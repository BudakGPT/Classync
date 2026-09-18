import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { getOpenRequestCount } from "@classync/core";
import { signOutAction } from "@/actions/auth";
import { GuildTabs } from "@/components/GuildTabs";
import { Poller } from "@/components/Poller";
import { Button, ButtonLink, ClassyncMark } from "@/components/ui";
import { requireTaGuild } from "@/lib/session";

interface Props {
  children: ReactNode;
  params: Promise<{ guildId: string }>;
}

/** Shared frame for every /g/[guildId] page: TA gate, header, tabs, and the 5-second poller. */
export default async function GuildLayout({ children, params }: Props) {
  const { guildId } = await params;
  const { guild } = await requireTaGuild(guildId);
  const openRequests = await getOpenRequestCount(guild.id);

  return (
    <div className="min-h-dvh">
      <Poller />
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 md:px-6">
          <Link href="/guilds" aria-label="All servers" className="shrink-0">
            <ClassyncMark size={32} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">TA dashboard</p>
            <h1 className="truncate text-[15px] font-bold leading-tight text-ink">{guild.name}</h1>
          </div>
          <ButtonLink href="/guilds" variant="ghost" size="sm" icon={ArrowLeftRight} className="max-sm:px-2">
            <span className="max-sm:hidden">Switch server</span>
          </ButtonLink>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm" icon={LogOut}>Sign out</Button>
          </form>
        </div>
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <GuildTabs guildId={guild.id} openRequests={openRequests} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 md:px-6">{children}</main>
    </div>
  );
}
