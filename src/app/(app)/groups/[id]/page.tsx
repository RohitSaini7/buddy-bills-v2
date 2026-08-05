import React from "react";
import { getCachedSession } from "@lib/auth";
import { redirect, notFound } from "next/navigation";
import { isValidUUID } from "@lib/validation";
import { db } from "@/db";
import {
  groupMembers,
  groups,
  users,
  expenses,
  expenseSplits,
  payments,
  accounts,
} from "@db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { GroupDetailsClient } from "./group-details-client";
import { calculateMemberBalances } from "@lib/balance";
import { simplifyDebts, calculatePairwiseDebts } from "@lib/debt-simplifier";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GroupDetailPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const session = await getCachedSession();

  if (!session) {
    redirect("/");
  }

  const { id } = params;

  if (!isValidUUID(id)) {
    notFound();
  }

  // Pagination params
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const [[group], [membership]] = await Promise.all([
    db
      .select({
        id: groups.id,
        name: groups.name,
        createdByUserId: groups.createdByUserId,
        currency: groups.currency,
        simplifyDebts: groups.simplifyDebts,
      })
      .from(groups)
      .where(and(eq(groups.id, id), isNull(groups.deletedAt)))
      .limit(1),
    db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, id),
          eq(groupMembers.userId, session.user.id),
          isNull(groupMembers.deletedAt)
        )
      )
      .limit(1),
  ]);

  if (!group || !membership) {
    redirect("/dashboard");
  }

  const payer = alias(users, "payer");
  const receiver = alias(users, "receiver");

  const [members, expensesList, paymentsList] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        joinedAt: groupMembers.joinedAt,
        hasAccount: sql<boolean>`exists (select 1 from ${accounts} where ${accounts.userId} = ${users.id})`,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(and(eq(groupMembers.groupId, id), isNull(groupMembers.deletedAt)))
      .orderBy(groupMembers.joinedAt),

    db
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
      .where(and(eq(expenses.groupId, id), isNull(expenses.deletedAt)))
      .orderBy(sql`${expenses.transactionDate} desc, ${expenses.createdAt} desc`)
      .limit(limit + 1) // Request 1 extra to see if there is a next page
      .offset(offset),

    db
      .select({
        id: payments.id,
        groupId: payments.groupId,
        paidByUserId: payments.paidByUserId,
        paidToUserId: payments.paidToUserId,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        createdAt: payments.createdAt,
        paidByName: payer.name,
        paidToName: receiver.name,
      })
      .from(payments)
      .innerJoin(payer, eq(payments.paidByUserId, payer.id))
      .innerJoin(receiver, eq(payments.paidToUserId, receiver.id))
      .where(and(eq(payments.groupId, id), isNull(payments.deletedAt)))
      .orderBy(sql`${payments.paymentDate} desc, ${payments.createdAt} desc`),
  ]);

  const hasNextPage = expensesList.length > limit;
  if (hasNextPage) {
    expensesList.pop(); // Remove the extra item
  }

  const splitsList =
    expensesList.length > 0
      ? await db
          .select({
            id: expenseSplits.id,
            expenseId: expenseSplits.expenseId,
            owedByUserId: expenseSplits.owedByUserId,
            amount: expenseSplits.amount,
            shareValue: expenseSplits.shareValue,
            owedByName: users.name,
            createdAt: expenseSplits.createdAt,
          })
          .from(expenseSplits)
          .innerJoin(users, eq(expenseSplits.owedByUserId, users.id))
          .where(
            and(
              inArray(
                expenseSplits.expenseId,
                expensesList.map((e) => e.id)
              ),
              isNull(expenseSplits.deletedAt)
            )
          )
      : [];

  // paymentsList is already fetched above

  // Build Activity Feed
  type Activity = {
    id: string;
    type: "expense" | "payment" | "join";
    title: string;
    description: string;
    timestamp: string;
    amount?: number;
  };

  const activities: Activity[] = [];

  expensesList.forEach((e) => {
    activities.push({
      id: `exp-${e.id}`,
      type: "expense",
      title: `${e.paidByName} added an expense`,
      description: e.description,
      timestamp: e.createdAt.toISOString(),
      amount: e.amount,
    });
  });

  paymentsList.forEach((p) => {
    activities.push({
      id: `pay-${p.id}`,
      type: "payment",
      title: `${p.paidByName} paid ${p.paidToName}`,
      description: "Settled up",
      timestamp: p.createdAt.toISOString(),
      amount: p.amount,
    });
  });

  members.forEach((m) => {
    activities.push({
      id: `join-${m.id}`,
      type: "join",
      title: `${m.name} joined the group`,
      description: "",
      timestamp: m.joinedAt.toISOString(),
    });
  });

  // Sort descending by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Fetch all expenses and splits for correct balance calculations
  const allExpenses = await db
    .select({
      id: expenses.id,
      paidByUserId: expenses.paidByUserId,
      amount: expenses.amount,
    })
    .from(expenses)
    .where(and(eq(expenses.groupId, id), isNull(expenses.deletedAt)));

  const allSplits =
    allExpenses.length > 0
      ? await db
          .select({
            expenseId: expenseSplits.expenseId,
            owedByUserId: expenseSplits.owedByUserId,
            amount: expenseSplits.amount,
          })
          .from(expenseSplits)
          .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
          .where(and(eq(expenses.groupId, id), isNull(expenseSplits.deletedAt)))
      : [];

  const memberBalances = calculateMemberBalances(members, allExpenses, allSplits, paymentsList);

  const repaymentsData = group.simplifyDebts
    ? simplifyDebts(members, allExpenses, allSplits, paymentsList)
    : calculatePairwiseDebts(members, allExpenses, allSplits, paymentsList);

  const directRepayments = repaymentsData.map((r) => ({
    fromId: r.fromId,
    fromName: r.fromName,
    toId: r.toId,
    toName: r.toName,
    amount: r.amountMinorUnits,
  }));

  return (
    <GroupDetailsClient
      group={group}
      members={members}
      expenses={expensesList}
      splits={splitsList}
      payments={paymentsList}
      activities={activities}
      currentUser={session.user}
      page={page}
      hasNextPage={hasNextPage}
      serverBalances={memberBalances}
      serverRepayments={directRepayments}
    />
  );
}
