import React from "react";

export default function GroupDetailsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded-full w-28" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-full w-48" />
            <div className="h-3.5 bg-muted rounded-full w-32" />
          </div>

          <div className="h-10 bg-muted rounded-xl w-44 shrink-0" />
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-6 pb-2.5">
          <div className="h-5 bg-muted rounded-full w-20" />
          <div className="h-5 bg-muted rounded-full w-20" />
          <div className="h-5 bg-muted rounded-full w-20" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm h-18"
          >
            <div className="flex items-center gap-3 w-full max-w-sm">
              <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
              <div className="space-y-2 w-full">
                <div className="h-4 bg-muted rounded-full w-2/3" />
                <div className="h-3 bg-muted rounded-full w-1/3" />
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="h-5 bg-muted rounded-full w-16" />
              <div className="w-4 h-4 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
