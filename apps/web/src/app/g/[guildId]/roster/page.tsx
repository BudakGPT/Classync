import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma, getRosterByGuild, getDistinctClasses } from "@classync/core";
import { RosterManager } from "./RosterManager";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function RosterPage({ params }: Props) {
  const { guildId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild) notFound();

  if (!guild.taUserIds.includes(session.user.id)) {
    redirect(`/g/${guildId}`);
  }

  const [roster, classes] = await Promise.all([
    getRosterByGuild(guild.id),
    getDistinctClasses(guild.id),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href={`/g/${guildId}`} className="hover:text-gray-300 transition">
              {guild.name}
            </Link>
            <span>/</span>
            <span className="text-gray-300">Data Mahasiswa & Asdos</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Kelola Roster & Verifikasi</h1>
        </div>
        <Link
          href={`/g/${guildId}`}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 transition"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      <RosterManager
        guildId={guild.id}
        guildName={guild.name}
        initialAuthEnabled={guild.authEnabled}
        initialRoster={roster}
        initialClasses={classes}
      />
    </main>
  );
}
