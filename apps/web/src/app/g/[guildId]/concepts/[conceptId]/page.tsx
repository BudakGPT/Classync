import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText, Hand, MessagesSquare, PenLine } from "lucide-react";
import { getAnswersForConcept, getOpenRequestsForConcept, getConceptDetail } from "@classync/core";
import { AnswerForm } from "@/components/AnswerForm";
import { KindBadge, RoomBadge } from "@/components/badges";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { dueLabel, fmtDateTime, fmtRelative } from "@/lib/format";
import { requireTaGuild } from "@/lib/session";
import { plural } from "@/lib/utils";

interface Props {
  params: Promise<{ guildId: string; conceptId: string }>;
}

/** W3: the concept, its open requesters (the only named students), the answer form, prior answers. */
export default async function ConceptPage({ params }: Props) {
  const { guildId, conceptId } = await params;
  const { guild } = await requireTaGuild(guildId);

  const concept = await getConceptDetail(conceptId);
  if (!concept || concept.item.guildId !== guild.id) notFound();

  const [requests, answers] = await Promise.all([getOpenRequestsForConcept(concept.id), getAnswersForConcept(concept.id)]);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <KindBadge kind={concept.item.kind} />
            <Link href={`/g/${guild.id}/items/${concept.item.id}`} className="text-[12.5px] font-semibold text-brand-700 hover:underline">
              {concept.item.title}
            </Link>
          </>
        }
        title={concept.label}
        subtitle={dueLabel(concept.item.dueAt)}
        actions={<RoomBadge room={concept.topicRoom} discordGuildId={guild.discordGuildId} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader
              icon={PenLine}
              title="Answer once"
              subtitle="Delivered by DM to every open requester, pinned in Discord, and shown to the next student who reports this concept."
            />
            <AnswerForm conceptId={concept.id} recipientCount={requests.length} />
          </Card>

          <Card>
            <CardHeader icon={BookOpenText} tone="emerald" title="Prior answers" subtitle={plural(answers.length, "answer")} />
            {answers.length === 0 ? (
              <EmptyState icon={BookOpenText} title="No answer yet" description="The first answer becomes this concept's stored explanation." />
            ) : (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {answers.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{a.body}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                      {a.deliveredAt ? (
                        <Badge tone="emerald" size="xs">Delivered to {a.deliveredCount}</Badge>
                      ) : (
                        <Badge tone="amber" size="xs" dot>Delivering…</Badge>
                      )}
                      <span>{fmtDateTime(a.createdAt)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader
              icon={Hand}
              tone="rose"
              title="Open help requests"
              subtitle="These students chose to reveal their name to you for this concept."
              action={<Badge tone={requests.length > 0 ? "rose" : "slate"}>{requests.length}</Badge>}
            />
            {requests.length === 0 ? (
              <EmptyState icon={Hand} title="No open requests" description="Stuck reports stay private; only explicit requests show up here." />
            ) : (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{r.displayName ?? "Discord user"}</p>
                      <p className="truncate font-mono text-[11px] text-ink-3">{r.student.discordUserId}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-3" title={fmtDateTime(r.createdAt)}>{fmtRelative(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader icon={MessagesSquare} tone="violet" title="Discussion room" subtitle="Voluntary, identity-visible Discord channel." />
            <div className="px-5 pb-5 pt-4 text-[13px] leading-relaxed text-ink-2">
              {concept.topicRoom ? (
                <p>
                  {concept.topicRoom.state === "OPEN" ? "Open" : "Closed"} with {plural(concept.topicRoom.memberCount, "member")}. The bot posts and pins your
                  answer there. Moderate it with <code className="rounded bg-subtle px-1 font-mono text-[12px]">/ta close-room</code> after the due date.
                </p>
              ) : (
                <p>No room yet. A student creates one from <strong>Ask / Join Room</strong> in /tasks; until then answers are pinned in the announcement channel.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
