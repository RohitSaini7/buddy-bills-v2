import { db } from "@/db";
import { users, groups, groupMembers } from "@db/schema";

export async function createMockUser(
  id: string,
  name: string = "Mock User",
  email: string = `mock-${id}@example.com`
) {
  const [user] = await db
    .insert(users)
    .values({
      id,
      name,
      email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return user;
}

export async function createMockGroup(creatorId: string, name: string = "Mock Group") {
  const [group] = await db
    .insert(groups)
    .values({
      name,
      createdByUserId: creatorId,
    })
    .returning();

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: creatorId,
  });

  return group;
}

export async function addMockMember(groupId: string, userId: string) {
  const [member] = await db
    .insert(groupMembers)
    .values({
      groupId,
      userId,
    })
    .returning();
  return member;
}

export async function clearTestDb() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("clearTestDb called in production!");
  }

  if (
    !process.env.DATABASE_URL?.includes("localhost") &&
    !process.env.DATABASE_URL?.includes("127.0.0.1") &&
    !process.env.IS_TEST_DB
  ) {
    throw new Error(
      "clearTestDb refused to run against a remote database without IS_TEST_DB=true to prevent accidental data loss."
    );
  }

  // Since we have cascading deletes, we can just delete groups and users.
  await db.delete(groups);
  await db.delete(users);
}
