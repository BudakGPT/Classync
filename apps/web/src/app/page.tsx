import { auth, signIn } from "@/auth";
import { getGuildsForTa } from "@classync/core";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  // If logged in, redirect straight to guild list
  if (session?.user?.id) {
    const guilds = await getGuildsForTa(session.user.id);
    if (guilds.length === 1) redirect(`/g/${guilds[0].id}`);
    if (guilds.length > 1) redirect("/guilds");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          📚 Classync
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          TA Dashboard — early warning for students about to fall behind.
        </p>
        <p className="text-gray-500 text-sm">
          Sign in with Discord to access your class dashboard.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("discord", { redirectTo: "/guilds" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-3 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Sign in with Discord
        </button>
      </form>

      <p className="text-xs text-gray-600">
        Only TAs who have run <code className="bg-gray-800 px-1 rounded">/setup</code> in their server can log in.
      </p>
    </main>
  );
}
