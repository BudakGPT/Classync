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

  return (
    <main className="mx-auto max-w-xl p-6 space-y-8">
      <div>
        <Link href={`/g/${guildId}`} className="text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to overview
        </Link>
        <h1 className="text-2xl font-bold mt-2">{item.title}</h1>
        <p className="text-gray-400 text-sm">
          {item.dueAt
            ? `Due: ${new Date(item.dueAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`
            : "No deadline"}
          {" · "}
          {item.kind}
        </p>
      </div>

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
    </main>
  );
}
