"use server";

import { db } from "@/db";
import {
  groups,
  groupMembers,
  users,
  expenses,
  expenseSplits,
  payments,
  groupInvites,
} from "@db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withAuth, withGroupAuth } from "@lib/action-auth";
import { EPSILON_MINOR_UNITS } from "@lib/money";
import { sendGroupInviteEmail } from "@lib/email";
import { triggerGroupUpdate } from "@lib/pusher";

export const createGroupAction = withAuth(
  "createGroup",
  10,
  60000
)(async ({ session }, name: string, currency?: string) => {
  if (!name || name.trim().length === 0) return { error: "Group name is required" };
  if (name.length > 100) return { error: "Group name must be 100 characters or less" };

  try {
    const newGroup = await db.transaction(async (tx) => {
      const [insertedGroup] = await tx
        .insert(groups)
        .values({
          name: name.trim(),
          createdByUserId: session.user.id,
          currency: currency || "INR",
        })
        .returning();
      await tx.insert(groupMembers).values({ userId: session.user.id, groupId: insertedGroup.id });
      return insertedGroup;
    });
    revalidatePath("/dashboard");
    return { success: true, group: newGroup };
  } catch (err) {
    console.error("createGroupAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to create group" };
  }
});

export const editGroupAction = withGroupAuth(
  "editGroup",
  10,
  60000
)(async ({ session, group }, groupId: string, name: string, currency: string) => {
  if (!name || name.trim().length === 0) return { error: "Group name is required" };
  if (name.length > 100) return { error: "Group name must be 100 characters or less" };
  if (group.createdByUserId !== session.user.id)
    return { error: "Only the group creator can edit this group." };

  try {
    await db
      .update(groups)
      .set({ name: name.trim(), currency: currency || group.currency, updatedAt: new Date() })
      .where(eq(groups.id, groupId));
    revalidatePath("/dashboard");
    await triggerGroupUpdate(groupId);
    await triggerGroupUpdate(groupId);
    await triggerGroupUpdate(groupId);
    await triggerGroupUpdate(groupId);
    await triggerGroupUpdate(groupId);
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error("editGroupAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to edit group" };
  }
});

export const transferGroupOwnershipAction = withGroupAuth(
  "transferOwnership",
  10,
  60000
)(async ({ session, group }, groupId: string, newOwnerId: string) => {
  if (group.createdByUserId !== session.user.id)
    return { error: "Only the current group creator can transfer ownership." };
  if (!newOwnerId) return { error: "New owner ID is required." };

  try {
    const [newOwnerMember] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, newOwnerId),
          isNull(groupMembers.deletedAt)
        )
      )
      .limit(1);

    if (!newOwnerMember) {
      return { error: "New owner must be an active member of the group." };
    }

    await db
      .update(groups)
      .set({ createdByUserId: newOwnerId, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error("transferGroupOwnershipAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to transfer ownership" };
  }
});

export const addMemberAction = withGroupAuth(
  "addMember",
  20,
  60000
)(async ({ session, group }, groupId: string, email: string) => {
  if (!email || email.trim().length === 0) return { error: "Email is required" };
  if (group.createdByUserId !== session.user.id)
    return { error: "Only the group creator can add members." };

  try {
    const cleanEmail = email.trim().toLowerCase();
    let targetUserId = "";
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUser) {
      targetUserId = existingUser.id;
    } else {
      const [existingInvite] = await db
        .select()
        .from(groupInvites)
        .where(and(eq(groupInvites.groupId, groupId), eq(groupInvites.email, cleanEmail)))
        .limit(1);
      if (!existingInvite) {
        await db
          .insert(groupInvites)
          .values({ groupId, email: cleanEmail, invitedByUserId: session.user.id });

        // Send email for new user invite
        await sendGroupInviteEmail({
          to: cleanEmail,
          groupName: group.name,
          inviterName: session.user.name,
          isNewUser: true,
          groupId,
        });
      }
      revalidatePath(`/groups/${groupId}`);
      return { success: true };
    }

    const [existingMember] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)))
      .limit(1);
    if (existingMember) {
      if (existingMember.deletedAt === null)
        return { error: "User is already a member of this group." };
      await db
        .update(groupMembers)
        .set({ deletedAt: null, removalType: null, removedByUserId: null })
        .where(eq(groupMembers.id, existingMember.id));
    } else {
      await db.insert(groupMembers).values({ groupId, userId: targetUserId });
    }

    await db.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, groupId));

    // Send email for existing user addition
    await sendGroupInviteEmail({
      to: cleanEmail,
      groupName: group.name,
      inviterName: session.user.name,
      isNewUser: false,
      groupId,
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error("addMemberAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to add member" };
  }
});

async function calculateMemberNetBalance(
  groupId: string,
  memberUserId: string,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
) {
  const groupExpenses = await tx
    .select({
      id: expenses.id,
      paidByUserId: expenses.paidByUserId,
      amount: expenses.amount,
    })
    .from(expenses)
    .where(and(eq(expenses.groupId, groupId), isNull(expenses.deletedAt)));

  const expenseIds = groupExpenses.map((e: { id: string }) => e.id);
  let netBalanceMinorUnits = 0;

  groupExpenses
    .filter((e: { paidByUserId: string }) => e.paidByUserId === memberUserId)
    .forEach((e: { amount: number }) => {
      netBalanceMinorUnits += e.amount;
    });

  if (expenseIds.length > 0) {
    const memberSplits = await tx
      .select({ amount: expenseSplits.amount })
      .from(expenseSplits)
      .where(
        and(
          inArray(expenseSplits.expenseId, expenseIds),
          eq(expenseSplits.owedByUserId, memberUserId),
          isNull(expenseSplits.deletedAt)
        )
      );

    memberSplits.forEach((s: { amount: number }) => {
      netBalanceMinorUnits -= s.amount;
    });
  }

  const memberPaymentsMade = await tx
    .select({ amount: payments.amount })
    .from(payments)
    .where(
      and(
        eq(payments.groupId, groupId),
        eq(payments.paidByUserId, memberUserId),
        isNull(payments.deletedAt)
      )
    );
  memberPaymentsMade.forEach((p: { amount: number }) => {
    netBalanceMinorUnits += p.amount;
  });

  const memberPaymentsReceived = await tx
    .select({ amount: payments.amount })
    .from(payments)
    .where(
      and(
        eq(payments.groupId, groupId),
        eq(payments.paidToUserId, memberUserId),
        isNull(payments.deletedAt)
      )
    );
  memberPaymentsReceived.forEach((p: { amount: number }) => {
    netBalanceMinorUnits -= p.amount;
  });

  return netBalanceMinorUnits;
}

export const removeMemberAction = withGroupAuth(
  "removeMember",
  20,
  60000
)(async ({ session, group }, groupId: string, memberUserId: string) => {
  if (group.createdByUserId !== session.user.id)
    return { error: "Only the group creator can remove members." };
  if (memberUserId === session.user.id)
    return { error: "You cannot remove yourself from a group you created." };

  try {
    await db.transaction(async (tx) => {
      const netBalanceMinorUnits = await calculateMemberNetBalance(groupId, memberUserId, tx);
      if (Math.abs(netBalanceMinorUnits) > EPSILON_MINOR_UNITS) {
        const owesOrOwed =
          netBalanceMinorUnits > 0 ? "is owed money by the group" : "owes money to the group";
        throw new Error(
          `Cannot remove member — they ${owesOrOwed}. Please settle all balances first.`
        );
      }
      await tx
        .update(groupMembers)
        .set({
          deletedAt: new Date(),
          removalType: "REMOVED_BY_CREATOR",
          removedByUserId: session.user.id,
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, memberUserId)));
      await tx.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, groupId));
    });
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error("removeMemberAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to remove member" };
  }
});

export const leaveGroupAction = withGroupAuth(
  "leaveGroup",
  20,
  60000
)(async ({ session, group }, groupId: string) => {
  if (group.createdByUserId === session.user.id)
    return { error: "The group creator cannot leave the group. Delete the group instead." };

  try {
    await db.transaction(async (tx) => {
      const netBalanceMinorUnits = await calculateMemberNetBalance(groupId, session.user.id, tx);
      if (Math.abs(netBalanceMinorUnits) > EPSILON_MINOR_UNITS) {
        const owesOrOwed =
          netBalanceMinorUnits > 0
            ? "You are owed money by the group"
            : "You owe money to the group";
        throw new Error(`Cannot leave group — ${owesOrOwed}. Please settle all balances first.`);
      }
      await tx
        .update(groupMembers)
        .set({
          deletedAt: new Date(),
          removalType: "LEFT_VOLUNTARILY",
          removedByUserId: session.user.id,
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, session.user.id)));
      await tx.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, groupId));
    });
    revalidatePath(`/dashboard`);
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error("leaveGroupAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to leave group" };
  }
});

export const deleteGroupAction = withGroupAuth(
  "deleteGroup",
  10,
  60000
)(async ({ session, group }, groupId: string) => {
  if (group.createdByUserId !== session.user.id)
    return { error: "Only the group creator can delete this group." };

  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.update(groups).set({ deletedAt: now }).where(eq(groups.id, groupId));
      await tx
        .update(groupMembers)
        .set({ deletedAt: now })
        .where(eq(groupMembers.groupId, groupId));
      const groupExpenses = await tx
        .select({ id: expenses.id })
        .from(expenses)
        .where(eq(expenses.groupId, groupId));
      const expenseIds = groupExpenses.map((e) => e.id);
      if (expenseIds.length > 0) {
        await tx
          .update(expenseSplits)
          .set({ deletedAt: now })
          .where(inArray(expenseSplits.expenseId, expenseIds));
      }
      await tx.update(expenses).set({ deletedAt: now }).where(eq(expenses.groupId, groupId));
      await tx.update(payments).set({ deletedAt: now }).where(eq(payments.groupId, groupId));
    });
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error("deleteGroupAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete group" };
  }
});

export const toggleSimplifyDebtsAction = withGroupAuth(
  "toggleSimplify",
  20,
  60000
)(async ({ session, group }, groupId: string, simplify: boolean) => {
  if (group.createdByUserId !== session.user.id)
    return { error: "Only the group creator can change this setting." };
  try {
    await db
      .update(groups)
      .set({ simplifyDebts: simplify, updatedAt: new Date() })
      .where(eq(groups.id, groupId));
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error("toggleSimplifyDebtsAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update settings" };
  }
});

export const acceptInvitesAction = withAuth(
  "acceptInvites",
  10,
  60000
)(async ({ session }) => {
  try {
    const pendingInvites = await db
      .select({ id: groupInvites.id, groupId: groupInvites.groupId })
      .from(groupInvites)
      .where(eq(groupInvites.email, session.user.email));

    if (pendingInvites.length === 0) return { success: true, acceptedGroupNames: [] };

    const acceptedGroupIds = pendingInvites.map((i) => i.groupId);
    const acceptedGroupNames: string[] = [];
    const inviteIds = pendingInvites.map((i) => i.id);

    await db.transaction(async (tx) => {
      const existingMembers = await tx
        .select()
        .from(groupMembers)
        .where(
          and(
            inArray(groupMembers.groupId, acceptedGroupIds),
            eq(groupMembers.userId, session.user.id)
          )
        );

      const existingMemberMap = new Map(existingMembers.map((m) => [m.groupId, m]));
      const membersToInsert: { groupId: string; userId: string }[] = [];
      const membersToRestore: string[] = [];

      for (const invite of pendingInvites) {
        const existing = existingMemberMap.get(invite.groupId);
        if (existing) {
          if (existing.deletedAt !== null) membersToRestore.push(existing.id);
        } else {
          membersToInsert.push({ groupId: invite.groupId, userId: session.user.id });
        }
      }

      if (membersToRestore.length > 0) {
        await tx
          .update(groupMembers)
          .set({ deletedAt: null, removalType: null, removedByUserId: null })
          .where(inArray(groupMembers.id, membersToRestore));
      }
      if (membersToInsert.length > 0) {
        await tx
          .insert(groupMembers)
          .values(membersToInsert)
          .onConflictDoNothing({ target: [groupMembers.userId, groupMembers.groupId] });
      }

      const groupsInfo = await tx
        .select({ id: groups.id, name: groups.name })
        .from(groups)
        .where(inArray(groups.id, acceptedGroupIds));
      groupsInfo.forEach((g) => acceptedGroupNames.push(g.name));

      await tx.delete(groupInvites).where(inArray(groupInvites.id, inviteIds));
    });

    revalidatePath("/dashboard");
    acceptedGroupIds.forEach(async (id) => {
      await triggerGroupUpdate(id);
      revalidatePath(`/groups/${id}`);
    });

    return { success: true, acceptedGroupNames };
  } catch (err) {
    console.error("acceptInvitesAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to accept invites" };
  }
});
