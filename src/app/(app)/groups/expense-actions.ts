"use server";

import { db } from "@/db";
import { expenses, expenseSplits, payments, groups, groupMembers } from "@db/schema";
import { getCachedSession } from "@lib/auth";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withGroupAuth } from "@lib/action-auth";
import { expenseInputSchema } from "@lib/schemas";
import { RateLimiter } from "@lib/rate-limit";
import { isValidUUID } from "@lib/validation";
import { getCurrencySymbol, minorUnitsToDisplay, EPSILON_MINOR_UNITS } from "@lib/money";
import { triggerGroupUpdate } from "@lib/pusher";

export const addExpenseAction = withGroupAuth(
  "addExpense",
  20,
  60000
)(async ({ session, group }, rawData: unknown) => {
  const parseResult = expenseInputSchema.safeParse(rawData);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message || "Invalid input" };
  }
  const data = parseResult.data;

  // IDOR check: paidByUserId must be session user or session user must be group creator
  if (data.paidByUserId !== session.user.id && group.createdByUserId !== session.user.id) {
    return { error: "Only the group creator can add an expense on behalf of someone else." };
  }

  const userIdsToCheck = Array.from(
    new Set([data.paidByUserId, ...data.splits.map((s: { userId: string }) => s.userId)])
  );
  const activeMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, data.groupId),
        inArray(groupMembers.userId, userIdsToCheck),
        isNull(groupMembers.deletedAt)
      )
    );

  if (activeMembers.length !== userIdsToCheck.length) {
    return { error: "One or more selected users are not active members of the group." };
  }

  const currSymbol = getCurrencySymbol(group.currency);
  const sumOfSplits = data.splits.reduce(
    (sum: number, split: { userId: string; amount: number }) => sum + split.amount,
    0
  );
  const targetAmount = data.amount;
  if (Math.abs(sumOfSplits - targetAmount) > EPSILON_MINOR_UNITS) {
    return {
      error: `Sum of splits (${currSymbol}${minorUnitsToDisplay(sumOfSplits)}) must equal total amount (${currSymbol}${minorUnitsToDisplay(targetAmount)}).`,
    };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [newExpense] = await tx
        .insert(expenses)
        .values({
          groupId: data.groupId,
          paidByUserId: data.paidByUserId,
          description: data.description.trim(),
          amount: data.amount,
          transactionDate: data.transactionDate,
          splitType: data.splitType as "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES",
        })
        .returning();

      const splitRecords = data.splits.map(
        (split: { userId: string; amount: number; shareValue?: number }) => ({
          expenseId: newExpense.id,
          owedByUserId: split.userId,
          amount: split.amount,
          shareValue: split.shareValue ?? null,
        })
      );
      await tx.insert(expenseSplits).values(splitRecords);
      await tx.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, data.groupId));
      return newExpense;
    });

    revalidatePath(`/groups/${data.groupId}`);
    return { success: true, expense: result };
  } catch (err) {
    console.error("addExpenseAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to log expense" };
  }
});

export const editExpenseAction = withGroupAuth(
  "editExpense",
  20,
  60000
)(async ({ session, group }, rawData: unknown) => {
  if (!isValidUUID((rawData as { expenseId?: string }).expenseId ?? ""))
    return { error: "Invalid expense ID" };

  const parseResult = expenseInputSchema.safeParse(rawData);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message || "Invalid input" };
  }
  const data = parseResult.data;

  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, (rawData as { expenseId: string }).expenseId))
    .limit(1);
  if (!expense) return { error: "Expense not found." };

  const isPayer = expense.paidByUserId === session.user.id;
  const isGroupCreator = group.createdByUserId === session.user.id;
  if (!isPayer && !isGroupCreator) {
    return { error: "Only the expense payer or group creator can edit this expense." };
  }

  const currSymbol = getCurrencySymbol(group.currency);
  const sumOfSplits = data.splits.reduce(
    (sum: number, split: { userId: string; amount: number }) => sum + split.amount,
    0
  );
  const targetAmount = data.amount;
  if (Math.abs(sumOfSplits - targetAmount) > EPSILON_MINOR_UNITS) {
    return {
      error: `Sum of splits (${currSymbol}${minorUnitsToDisplay(sumOfSplits)}) must equal total amount (${currSymbol}${minorUnitsToDisplay(targetAmount)}).`,
    };
  }

  try {
    const result = await db.transaction(async (tx) => {
      await tx
        .update(expenseSplits)
        .set({ deletedAt: new Date() })
        .where(eq(expenseSplits.expenseId, (rawData as { expenseId: string }).expenseId));
      const [updatedExpense] = await tx
        .update(expenses)
        .set({
          paidByUserId: data.paidByUserId,
          description: data.description.trim(),
          amount: data.amount,
          transactionDate: data.transactionDate,
          splitType: data.splitType as "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES",
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, (rawData as { expenseId: string }).expenseId))
        .returning();

      const splitRecords = data.splits.map(
        (split: { userId: string; amount: number; shareValue?: number }) => ({
          expenseId: expense.id,
          owedByUserId: split.userId,
          amount: split.amount,
          shareValue: split.shareValue ?? null,
        })
      );
      await tx.insert(expenseSplits).values(splitRecords);
      await tx.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, data.groupId));
      return updatedExpense;
    });

    await triggerGroupUpdate(data.groupId);
    revalidatePath(`/groups/${data.groupId}`);
    return { success: true, expense: result };
  } catch (err) {
    console.error("editExpenseAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to edit expense" };
  }
});

export const addPaymentAction = withGroupAuth(
  "addPayment",
  20,
  60000
)(async (
  { session, group },
  data: {
    groupId: string;
    paidByUserId: string;
    paidToUserId: string;
    amount: number;
    paymentDate: string;
  }
) => {
  if (data.paidByUserId === data.paidToUserId)
    return { error: "Payer and recipient cannot be the same person" };
  if (!data.amount || data.amount <= 0) return { error: "Amount must be greater than 0" };

  const isPayer = data.paidByUserId === session.user.id;
  const isRecipient = data.paidToUserId === session.user.id;
  const isGroupCreator = group.createdByUserId === session.user.id;

  if (!isPayer && !isRecipient && !isGroupCreator) {
    return { error: "Only the payer, recipient, or group creator can record a payment." };
  }

  const activeMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, data.groupId),
        inArray(groupMembers.userId, [data.paidByUserId, data.paidToUserId]),
        isNull(groupMembers.deletedAt)
      )
    );

  if (activeMembers.length !== 2)
    return { error: "Both participants must be active members of the group." };

  try {
    const [newPayment] = await db
      .insert(payments)
      .values({
        groupId: data.groupId,
        paidByUserId: data.paidByUserId,
        paidToUserId: data.paidToUserId,
        amount: data.amount,
        paymentDate: data.paymentDate,
      })
      .returning();

    await db.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, data.groupId));
    await triggerGroupUpdate(data.groupId);
    revalidatePath(`/groups/${data.groupId}`);
    return { success: true, payment: newPayment };
  } catch (err) {
    console.error("addPaymentAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to record payment" };
  }
});

// Skipping wrapper since it doesn't receive groupId directly from args and requires fetching expense first.
export async function deleteExpenseAction(expenseId: string) {
  const session = await getCachedSession();
  if (!session) return { error: "Unauthorized" };
  if (!isValidUUID(expenseId)) return { error: "Invalid expense ID" };

  const rateLimit = await RateLimiter.check(`deleteExpense:${session.user.id}`, 20, 60000);
  if (!rateLimit.success) {
    const secondsLeft = Math.ceil((rateLimit.reset - Date.now()) / 1000);
    return { error: `Too many requests. Please try again in ${secondsLeft} second(s).` };
  }

  try {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
    if (!expense) return { error: "Expense not found." };

    const [group] = await db.select().from(groups).where(eq(groups.id, expense.groupId)).limit(1);
    if (!group) return { error: "Group not found." };

    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, expense.groupId),
          eq(groupMembers.userId, session.user.id),
          isNull(groupMembers.deletedAt)
        )
      )
      .limit(1);
    if (!membership) return { error: "You are not a member of this group." };

    const isPayer = expense.paidByUserId === session.user.id;
    const isGroupCreator = group.createdByUserId === session.user.id;
    if (!isPayer && !isGroupCreator)
      return { error: "Only the expense payer or group creator can delete this expense." };

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.update(expenses).set({ deletedAt: now }).where(eq(expenses.id, expenseId));
      await tx
        .update(expenseSplits)
        .set({ deletedAt: now })
        .where(eq(expenseSplits.expenseId, expenseId));
      await tx.update(groups).set({ updatedAt: now }).where(eq(groups.id, expense.groupId));
    });

    await triggerGroupUpdate(expense.groupId);
    revalidatePath(`/groups/${expense.groupId}`);
    return { success: true };
  } catch (err) {
    console.error("deleteExpenseAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete expense" };
  }
}

// Skipping wrapper since it doesn't receive groupId directly from args and requires fetching payment first.
export async function deletePaymentAction(paymentId: string) {
  const session = await getCachedSession();
  if (!session) return { error: "Unauthorized" };
  if (!isValidUUID(paymentId)) return { error: "Invalid payment ID" };

  const rateLimit = await RateLimiter.check(`deletePayment:${session.user.id}`, 20, 60000);
  if (!rateLimit.success) {
    const secondsLeft = Math.ceil((rateLimit.reset - Date.now()) / 1000);
    return { error: `Too many requests. Please try again in ${secondsLeft} second(s).` };
  }

  try {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) return { error: "Payment not found." };

    const [group] = await db.select().from(groups).where(eq(groups.id, payment.groupId)).limit(1);
    if (!group) return { error: "Group not found." };

    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, payment.groupId),
          eq(groupMembers.userId, session.user.id),
          isNull(groupMembers.deletedAt)
        )
      )
      .limit(1);
    if (!membership) return { error: "You are not a member of this group." };

    const isPayer = payment.paidByUserId === session.user.id;
    const isRecipient = payment.paidToUserId === session.user.id;
    const isGroupCreator = group.createdByUserId === session.user.id;
    if (!isPayer && !isRecipient && !isGroupCreator)
      return { error: "Only the payment participants or group creator can delete this payment." };

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.update(payments).set({ deletedAt: now }).where(eq(payments.id, paymentId));
      await tx.update(groups).set({ updatedAt: now }).where(eq(groups.id, payment.groupId));
    });

    await triggerGroupUpdate(payment.groupId);
    revalidatePath(`/groups/${payment.groupId}`);
    return { success: true };
  } catch (err) {
    console.error("deletePaymentAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete payment" };
  }
}
