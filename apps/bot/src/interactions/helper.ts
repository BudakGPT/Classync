import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, type ButtonInteraction, type Client } from "discord.js";
import { z } from "zod";
import { createMatch, findProviders, getGuildByDiscordId, getOrCreateStudent, setHelperOptIn } from "@classync/core";
import { taskListScreen } from "../ui/tasks";

const toggleSchema = z.enum(["helper:optin", "helper:optout"]);

/** `helper:optin` / `helper:optout` from the /tasks privacy row. */
export async function handleHelperToggle(interaction: ButtonInteraction): Promise<void> {
  const id = toggleSchema.parse(interaction.customId);
  await interaction.deferUpdate();
  const guild = interaction.guildId ? await getGuildByDiscordId(interaction.guildId) : null;
  if (!guild) return void (await interaction.followUp({ content: "Open `/tasks` in the class server first.", flags: MessageFlags.Ephemeral }));
  const student = await getOrCreateStudent(guild.id, interaction.user.id);
  await setHelperOptIn(student.id, id === "helper:optin");
  await interaction.editReply(await taskListScreen(guild.id, await getOrCreateStudent(guild.id, interaction.user.id)));
}

/**
 * Trigger after a Stuck save (handoff §4). Returns the line to append to the receiver's reply.
 * Empty string means "skip silently" (receiver is already matched).
 */
export async function offerPeerHelp(
  client: Client,
  item: { id: string; title: string },
  concept: { id: string; label: string },
  student: { id: string }
): Promise<string> {
  const providers = await findProviders(item.id, student.id);
  if (providers.length === 0) return "No classmate is free right now. You can request TA help below.";

  const match = await createMatch({
    itemId: item.id,
    conceptId: concept.id,
    receiverId: student.id,
    offeredTo: providers.map((p) => p.studentId),
  });
  if (!match) return "";

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`match:offer-yes:${match.id}`).setLabel("Yes").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`match:offer-no:${match.id}`).setLabel("Not now").setStyle(ButtonStyle.Secondary)
  );
  const content =
    `🤝 A classmate is stuck on **${concept.label}** in **${item.title}**, which you finished. ` +
    "Help privately, about 10 minutes?";
  for (const provider of providers) {
    try {
      const user = await client.users.fetch(provider.discordUserId);
      await user.send({ content, components: [row] });
    } catch {
      console.warn(`[match] Cannot DM provider ${provider.discordUserId} (DMs closed)`);
    }
  }
  return "🤝 I have asked a classmate who finished this to help. You will get a DM if they accept.";
}
