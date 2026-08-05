"use client";

import React, { useState } from "react";
import { Button } from "@components/ui/button";
import { UserPlus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { getInitials } from "@lib/utils";
import type { Member, Group, UserType } from "@/types/group";
import { Input } from "@components/ui/input";

export function MembersTab({
  optimisticMembers,
  group,
  currentUser,
  isCreator,
  onAddMember,
  onRemoveMember,
}: {
  optimisticMembers: Member[];
  group: Group;
  currentUser: UserType;
  isCreator: boolean;
  onAddMember: (email: string) => Promise<{ error?: string }>;
  onRemoveMember: (userId: string) => Promise<{ error?: string }>;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState<string | null>(null);
  const [failedImageUserIds, setFailedImageUserIds] = useState<Set<string>>(new Set());

  const handleImageError = (userId: string) => {
    setFailedImageUserIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = emailInput.trim();
    if (!targetEmail) return;

    setIsAddLoading(true);
    setAddError("");
    setAddSuccess("");

    const res = await onAddMember(targetEmail);
    if (res?.error) {
      setAddError(res.error);
    } else {
      setAddSuccess("Invite sent! Note: The email may go to their spam folder.");
      setEmailInput("");
    }
    setIsAddLoading(false);
  };

  const handleRemoveClick = async (userId: string) => {
    setRemovingUserId(userId);
    await onRemoveMember(userId);
    setRemovingUserId(null);
    setConfirmRemoveUserId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-3">
        <h3 className="text-base font-bold text-foreground mb-4">Group Members</h3>
        {optimisticMembers.map((member) => {
          const isMemberCreator = member.id === group.createdByUserId;
          const isMe = member.id === currentUser.id;
          const isRemoving = removingUserId === member.id;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage
                    src={!failedImageUserIds.has(member.id) && member.image ? member.image : ""}
                    alt={member.name}
                    onError={() => handleImageError(member.id)}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold font-mono text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground truncate max-w-37.5 sm:max-w-50">
                      {member.name}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      {isMemberCreator && (
                        <span className="px-1.5 py-px text-xs font-bold rounded-md bg-primary/10 text-primary border border-primary/25">
                          Creator
                        </span>
                      )}
                      {isMe && (
                        <span className="px-1.5 py-px text-xs font-semibold rounded-md bg-muted text-muted-foreground border border-border">
                          You
                        </span>
                      )}
                      {!member.hasAccount && (
                        <span className="px-1.5 py-px text-xs font-bold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="block text-xs text-muted-foreground truncate max-w-45 sm:max-w-62.5">
                    {member.email}
                  </span>
                </div>
              </div>

              {isCreator && !isMe && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {confirmRemoveUserId === member.id ? (
                    <>
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={isRemoving}
                        onClick={() => setConfirmRemoveUserId(null)}
                        className="cursor-pointer text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="xs"
                        disabled={isRemoving}
                        onClick={() => handleRemoveClick(member.id)}
                        className="cursor-pointer font-bold text-xs animate-in fade-in zoom-in-95 duration-150"
                      >
                        {isRemoving ? "Removing..." : "Confirm"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="destructive"
                      size="xs"
                      disabled={isRemoving}
                      onClick={() => setConfirmRemoveUserId(member.id)}
                      className="cursor-pointer text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isCreator && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Invite Member
            </h3>
            <p className="text-xs text-muted-foreground">
              Add someone to the group using their registered account email address.
            </p>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3 pt-2">
            {addError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}
            {addSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
                <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{addSuccess}</span>
              </div>
            )}

            <div className="space-y-1">
              <Input
                type="email"
                required
                placeholder="friend@buddybills.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isAddLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isAddLoading || !emailInput.trim()}
              className="w-full cursor-pointer font-semibold"
            >
              {isAddLoading ? "Inviting..." : "Add to Group"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
