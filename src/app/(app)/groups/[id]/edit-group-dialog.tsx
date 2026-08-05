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
import { Edit2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { editGroupAction } from "@/app/(app)/dashboard/actions";
import type { Group } from "@/types/group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Input } from "@components/ui/input";

export function EditGroupDialog({ group }: { group: Group }) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [currency, setCurrency] = useState(group.currency);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsLoading(true);
    setErrorMsg("");

    const res = await editGroupAction(group.id, groupName, currency);

    if (res.error) {
      toast.error(res.error);
      setErrorMsg(res.error);
      setIsLoading(false);
    } else {
      toast.success("Group updated successfully!");
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isLoading) {
          setIsOpen(open);
          if (open) {
            setGroupName(group.name);
            setCurrency(group.currency);
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className="mt-2 text-xs flex items-center gap-1 cursor-pointer font-semibold transition-all shadow-sm"
        >
          <Edit2 className="w-3 h-3" />
          <span>Edit Group</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>Update your group&apos;s name and currency.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-group-name">Group Name</Label>
            <Input
              type="text"
              id="edit-group-name"
              required
              placeholder="e.g., Summer Trip, Flatmates"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-group-currency">Group Currency</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={isLoading}>
              <SelectTrigger id="edit-group-currency" className="w-full bg-background rounded-xl">
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
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <DialogClose asChild disabled={isLoading}>
              <Button type="button" variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading || !groupName.trim()}
              className="cursor-pointer font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
