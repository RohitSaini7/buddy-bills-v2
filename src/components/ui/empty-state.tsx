import * as React from "react";
import { cn } from "@lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-card/30 border border-border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
