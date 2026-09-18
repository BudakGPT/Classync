import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { getAnswersForGuild } from "@classync/core";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { requireTaGuild } from "@/lib/session";
import { plural } from "@/lib/utils";

interface Props {
  params: Promise<{ guildId: string }>;
}

type Answer = Awaited<ReturnType<typeof getAnswersForGuild>>[number];

/** W5: every delivered answer, grouped by task. */
export default async function KnowledgeBasePage({ params }: Props) {
  const { guildId } = await params;
  const { guild } = await requireTaGuild(guildId);
  const answers = await getAnswersForGuild(guild.id);

  const byItem = new Map<string, { title: string; entries: Answer[] }>();
  for (const a of answers) {
    const group = byItem.get(a.concept.item.id) ?? { title: a.concept.item.title, entries: [] };
    group.entries.push(a);
    byItem.set(a.concept.item.id, group);
  }

  return (
    <>
      <PageHeader
        title="Knowledge base"
        subtitle="Every delivered answer, kept for the next student who reports the same concept."
        actions={<Badge tone="emerald" size="md">{plural(answers.length, "answer")}</Badge>}
      />
      {byItem.size === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpenText}
            title="No answers yet"
            description="Answer a concept from the overview, or use /ta answer in Discord. Delivered answers land here."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(byItem.entries()).map(([itemId, group]) => (
            <Card key={itemId}>
              <CardHeader
                icon={BookOpenText}
                tone="emerald"
                title={<Link href={`/g/${guild.id}/items/${itemId}`} className="hover:underline">{group.title}</Link>}
                subtitle={plural(group.entries.length, "answer")}
              />
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {group.entries.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <Link href={`/g/${guild.id}/concepts/${a.concept.id}`} className="text-[11px] font-bold uppercase tracking-wider text-brand-700 hover:underline">
                      {a.concept.label}
                    </Link>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{a.body}</p>
                    <p className="mt-2 text-xs text-ink-3">
                      Delivered to {plural(a.deliveredCount, "student")}
                      {a.deliveredAt && ` · ${fmtDateTime(a.deliveredAt)}`}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
