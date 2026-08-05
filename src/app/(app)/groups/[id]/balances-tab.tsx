import { minorUnitsToDisplay, EPSILON_MINOR_UNITS } from "@lib/money";
import type { Member, Payment, Group, UserType } from "@/types/group";
import { SettlementHistory } from "./settlement-history";
import { DebtMap } from "./debt-map";
import { getInitials } from "@lib/utils";
import { Avatar, AvatarFallback } from "@components/ui/avatar";

interface DirectRepayment {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

interface BalancesTabProps {
  members: Member[];
  memberBalances: Record<string, number>;
  payments: Payment[];
  directRepayments: DirectRepayment[];
  currentUser: UserType;
  currencySymbol: string;
  group: Group;
  isCreator: boolean;
  onDeletePayment: (paymentId: string) => void;
}

export function BalancesTab({
  members,
  memberBalances,
  payments,
  directRepayments,
  currentUser,
  currencySymbol,
  group,
  isCreator,
  onDeletePayment,
}: BalancesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-base font-bold text-foreground">Group Net Balances</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((member) => {
            const bal = memberBalances[member.id] || 0;
            const isMe = member.id === currentUser.id;

            return (
              <div
                key={member.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-muted text-xs font-bold font-mono">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-bold block text-foreground">
                      {isMe ? "You" : member.name}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {bal > EPSILON_MINOR_UNITS
                        ? "Creditor"
                        : bal < -EPSILON_MINOR_UNITS
                          ? "Debtor"
                          : "Settled"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-sm block ${
                      bal > EPSILON_MINOR_UNITS
                        ? "text-emerald-500"
                        : bal < -EPSILON_MINOR_UNITS
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {bal > EPSILON_MINOR_UNITS ? "+" : ""}
                    {currencySymbol}
                    {minorUnitsToDisplay(bal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <SettlementHistory
          payments={payments}
          currentUser={currentUser}
          currencySymbol={currencySymbol}
          isCreator={isCreator}
          onDeletePayment={onDeletePayment}
        />
      </div>

      <DebtMap
        group={group}
        directRepayments={directRepayments}
        currentUser={currentUser}
        currencySymbol={currencySymbol}
        isCreator={isCreator}
      />
    </div>
  );
}
