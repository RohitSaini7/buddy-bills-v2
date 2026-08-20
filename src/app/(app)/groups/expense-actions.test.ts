import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { addExpenseAction } from "./expense-actions";
import { clearTestDb, createMockUser, createMockGroup, addMockMember } from "@tests/factories";
import { setMockUser } from "@tests/setup";
import { db } from "@/db";
import { expenses, expenseSplits } from "@db/schema";
import { eq } from "drizzle-orm";

const runIntegrationTests = process.env.IS_TEST_DB === "true";

describe("Expense Server Actions", () => {
  beforeEach(async () => {
    if (runIntegrationTests) await clearTestDb();
  });

  afterEach(async () => {
    if (runIntegrationTests) await clearTestDb();
  });

  test.skipIf(!runIntegrationTests)("addExpenseAction creates expense and splits", async () => {
    const creator = await createMockUser("11111111-1111-1111-1111-111111111111");
    const friend = await createMockUser("22222222-2222-2222-2222-222222222222");

    const group = await createMockGroup(creator.id, "Test Group");
    await addMockMember(group.id, friend.id);

    setMockUser(creator);

    const result = await addExpenseAction({
      groupId: group.id,
      description: "Dinner",
      amount: 2000,
      paidByUserId: creator.id,
      transactionDate: new Date().toISOString().split("T")[0],
      splitType: "EQUAL",
      splits: [
        { userId: creator.id, amount: 1000 },
        { userId: friend.id, amount: 1000 },
      ],
    });

    expect("error" in result).toBe(false);

    const dbExpenses = await db.select().from(expenses).where(eq(expenses.groupId, group.id));
    expect(dbExpenses.length).toBe(1);
    expect(dbExpenses[0].amount).toBe(2000);

    const dbSplits = await db
      .select()
      .from(expenseSplits)
      .where(eq(expenseSplits.expenseId, dbExpenses[0].id));
    expect(dbSplits.length).toBe(2);
  });

  test.skipIf(!runIntegrationTests)(
    "addExpenseAction fails if splits do not sum to total",
    async () => {
      const creator = await createMockUser("11111111-1111-1111-1111-111111111111");
      const friend = await createMockUser("22222222-2222-2222-2222-222222222222");

      const group = await createMockGroup(creator.id, "Test Group");
      await addMockMember(group.id, friend.id);

      setMockUser(creator);

      const result = await addExpenseAction({
        groupId: group.id,
        description: "Dinner",
        amount: 2000,
        paidByUserId: creator.id,
        transactionDate: new Date().toISOString().split("T")[0],
        splitType: "EQUAL",
        splits: [
          { userId: creator.id, amount: 500 }, // sum is 1500, not 2000
          { userId: friend.id, amount: 1000 },
        ],
      });

      expect(result).toHaveProperty("error");
      expect((result as { error: string }).error).toContain("must equal total amount");
    }
  );

  test.skipIf(!runIntegrationTests)(
    "addExpenseAction correctly stores shareValue for SHARES split",
    async () => {
      const creator = await createMockUser("11111111-1111-1111-1111-111111111111");
      const friend = await createMockUser("22222222-2222-2222-2222-222222222222");

      const group = await createMockGroup(creator.id, "Test Group");
      await addMockMember(group.id, friend.id);

      setMockUser(creator);

      const result = await addExpenseAction({
        groupId: group.id,
        description: "Dinner",
        amount: 3000,
        paidByUserId: creator.id,
        transactionDate: new Date().toISOString().split("T")[0],
        splitType: "SHARES",
        splits: [
          { userId: creator.id, amount: 2000, shareValue: 2 },
          { userId: friend.id, amount: 1000, shareValue: 1 },
        ],
      });

      if ("error" in result) {
        console.log(result.error);
      }
      expect("error" in result).toBe(false);

      const dbExpenses = await db.select().from(expenses).where(eq(expenses.groupId, group.id));
      expect(dbExpenses.length).toBe(1);

      const dbSplits = await db
        .select()
        .from(expenseSplits)
        .where(eq(expenseSplits.expenseId, dbExpenses[0].id));
      expect(dbSplits.length).toBe(2);

      const creatorSplit = dbSplits.find((s) => s.owedByUserId === creator.id);
      const friendSplit = dbSplits.find((s) => s.owedByUserId === friend.id);

      expect(creatorSplit?.shareValue).toBe(2);
      expect(friendSplit?.shareValue).toBe(1);
    }
  );
});
