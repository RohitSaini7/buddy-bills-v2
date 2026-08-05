import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm">
        <div className="space-y-2.5 w-full max-w-sm">
          <div className="h-4 bg-muted rounded-full w-24" />
          <div className="h-7 bg-muted rounded-full w-60" />
          <div className="h-3 bg-muted rounded-full w-40" />
        </div>
        <div className="h-8 bg-muted rounded-xl w-28 shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm h-24">
          <div className="space-y-2.5">
            <div className="h-3.5 bg-muted rounded-full w-20" />
            <div className="h-6 bg-muted rounded-full w-16" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm h-24">
          <div className="space-y-2.5">
            <div className="h-3.5 bg-muted rounded-full w-28" />
            <div className="h-6 bg-muted rounded-full w-16" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-5 bg-muted rounded-full w-28" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between h-44"
            >
              <div className="w-10 h-10 rounded-xl bg-muted" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-muted rounded-full w-3/4" />
                <div className="flex gap-4">
                  <div className="h-3 bg-muted rounded-full w-16" />
                  <div className="h-3 bg-muted rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
