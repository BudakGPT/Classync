import { auth } from "@/auth";
import { getGuildsForTa } from "@classync/core";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function GuildsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const guilds = await getGuildsForTa(session.user.id);

  if (guilds.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">📭 No Classync Servers Found</h1>
        <p className="text-gray-400 max-w-sm text-center">
          You are not a TA in any Classync server. Ask a server admin to run{" "}
          <code className="bg-gray-800 px-1 rounded">/setup channel</code> and add you with{" "}
          <code className="bg-gray-800 px-1 rounded">/setup add-ta</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Your Classync Servers</h1>
      <ul className="flex flex-col gap-3 w-full max-w-sm">
        {guilds.map((guild) => (
          <li key={guild.id}>
            <Link
              href={`/g/${guild.id}`}
              className="flex items-center justify-between rounded-lg bg-gray-800 px-5 py-4 hover:bg-gray-700 transition-colors"
            >
              <span className="font-semibold">{guild.name}</span>
              <span className="text-gray-400 text-sm">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
