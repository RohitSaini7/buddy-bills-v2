"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { UserType } from "@/types/group";
import { GroupNavList } from "./group-nav-list";
import { BalanceSummaryCard } from "./balance-summary-card";
import { UserMenu } from "./user-menu";
import { Button } from "@components/ui/button";
import { usePathname } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CoinsIcon,
  MenuIcon,
  UsersIcon,
  SettingsIcon,
} from "lucide-react";

interface GroupType {
  id: string;
  name: string;
}

interface DashboardSidebarProps {
  user: UserType;
  groups?: GroupType[];
  totalYouOweMinorUnits?: number;
  totalOwedToYouMinorUnits?: number;
  initialCollapsed?: boolean;
}

export function DashboardSidebar({
  user,
  groups = [],
  totalYouOweMinorUnits = 0,
  totalOwedToYouMinorUnits = 0,
  initialCollapsed = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [prevInitialCollapsed, setPrevInitialCollapsed] = useState(initialCollapsed);

  if (initialCollapsed !== prevInitialCollapsed) {
    setPrevInitialCollapsed(initialCollapsed);
    setIsCollapsed(initialCollapsed);
  }

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("sidebar-collapsed", String(nextVal));
    document.cookie = `sidebar-collapsed=${nextVal}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  const navLinks = [
    {
      name: "Groups",
      href: "/dashboard",
      icon: UsersIcon,
    },
    {
      name: "Settings",
      href: "/settings/profile",
      icon: SettingsIcon,
    },
  ];

  const renderSidebarContent = (forceOpen = false) => {
    const collapsed = isCollapsed && !forceOpen;

    return (
      <div className="flex flex-col h-full justify-between bg-card text-card-foreground">
        <div className="space-y-8">
          <div
            className={`flex items-center gap-2.5 px-2 ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-bold text-xl tracking-tight shrink-0"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                <CoinsIcon className="w-5 h-5" />
              </div>
              {!collapsed && <span>BuddyBills</span>}
            </Link>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <div key={link.name} className="space-y-1">
                  <Link
                    href={link.href}
                    className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                    } ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{link.name}</span>}
                  </Link>

                  <GroupNavList
                    groups={groups}
                    pathname={pathname}
                    collapsed={collapsed}
                    onGroupClick={() => setMobileOpen(false)}
                  />
                </div>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <BalanceSummaryCard
            collapsed={collapsed}
            totalYouOweMinorUnits={totalYouOweMinorUnits}
            totalOwedToYouMinorUnits={totalOwedToYouMinorUnits}
            currencyCode={user.defaultCurrency}
          />

          <UserMenu
            user={user}
            collapsed={collapsed}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            onCloseMobileSidebar={() => setMobileOpen(false)}
          />

          {/* Collapse/Expand toggle button (only in desktop mode) */}
          {!forceOpen && (
            <Button
              type="button"
              variant="ghost"
              className={`hidden md:flex w-full items-center text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all cursor-pointer focus:outline-none ${
                collapsed ? "justify-center" : "gap-3 px-3"
              }`}
              onClick={toggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRightIcon className="w-4 h-4 shrink-0" />
              ) : (
                <>
                  <ChevronLeftIcon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">Collapse Sidebar</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md h-16 flex items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg tracking-tight"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            <CoinsIcon className="w-4 h-4" />
          </div>
          <span>BuddyBills</span>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="p-1.5 rounded-xl hover:bg-muted transition-all border border-border focus:outline-none cursor-pointer"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon className="w-5 h-5 text-foreground" />
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative flex flex-col w-72 max-w-xs bg-card p-6 border-r border-border animate-in slide-in-from-left duration-300 shadow-2xl h-full">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 border-r border-border bg-card z-30 flex-col transition-all duration-300 ${
          isCollapsed ? "w-16 items-center px-2 py-6" : "w-64 p-6"
        }`}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
}
