import React from "react";
import { useTheme } from "next-themes";
import { EllipsisVertical, Sun, Moon, LogOut } from "lucide-react";
import { getInitials } from "@lib/utils";
import { authClient } from "@lib/auth-client";
import type { UserType } from "@/types/group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Button } from "@components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";

export function UserMenu({
  user,
  collapsed,
  showSettings,
  setShowSettings,
  onCloseMobileSidebar,
}: {
  user: UserType;
  collapsed: boolean;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  onCloseMobileSidebar: () => void;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" || resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <div
      className={`flex items-center px-1 relative ${
        collapsed ? "justify-center" : "justify-between gap-1"
      }`}
    >
      <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full flex items-center h-auto hover:bg-muted/60 p-1.5 rounded-xl transition-all focus:outline-none cursor-pointer ${
              collapsed ? "justify-center" : "justify-between gap-2.5"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={user.image || ""} alt={user.name} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold font-mono text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-bold truncate text-foreground leading-snug">
                    {user.name}
                  </span>
                  <span className="block text-xs truncate text-muted-foreground font-mono">
                    {user.email}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && <EllipsisVertical className="w-4 h-4 text-muted-foreground shrink-0" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Settings
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={toggleTheme}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {theme === "dark" || resolvedTheme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span>
                {theme === "dark" || resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </div>
            <div
              className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                theme === "dark" || resolvedTheme === "dark"
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  theme === "dark" || resolvedTheme === "dark" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setShowSettings(false);
              onCloseMobileSidebar();
              handleSignOut();
            }}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 cursor-pointer font-semibold"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
