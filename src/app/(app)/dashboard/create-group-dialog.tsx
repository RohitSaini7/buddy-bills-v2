"use client";

import React, { useState } from "react";
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
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createGroupAction } from "./actions";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupFormSchema } from "@lib/schemas";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Input } from "@components/ui/input";

type CreateGroupFormData = z.infer<typeof createGroupFormSchema>;

export function CreateGroupDialog({ defaultCurrency = "INR" }: { defaultCurrency?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: {
      name: "",
      currency: defaultCurrency,
    },
  });

  const onSubmit = async (data: CreateGroupFormData) => {
    setErrorMsg("");
    const res = await createGroupAction(data.name, data.currency);

    if (res.error) {
      toast.error(res.error);
      setErrorMsg(res.error);
    } else {
      toast.success("Group created successfully!");
      reset();
      setIsOpen(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) setIsOpen(open);
        if (open) {
          reset();
          setErrorMsg("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" className="gap-1.5 cursor-pointer font-medium">
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Set up a new space to split dinners, trips, or roommate expenses.
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
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              type="text"
              id="group-name"
              placeholder="e.g., Summer Trip, Flatmates"
              disabled={isSubmitting}
              className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              maxLength={100}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group-currency">Group Currency</Label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="group-currency"
                    className={`w-full bg-background rounded-xl ${errors.currency ? "border-destructive focus:ring-destructive" : "border-border"}`}
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && (
              <p className="text-xs text-destructive mt-1">{errors.currency.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <DialogClose asChild disabled={isSubmitting}>
              <Button type="button" variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer font-semibold">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
