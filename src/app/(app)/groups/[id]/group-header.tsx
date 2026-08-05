import Link from "next/link";
import { ArrowLeft, Trash2, LogOut } from "lucide-react";
import { Button } from "@components/ui/button";
import { minorUnitsToDisplay } from "@lib/money";
import { EditGroupDialog } from "./edit-group-dialog";
import type { Group } from "@/types/group";

export function GroupHeader({
  group,
  totalSpend,
  currencySymbol,
  isCreator,
  onDeleteGroup,
  onLeaveGroup,
}: {
  group: Group;
  totalSpend: number;
  currencySymbol: string;
  isCreator: boolean;
  onDeleteGroup: () => void;
  onLeaveGroup: () => void;
}) {
  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium group-link"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-all" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{group.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Group ID: <span className="font-mono">{group.id}</span>
            </p>
          </div>
          {isCreator ? (
            <div className="flex items-center gap-2">
              <EditGroupDialog group={group} />
              <Button
                variant="destructive"
                size="xs"
                onClick={onDeleteGroup}
                className="mt-2 text-xs flex items-center gap-1 cursor-pointer font-semibold border border-transparent active:scale-95 transition-all shadow-sm"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Group</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="xs"
              onClick={onLeaveGroup}
              className="mt-2 text-xs flex items-center gap-1 cursor-pointer font-semibold border border-transparent active:scale-95 transition-all shadow-sm"
            >
              <LogOut className="w-3 h-3" />
              <span>Leave Group</span>
            </Button>
          )}
        </div>

        <div className="bg-card border border-border px-4 py-2.5 rounded-xl flex items-center gap-3 self-start sm:self-center shadow-sm font-mono text-sm">
          <span className="text-muted-foreground font-semibold">Total Group Spend:</span>
          <span className="font-bold text-primary">
            {currencySymbol}
            {minorUnitsToDisplay(totalSpend)}
          </span>
        </div>
      </div>
    </div>
  );
}
