import {
  ChannelType,
  type Guild,
} from "discord.js";

/** Role names that Classync creates during /setup. The bot's own managed role is NOT here. */
const CLASSYNC_ROLE_NAMES = new Set([
  "dosen pengampu",
  "teaching assistant",
  "mahasiswa",
  "verified",
]);

/** Category name prefixes that Classync creates (case-insensitive startsWith check). */
const CLASSYNC_CATEGORY_PREFIXES = [
  "📢 informasi akademik",
  "💬 diskusi umum",
  "🔒 ruang ta & dosen",
  "🔐 gerbang verifikasi",
  "📁 ",
];

function isBotManagedCategory(name: string): boolean {
  const lower = name.toLowerCase();
  return CLASSYNC_CATEGORY_PREFIXES.some((p) => lower.startsWith(p));
}

/**
 * Deletes all Classync-created channels, categories, and roles.
 * Preserves the bot's own managed role and all user-created resources.
 * Returns counts for the confirmation embed.
 */
export async function teardownAcademicChannels(guild: Guild): Promise<{ deletedChannels: number; deletedRoles: number }> {
  let deletedChannels = 0;
  let deletedRoles = 0;

  // 1. Delete channels inside managed categories (must delete children first)
  const categories = guild.channels.cache.filter(
    (c) => c.type === ChannelType.GuildCategory && isBotManagedCategory(c.name),
  );

  for (const category of categories.values()) {
    const children = guild.channels.cache.filter((c) => c.parentId === category.id);
    for (const child of children.values()) {
      await child.delete("Classync reset").catch(() => undefined);
      deletedChannels += 1;
    }
    await category.delete("Classync reset").catch(() => undefined);
    deletedChannels += 1;
  }

  // 2. Delete Classync-created roles (skip bot's own managed role)
  const botRoleIds = new Set(guild.members.me?.roles.cache.map((r) => r.id) ?? []);
  const classyncRoles = guild.roles.cache.filter(
    (r) => CLASSYNC_ROLE_NAMES.has(r.name.toLowerCase()) && !botRoleIds.has(r.id) && !r.managed,
  );

  // Also delete class-specific roles (e.g. "Kelas A", "Kelas B") created by setupClassroomCategories
  const classRoles = guild.roles.cache.filter(
    (r) => /^kelas\s/i.test(r.name) && !botRoleIds.has(r.id) && !r.managed,
  );

  for (const role of [...classyncRoles.values(), ...classRoles.values()]) {
    await role.delete("Classync reset").catch(() => undefined);
    deletedRoles += 1;
  }

  return { deletedChannels, deletedRoles };
}
