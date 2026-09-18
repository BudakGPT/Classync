import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, LogOut, ServerOff } from "lucide-react";
import { getGuildsForTa } from "@classync/core";
import { auth } from "@/auth";
import { signOutAction } from "@/actions/auth";
import { Button, Card, EmptyState, Logo } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";

/** W1: servers where the signed-in Discord ID is in `taUserIds`. */
export default async function GuildsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const guilds = await getGuildsForTa(session.user.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm" icon={LogOut}>Sign out</Button>
        </form>
      </div>

      <h1 className="mt-8 text-[22px] font-extrabold tracking-tight text-ink">Your Classync servers</h1>
      <p className="mt-1 text-[13.5px] text-ink-3">Pick a class server to open its dashboard.</p>

      <Card className="mt-5 overflow-hidden">
        {guilds.length === 0 ? (
          <EmptyState
            icon={ServerOff}
            title="You are not a TA in any Classync server."
            description={
              <>
                Ask the server owner to run <code className="rounded bg-subtle px-1 py-0.5 text-[12px]">/setup add-ta</code> with your account, then reload.
              </>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {guilds.map((guild) => (
              <li key={guild.id}>
                <Link href={`/g/${guild.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-subtle/60">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-[13px] font-extrabold text-brand-700">
                    {guild.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold text-ink">{guild.name}</span>
                    <span className="block text-xs text-ink-3">Installed {fmtDateTime(guild.installedAt)}</span>
                  </span>
                  <ChevronRight className="size-4 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
