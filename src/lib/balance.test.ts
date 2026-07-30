import { expect, test, describe } from "bun:test";
import { calculateNetBalances, calculateMemberBalances } from "./balance";

describe("Balance Utilities", () => {
  describe("calculateNetBalances", () => {
    test("calculates correct net balances across groups", () => {
      const userId = "user1";
      const groupIds = ["group1", "group2"];

      const expenses = [
        { id: "e1", groupId: "group1", paidByUserId: "user1", amount: 1000 },
        { id: "e2", groupId: "group2", paidByUserId: "user2", amount: 500 },
      ];

      const splits = [
        { expenseId: "e1", owedByUserId: "user1", amount: 500 },
        { expenseId: "e1", owedByUserId: "user2", amount: 500 },
        { expenseId: "e2", owedByUserId: "user1", amount: 500 },
      ];

      const payments = [
        { groupId: "group1", paidByUserId: "user2", paidToUserId: "user1", amount: 100 },
      ];

      const result = calculateNetBalances(userId, groupIds, expenses, splits, payments);

      // group1: user1 paid 1000, owes 500 -> +500. user2 paid user1 100 -> user1 balance is +400
      // group2: user2 paid 500, user1 owes 500 -> -500.
      // Total owed to user1 = 400
      // Total user1 owes = 500

      expect(result.totalOwedToYouMinorUnits).toBe(400);
      expect(result.totalYouOweMinorUnits).toBe(500);
    });

    test("handles users with no expenses or splits", () => {
      const result = calculateNetBalances("user3", ["group1"], [], [], []);
      expect(result.totalOwedToYouMinorUnits).toBe(0);
      expect(result.totalYouOweMinorUnits).toBe(0);
    });
  });

  describe("calculateMemberBalances", () => {
    test("calculates per-member balances correctly within a group", () => {
      const members = [{ id: "user1" }, { id: "user2" }, { id: "user3" }];

      const expenses = [{ paidByUserId: "user1", amount: 3000 }];

      const splits = [
        { owedByUserId: "user1", amount: 1000 },
        { owedByUserId: "user2", amount: 1000 },
        { owedByUserId: "user3", amount: 1000 },
      ];

      const payments = [{ paidByUserId: "user2", paidToUserId: "user1", amount: 500 }];

      const result = calculateMemberBalances(members, expenses, splits, payments);

      // user1: paid 3000, owes 1000. received 500 -> +1500
      // user2: paid 0, owes 1000. sent 500 -> -500
      // user3: paid 0, owes 1000 -> -1000

      expect(result["user1"]).toBe(1500);
      expect(result["user2"]).toBe(-500);
      expect(result["user3"]).toBe(-1000);
    });

    test("ignores members who have left if they are not in the members array", () => {
      const members = [{ id: "user1" }];
      const expenses = [{ paidByUserId: "user1", amount: 1000 }];
      const splits = [{ owedByUserId: "user2", amount: 1000 }];
      const payments = [];

      const result = calculateMemberBalances(members, expenses, splits, payments);

      // user2 is not in members array, their balance is not tracked/returned
      expect(result["user1"]).toBe(1000);
      expect(result["user2"]).toBeUndefined();
    });
  });
});
