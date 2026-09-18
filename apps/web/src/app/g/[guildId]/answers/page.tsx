import { auth } from "@/auth";
import { getAnswersForGuild } from "@classync/core";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function KnowledgeBasePage({ params }: Props) {
  const { guildId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { prisma } = await import("@classync/core");
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild) notFound();
  if (!guild.taUserIds.includes(session.user.id)) redirect("/guilds");

  const answers = await getAnswersForGuild(guildId);

  // Group by item
  const byItem = new Map<string, { itemTitle: string; entries: typeof answers }>();
  for (const a of answers) {
    const key = a.concept.item.id;
    if (!byItem.has(key)) {
      byItem.set(key, { itemTitle: a.concept.item.title, entries: [] });
    }
    byItem.get(key)!.entries.push(a);
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/g/${guildId}`} className="text-sm text-gray-500 hover:text-white transition-colors">
            ← Back to overview
          </Link>
          <h1 className="text-2xl font-bold mt-2">📚 Knowledge Base</h1>
          <p className="text-gray-400 text-sm">All answers — accumulated for future students.</p>
        </div>
      </div>

      {byItem.size === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p>No answers yet. Use <code className="bg-gray-800 px-1 rounded">/ta answer</code> or the concept page to post the first one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byItem.entries()).map(([itemId, { itemTitle, entries }]) => (
            <section key={itemId}>
              <h2 className="text-base font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-2">
                {itemTitle}
              </h2>
              <div className="space-y-3">
                {entries.map((a) => (
                  <div key={a.id} className="rounded-lg bg-gray-800 px-5 py-4">
                    <p className="text-xs font-semibold text-indigo-400 mb-1 uppercase tracking-wide">
                      {a.concept.label}
                    </p>
                    <p className="text-gray-200 whitespace-pre-wrap">{a.body}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Delivered to {a.deliveredCount} student(s)
                      {a.deliveredAt &&
                        ` · ${new Date(a.deliveredAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
