import Link from "next/link";
import { CalendarClock, ChevronRight, ListChecks } from "lucide-react";
import { getItemsForDashboard } from "@classync/core";
import { KindBadge } from "@/components/badges";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { dueLabel, isPast } from "@/lib/format";
import { requireTaGuild } from "@/lib/session";
import { plural } from "@/lib/utils";

interface Props {
  params: Promise<{ guildId: string }>;
}

/** Entry point for W4: every task with its concept, request and room counts. */
export default async function TasksPage({ params }: Props) {
  const { guildId } = await params;
  const { guild } = await requireTaGuild(guildId);
  const items = await getItemsForDashboard(guild.id);

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Everything students see in /tasks. Open a task for its status aggregate and concept rooms."
        actions={<Badge tone="slate" size="md">Add tasks with <code className="ml-1 font-mono">/ta add-item</code></Badge>}
      />
      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks yet" description="Run /ta add-item in Discord and it appears here within 5 seconds." />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={`/g/${guild.id}/items/${item.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-subtle/60">
                  <div className="min-w-0 flex-1 basis-64">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14.5px] font-semibold text-ink">{item.title}</p>
                      <KindBadge kind={item.kind} size="xs" />
                    </div>
                    <p className={`mt-0.5 inline-flex items-center gap-1 text-xs ${isPast(item.dueAt) ? "text-rose-600" : "text-ink-3"}`}>
                      <CalendarClock className="size-3.5" />{dueLabel(item.dueAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                    <Badge tone="slate">{plural(item.conceptCount, "concept")}</Badge>
                    <Badge tone={item.openRequestCount > 0 ? "rose" : "slate"}>{plural(item.openRequestCount, "open request")}</Badge>
                    <Badge tone={item.openRoomCount > 0 ? "emerald" : "slate"}>{plural(item.openRoomCount, "open room")}</Badge>
                  </div>
                  <ChevronRight className="size-4 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
