"use server";

import { db } from "@/db";
import { expenses, expenseSplits, users, groupMembers } from "@db/schema";
import { eq, and, isNull, inArray, desc, asc, sql } from "drizzle-orm";
import { getCachedSession } from "@lib/auth";
import type { Expense, Split } from "@/types/group";
import { isValidUUID } from "@lib/validation";

export async function getGroupExpensesAction(
  groupId: string,
  offset: number,
  limit: number,
  sortBy: "date_desc" | "date_asc" | "amount_desc" | "amount_asc"
) {
  const session = await getCachedSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  if (!isValidUUID(groupId)) {
    return { error: "Invalid group ID" };
  }

  // Check membership
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        isNull(groupMembers.deletedAt)
      )
    )
    .limit(1);

  if (!membership) {
    return { error: "Not a member of this group" };
  }

  let orderByClause;
  switch (sortBy) {
    case "date_desc":
      orderByClause = sql`${expenses.transactionDate} desc, ${expenses.createdAt} desc`;
      break;
    case "date_asc":
      orderByClause = sql`${expenses.transactionDate} asc, ${expenses.createdAt} asc`;
      break;
    case "amount_desc":
      orderByClause = desc(expenses.amount);
      break;
    case "amount_asc":
      orderByClause = asc(expenses.amount);
      break;
    default:
      orderByClause = sql`${expenses.transactionDate} desc, ${expenses.createdAt} desc`;
  }

  try {
    const expensesList = await db
      .select({
        id: expenses.id,
        groupId: expenses.groupId,
        paidByUserId: expenses.paidByUserId,
        description: expenses.description,
        amount: expenses.amount,
        transactionDate: expenses.transactionDate,
        splitType: expenses.splitType,
        createdAt: expenses.createdAt,
        paidByName: users.name,
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidByUserId, users.id))
      .where(and(eq(expenses.groupId, groupId), isNull(expenses.deletedAt)))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const expenseIds = expensesList.map((e) => e.id);

    let splitsList: Split[] = [];
    if (expenseIds.length > 0) {
      splitsList = await db
        .select({
          id: expenseSplits.id,
          expenseId: expenseSplits.expenseId,
          owedByUserId: expenseSplits.owedByUserId,
          amount: expenseSplits.amount,
          shareValue: expenseSplits.shareValue,
          createdAt: expenseSplits.createdAt,
          owedByName: users.name,
        })
        .from(expenseSplits)
        .innerJoin(users, eq(expenseSplits.owedByUserId, users.id))
        .where(and(inArray(expenseSplits.expenseId, expenseIds), isNull(expenseSplits.deletedAt)));
    }

    return { success: true, expenses: expensesList as Expense[], splits: splitsList as Split[] };
  } catch (error) {
    console.error("getGroupExpensesAction error:", error);
    return { error: "Failed to load expenses" };
  }
}
