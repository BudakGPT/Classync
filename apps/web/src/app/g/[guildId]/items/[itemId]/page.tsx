import { auth } from "@/auth";
import { getItemById, getItemAggregate } from "@classync/core";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ guildId: string; itemId: string }>;
}

export default async function ItemAggregatePage({ params }: Props) {
  const { guildId, itemId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { prisma } = await import("@classync/core");
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild) notFound();
  if (!guild.taUserIds.includes(session.user.id)) redirect("/guilds");

  const item = await getItemById(itemId);
  if (!item) notFound();

  const aggregate = await getItemAggregate(itemId);

  // Fetch concepts under this item for discussion rooms display
  const concepts = await prisma.concept.findMany({
    where: { itemId: item.id },
    include: {
      helpRequests: { select: { id: true, state: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const isPastDue = item.dueAt ? Date.now() >= new Date(item.dueAt).getTime() : true;
  const formattedDue = item.dueAt
    ? new Date(item.dueAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    : "No deadline";

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <div>
        <Link href={`/g/${guildId}`} className="text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to overview
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-bold">{item.title}</h1>
            <p className="text-gray-400 text-sm">
              Due: {formattedDue} · {item.kind}
            </p>
          </div>
          {/* Discord Category Indicator */}
          <span className="rounded-lg bg-indigo-950/50 border border-indigo-800/40 px-3 py-1.5 text-xs text-indigo-300 flex items-center gap-1.5">
            <span>📁</span> Category: <strong className="text-white">{item.title}</strong>
          </span>
        </div>
      </div>

      {/* Student Status Aggregate */}
      <section>
        <h2 className="text-lg font-semibold mb-3">📊 Student Status Aggregate</h2>

        {aggregate === null ? (
          <div className="rounded-xl bg-gray-800 p-6 text-center">
            <p className="text-2xl mb-2">🔒</p>
            <p className="font-semibold">Not enough reports yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Privacy floor: at least 5 students must have a status before aggregate is shown.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Done", value: aggregate["DONE"] ?? 0, color: "bg-green-900/40 border-green-700", emoji: "✅" },
              { label: "In Progress", value: aggregate["IN_PROGRESS"] ?? 0, color: "bg-blue-900/40 border-blue-700", emoji: "🔵" },
              { label: "Stuck", value: aggregate["STUCK"] ?? 0, color: "bg-red-900/40 border-red-700", emoji: "🔴" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-5 flex flex-col gap-1 ${s.color}`}>
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-3xl font-bold">{s.value}</span>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Concept Discussion Rooms List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">💬 Concept Discussion Rooms</h2>
            <p className="text-xs text-gray-400">
              Private channels created per concept under category 📁 {item.title}
            </p>
          </div>
          {/* Bulk Cleanup Action (Disabled) */}
          <button
            type="button"
            disabled
            title={
              !isPastDue
                ? `Cannot close rooms before deadline (${formattedDue})`
                : "Fitur dinonaktifkan sementara (menunggu bot)"
            }
            className="rounded-lg bg-red-950/40 border border-red-800/40 px-3 py-1.5 text-xs font-medium text-red-300 opacity-60 cursor-not-allowed"
          >
            Close All Rooms for this Task
          </button>
        </div>

        {concepts.length === 0 ? (
          <div className="rounded-xl bg-gray-800 p-6 text-center text-sm text-gray-400">
            No concepts reported for this task yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/60 rounded-xl border border-gray-700/60 bg-gray-800/80 overflow-hidden">
            {concepts.map((c) => {
              const openCount = c.helpRequests.filter((r) => r.state === "OPEN").length;
              return (
                <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-750/50 transition-colors">
                  <div>
                    <Link
                      href={`/g/${guildId}/concepts/${c.id}`}
                      className="font-medium text-white hover:text-indigo-400 transition-colors flex items-center gap-2"
                    >
                      <span>#{c.label.replace(/\s+/g, "-")}</span>
                      <span className="text-xs text-gray-400 font-normal">→</span>
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {openCount} active help request(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-slate-700/60 border border-slate-600/40 px-2.5 py-0.5 text-xs text-slate-300">
                      Room: Belum tersedia
                    </span>
                    <button
                      type="button"
                      disabled
                      className="rounded bg-gray-700/50 px-2.5 py-1 text-xs text-gray-400 opacity-60 cursor-not-allowed"
                    >
                      Discord ↗
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
