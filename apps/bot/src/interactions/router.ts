import type { Interaction } from "discord.js";
import { handleTaskInteraction } from "./tasks";
import { handleMatchButton } from "./match";
import { handleHelperToggle } from "./helper";

/** Dispatches buttons, string selects and modals by the prefix before the first ":". Unknown prefixes are ignored. */
export async function handleComponent(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;
  const prefix = interaction.customId.split(":")[0];
  if (prefix === "task") return handleTaskInteraction(interaction);
  if (!interaction.isButton()) return;
  if (prefix === "match") return handleMatchButton(interaction);
  if (prefix === "helper") return handleHelperToggle(interaction);
}
