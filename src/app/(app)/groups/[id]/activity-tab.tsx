import { Activity as ActivityIcon, ReceiptText, Wallet, UserPlus } from "lucide-react";
import { minorUnitsToDisplay } from "@lib/money";

export type Activity = {
  id: string;
  type: "expense" | "payment" | "join";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
};

interface ActivityTabProps {
  activities: Activity[];
  currencySymbol: string;
}

export function ActivityTab({ activities, currencySymbol }: ActivityTabProps) {
  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-75">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ActivityIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-foreground">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Group events like adding expenses or settling up will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 flex gap-4 hover:bg-muted/30 transition-colors">
                <div className="mt-1 shrink-0">
                  {activity.type === "expense" && (
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                  )}
                  {activity.type === "payment" && (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                  )}
                  {activity.type === "join" && (
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <UserPlus className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5" suppressHydrationWarning>
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(activity.timestamp))}
                    </p>
                  </div>

                  {activity.amount !== undefined && (
                    <div className="shrink-0 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          activity.type === "expense" ? "text-blue-500" : "text-emerald-500"
                        }`}
                      >
                        {currencySymbol}
                        {minorUnitsToDisplay(activity.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
