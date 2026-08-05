"use server";

import { db } from "@/db";
import { accounts } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCachedSession } from "@lib/auth";

export async function unlinkProviderAction(providerId: string) {
  const session = await getCachedSession();

  if (!session) {
    return { error: "Unauthorized" };
  }

  // Check how many accounts the user has
  const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, session.user.id));

  if (userAccounts.length <= 1) {
    return {
      error:
        "Cannot unlink your only sign-in method. Please set up a password or another social account first.",
    };
  }

  const accountToUnlink = userAccounts.find((a) => a.providerId === providerId);
  if (!accountToUnlink) {
    return { error: "Provider not found." };
  }

  try {
    await db
      .delete(accounts)
      .where(and(eq(accounts.userId, session.user.id), eq(accounts.providerId, providerId)));

    revalidatePath("/settings/profile");
    return { success: true };
  } catch (err) {
    console.error("unlinkProviderAction error:", err);
    return { error: "Failed to unlink provider. Please try again." };
  }
}
