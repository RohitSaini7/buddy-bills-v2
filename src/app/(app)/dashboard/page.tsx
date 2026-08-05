import { getCachedSession } from "@lib/auth";
import { redirect } from "next/navigation";
import { CreateGroupDialog } from "./create-group-dialog";
import { Sparkles, Users } from "lucide-react";
import { getDashboardData } from "@db/queries";
import { MetricsCards } from "./metrics-cards";
import { GroupCard } from "./group-card";
import { InviteAcceptToast } from "@components/invite-accept-toast";
import { Badge } from "@components/ui/badge";

export default async function DashboardPage() {
  const session = await getCachedSession();

  if (!session) {
    redirect("/");
  }

  const user = session.user;

  const {
    groups: userGroups,
    totalYouOweMinorUnits,
    totalOwedToYouMinorUnits,
  } = await getDashboardData(user.id);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <InviteAcceptToast />
      {/* Welcome Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm">
        <div className="space-y-1">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent">
            <Sparkles className="w-3.5 h-3.5" />
            Foundation Ready
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-mono">{user.email}</span>
          </p>
        </div>
        <div className="flex items-center">
          <CreateGroupDialog defaultCurrency={user.defaultCurrency} />
        </div>
      </div>

      <MetricsCards
        totalYouOweMinorUnits={totalYouOweMinorUnits}
        totalOwedToYouMinorUnits={totalOwedToYouMinorUnits}
        currencyCode={user.defaultCurrency as string | undefined}
      />

      {/* Groups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Your Groups
            {userGroups.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground font-mono">
                {userGroups.length}
              </span>
            )}
          </h2>
        </div>

        {userGroups.length === 0 ? (
          /* Empty State */
          <div className="bg-card/30 border border-border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-70">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-foreground">No groups yet</h3>
              <p className="text-sm text-muted-foreground">
                To start tracking and splitting expenses, create a group and invite your friends.
              </p>
            </div>
            <CreateGroupDialog defaultCurrency={user.defaultCurrency} />
          </div>
        ) : (
          /* Groups Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
