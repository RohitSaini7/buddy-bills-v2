"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@components/ui/select";
import { Switch } from "@components/ui/switch";
import { Card } from "@components/ui/card";
import { toast } from "sonner";
import { editGroupAction, transferGroupOwnershipAction } from "@/app/(app)/dashboard/actions";
import type { Group, Member, UserType } from "@/types/group";
import { CURRENCIES } from "@lib/money";
import { ConfirmDialog } from "@components/ui/confirm-dialog";
import { AlertCircle } from "lucide-react";

interface SettingsTabProps {
  group: Group;
  members: Member[];
  currentUser: UserType;
  isCreator: boolean;
  onToggleSimplify: (nextVal: boolean) => Promise<{ error?: string } | { success: true }>;
}

export function SettingsTab({
  group,
  members,
  currentUser,
  isCreator,
  onToggleSimplify,
}: SettingsTabProps) {
  const [name, setName] = useState(group.name);
  const [currency, setCurrency] = useState(group.currency);
  const [isUpdating, setIsUpdating] = useState(false);

  const [simplifyDebts, setSimplifyDebts] = useState(group.simplifyDebts);
  const [isTogglingSimplify, setIsTogglingSimplify] = useState(false);

  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Group name is required");

    setIsUpdating(true);
    try {
      const res = await editGroupAction(group.id, name, currency);
      if (res && "error" in res && res.error) throw new Error(res.error);
      toast.success("Group settings updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update group");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSimplify = async (checked: boolean) => {
    setSimplifyDebts(checked);
    setIsTogglingSimplify(true);
    try {
      const res = await onToggleSimplify(checked);
      if (res && "error" in res && res.error) throw new Error(res.error);
      toast.success(checked ? "Debt simplification enabled" : "Debt simplification disabled");
    } catch (err: unknown) {
      setSimplifyDebts(!checked); // Revert
      toast.error(err instanceof Error ? err.message : "Failed to change setting");
    } finally {
      setIsTogglingSimplify(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return toast.error("Please select a new owner");
    setIsTransferring(true);
    try {
      const res = await transferGroupOwnershipAction(group.id, newOwnerId);
      if (res && "error" in res && res.error) throw new Error(res.error);
      toast.success("Ownership transferred successfully");
      setShowTransferDialog(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to transfer ownership");
      setIsTransferring(false);
    }
  };

  if (!isCreator) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-2xl bg-card/50">
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
        <h3 className="text-lg font-bold">Access Denied</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Only the group creator can view and modify group settings.
        </p>
      </div>
    );
  }

  const eligibleNewOwners = members.filter((m) => m.id !== currentUser.id && m.hasAccount);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">General Settings</h2>
        <form onSubmit={handleUpdateGroup} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Goa Trip"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changing currency does not convert past expenses. All amounts will remain the same
              numerical value.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isUpdating || (name === group.name && currency === group.currency)}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Features</h2>
        <div className="max-w-md">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Simplify Debts</Label>
              <p className="text-xs text-muted-foreground pr-4">
                Reduces the total number of payments between members by restructuring debts.
              </p>
            </div>
            <Switch
              checked={simplifyDebts}
              onCheckedChange={handleToggleSimplify}
              disabled={isTogglingSimplify}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-destructive/20">
        <h2 className="text-lg font-bold text-destructive mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Transfer ownership of this group to another member. You will lose the ability to manage
          settings and delete the group.
        </p>

        <Button
          variant="outline"
          onClick={() => setShowTransferDialog(true)}
          disabled={eligibleNewOwners.length === 0}
        >
          Transfer Ownership
        </Button>
        {eligibleNewOwners.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            There are no other verified members to transfer ownership to.
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        title="Transfer Ownership"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a member to transfer ownership to. They must have a registered account.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="newOwner">New Owner</Label>
              <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                <SelectTrigger id="newOwner">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleNewOwners.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        confirmText="Transfer Ownership"
        onConfirm={handleTransferOwnership}
        isLoading={isTransferring}
      />
    </div>
  );
}
