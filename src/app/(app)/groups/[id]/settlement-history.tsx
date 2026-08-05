import React from "react";
import { Trash2 } from "lucide-react";
import { minorUnitsToDisplay } from "@lib/money";
import type { Payment, UserType } from "@/types/group";
import { Button } from "@components/ui/button";

export function SettlementHistory({
  payments,
  currentUser,
  currencySymbol,
  isCreator,
  onDeletePayment,
}: {
  payments: Payment[];
  currentUser: UserType;
  currencySymbol: string;
  isCreator: boolean;
  onDeletePayment: (paymentId: string) => void;
}) {
  return (
    <div className="space-y-3 pt-4">
      <h3 className="text-sm font-bold text-foreground">Settlement History</h3>
      {payments.length === 0 ? (
        <div className="bg-card/20 border border-border border-dashed rounded-2xl py-8 text-center text-xs text-muted-foreground">
          No payment logs recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((pmt) => {
            const isSenderMe = pmt.paidByUserId === currentUser.id;
            const isRecipientMe = pmt.paidToUserId === currentUser.id;

            return (
              <div
                key={pmt.id}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">
                      {isSenderMe ? "You" : pmt.paidByName}
                    </span>
                    {" paid "}
                    <span className="font-bold text-foreground">
                      {isRecipientMe ? "You" : pmt.paidToName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-emerald-500">
                    {currencySymbol}
                    {minorUnitsToDisplay(pmt.amount)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs text-muted-foreground font-mono"
                      suppressHydrationWarning
                    >
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "short",
                        // Issue #18: Append T00:00:00 to date-only strings
                      }).format(new Date(pmt.paymentDate + "T00:00:00"))}
                    </span>
                    {(pmt.paidByUserId === currentUser.id ||
                      pmt.paidToUserId === currentUser.id ||
                      isCreator) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDeletePayment(pmt.id)}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Delete settlement record"
                        aria-label="Delete settlement record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
