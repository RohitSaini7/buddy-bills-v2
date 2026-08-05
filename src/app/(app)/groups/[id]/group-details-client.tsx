"use client";

import { ConfirmDialog } from "@components/ui/confirm-dialog";
import { Button } from "@components/ui/button";
import { toggleSimplifyDebtsAction } from "@/app/(app)/dashboard/actions";
import { AddExpenseDialog } from "./add-expense-dialog";
import { SettleUpDialog } from "./settle-up-dialog";
import { ExpensesTab } from "./expenses-tab";
import { BalancesTab } from "./balances-tab";
import { MembersTab } from "./members-tab";
import { GroupHeader } from "./group-header";
import { Activity, ActivityTab } from "./activity-tab";
import { SettingsTab } from "./settings-tab";
import {
  AlertCircle,
  ReceiptText,
  Wallet,
  Users,
  Activity as ActivityIcon,
  Settings,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { getCurrencySymbol } from "@lib/money";
import { calculateMemberBalances } from "@lib/balance";
import { simplifyDebts, calculatePairwiseDebts } from "@lib/debt-simplifier";
import type { Member, Group, UserType, Expense, Split, Payment } from "@/types/group";
import { useGroupDetails } from "./use-group-details";
import { usePusherRefresh } from "@hooks/use-pusher-refresh";

export function GroupDetailsClient({
  group,
  members,
  expenses,
  splits,
  payments,
  activities,
  currentUser,
  serverBalances,
  serverRepayments,
  page,
  hasNextPage,
}: {
  group: Group;
  members: Member[];
  expenses: Expense[];
  splits: Split[];
  payments: Payment[];
  activities: Activity[];
  currentUser: UserType;
  page?: number;
  hasNextPage?: boolean;
  serverBalances?: Record<string, number>;
  serverRepayments?: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
  }[];
}) {
  usePusherRefresh(group.id);

  const {
    activeTab,
    setActiveTab,
    actionError,
    setActionError,
    confirmDialog,
    setConfirmDialog,
    optimisticMembers,
    handleDeleteGroup,
    handleLeaveGroup,
    handleDeleteExpense,
    handleDeletePayment,
    handleAddMember,
    handleRemoveMember,
  } = useGroupDetails(group, members);

  const currencySymbol = getCurrencySymbol(group.currency);

  const isCreator = group.createdByUserId === currentUser.id;

  const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const hasUnverifiedMembers = optimisticMembers.some((m) => !m.hasAccount);

  const memberBalances =
    serverBalances || calculateMemberBalances(optimisticMembers, expenses, splits, payments);

  const directRepayments =
    serverRepayments ||
    (group.simplifyDebts
      ? simplifyDebts(optimisticMembers, expenses, splits, payments)
      : calculatePairwiseDebts(optimisticMembers, expenses, splits, payments)
    ).map((r) => ({
      fromId: r.fromId,
      fromName: r.fromName,
      toId: r.toId,
      toName: r.toName,
      amount: r.amountMinorUnits,
    }));

  const suggestedPayer = directRepayments.length > 0 ? directRepayments[0].fromId : undefined;
  const suggestedReceiver = directRepayments.length > 0 ? directRepayments[0].toId : undefined;

  return (
    <div className="space-y-6">
      {/* Issue #13: Custom confirmation dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
        isLoading={confirmDialog.isLoading}
      />

      {/* Issue #13: Action error display (replaces window.alert) */}
      {actionError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-destructive/60 hover:text-destructive cursor-pointer h-5 w-5"
            onClick={() => setActionError("")}
          >
            ×
          </Button>
        </div>
      )}

      <GroupHeader
        group={group}
        totalSpend={totalSpend}
        currencySymbol={currencySymbol}
        isCreator={isCreator}
        onDeleteGroup={handleDeleteGroup}
        onLeaveGroup={handleLeaveGroup}
      />

      {hasUnverifiedMembers && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Unverified Members Present</span>
            This group contains members with unverified email addresses. Split calculations and
            repayment paths will remain active, but unverified users must register to access and
            settle their balances.
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as typeof activeTab)}
        className="w-full"
      >
        <div className="border-b border-border">
          <div className="flex justify-between items-end">
            <TabsList variant="line" className="h-auto pb-0">
              <TabsTrigger value="expenses" className="pb-3 text-sm font-semibold gap-2">
                <ReceiptText className="w-4 h-4" />
                Expenses
                {expenses.length > 0 && (
                  <span className="px-1.5 py-px text-xs bg-muted rounded-full font-mono font-medium">
                    {expenses.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="balances" className="pb-3 text-sm font-semibold gap-2">
                <Wallet className="w-4 h-4" />
                Balances
              </TabsTrigger>
              <TabsTrigger value="members" className="pb-3 text-sm font-semibold gap-2">
                <Users className="w-4 h-4" />
                Members
                <span className="px-1.5 py-px text-xs bg-muted rounded-full font-mono font-medium">
                  {members.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="pb-3 text-sm font-semibold gap-2 hidden sm:flex"
              >
                <ActivityIcon className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="pb-3 text-sm font-semibold gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <div className="pb-2 flex items-center gap-2">
              {activeTab === "balances" && (
                <SettleUpDialog
                  groupId={group.id}
                  members={members}
                  currentUser={currentUser}
                  suggestedPayerId={suggestedPayer}
                  suggestedReceiverId={suggestedReceiver}
                  currencySymbol={currencySymbol}
                />
              )}
              <AddExpenseDialog
                groupId={group.id}
                members={members}
                currentUser={currentUser}
                currencySymbol={getCurrencySymbol(group.currency)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 animate-in fade-in duration-200">
          <TabsContent value="expenses" className="mt-0 outline-none">
            <ExpensesTab
              expenses={expenses}
              splits={splits}
              currentUser={currentUser}
              currencySymbol={currencySymbol}
              isCreator={isCreator}
              groupId={group.id}
              members={members}
              onDeleteExpense={handleDeleteExpense}
              serverPage={page}
              hasNextPage={hasNextPage}
            />
          </TabsContent>

          <TabsContent value="balances" className="mt-0 outline-none">
            <BalancesTab
              members={members}
              memberBalances={memberBalances}
              payments={payments}
              directRepayments={directRepayments}
              currentUser={currentUser}
              currencySymbol={currencySymbol}
              group={group}
              isCreator={isCreator}
              onDeletePayment={handleDeletePayment}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-0 outline-none">
            <MembersTab
              optimisticMembers={optimisticMembers}
              group={group}
              currentUser={currentUser}
              isCreator={isCreator}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-0 outline-none">
            <ActivityTab activities={activities} currencySymbol={currencySymbol} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 outline-none">
            <SettingsTab
              group={group}
              members={optimisticMembers}
              currentUser={currentUser}
              isCreator={isCreator}
              onToggleSimplify={(nextVal) => toggleSimplifyDebtsAction(group.id, nextVal)}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
