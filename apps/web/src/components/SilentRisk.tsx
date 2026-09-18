import Link from "next/link";
import { BellRing, CalendarClock, ChevronRight, CircleCheck, Radar } from "lucide-react";
import type { SilentRiskSummary } from "@classync/core";
import { KindBadge } from "@/components/badges";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { dueLabel } from "@/lib/format";

/**
 * W2 early-warning card: tasks where ≥ 5 consented students have no status at all.
 * These are the students who never tap Stuck; the reminder DM is the only thing reaching them.
 * Counts only — the service never returns who they are.
 */
export function SilentRisk({ summary, guildId }: { summary: SilentRiskSummary; guildId: string }) {
  return (
    <Card>
      <CardHeader
        icon={Radar}
        tone="amber"
        title="Gone quiet"
        subtitle={`Students with no status on a task due within 7 days, out of ${summary.consentedCount} consented. Counts only.`}
      />
      {summary.items.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          tone="emerald"
          title="Nobody has gone quiet"
          description="Every task due this week has fewer than 5 silent students (privacy floor: 5)."
        />
      ) : (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {summary.items.map(({ item, quietCount, remindedQuietCount }) => (
            <li key={item.id}>
              <Link href={`/g/${guildId}/items/${item.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition hover:bg-subtle/60">
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-ink">{item.title}</p>
                    <KindBadge kind={item.kind} size="xs" />
                  </div>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-3">
                    <CalendarClock className="size-3.5" />{dueLabel(item.dueAt)}
                  </p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[22px] font-extrabold leading-none tracking-tight text-amber-700 tabular">{quietCount}</span>
                  <span className="text-xs text-ink-3">quiet</span>
                </div>
                {remindedQuietCount !== null && (
                  <Badge tone="rose" icon={BellRing}>{remindedQuietCount} ignored a reminder</Badge>
                )}
                <ChevronRight className="size-4 text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
