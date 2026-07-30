import { EPSILON_MINOR_UNITS } from "./money";

interface ExpenseData {
  id: string;
  groupId: string;
  paidByUserId: string;
  amount: number;
}

interface SplitData {
  expenseId: string;
  owedByUserId: string;
  amount: number;
}

interface PaymentData {
  groupId: string;
  paidByUserId: string;
  paidToUserId: string;
  amount: number;
}

/**
 * Calculate net balances across multiple groups for a given user.
 * Used in sidebar and dashboard to compute "you owe" / "owed to you" totals.
 *
 * @returns `{ totalYouOweMinorUnits, totalOwedToYouMinorUnits }` — both non-negative integers.
 */
export function calculateNetBalances(
  userId: string,
  groupIds: string[],
  allExpenses: ExpenseData[],
  allSplits: SplitData[],
  allPayments: PaymentData[]
): { totalYouOweMinorUnits: number; totalOwedToYouMinorUnits: number } {
  const groupBalances = new Map<string, number>();
  for (const g of groupIds) {
    groupBalances.set(g, 0);
  }

  for (const e of allExpenses) {
    if (e.paidByUserId === userId) {
      const current = groupBalances.get(e.groupId) || 0;
      groupBalances.set(e.groupId, current + e.amount);
    }
  }

  const expenseIdToGroupId = new Map<string, string>();
  for (const e of allExpenses) {
    expenseIdToGroupId.set(e.id, e.groupId);
  }

  for (const s of allSplits) {
    if (s.owedByUserId === userId) {
      const gId = expenseIdToGroupId.get(s.expenseId);
      if (gId) {
        const current = groupBalances.get(gId) || 0;
        groupBalances.set(gId, current - s.amount);
      }
    }
  }

  for (const p of allPayments) {
    if (p.paidByUserId === userId) {
      const current = groupBalances.get(p.groupId) || 0;
      groupBalances.set(p.groupId, current + p.amount);
    } else if (p.paidToUserId === userId) {
      const current = groupBalances.get(p.groupId) || 0;
      groupBalances.set(p.groupId, current - p.amount);
    }
  }

  let totalYouOweMinorUnits = 0;
  let totalOwedToYouMinorUnits = 0;

  for (const netBalanceMinorUnits of groupBalances.values()) {
    if (netBalanceMinorUnits < -EPSILON_MINOR_UNITS) {
      totalYouOweMinorUnits += Math.abs(netBalanceMinorUnits);
    } else if (netBalanceMinorUnits > EPSILON_MINOR_UNITS) {
      totalOwedToYouMinorUnits += netBalanceMinorUnits;
    }
  }

  return { totalYouOweMinorUnits, totalOwedToYouMinorUnits };
}

interface MemberData {
  id: string;
}

/**
 * Calculate per-member net balance within a single group.
 * Positive = owed money (creditor), negative = owes money (debtor).
 *
 * Used on the group detail page to display each member's balance.
 */
export function calculateMemberBalances(
  members: MemberData[],
  expenses: { paidByUserId: string; amount: number }[],
  splits: { owedByUserId: string; amount: number }[],
  payments: { paidByUserId: string; paidToUserId: string; amount: number }[]
): Record<string, number> {
  const memberBalances: Record<string, number> = {};

  members.forEach((m) => {
    memberBalances[m.id] = 0;
  });

  expenses.forEach((expense) => {
    const payerId = expense.paidByUserId;
    const amt = expense.amount;
    if (memberBalances[payerId] !== undefined) {
      memberBalances[payerId] += amt;
    }
  });

  splits.forEach((split) => {
    const owerId = split.owedByUserId;
    const amt = split.amount;
    if (memberBalances[owerId] !== undefined) {
      memberBalances[owerId] -= amt;
    }
  });

  payments.forEach((payment) => {
    const senderId = payment.paidByUserId;
    const recipientId = payment.paidToUserId;
    const amt = payment.amount;

    if (memberBalances[senderId] !== undefined) {
      memberBalances[senderId] += amt;
    }
    if (memberBalances[recipientId] !== undefined) {
      memberBalances[recipientId] -= amt;
    }
  });

  return memberBalances;
}
