"use client";

import { useState } from "react";
import { authClient } from "@lib/auth-client";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "sonner";
import { Card } from "@components/ui/card";
import { ConfirmDialog } from "@components/ui/confirm-dialog";
import { AlertCircle } from "lucide-react";
import type { UserType } from "@/types/group";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { unlinkProviderAction } from "./actions";
import { Avatar, AvatarFallback } from "@components/ui/avatar";

export function ProfileClient({
  user,
  linkedAccounts,
}: {
  user: UserType;
  linkedAccounts: { id: string; providerId: string }[];
}) {
  const [name, setName] = useState(user.name);
  const [image] = useState(user.image || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name cannot be empty");

    setIsUpdating(true);
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
        image: image.trim() || undefined,
      });

      if (error) throw new Error(error.message);
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message);

      // authClient.deleteUser automatically signs the user out, but let's be safe
      window.location.href = "/";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleLinkGithub = async () => {
    try {
      const { error } = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/settings/profile",
      });
      if (error) {
        toast.error(error.message || "Failed to link GitHub account.");
      }
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : "Failed to link provider") +
          ". You may need to configure GitHub credentials in auth.ts."
      );
    }
  };

  const handleUnlink = async (providerId: string) => {
    setUnlinkingProvider(providerId);
    try {
      const res = await unlinkProviderAction(providerId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${providerId} unlinked successfully`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setUnlinkingProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Public Profile</h2>
        <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email address cannot be changed currently.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <Button
            type="submit"
            disabled={isUpdating || (name === user.name && image === (user.image || ""))}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Connected Accounts</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your account with external providers to easily sign in.
        </p>

        <div className="space-y-3 mb-6">
          {linkedAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-secondary font-bold capitalize text-sm">
                    {account.providerId.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold capitalize">{account.providerId}</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnlink(account.providerId)}
                disabled={unlinkingProvider === account.providerId}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {unlinkingProvider === account.providerId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Unlink
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleLinkGithub}
          disabled={linkedAccounts.some((a) => a.providerId === "github")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Link GitHub Account
        </Button>
      </Card>

      <Card className="p-6 border-destructive/20">
        <h2 className="text-lg font-bold text-destructive mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Note:</strong> You cannot delete your account if you are the creator of any
            groups. You must either transfer ownership of those groups or delete them first.
          </div>
        </div>

        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          Delete Account
        </Button>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Account"
        description="Are you absolutely sure you want to delete your account? This action cannot be undone and will immediately remove your access."
        confirmText="Yes, delete my account"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
