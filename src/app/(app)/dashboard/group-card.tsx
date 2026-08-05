import Link from "next/link";
import { Users, Calendar, ChevronRight } from "lucide-react";
import { getInitials } from "@lib/utils";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    createdAt: Date;
    memberCount: number;
  };
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="group bg-card hover:bg-muted/10 border border-border hover:border-primary/40 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between h-44 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-sm font-bold font-mono transition-colors">
          {getInitials(group.name)}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>

      <div className="space-y-1 mt-4">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base truncate">
          {group.name}
        </h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-mono">
            <Users className="w-3.5 h-3.5" />
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
          </span>
          <span className="flex items-center gap-1 font-mono" suppressHydrationWarning>
            <Calendar className="w-3.5 h-3.5" />
            {new Intl.DateTimeFormat("en-IN", {
              day: "numeric",
              month: "short",
            }).format(new Date(group.createdAt))}
          </span>
        </div>
      </div>
    </Link>
  );
}
