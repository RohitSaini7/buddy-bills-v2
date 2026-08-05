"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { ReceiptText } from "lucide-react";
import { addExpenseAction } from "@/app/(app)/groups/expense-actions";
import { toast } from "sonner";
import { ExpenseForm, type ExpenseFormData } from "./expense-form";
import type { Member, UserType } from "@/types/group";

export function AddExpenseDialog({
  groupId,
  members,
  currentUser,
  currencySymbol,
}: {
  groupId: string;
  members: Member[];
  currentUser: UserType;
  currencySymbol: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (isLoading) return;
    setIsOpen(open);
    if (open) {
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

    const res = await addExpenseAction({
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
      toast.success("Expense added successfully");
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-1.5 cursor-pointer font-medium">
          <ReceiptText className="w-4 h-4" />
          Add Expense
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle>Log Expense</DialogTitle>
          <DialogDescription>
            Record a bill and divide the costs among group members.
          </DialogDescription>
        </DialogHeader>

        <ExpenseForm
          key={isOpen ? "open" : "closed"}
          members={members}
          currentUser={currentUser}
          currencySymbol={currencySymbol}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          submitLabel="Log Expense"
          loadingLabel="Logging..."
          isLoading={isLoading}
          errorMsg={errorMsg}
        />
      </DialogContent>
    </Dialog>
  );
}
