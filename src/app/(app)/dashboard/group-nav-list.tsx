import Link from "next/link";
import { getInitials } from "@lib/utils";

interface GroupType {
  id: string;
  name: string;
}

export function GroupNavList({
  groups,
  pathname,
  collapsed,
  onGroupClick,
}: {
  groups: GroupType[];
  pathname: string;
  collapsed: boolean;
  onGroupClick: () => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div
      className={`border-border/60 mt-1 max-h-[30vh] overflow-y-auto pr-1 transition-all ${
        collapsed ? "flex flex-col items-center gap-2 pt-1.5" : "pl-3 ml-2.5 border-l space-y-1"
      }`}
    >
      {groups.map((group) => {
        const isGroupActive = pathname === `/groups/${group.id}`;
        return (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className={`group/item flex items-center rounded-lg text-xs font-semibold transition-all ${
              collapsed
                ? "p-1 bg-transparent"
                : `gap-2 px-3 py-1.5 ${
                    isGroupActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
            }`}
            onClick={onGroupClick}
            title={group.name}
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold font-mono shrink-0 transition-colors ${
                isGroupActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground group-hover/item:bg-primary/15 group-hover/item:text-primary"
              }`}
            >
              {getInitials(group.name)}
            </div>
            {!collapsed && <span className="truncate flex-1">{group.name}</span>}
          </Link>
        );
      })}
    </div>
  );
}
