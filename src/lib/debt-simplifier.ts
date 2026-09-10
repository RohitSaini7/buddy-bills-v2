export interface DebtsPath {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amountMinorUnits: number;
}

export function calculatePairwiseDebts(
  members: { id: string; name: string }[],
  expenses: { id: string; paidByUserId: string; amount: number }[],
  splits: { expenseId: string; owedByUserId: string; amount: number }[],
  payments: { paidByUserId: string; paidToUserId: string; amount: number }[]
): DebtsPath[] {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const matrix: Record<string, Record<string, number>> = {};

  members.forEach((m1) => {
    matrix[m1.id] = {};
    members.forEach((m2) => {
      matrix[m1.id][m2.id] = 0;
    });
  });

  const expenseMap = new Map(expenses.map((e) => [e.id, e]));

  splits.forEach((split) => {
    const expense = expenseMap.get(split.expenseId);
    if (!expense) return;
    const P = expense.paidByUserId;
    const O = split.owedByUserId;
    if (P === O) return;

    if (matrix[O] && matrix[O][P] !== undefined) {
      matrix[O][P] += split.amount;
    }
  });

  payments.forEach((pmt) => {
    const A = pmt.paidByUserId;
    const B = pmt.paidToUserId;
    if (A === B) return;

    if (matrix[A] && matrix[A][B] !== undefined) {
      matrix[A][B] -= pmt.amount;
    }
  });

  const result: DebtsPath[] = [];
  const processedPairs = new Set<string>();

  members.forEach((m1) => {
    members.forEach((m2) => {
      if (m1.id === m2.id) return;
      const pairKey = [m1.id, m2.id].sort().join("-");
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      const m1OwesM2 = matrix[m1.id][m2.id] || 0;
      const m2OwesM1 = matrix[m2.id][m1.id] || 0;

      const net = m1OwesM2 - m2OwesM1;
      if (net > 0) {
        result.push({
          fromId: m1.id,
          fromName: memberMap.get(m1.id) || "Unknown",
          toId: m2.id,
          toName: memberMap.get(m2.id) || "Unknown",
          amountMinorUnits: net,
        });
      } else if (net < 0) {
        result.push({
          fromId: m2.id,
          fromName: memberMap.get(m2.id) || "Unknown",
          toId: m1.id,
          toName: memberMap.get(m1.id) || "Unknown",
          amountMinorUnits: Math.abs(net),
        });
      }
    });
  });

  return result;
}

export function simplifyDebts(
  members: { id: string; name: string }[],
  expenses: { id: string; paidByUserId: string; amount: number }[],
  splits: { expenseId: string; owedByUserId: string; amount: number }[],
  payments: { paidByUserId: string; paidToUserId: string; amount: number }[]
): DebtsPath[] {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const balances: Record<string, number> = {};

  members.forEach((m) => {
    balances[m.id] = 0;
  });

  expenses.forEach((e) => {
    if (balances[e.paidByUserId] !== undefined) {
      balances[e.paidByUserId] += e.amount;
    }
  });

  const expenseIds = new Set(expenses.map((e) => e.id));
  splits.forEach((s) => {
    if (expenseIds.has(s.expenseId) && balances[s.owedByUserId] !== undefined) {
      balances[s.owedByUserId] -= s.amount;
    }
  });

  payments.forEach((p) => {
    if (balances[p.paidByUserId] !== undefined) {
      balances[p.paidByUserId] += p.amount;
    }
    if (balances[p.paidToUserId] !== undefined) {
      balances[p.paidToUserId] -= p.amount;
    }
  });

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.keys(balances).forEach((id) => {
    const bal = balances[id];
    if (bal < 0) {
      debtors.push({ id, amount: Math.abs(bal) });
    } else if (bal > 0) {
      creditors.push({ id, amount: bal });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const result: DebtsPath[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amountToPay = Math.min(debtor.amount, creditor.amount);

    if (amountToPay > 0) {
      result.push({
        fromId: debtor.id,
        fromName: memberMap.get(debtor.id) || "Unknown",
        toId: creditor.id,
        toName: memberMap.get(creditor.id) || "Unknown",
        amountMinorUnits: amountToPay,
      });
    }

    debtor.amount -= amountToPay;
    creditor.amount -= amountToPay;

    if (debtor.amount <= 0) {
      dIdx++;
    }
    if (creditor.amount <= 0) {
      cIdx++;
    }
  }

  return result;
}
