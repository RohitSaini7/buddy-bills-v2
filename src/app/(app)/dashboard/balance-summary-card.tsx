import { minorUnitsToDisplay, getCurrencySymbol } from "@lib/money";
import { Separator } from "@components/ui/separator";

export function BalanceSummaryCard({
  collapsed,
  totalYouOweMinorUnits,
  totalOwedToYouMinorUnits,
  currencyCode,
}: {
  collapsed: boolean;
  totalYouOweMinorUnits: number;
  totalOwedToYouMinorUnits: number;
  currencyCode?: string;
}) {
  if (collapsed) return null;

  return (
    <div className="px-3 py-2 bg-muted/40 rounded-xl flex items-center justify-between gap-2 border border-border/50 text-[11px] leading-tight">
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider truncate">
          Owe
        </span>
        <span
          className={`font-mono font-bold truncate ${totalYouOweMinorUnits > 0 ? "text-destructive" : "text-muted-foreground"}`}
        >
          {getCurrencySymbol(currencyCode)}
          {minorUnitsToDisplay(totalYouOweMinorUnits)}
        </span>
      </div>
      <Separator orientation="vertical" className="h-6 shrink-0 self-center opacity-60" />
      <div className="flex flex-col flex-1 min-w-0 text-right">
        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider truncate">
          Owed
        </span>
        <span
          className={`font-mono font-bold truncate ${totalOwedToYouMinorUnits > 0 ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground"}`}
        >
          {getCurrencySymbol(currencyCode)}
          {minorUnitsToDisplay(totalOwedToYouMinorUnits)}
        </span>
      </div>
    </div>
  );
}
