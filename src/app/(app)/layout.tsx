import React from "react";
import { getCachedSession } from "@lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "./dashboard/dashboard-sidebar";
import { getSidebarData } from "@db/queries";
import { cookies } from "next/headers";
import { Toaster } from "@components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();

  if (!session) {
    redirect("/");
  }

  const { groups, totalYouOweMinorUnits, totalOwedToYouMinorUnits } = await getSidebarData(
    session.user.id
  );
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-100 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md font-bold"
      >
        Skip to content
      </a>
      <DashboardSidebar
        user={session.user}
        groups={groups}
        totalYouOweMinorUnits={totalYouOweMinorUnits}
        totalOwedToYouMinorUnits={totalOwedToYouMinorUnits}
        initialCollapsed={isCollapsed}
      />
      <div
        className={`flex-1 flex flex-col w-full min-w-0 transition-all duration-300 main-content-wrapper ${
          isCollapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        <main
          id="main-content"
          className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10"
        >
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
