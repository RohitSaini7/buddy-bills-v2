import { TrendingDown, TrendingUp } from "lucide-react";
import { minorUnitsToDisplay, getCurrencySymbol } from "@lib/money";

interface MetricsCardsProps {
  totalYouOweMinorUnits: number;
  totalOwedToYouMinorUnits: number;
  currencyCode?: string;
}

export function MetricsCards({
  totalYouOweMinorUnits,
  totalOwedToYouMinorUnits,
  currencyCode,
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="text-sm font-semibold text-muted-foreground">Total you owe</span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {getCurrencySymbol(currencyCode)}
            {minorUnitsToDisplay(totalYouOweMinorUnits)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="text-sm font-semibold text-muted-foreground">Total owed to you</span>
          <div className="text-2xl font-bold font-mono text-emerald-500">
            {getCurrencySymbol(currencyCode)}
            {minorUnitsToDisplay(totalOwedToYouMinorUnits)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
