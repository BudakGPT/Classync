import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CircleCheck, FolderOpen, LifeBuoy, Loader, Lock, MessagesSquare } from "lucide-react";
import { getItemAggregate, getItemById, getItemConceptSummaries } from "@classync/core";
import { KindBadge, RoomBadge } from "@/components/badges";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { dueLabel } from "@/lib/format";
import { requireTaGuild } from "@/lib/session";
import { plural } from "@/lib/utils";

interface Props {
  params: Promise<{ guildId: string; itemId: string }>;
}

/** W4: done / in progress / stuck counts behind the privacy floor, plus the task's concept rooms. */
export default async function ItemPage({ params }: Props) {
  const { guildId, itemId } = await params;
  const { guild } = await requireTaGuild(guildId);

  const item = await getItemById(itemId);
  if (!item || item.guildId !== guild.id) notFound();

  const [aggregate, concepts] = await Promise.all([getItemAggregate(item.id), getItemConceptSummaries(item.id)]);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <KindBadge kind={item.kind} />
            {item.discordCategoryId && <Badge tone="brand" icon={FolderOpen}>Discord category provisioned</Badge>}
          </>
        }
        title={item.title}
        subtitle={dueLabel(item.dueAt)}
        actions={<ButtonLink href={`/g/${guild.id}/tasks`} variant="ghost" size="sm">All tasks</ButtonLink>}
      />

      <section aria-label="Status aggregate">
        {aggregate === null ? (
          <Card>
            <EmptyState
              icon={Lock}
              tone="amber"
              title="Not enough reports yet (privacy floor: 5)"
              description="Counts appear once at least five students have set any status on this task. Nothing is shown below that."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Done" value={aggregate.DONE ?? 0} icon={CircleCheck} tone="emerald" />
            <StatCard label="In progress" value={aggregate.IN_PROGRESS ?? 0} icon={Loader} tone="sky" />
            <StatCard label="Stuck" value={aggregate.STUCK ?? 0} icon={LifeBuoy} tone="rose" />
          </div>
        )}
      </section>

      <Card className="mt-6">
        <CardHeader
          icon={MessagesSquare}
          tone="violet"
          title="Concepts and rooms"
          subtitle="Rooms are private Discord channels students opt into. Close or reopen them with /ta close-room."
        />
        {concepts.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="No concepts reported yet" description="Concepts appear when a student taps Stuck or opens a room on this task." />
        ) : (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {concepts.map((c) => (
              <li key={c.id}>
                <Link href={`/g/${guild.id}/concepts/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition hover:bg-subtle/60">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-[14px] font-semibold text-ink">{c.label}</p>
                    <p className="text-xs text-ink-3">{plural(c.openRequests, "open request")}</p>
                  </div>
                  {c.answered && <Badge tone="emerald" icon={CircleCheck}>Answered</Badge>}
                  <RoomBadge room={c.topicRoom} discordGuildId={guild.discordGuildId} />
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
