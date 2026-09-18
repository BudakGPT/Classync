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

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <div>
        <Link href={`/g/${guildId}`} className="text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to overview
        </Link>
        <h1 className="text-2xl font-bold mt-2">🎯 {concept.label}</h1>
        <p className="text-gray-400 text-sm">Item: {item?.title}</p>
      </div>

      {/* Open requesters */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          🙋 Open Requests ({openRequests.length})
        </h2>
        {openRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">No open requests.</p>
        ) : (
          <ul className="space-y-2">
            {openRequests.map((req) => (
              <li key={req.id} className="rounded-lg bg-gray-800 px-4 py-3 text-sm">
                <span className="font-mono text-gray-300">{req.student.discordUserId}</span>
                <span className="text-gray-500 ml-2">
                  · {new Date(req.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
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
