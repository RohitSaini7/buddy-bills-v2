"use server";

import { db } from "@/db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withAuth } from "@lib/action-auth";

export const updateUserPreferencesAction = withAuth(
  "updatePreferences",
  20,
  60000
)(async ({ session }, preferences: { defaultCurrency?: string }) => {
  try {
    if (preferences.defaultCurrency) {
      await db
        .update(users)
        .set({ defaultCurrency: preferences.defaultCurrency })
        .where(eq(users.id, session.user.id));
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updateUserPreferencesAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update preferences" };
  }
});
