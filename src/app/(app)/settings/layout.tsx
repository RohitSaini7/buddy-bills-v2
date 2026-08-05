import React from "react";
import Link from "next/link";
import { User, Settings2 } from "lucide-react";
import { getCachedSession } from "@lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();
  if (!session) redirect("/");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <Link
              href="/settings/preferences"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              Preferences
            </Link>
          </nav>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
