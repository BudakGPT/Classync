import Link from "next/link";
import { ChevronRight, CircleCheck, Flame, GraduationCap, Hand, HeartHandshake, ListChecks, Timer, TrendingUp } from "lucide-react";
import {
  countItemsByGuild,
  getConsentedStudentCount,
  getDeliveredAnswerCount,
  getDifficultyList,
  getHeatMapData,
  getOpenRequestCount,
  getPeerMetrics,
} from "@classync/core";
import { DifficultyBadge, RoomBadge } from "@/components/badges";
import { HeatMap } from "@/components/HeatMap";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireTaGuild } from "@/lib/session";

interface Props {
  params: Promise<{ guildId: string }>;
}

const PEER_FLOOR = "Privacy floor: fewer than 5 peer matches";

/** W2: tiles, peer tiles, heat map, difficulty list. Refreshed every 5 s by the layout poller. */
export default async function GuildOverviewPage({ params }: Props) {
  const { guildId } = await params;
  const { guild } = await requireTaGuild(guildId);

  const [items, students, openRequests, delivered, difficulty, heatMap, peer] = await Promise.all([
    countItemsByGuild(guild.id),
    getConsentedStudentCount(guild.id),
    getOpenRequestCount(guild.id),
    getDeliveredAnswerCount(guild.id),
    getDifficultyList(guild.id),
    getHeatMapData(guild.id),
    getPeerMetrics(guild.id),
  ]);
  const queue = difficulty.filter((d) => d.open > 0 || d.topicRoom !== null);

  return (
    <>
      <PageHeader title="Overview" subtitle="What the class is stuck on right now. Names appear only where a student asked for TA help." />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Totals">
        <StatCard label="Tasks" value={items} icon={ListChecks} />
        <StatCard label="Consented students" value={students} icon={GraduationCap} tone="teal" />
        <StatCard label="Open help requests" value={openRequests} icon={Hand} tone="rose" highlight={openRequests > 0} />
        <StatCard label="Answers delivered" value={delivered} icon={CircleCheck} tone="emerald" />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Peer help">
        <StatCard
          label="Resolved by classmates"
          value={peer.peerResolvedCount ?? PEER_FLOOR}
          icon={HeartHandshake}
          tone="violet"
          footer="Peer matches that ended with Resolved."
        />
        <StatCard
          label="Median minutes to a human"
          value={peer.peerResolvedCount === null ? PEER_FLOOR : peer.medianMinutesToAccept ?? "No accepted matches yet"}
          icon={Timer}
          tone="sky"
          footer="From Stuck to a classmate accepting the offer."
        />
      </section>

      <Card className="mt-6">
        <CardHeader icon={TrendingUp} tone="orange" title="Stuck reports, last 7 days" subtitle="Per task, per Jakarta day. Counts only." />
        {heatMap.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No stuck reports this week" description="Cells fill in as students tap Stuck in /tasks." />
        ) : (
          <HeatMap data={heatMap} />
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          icon={Flame}
          tone="rose"
          title="Difficulty list"
          subtitle="Concepts ranked by open help requests. Click one to answer."
        />
        {queue.length === 0 ? (
          <EmptyState icon={CircleCheck} tone="emerald" title="No open help requests" description="Every student who asked for help has an answer on the way." />
        ) : (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {queue.map((d) => (
              <li key={d.concept.id}>
                <Link href={`/g/${guild.id}/concepts/${d.concept.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition hover:bg-subtle/60">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-[14px] font-semibold text-ink">{d.concept.label}</p>
                    <p className="truncate text-xs text-ink-3">{d.item.title}</p>
                  </div>
                  <RoomBadge room={d.topicRoom} discordGuildId={guild.discordGuildId} />
                  <DifficultyBadge band={d.band} open={d.open} answered={d.answered} />
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
