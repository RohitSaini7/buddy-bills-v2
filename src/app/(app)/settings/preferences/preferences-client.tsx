"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { toast } from "sonner";
import { Card } from "@components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@components/ui/select";
import { Switch } from "@components/ui/switch";
import { updateUserPreferencesAction } from "../actions";
import { CURRENCIES } from "@lib/money";

export function PreferencesClient({
  initialCurrency,
  initialSidebarCollapsed,
}: {
  initialCurrency: string;
  initialSidebarCollapsed: boolean;
}) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const res = await updateUserPreferencesAction({ defaultCurrency: currency });
      if (res.error) throw new Error(res.error);

      toast.success("Preferences updated successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update preferences");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSidebarToggle = (checked: boolean) => {
    setSidebarCollapsed(checked);
    // Update cookie and local storage
    localStorage.setItem("sidebar-collapsed", String(checked));
    document.cookie = `sidebar-collapsed=${checked}; path=/; max-age=${60 * 60 * 24 * 365}`;

    // Dispatch event to force sidebar to re-read or we can just let it reload
    // For now, this requires a refresh to take effect globally if we don't use React context,
    // but our sidebar reads it from state in its own layout.
    // Since sidebar in AppLayout is a server component wrapper that passes initialCollapsed,
    // reloading the page or letting the sidebar's local state handle it is tricky.
    // Actually the sidebar itself updates this cookie when toggled!
    // So this is just a secondary way to change it. We can tell the user it takes effect on reload.
    toast.info("Sidebar preference saved. Refresh to see changes.");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">App Preferences</h2>

        <form onSubmit={handleUpdate} className="space-y-6 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Default Currency</Label>
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
              This currency will be selected by default when creating new groups.
            </p>
          </div>

          <Button type="submit" disabled={isUpdating || currency === initialCurrency}>
            {isUpdating ? "Saving..." : "Save Preferences"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Display</h2>
        <div className="max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Collapse Sidebar</Label>
              <p className="text-xs text-muted-foreground">
                Keep the left sidebar collapsed by default on desktop.
              </p>
            </div>
            <Switch checked={sidebarCollapsed} onCheckedChange={handleSidebarToggle} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold">Notifications</h2>
          <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Email and push notifications are currently in development.
        </p>
        <div className="max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Group Invites</Label>
              <p className="text-xs text-muted-foreground">
                Email me when I am invited to a new group.
              </p>
            </div>
            <Switch disabled checked={true} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Expenses</Label>
              <p className="text-xs text-muted-foreground">
                Email me when someone adds an expense I&apos;m involved in.
              </p>
            </div>
            <Switch disabled checked={true} />
          </div>
        </div>
      </Card>
    </div>
  );
}
