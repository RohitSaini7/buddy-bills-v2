import { db } from "@/db";
import { groupMembers, groups } from "@db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { cache } from "react";

export interface SidebarData {
  groups: {
    id: string;
    name: string;
    currency: string;
  }[];
  totalYouOweMinorUnits: number;
  totalOwedToYouMinorUnits: number;
}

const getUserBalancesForGroups = cache(async (userId: string, groupIds: string[]) => {
  if (groupIds.length === 0) {
    return { totalYouOweMinorUnits: 0, totalOwedToYouMinorUnits: 0 };
  }

  const balances = await db.execute(sql`
    SELECT 
      g.id as group_id,
      (
        COALESCE((SELECT SUM(amount) FROM expenses WHERE group_id = g.id AND paid_by_user_id = ${userId} AND deleted_at IS NULL), 0) -
        COALESCE((SELECT SUM(s.amount) FROM expense_splits s JOIN expenses e ON s.expense_id = e.id WHERE e.group_id = g.id AND s.owed_by_user_id = ${userId} AND s.deleted_at IS NULL AND e.deleted_at IS NULL), 0) +
        COALESCE((SELECT SUM(amount) FROM payments WHERE group_id = g.id AND paid_by_user_id = ${userId} AND deleted_at IS NULL), 0) -
        COALESCE((SELECT SUM(amount) FROM payments WHERE group_id = g.id AND paid_to_user_id = ${userId} AND deleted_at IS NULL), 0)
      ) as net_balance
    FROM groups g
    WHERE ${inArray(sql`g.id`, groupIds)}
  `);

  let totalYouOweMinorUnits = 0;
  let totalOwedToYouMinorUnits = 0;

  for (const row of balances) {
    const netBalance = Number(row.net_balance);
    if (netBalance < 0) {
      totalYouOweMinorUnits += Math.abs(netBalance);
    } else if (netBalance > 0) {
      totalOwedToYouMinorUnits += netBalance;
    }
  }

  return { totalYouOweMinorUnits, totalOwedToYouMinorUnits };
});

export const getSidebarData = cache(async (userId: string): Promise<SidebarData> => {
  const userMemberships = await db
    .select({
      groupId: groupMembers.groupId,
    })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), isNull(groupMembers.deletedAt)));

  const groupIds = userMemberships.map((m) => m.groupId);

  if (groupIds.length === 0) {
    return { groups: [], totalYouOweMinorUnits: 0, totalOwedToYouMinorUnits: 0 };
  }

  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      currency: groups.currency,
    })
    .from(groups)
    .where(and(inArray(groups.id, groupIds), isNull(groups.deletedAt)))
    .orderBy(sql`${groups.name} asc`);

  const { totalYouOweMinorUnits, totalOwedToYouMinorUnits } = await getUserBalancesForGroups(
    userId,
    groupIds
  );

  return {
    groups: userGroups,
    totalYouOweMinorUnits,
    totalOwedToYouMinorUnits,
  };
});

export interface DashboardData {
  groups: {
    id: string;
    name: string;
    createdAt: Date;
    createdByUserId: string;
    currency: string;
    memberCount: number;
  }[];
  totalYouOweMinorUnits: number;
  totalOwedToYouMinorUnits: number;
}

export const getDashboardData = cache(async (userId: string): Promise<DashboardData> => {
  const userMemberships = await db
    .select({
      groupId: groupMembers.groupId,
    })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), isNull(groupMembers.deletedAt)));

  const groupIds = userMemberships.map((m) => m.groupId);

  if (groupIds.length === 0) {
    return { groups: [], totalYouOweMinorUnits: 0, totalOwedToYouMinorUnits: 0 };
  }

  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      createdAt: groups.createdAt,
      createdByUserId: groups.createdByUserId,
      currency: groups.currency,
      memberCount: sql<number>`count(case when ${groupMembers.deletedAt} is null then 1 end)::int`,
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(and(inArray(groups.id, groupIds), isNull(groups.deletedAt)))
    .groupBy(groups.id)
    .orderBy(sql`${groups.createdAt} desc`);

  const { totalYouOweMinorUnits, totalOwedToYouMinorUnits } = await getUserBalancesForGroups(
    userId,
    groupIds
  );

  return {
    groups: userGroups,
    totalYouOweMinorUnits,
    totalOwedToYouMinorUnits,
  };
});
