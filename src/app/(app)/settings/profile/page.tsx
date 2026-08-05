import { getCachedSession } from "@lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";
import { db } from "@/db";
import { accounts } from "@db/schema";
import { eq } from "drizzle-orm";
import type { UserType } from "@/types/group";

export default async function ProfilePage() {
  const session = await getCachedSession();

  if (!session) {
    redirect("/");
  }

  const linkedAccounts = await db
    .select({
      id: accounts.id,
      providerId: accounts.providerId,
    })
    .from(accounts)
    .where(eq(accounts.userId, session.user.id));

  return <ProfileClient user={session.user as UserType} linkedAccounts={linkedAccounts} />;
}
