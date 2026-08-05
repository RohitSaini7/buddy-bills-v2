import { getCachedSession } from "@lib/auth";
import { redirect } from "next/navigation";
import { PreferencesClient } from "./preferences-client";
import { cookies } from "next/headers";

export default async function PreferencesPage() {
  const session = await getCachedSession();

  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <PreferencesClient
      initialCurrency={session.user.defaultCurrency || "INR"}
      initialSidebarCollapsed={isCollapsed}
    />
  );
}
