"use client";

import { Button } from "@components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { toMinorUnits, minorUnitsToDisplay } from "@lib/money";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseFormSchema } from "@lib/schemas";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";

import type { Member, UserType } from "@/types/group";

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  members: Member[];
  currentUser: UserType;
  currencySymbol: string;
  initialData?: ExpenseFormData;
  onSubmit: (
    data: ExpenseFormData,
    splits: { userId: string; amount: number; shareValue?: number }[],
    totalMinorUnits: number
  ) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  errorMsg: string;
}

export function ExpenseForm({
  members,
  currentUser,
  currencySymbol,
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  loadingLabel,
  isLoading,
  errorMsg,
}: ExpenseFormProps) {
  // Prepare default values
  const defaultSplits =
    initialData?.splits ||
    members.map((m) => ({
      userId: m.id,
      isSelected: true,
      customValue: "",
    }));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount || "",
      paidByUserId: initialData?.paidByUserId || currentUser.id,
      date: initialData?.date || new Date().toISOString().split("T")[0],
      splitType: initialData?.splitType || "EQUAL",
      splits: defaultSplits,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "splits",
  });

  // Watch values for dynamic UI rendering
  const amountStr = useWatch({ control, name: "amount" });
  const splitType = useWatch({ control, name: "splitType" });
  const splitsData = useWatch({ control, name: "splits" }) || [];

  const totalMinorUnits = toMinorUnits(amountStr || "0");
  const selectedSplits = splitsData.filter((s) => s.isSelected);

  const equalShare =
    selectedSplits.length > 0
      ? minorUnitsToDisplay(Math.floor(totalMinorUnits / selectedSplits.length))
      : "0.00";

  // Derive root level splits error (from superRefine)
  const splitsError =
    errors.splits?.root?.message || (errors.splits as unknown as { message?: string })?.message;

  const handleFormSubmit = async (data: ExpenseFormData) => {
    const finalTotalMinorUnits = toMinorUnits(data.amount);
    const finalSelectedSplits = data.splits.filter((s) => s.isSelected);

    const finalSplits: { userId: string; amount: number; shareValue?: number }[] = [];
    const size = finalSelectedSplits.length;

    if (data.splitType === "EQUAL") {
      const baseShareMinorUnits = Math.floor(finalTotalMinorUnits / size);
      finalSelectedSplits.forEach((s, index) => {
        let memberShareMinorUnits = baseShareMinorUnits;
        if (index === 0) {
          memberShareMinorUnits += finalTotalMinorUnits - baseShareMinorUnits * size;
        }
        finalSplits.push({ userId: s.userId, amount: memberShareMinorUnits });
      });
    } else if (data.splitType === "EXACT") {
      finalSelectedSplits.forEach((s) => {
        finalSplits.push({ userId: s.userId, amount: toMinorUnits(s.customValue || "0") });
      });
    } else if (data.splitType === "PERCENTAGE") {
      let distributedSumMinorUnits = 0;
      finalSelectedSplits.forEach((s, idx) => {
        const pct = parseFloat(s.customValue) || 0;
        let memberShareMinorUnits = Math.round(finalTotalMinorUnits * (pct / 100));
        if (idx === finalSelectedSplits.length - 1) {
          memberShareMinorUnits = finalTotalMinorUnits - distributedSumMinorUnits;
        } else {
          distributedSumMinorUnits += memberShareMinorUnits;
        }
        finalSplits.push({ userId: s.userId, amount: memberShareMinorUnits });
      });
    } else if (data.splitType === "SHARES") {
      let distributedSumMinorUnits = 0;
      const sumShares = finalSelectedSplits.reduce(
        (acc, s) => acc + (parseFloat(s.customValue) || 0),
        0
      );
      finalSelectedSplits.forEach((s, idx) => {
        const shares = parseFloat(s.customValue) || 0;
        let memberShareMinorUnits = Math.round(finalTotalMinorUnits * (shares / sumShares));
        if (idx === finalSelectedSplits.length - 1) {
          memberShareMinorUnits = finalTotalMinorUnits - distributedSumMinorUnits;
        } else {
          distributedSumMinorUnits += memberShareMinorUnits;
        }
        finalSplits.push({ userId: s.userId, amount: memberShareMinorUnits, shareValue: shares });
      });
    }

    await onSubmit(data, finalSplits, finalTotalMinorUnits);
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <form
        id="expense-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Description</Label>
            <Input
              type="text"
              id="exp-desc"
              placeholder="e.g., Pizza, Grocery, Cab"
              disabled={isLoading || isSubmitting}
              className={
                errors.description ? "border-destructive focus-visible:ring-destructive" : ""
              }
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">Total Amount ({currencySymbol})</Label>
            <Input
              type="number"
              id="exp-amount"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading || isSubmitting}
              className={`font-mono ${errors.amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="exp-paid-by">Paid By</Label>
            <Controller
              control={control}
              name="paidByUserId"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger
                    id="exp-paid-by"
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
            <Label htmlFor="exp-date">Date</Label>
            <Input
              type="date"
              id="exp-date"
              disabled={isLoading || isSubmitting}
              className={`font-mono ${errors.date ? "border-destructive focus-visible:ring-destructive" : ""}`}
              {...register("date")}
            />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label>Split Method</Label>
          <div className="flex bg-muted p-1 rounded-xl text-xs font-medium w-fit">
            {(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading || isSubmitting}
                className={`px-4 py-1.5 h-auto rounded-lg transition-all capitalize cursor-pointer ${
                  splitType === type
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
                onClick={() => setValue("splitType", type)}
              >
                {type.toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold text-muted-foreground block">
            Split Share Breakdown
          </span>
          <div
            className={`border rounded-2xl divide-y divide-border overflow-hidden bg-background ${
              splitsError ? "border-destructive" : "border-border"
            }`}
          >
            {fields.map((field, index) => {
              const member = members.find((m) => m.id === field.userId);
              if (!member) return null;

              const isChecked = splitsData[index]?.isSelected;

              return (
                <div
                  key={field.id}
                  className={`flex items-center justify-between p-3 transition-colors ${
                    isChecked ? "bg-card/10" : "opacity-60 bg-muted/5"
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold select-none flex-1">
                    <Controller
                      control={control}
                      name={`splits.${index}.isSelected`}
                      render={({ field }) => (
                        <Checkbox
                          disabled={isLoading || isSubmitting}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="w-4 h-4 cursor-pointer"
                        />
                      )}
                    />
                    <span>{member.id === currentUser.id ? "You" : member.name}</span>
                  </label>

                  {isChecked && (
                    <div className="flex items-center gap-2">
                      <input type="hidden" {...register(`splits.${index}.userId`)} />

                      {splitType === "EQUAL" && (
                        <span className="text-sm font-bold font-mono text-muted-foreground">
                          {currencySymbol}
                          {equalShare}
                        </span>
                      )}

                      {splitType === "EXACT" && (
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-xs text-muted-foreground font-mono">
                            {currencySymbol}
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            disabled={isLoading || isSubmitting}
                            className={`w-48 pl-7 text-right font-mono ${
                              errors.splits?.[index]?.customValue
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }`}
                            {...register(`splits.${index}.customValue`)}
                          />
                        </div>
                      )}

                      {splitType === "SHARES" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            ({currencySymbol}
                            {minorUnitsToDisplay(
                              Math.round(
                                totalMinorUnits *
                                  ((parseFloat(splitsData[index]?.customValue || "0") || 0) /
                                    Math.max(
                                      0.0001,
                                      selectedSplits.reduce(
                                        (a, s) => a + (parseFloat(s.customValue || "0") || 0),
                                        0
                                      )
                                    ))
                              )
                            )}
                            )
                          </span>
                          <div className="relative flex items-center">
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              step="0.1"
                              disabled={isLoading || isSubmitting}
                              className={`w-20 pr-7 text-right font-mono ${
                                errors.splits?.[index]?.customValue
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                              }`}
                              {...register(`splits.${index}.customValue`)}
                            />
                            <span className="absolute right-2 text-xs text-muted-foreground">
                              sh
                            </span>
                          </div>
                        </div>
                      )}

                      {splitType === "PERCENTAGE" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            ({currencySymbol}
                            {minorUnitsToDisplay(
                              Math.round(
                                totalMinorUnits *
                                  ((parseFloat(splitsData[index]?.customValue || "0") || 0) / 100)
                              )
                            )}
                            )
                          </span>
                          <div className="relative flex items-center">
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="100"
                              step="1"
                              disabled={isLoading || isSubmitting}
                              className={`w-20 pr-7 text-right font-mono ${
                                errors.splits?.[index]?.customValue
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                              }`}
                              {...register(`splits.${index}.customValue`)}
                            />
                            <span className="absolute right-2 text-xs text-muted-foreground">
                              %
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </form>

      <div className="p-6 border-t border-border shrink-0 bg-card/60 space-y-4">
        {splitsError && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{splitsError}</span>
          </div>
        )}

        <div className="flex justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="expense-form"
            disabled={isLoading || isSubmitting}
            className="cursor-pointer font-bold"
          >
            {(isLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading || isSubmitting ? loadingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
