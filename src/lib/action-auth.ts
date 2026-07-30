import { getCachedSession } from "@lib/auth";
import { db } from "@/db";
import { groupMembers, groups } from "@db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { RateLimiter } from "@lib/rate-limit";
import { isValidUUID } from "@lib/validation";

type NonNullable<T> = T extends null | undefined ? never : T;
type SessionResult = NonNullable<Awaited<ReturnType<typeof getCachedSession>>>;

export type ActionContext = {
  session: SessionResult;
  membership: typeof groupMembers.$inferSelect;
  group: typeof groups.$inferSelect;
};

export function withGroupAuth(actionName: string, limit: number, windowMs: number) {
  return <TArgs extends unknown[], TReturn>(
    handler: (context: ActionContext, ...args: TArgs) => Promise<TReturn>,
    getGroupId?: (...args: TArgs) => string
  ) => {
    return async (...args: TArgs): Promise<TReturn | { error: string }> => {
      const session = await getCachedSession();
      if (!session) {
        return { error: "Unauthorized" };
      }

      const groupId = getGroupId
        ? getGroupId(...args)
        : typeof args[0] === "string"
          ? args[0]
          : (args[0] as { groupId?: string })?.groupId;
      if (!groupId || !isValidUUID(groupId)) {
        return { error: "Invalid group ID" };
      }

      const rateLimit = await RateLimiter.check(
        `${actionName}:${session.user.id}`,
        limit,
        windowMs
      );
      if (!rateLimit.success) {
        const secondsLeft = Math.ceil((rateLimit.reset - Date.now()) / 1000);
        return { error: `Too many requests. Please try again in ${secondsLeft} second(s).` };
      }

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
        return { error: "You are not a member of this group." };
      }

      const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
      if (!group) {
        return { error: "Group not found." };
      }

      return handler({ session, membership, group }, ...args);
    };
  };
}

export function withAuth(actionName: string, limit: number, windowMs: number) {
  return <TArgs extends unknown[], TReturn>(
    handler: (context: { session: SessionResult }, ...args: TArgs) => Promise<TReturn>
  ) => {
    return async (...args: TArgs): Promise<TReturn | { error: string }> => {
      const session = await getCachedSession();
      if (!session) {
        return { error: "Unauthorized" };
      }

      const rateLimit = await RateLimiter.check(
        `${actionName}:${session.user.id}`,
        limit,
        windowMs
      );
      if (!rateLimit.success) {
        const secondsLeft = Math.ceil((rateLimit.reset - Date.now()) / 1000);
        return { error: `Too many requests. Please try again in ${secondsLeft} second(s).` };
      }

      return handler({ session }, ...args);
    };
  };
}
