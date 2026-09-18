import { auth } from "@/auth";
import {
  getConceptById,
  getOpenRequestsForConcept,
  getAnswersForGuild,
} from "@classync/core";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AnswerForm } from "@/components/AnswerForm";

interface Props {
  params: Promise<{ guildId: string; conceptId: string }>;
}

export default async function ConceptPage({ params }: Props) {
  const { guildId, conceptId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { prisma } = await import("@classync/core");
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild) notFound();
  if (!guild.taUserIds.includes(session.user.id)) redirect("/guilds");

  const concept = await getConceptById(conceptId);
  if (!concept) notFound();

  const openRequests = await getOpenRequestsForConcept(conceptId);

  // Prior answers for this concept
  const allAnswers = await getAnswersForGuild(guildId);
  const priorAnswers = allAnswers.filter((a) => a.conceptId === conceptId);

  // Item info
  const item = await prisma.item.findUnique({ where: { id: concept.itemId } });

  // Due date check for room closure moderation
  const isPastDue = item?.dueAt ? Date.now() >= new Date(item.dueAt).getTime() : true;
  const formattedDue = item?.dueAt
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
            <h1 className="text-2xl font-bold">🎯 {concept.label}</h1>
            <p className="text-gray-400 text-sm">
              Task: <span className="text-gray-200 font-medium">{item?.title}</span> · Due: {formattedDue}
            </p>
          </div>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            Room: Belum tersedia
          </span>
        </div>
      </div>

      {/* Private Room Overview Card */}
      <section className="rounded-xl border border-gray-700/60 bg-gray-800/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>💬</span> Private Concept Room
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Dedicated private channel under category 📁 {item?.title ?? "Assignment"}
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Channel will be created automatically when students join discussion"
            className="rounded-lg bg-gray-700/60 border border-gray-600/50 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed opacity-75"
          >
            Open Discord Room ↗
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-gray-900/60 p-3">
            <p className="text-gray-400">Room Status</p>
            <p className="font-semibold text-gray-200 mt-1">Pending student activity</p>
          </div>
          <div className="rounded-lg bg-gray-900/60 p-3">
            <p className="text-gray-400">Discussion Participants</p>
            <p className="font-semibold text-gray-200 mt-1">{openRequests.length} active requesters</p>
          </div>
        </div>

        {/* Room Moderation Controls */}
        <div className="border-t border-gray-700/60 pt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11.5px] text-gray-400">
            {!isPastDue ? (
              <span>🔒 Room can only be closed after deadline ({formattedDue}).</span>
            ) : (
              <span>ℹ️ Room closure controls (awaiting bot synchronization).</span>
            )}
          </div>
          <div className="flex gap-2">
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
              Close Room
            </button>
            <button
              type="button"
              disabled
              title="Fitur dinonaktifkan sementara (menunggu bot)"
              className="rounded-lg bg-gray-700/50 border border-gray-600/40 px-3 py-1.5 text-xs font-medium text-gray-400 opacity-60 cursor-not-allowed"
            >
              Reopen
            </button>
          </div>
        </div>
      </section>

      {/* Open requesters */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          🙋 Open Explicit Requests ({openRequests.length})
        </h2>
        {openRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">No open requests.</p>
        ) : (
          <ul className="space-y-2">
            {openRequests.map((req) => (
              <li key={req.id} className="rounded-lg bg-gray-800 px-4 py-3 text-sm flex items-center justify-between">
                <div>
                  <span className="font-mono text-gray-300">{req.student.discordUserId}</span>
                  <span className="text-gray-500 ml-2">
                    · {new Date(req.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                  </span>
                </div>
                <span className="rounded bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                  Explicit TA Request
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Answer form */}
      <section>
        <h2 className="text-lg font-semibold mb-3">✍️ Post Answer</h2>
        <AnswerForm
          conceptId={conceptId}
          guildId={guildId}
          authorUserId={session.user.id}
          recipientCount={openRequests.length}
        />
      </section>

      {/* Prior answers */}
      {priorAnswers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">📖 Prior Answers</h2>
          <div className="space-y-3">
            {priorAnswers.map((a) => (
              <div key={a.id} className="rounded-lg bg-gray-800 px-5 py-4">
                <p className="text-gray-200 whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Delivered to {a.deliveredCount} student(s) ·{" "}
                  {a.deliveredAt
                    ? new Date(a.deliveredAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
                    : "Pending..."}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
