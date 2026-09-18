import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { getGuildByDiscordId, getItemById, getOrCreateStudent, hasConsented } from "@classync/core";
import type { ItemRef, StudentRef } from "../ui/tasks";

export type TaskComponent = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;
export interface TaskContext {
  item: ItemRef;
  student: StudentRef;
}

/** Resolves item + consented student for a component tap. Works in guild replies and in DMs. */
export async function contextForItem(itemId: string, interaction: TaskComponent): Promise<TaskContext | null> {
  const item = await getItemById(itemId);
  if (!item) return null;
  if (interaction.guildId) {
    const guild = await getGuildByDiscordId(interaction.guildId);
    if (!guild || guild.id !== item.guildId) return null;
  }
  const student = await getOrCreateStudent(item.guildId, interaction.user.id);
  if (!(await hasConsented(student.id))) return null;
  return { item, student };
}
