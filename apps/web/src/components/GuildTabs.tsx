"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, LayoutDashboard, ListChecks, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Path prefixes (after the guild root) that count as this tab. */
  match: string[];
  count?: number;
}

/** Guild-level nav. The open-request count is re-rendered by the layout's 5-second poller. */
export function GuildTabs({ guildId, openRequests }: { guildId: string; openRequests: number }) {
  const pathname = usePathname();
  const root = `/g/${guildId}`;
  const rest = pathname.startsWith(root) ? pathname.slice(root.length) : "";

  const tabs: Tab[] = [
    { href: root, label: "Overview", icon: LayoutDashboard, match: ["", "/concepts"], count: openRequests },
    { href: `${root}/tasks`, label: "Tasks", icon: ListChecks, match: ["/tasks", "/items"] },
    { href: `${root}/answers`, label: "Knowledge base", icon: BookOpenText, match: ["/answers"] },
  ];

  return (
    <nav aria-label="Guild sections" className="flex items-center gap-5 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.match.some((m) => (m === "" ? rest === "" || rest === "/" : rest.startsWith(m)));
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap pb-3 pt-1 text-[13.5px] font-semibold transition-colors",
              active ? "text-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn("rounded-full px-1.5 py-px text-[11px] font-bold tabular", active ? "bg-rose-50 text-rose-600" : "bg-subtle text-ink-3")}>
                {t.count}
              </span>
            )}
            <span className={cn("absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600 transition-transform", active ? "scale-x-100" : "scale-x-0")} />
          </Link>
        );
      })}
    </nav>
  );
}
