import { auth } from "@/auth";
import {
  getGuildByDiscordId,
  getItemsByGuild,
  getConsentedStudentCount,
  getOpenRequestCount,
  getDeliveredAnswerCount,
  getDifficultyList,
  getHeatMapData,
  getPeerMetrics,
  isTa,
} from "@classync/core";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { HeatMap } from "@/components/HeatMap";
import { Poller } from "@/components/Poller";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function GuildOverviewPage({ params }: Props) {
  const { guildId } = await params; // Next 15: params is a Promise
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // Find guild by internal ID
  const { prisma } = await import("@classync/core");
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild) notFound();

  // TA gate
  if (!guild.taUserIds.includes(session.user.id)) {
    redirect("/guilds");
  }

  const [itemCount, studentCount, openRequests, answersDelivered, difficulty, heatMap, peer] =
    await Promise.all([
      getItemsByGuild(guild.id).then((i) => i.length),
      getConsentedStudentCount(guild.id),
      getOpenRequestCount(guild.id),
      getDeliveredAnswerCount(guild.id),
      getDifficultyList(guild.id),
      getHeatMapData(guild.id),
      getPeerMetrics(guild.id),
    ]);

  // Peer-matching tiles: counts only, null below the privacy floor (handoff §6)
  const PRIVACY_FLOOR_TEXT = "Privacy floor: fewer than 5 matches";
  const peerTiles = [
    {
      label: "Resolved by classmates",
      value: peer.peerResolvedCount === null ? PRIVACY_FLOOR_TEXT : peer.peerResolvedCount,
      icon: "🤝",
    },
    {
      label: "Median minutes to a human",
      value:
        peer.peerResolvedCount === null
          ? PRIVACY_FLOOR_TEXT
          : peer.medianMinutesToAccept === null
            ? "No accepted matches yet"
            : peer.medianMinutesToAccept,
      icon: "⏱️",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <Poller />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">TA Dashboard</p>
          <h1 className="text-2xl font-bold">{guild.name}</h1>
        </div>
        <Link href="/guilds" className="text-sm text-gray-500 hover:text-white transition-colors">
          ← All servers
        </Link>
      </div>

      {/* Overview tiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tasks", value: itemCount, icon: "📋" },
          { label: "Students", value: studentCount, icon: "🧑‍🎓" },
          { label: "Open Requests", value: openRequests, icon: "🙋", highlight: openRequests > 0 },
          { label: "Answers Delivered", value: answersDelivered, icon: "✅" },
        ].map((tile) => (
          <div
            key={tile.label}
            className={`rounded-xl p-5 flex flex-col gap-1 ${
              tile.highlight ? "bg-red-900/40 border border-red-700" : "bg-gray-800"
            }`}
          >
            <span className="text-2xl">{tile.icon}</span>
            <span className="text-3xl font-bold">{tile.value}</span>
            <span className="text-xs text-gray-400">{tile.label}</span>
          </div>
        ))}
      </section>

      {/* Peer matching tiles */}
      <section className="grid grid-cols-2 gap-4">
        {peerTiles.map((tile) => (
          <div key={tile.label} className="rounded-xl p-5 flex flex-col gap-1 bg-gray-800">
            <span className="text-2xl">{tile.icon}</span>
            {typeof tile.value === "number" ? (
              <span className="text-3xl font-bold">{tile.value}</span>
            ) : (
              <span className="text-sm text-gray-400 py-2">{tile.value}</span>
            )}
            <span className="text-xs text-gray-400">{tile.label}</span>
          </div>
        ))}
      </section>

      {/* Heat map */}
      {heatMap.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">📊 Stuck Reports — Last 7 Days</h2>
          <HeatMap data={heatMap} />
        </section>
      )}

      {/* Difficulty list */}
      <section>
        <h2 className="text-lg font-semibold mb-3">🔥 Difficulty List</h2>
        {difficulty.filter((d) => d.open > 0).length === 0 ? (
          <p className="text-gray-500 text-sm">No open help requests right now 🎉</p>
        ) : (
          <div className="space-y-2">
            {difficulty
              .filter((d) => d.open > 0)
              .map((d) => (
                <Link
                  key={d.concept.id}
                  href={`/g/${guildId}/concepts/${d.concept.id}`}
                  className="flex items-center justify-between rounded-lg bg-gray-800 px-5 py-4 hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="font-medium">{d.concept.label}</p>
                    <p className="text-xs text-gray-400">{d.item.title}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-slate-700/60 border border-slate-600/40 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      No Room Yet
                    </span>
                    <DifficultyBadge band={d.band} open={d.open} answered={d.answered} />
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </section>

      {/* Quick nav */}
      <section className="flex gap-3 flex-wrap">
        <Link href={`/g/${guildId}/answers`} className="rounded-lg bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700 transition-colors">
          📚 Knowledge Base
        </Link>
      </section>
    </main>
  );
}
