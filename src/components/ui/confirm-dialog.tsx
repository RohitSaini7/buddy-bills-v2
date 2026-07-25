"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

/**
 * Issue #13: Custom confirmation dialog replacing window.confirm/alert.
 * Uses Radix Dialog for accessibility, consistency, and non-blocking behavior.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 focus:outline-none">
          <Dialog.Close asChild disabled={isLoading}>
            <button
              type="button"
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all cursor-pointer focus:outline-none"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </Dialog.Close>

          <div className="flex items-start gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Dialog.Title className="text-base font-bold text-foreground">{title}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Dialog.Close asChild disabled={isLoading}>
              <Button type="button" variant="outline" className="cursor-pointer">
                {cancelText}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={() => {
                onConfirm();
              }}
              disabled={isLoading}
              className="cursor-pointer font-bold"
            >
              {isLoading ? "Processing..." : confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
