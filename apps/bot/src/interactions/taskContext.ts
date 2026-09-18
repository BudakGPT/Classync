import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { getConsentedStudent, getGuildByDiscordId, getItemById, isTa } from "@classync/core";
import type { ItemRef, StudentRef } from "../ui/tasks.js";

export type TaskComponent = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;
export interface TaskContext {
  item: ItemRef;
  student: StudentRef;
}

/**
 * Resolves item + consented student for a component tap. Works in guild replies and in DMs
 * (the peer-match expiry job sends `task:help` buttons by DM). Returns null for TAs, unknown or
 * cross-guild items, past-due items, and students who have not consented.
 */
export async function contextForItem(
  itemId: string,
  userId: string,
  interactionGuildId: string | null,
): Promise<TaskContext | null> {
  const item = await getItemById(itemId);
  if (!item) return null;
  if (interactionGuildId !== null) {
    const guild = await getGuildByDiscordId(interactionGuildId);
    if (!guild || item.guildId !== guild.id) return null;
    if (await isTa(interactionGuildId, userId)) return null;
  }
  if (item.dueAt && item.dueAt.getTime() < Date.now()) return null;
  const student = await getConsentedStudent(item.guildId, userId);
  return student ? { item, student } : null;
}
