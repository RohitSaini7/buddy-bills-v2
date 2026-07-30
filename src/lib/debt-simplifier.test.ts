import { describe, test, expect } from "bun:test";
import { calculatePairwiseDebts, simplifyDebts } from "./debt-simplifier";

// Mock Data
const members = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
  { id: "charlie", name: "Charlie" },
];

describe("Debt Simplifier Engine", () => {
  test("calculatePairwiseDebts - direct split", () => {
    // Alice paid 100 for an expense split equally with Bob (Alice is not in splits or owes herself, wait, let's say Alice paid 100, split is 50 for Bob, 50 for Alice)
    const expenses = [{ id: "exp1", paidByUserId: "alice", amount: 10000 }];
    const splits = [
      { expenseId: "exp1", owedByUserId: "alice", amount: 5000 },
      { expenseId: "exp1", owedByUserId: "bob", amount: 5000 },
    ];
    const payments: { paidByUserId: string; paidToUserId: string; amount: number }[] = [];

    const rawDebts = calculatePairwiseDebts(members, expenses, splits, payments);

    expect(rawDebts).toHaveLength(1);
    expect(rawDebts[0]).toEqual({
      fromId: "bob",
      fromName: "Bob",
      toId: "alice",
      toName: "Alice",
      amountMinorUnits: 5000,
    });
  });

  test("calculatePairwiseDebts - nets out mutual balances", () => {
    // 1. Alice paid 100, Bob owes 50
    // 2. Bob paid 40, Alice owes 20
    const expenses = [
      { id: "exp1", paidByUserId: "alice", amount: 10000 },
      { id: "exp2", paidByUserId: "bob", amount: 4000 },
    ];
    const splits = [
      { expenseId: "exp1", owedByUserId: "alice", amount: 5000 },
      { expenseId: "exp1", owedByUserId: "bob", amount: 5000 },
      { expenseId: "exp2", owedByUserId: "alice", amount: 2000 },
      { expenseId: "exp2", owedByUserId: "bob", amount: 2000 },
    ];
    const payments: { paidByUserId: string; paidToUserId: string; amount: number }[] = [];

    const rawDebts = calculatePairwiseDebts(members, expenses, splits, payments);

    expect(rawDebts).toHaveLength(1);
    expect(rawDebts[0]).toEqual({
      fromId: "bob",
      fromName: "Bob",
      toId: "alice",
      toName: "Alice",
      amountMinorUnits: 3000, // 5000 - 2000
    });
  });

  test("simplifyDebts vs calculatePairwiseDebts - optimization check", () => {
    // Alice owes Bob 50. Bob owes Charlie 50.
    // 1. Alice paid Bob (represented as Bob paying for expense where Alice owes 50)
    // 2. Bob paid Charlie (Charlie paid for expense where Bob owes 50)
    const expenses = [
      { id: "exp1", paidByUserId: "bob", amount: 10000 }, // Bob paid 100, Bob share 50, Alice share 50
      { id: "exp2", paidByUserId: "charlie", amount: 10000 }, // Charlie paid 100, Charlie share 50, Bob share 50
    ];
    const splits = [
      { expenseId: "exp1", owedByUserId: "bob", amount: 5000 },
      { expenseId: "exp1", owedByUserId: "alice", amount: 5000 },
      { expenseId: "exp2", owedByUserId: "charlie", amount: 5000 },
      { expenseId: "exp2", owedByUserId: "bob", amount: 5000 },
    ];
    const payments: { paidByUserId: string; paidToUserId: string; amount: number }[] = [];

    // Pairwise debts show direct lines: Alice owes Bob (50), Bob owes Charlie (50)
    const rawDebts = calculatePairwiseDebts(members, expenses, splits, payments);
    expect(rawDebts).toHaveLength(2);

    const aliceToBob = rawDebts.find((d) => d.fromId === "alice" && d.toId === "bob");
    const bobToCharlie = rawDebts.find((d) => d.fromId === "bob" && d.toId === "charlie");
    expect(aliceToBob?.amountMinorUnits).toBe(5000);
    expect(bobToCharlie?.amountMinorUnits).toBe(5000);

    // Simplified debts nets Bob out completely. Only Alice pays Charlie (50).
    const simplified = simplifyDebts(members, expenses, splits, payments);
    expect(simplified).toHaveLength(1);
    expect(simplified[0]).toEqual({
      fromId: "alice",
      fromName: "Alice",
      toId: "charlie",
      toName: "Charlie",
      amountMinorUnits: 5000,
    });
  });

  test("calculatePairwiseDebts - handles payments", () => {
    // Alice paid 100, Bob owes 50
    // Bob makes a settle-up payment of 40 to Alice
    const expenses = [{ id: "exp1", paidByUserId: "alice", amount: 10000 }];
    const splits = [
      { expenseId: "exp1", owedByUserId: "alice", amount: 5000 },
      { expenseId: "exp1", owedByUserId: "bob", amount: 5000 },
    ];
    const payments = [{ paidByUserId: "bob", paidToUserId: "alice", amount: 4000 }];

    const rawDebts = calculatePairwiseDebts(members, expenses, splits, payments);

    expect(rawDebts).toHaveLength(1);
    expect(rawDebts[0]).toEqual({
      fromId: "bob",
      fromName: "Bob",
      toId: "alice",
      toName: "Alice",
      amountMinorUnits: 1000, // 5000 - 4000
    });
  });
});
