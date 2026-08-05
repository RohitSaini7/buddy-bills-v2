"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Edit2 } from "lucide-react";
import { editExpenseAction } from "@/app/(app)/groups/expense-actions";
import { minorUnitsToDisplay } from "@lib/money";
import { toast } from "sonner";
import { ExpenseForm, type ExpenseFormData } from "./expense-form";

import type { Member, UserType, Expense, Split } from "@/types/group";

export function EditExpenseDialog({
  groupId,
  members,
  expense,
  expenseSplits,
  currencySymbol,
  currentUser,
}: {
  groupId: string;
  members: Member[];
  expense: Expense;
  expenseSplits: Split[];
  currencySymbol: string;
  currentUser: UserType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const initialData = useMemo<ExpenseFormData>(() => {
    const splitsList = members.map((m) => {
      const splitRecord = expenseSplits.find((s) => s.owedByUserId === m.id);
      let customValue = "";

      if (splitRecord) {
        if (expense.splitType === "EXACT") {
          customValue = minorUnitsToDisplay(splitRecord.amount).toString();
        } else if (expense.splitType === "PERCENTAGE") {
          const pct = (splitRecord.amount / expense.amount) * 100;
          customValue = pct.toString();
        } else if (expense.splitType === "SHARES") {
          customValue = splitRecord.shareValue?.toString() || "0";
        }
      }

      return {
        userId: m.id,
        isSelected: !!splitRecord,
        customValue,
      };
    });

    return {
      description: expense.description,
      amount: minorUnitsToDisplay(expense.amount).toString(),
      paidByUserId: expense.paidByUserId,
      date: expense.transactionDate,
      splitType: expense.splitType as "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES",
      splits: splitsList,
    };
  }, [expense, expenseSplits, members]);

  const handleOpenChange = (open: boolean) => {
    if (isLoading) return;
    setIsOpen(open);
    if (!open) {
      setErrorMsg("");
    }
  };

  const handleSubmit = async (
    data: ExpenseFormData,
    splits: { userId: string; amount: number; shareValue?: number }[],
    totalMinorUnits: number
  ) => {
    setIsLoading(true);
    setErrorMsg("");

    const res = await editExpenseAction({
      expenseId: expense.id,
      groupId,
      paidByUserId: data.paidByUserId,
      description: data.description,
      amount: totalMinorUnits,
      transactionDate: data.date,
      splitType: data.splitType,
      splits,
    });

    if (res.error) {
      toast.error(res.error);
      setErrorMsg(res.error);
      setIsLoading(false);
    } else {
      toast.success("Expense updated successfully");
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className="text-xs flex items-center gap-1 cursor-pointer font-semibold transition-all shadow-sm"
        >
          <Edit2 className="w-3 h-3" />
          <span>Edit</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>Update the details or splits of this expense.</DialogDescription>
        </DialogHeader>

        <ExpenseForm
          key={isOpen ? "open" : "closed"}
          members={members}
          currentUser={currentUser}
          currencySymbol={currencySymbol}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          submitLabel="Save Changes"
          loadingLabel="Saving..."
          isLoading={isLoading}
          errorMsg={errorMsg}
        />
      </DialogContent>
    </Dialog>
  );
}
