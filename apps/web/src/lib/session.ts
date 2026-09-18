import { auth } from "@/auth";
import { getGuildById } from "@classync/core";
import { notFound, redirect } from "next/navigation";

/**
 * Every /g/[guildId] page and every mutation goes through this gate:
 * signed in, guild exists, and the signed-in Discord ID is in `taUserIds`.
 */
export async function requireTaGuild(guildId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/");

  const guild = await getGuildById(guildId);
  if (!guild) notFound();
  if (!guild.taUserIds.includes(userId)) redirect("/guilds");

  return { guild, userId };
}

/** Same gate for server actions and route handlers: returns null instead of redirecting. */
export async function taGuildOrNull(guildId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const guild = await getGuildById(guildId);
  if (!guild || !guild.taUserIds.includes(userId)) return null;
  return { guild, userId };
}
