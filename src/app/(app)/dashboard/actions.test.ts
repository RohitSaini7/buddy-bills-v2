import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { createGroupAction, addMemberAction } from "./actions";
import { clearTestDb, createMockUser, createMockGroup } from "@tests/factories";
import { setMockUser } from "@tests/setup";
import { db } from "@/db";
import { groupMembers } from "@db/schema";
import { and, eq, isNull } from "drizzle-orm";

const runIntegrationTests = process.env.IS_TEST_DB === "true";

describe("Dashboard Server Actions", () => {
  beforeEach(async () => {
    if (runIntegrationTests) await clearTestDb();
  });

  afterEach(async () => {
    if (runIntegrationTests) await clearTestDb();
  });

  test.skipIf(!runIntegrationTests)("createGroupAction successfully creates a group", async () => {
    const creator = await createMockUser("user-1");
    setMockUser(creator);

    const result = await createGroupAction("My New Group", "USD");

    expect("error" in result).toBe(false);
    if ("success" in result && result.group) {
      expect(result.group.name).toBe("My New Group");
      expect(result.group.currency).toBe("USD");
      expect(result.group.createdByUserId).toBe(creator.id);

      // Verify they are a member
      const members = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, result.group.id));
      expect(members.length).toBe(1);
      expect(members[0].userId).toBe(creator.id);
    }
  });

  test.skipIf(!runIntegrationTests)(
    "addMemberAction adds an existing user to the group",
    async () => {
      const creator = await createMockUser("creator-1");
      const friend = await createMockUser("friend-1", "Friend", "friend@example.com");

      const group = await createMockGroup(creator.id, "Test Group");
      setMockUser(creator);

      const result = await addMemberAction(group.id, "friend@example.com");
      expect("error" in result).toBe(false);

      const members = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), isNull(groupMembers.deletedAt)));

      expect(members.length).toBe(2);
      expect(members.map((m) => m.userId)).toContain(friend.id);
    }
  );

  test.skipIf(!runIntegrationTests)("addMemberAction fails if not creator", async () => {
    const creator = await createMockUser("creator-1");
    const imposter = await createMockUser("imposter-1");

    const group = await createMockGroup(creator.id, "Test Group");
    setMockUser(imposter);

    const result = await addMemberAction(group.id, "someone@example.com");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toContain("Only the group creator");
  });
});
