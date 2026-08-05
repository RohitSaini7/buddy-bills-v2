"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { Wallet, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addPaymentAction } from "@/app/(app)/groups/expense-actions";
import { toMinorUnits } from "@lib/money";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settleUpFormSchema } from "@lib/schemas";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Input } from "@components/ui/input";

import type { Member, UserType } from "@/types/group";

type SettleUpFormData = z.infer<typeof settleUpFormSchema>;

export function SettleUpDialog({
  groupId,
  members,
  currentUser,
  suggestedPayerId,
  suggestedReceiverId,
  currencySymbol,
}: {
  groupId: string;
  members: Member[];
  currentUser: UserType;
  suggestedPayerId?: string;
  suggestedReceiverId?: string;
  currencySymbol: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SettleUpFormData>({
    resolver: zodResolver(settleUpFormSchema),
    defaultValues: {
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paidByUserId: suggestedPayerId || currentUser.id,
      paidToUserId:
        suggestedReceiverId ||
        members.find((m) => m.id !== (suggestedPayerId || currentUser.id))?.id ||
        "",
    },
  });

  const watchPaidByUserId = getValues("paidByUserId");

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting) return;
    setIsOpen(open);
    if (open) {
      const payerId = suggestedPayerId || currentUser.id;
      const receiverId = suggestedReceiverId || members.find((m) => m.id !== payerId)?.id || "";

      reset({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        paidByUserId: payerId,
        paidToUserId: receiverId,
      });
      setErrorMsg("");
    }
  };

  const handlePayerChange = (newPayerId: string) => {
    setValue("paidByUserId", newPayerId);

    // Auto-switch recipient if they selected the same person
    const currentReceiverId = getValues("paidToUserId");
    if (newPayerId === currentReceiverId) {
      const alternateReceiver = members.find((m) => m.id !== newPayerId)?.id || "";
      setValue("paidToUserId", alternateReceiver);
    }
  };

  const onSubmit = async (data: SettleUpFormData) => {
    if (data.paidByUserId === data.paidToUserId) {
      setErrorMsg("Payer and recipient cannot be the same person.");
      return;
    }

    setErrorMsg("");

    const res = await addPaymentAction({
      groupId,
      paidByUserId: data.paidByUserId,
      paidToUserId: data.paidToUserId,
      amount: toMinorUnits(parseFloat(data.amount)),
      paymentDate: data.date,
    });

    if (res.error) {
      toast.error(res.error);
      setErrorMsg(res.error);
    } else {
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-1.5 cursor-pointer font-medium border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          Settle Up
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Document a direct cash/digital settlement between members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pmt-from">Who Paid? (Sender)</Label>
            <Controller
              control={control}
              name="paidByUserId"
              render={({ field }) => (
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    handlePayerChange(val);
                  }}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="pmt-from"
                    className={`w-full bg-background rounded-xl ${errors.paidByUserId ? "border-destructive focus:ring-destructive" : "border-border"}`}
                  >
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.id === currentUser.id ? "You" : member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paidByUserId && (
              <p className="text-xs text-destructive mt-1">{errors.paidByUserId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pmt-to">Who Received? (Recipient)</Label>
            <Controller
              control={control}
              name="paidToUserId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <SelectTrigger
                    id="pmt-to"
                    className={`w-full bg-background rounded-xl ${errors.paidToUserId ? "border-destructive focus:ring-destructive" : "border-border"}`}
                  >
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members
                      .filter((m) => m.id !== watchPaidByUserId)
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.id === currentUser.id ? "You" : member.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paidToUserId && (
              <p className="text-xs text-destructive mt-1">{errors.paidToUserId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pmt-amount">Amount Paid ({currencySymbol})</Label>
              <Input
                type="number"
                id="pmt-amount"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                disabled={isSubmitting}
                className={`font-mono ${
                  errors.amount ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pmt-date">Date</Label>
              <Input
                type="date"
                id="pmt-date"
                disabled={isSubmitting}
                className={`font-mono ${
                  errors.date ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                {...register("date")}
              />
              {errors.date && (
                <p className="text-xs text-destructive mt-1">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <DialogClose asChild disabled={isSubmitting}>
              <Button type="button" variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer font-bold bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
