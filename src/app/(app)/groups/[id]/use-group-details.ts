import { useState, useOptimistic, startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addMemberAction,
  removeMemberAction,
  deleteGroupAction,
  leaveGroupAction,
} from "@/app/(app)/dashboard/actions";
import { deleteExpenseAction, deletePaymentAction } from "@/app/(app)/groups/expense-actions";
import type { Member, Group } from "@/types/group";

export function useGroupDetails(group: Group, initialMembers: Member[]) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "expenses" | "balances" | "members" | "activity" | "settings"
  >("expenses");
  const [actionError, setActionError] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    onConfirm: () => {},
    isLoading: false,
  });

  const [optimisticMembers, setOptimisticMembers] = useOptimistic(
    initialMembers,
    (state, action: { type: "add"; member: Member } | { type: "remove"; id: string }) => {
      if (action.type === "add") {
        return [...state, action.member];
      } else {
        return state.filter((m) => m.id !== action.id);
      }
    }
  );

  const handleDeleteGroup = () => {
    setConfirmDialog({
      open: true,
      title: "Delete Group",
      description:
        "Are you absolutely sure you want to delete this group? All expenses and payments will be soft-deleted.",
      confirmText: "Delete Group",
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        const res = await deleteGroupAction(group.id);
        setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Group deleted successfully");
          router.push("/dashboard");
        }
      },
    });
  };

  const handleLeaveGroup = () => {
    setConfirmDialog({
      open: true,
      title: "Leave Group",
      description:
        "Are you sure you want to leave this group? You can only leave if all your balances are settled.",
      confirmText: "Leave Group",
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        const res = await leaveGroupAction(group.id);
        setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("You have left the group.");
          router.push("/dashboard");
        }
      },
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Expense",
      description:
        "Are you sure you want to delete this expense? This will recalculate everyone's balances.",
      confirmText: "Delete Expense",
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        const res = await deleteExpenseAction(expenseId);
        setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Expense deleted successfully");
        }
      },
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Settlement",
      description: "Are you sure you want to delete this settlement record?",
      confirmText: "Delete Settlement",
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        const res = await deletePaymentAction(paymentId);
        setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Settlement deleted successfully");
        }
      },
    });
  };

  const handleAddMember = async (targetEmail: string) => {
    const namePart = targetEmail.split("@")[0];
    const tempName = namePart.charAt(0).toUpperCase() + namePart.slice(1) + " (Inviting...)";
    const optimisticMember: Member = {
      id: crypto.randomUUID(),
      name: tempName,
      email: targetEmail.toLowerCase(),
      hasAccount: false,
      joinedAt: new Date(),
    };
    startTransition(() => {
      setOptimisticMembers({ type: "add", member: optimisticMember });
    });

    const res = await addMemberAction(group.id, targetEmail);

    if (res?.error) {
      toast.error(res.error);
      router.refresh();
    } else {
      toast.success("Member invited successfully");
    }
    return res;
  };

  const handleRemoveMember = async (memberUserId: string) => {
    startTransition(() => {
      setOptimisticMembers({ type: "remove", id: memberUserId });
    });

    const res = await removeMemberAction(group.id, memberUserId);

    if (res?.error) {
      toast.error(res.error);
      router.refresh();
    } else {
      toast.success("Member removed successfully");
    }
    return res;
  };

  return {
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
  };
}
