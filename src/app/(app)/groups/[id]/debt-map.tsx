import React from "react";
import { Wallet, Check, TrendingDown, ArrowRight } from "lucide-react";
import { minorUnitsToDisplay } from "@lib/money";
import type { Group, UserType } from "@/types/group";

interface DirectRepayment {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export function DebtMap({
  directRepayments,
  currentUser,
  currencySymbol,
}: {
  group: Group;
  directRepayments: DirectRepayment[];
  currentUser: UserType;
  currencySymbol: string;
  isCreator: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          Active Debt Map
        </h3>
      </div>

      {directRepayments.length === 0 ? (
        <div className="space-y-3 text-center py-6">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Check className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-foreground">Fully Settled</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All split bills are completely squared off. Excellent work!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Minimize transactional friction. Settle debts by sending direct payments:
          </p>

          <div className="space-y-2">
            {directRepayments.map((debt) => {
              const isFromMe = debt.fromId === currentUser.id;
              const isToMe = debt.toId === currentUser.id;

              return (
                <div
                  key={`${debt.fromId}-${debt.toId}`}
                  className="bg-background border border-border p-3 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span
                        className={`font-bold ${isFromMe ? "text-primary" : "text-foreground"}`}
                      >
                        {isFromMe ? "You" : debt.fromName}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span
                        className={`font-bold ${isToMe ? "text-emerald-500" : "text-foreground"}`}
                      >
                        {isToMe ? "You" : debt.toName}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-foreground block">
                      {currencySymbol}
                      {minorUnitsToDisplay(debt.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-primary/5 border border-primary/15 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-primary">
            <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Click the <span className="font-bold">Settle Up</span> button above to pay off
              suggestions. Payer and Receiver defaults will automatically fill for the highest debt
              path.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
