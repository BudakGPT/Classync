import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, type ButtonInteraction, type Client } from "discord.js";
import { z } from "zod";
import {
  acceptMatch,
  declineOffer,
  getActiveMatchForUser,
  getItemById,
  getMatchStudentId,
  reportMatch,
  resolveMatch,
  revealIdentity,
} from "@classync/core";

const customIdSchema = z.tuple([
  z.literal("match"),
  z.enum(["offer-yes", "offer-no", "resolve", "reveal", "report"]),
  z.string().min(1).max(64),
]);

function relayRow(matchId: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`match:resolve:${matchId}`).setLabel("Resolved").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`match:reveal:${matchId}`).setLabel("Reveal me").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`match:report:${matchId}`).setLabel("Report").setStyle(ButtonStyle.Danger)
  );
}

/** DM failures (closed DMs) are logged and skipped, never thrown. */
async function dm(client: Client, discordUserId: string, content: string, matchId?: string): Promise<void> {
  try {
    const user = await client.users.fetch(discordUserId);
    await user.send(matchId ? { content, components: [relayRow(matchId)] } : { content });
  } catch {
    console.warn(`[match] Cannot DM ${discordUserId} (DMs closed)`);
  }
}

export async function handleMatchButton(interaction: ButtonInteraction): Promise<void> {
  const [, action, matchId] = customIdSchema.parse(interaction.customId.split(":"));
  await interaction.deferUpdate();
  const studentId = await getMatchStudentId(matchId, interaction.user.id);
  if (!studentId) {
    await interaction.followUp({ content: "This offer is no longer available.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (action === "offer-yes") await handleOfferYes(interaction, matchId, studentId);
  else if (action === "offer-no") await handleOfferNo(interaction, matchId, studentId);
  else if (action === "resolve") await handleResolve(interaction, matchId, studentId);
  else if (action === "reveal") await handleReveal(interaction, matchId, studentId);
  else await handleReport(interaction, matchId, studentId);
}

async function handleOfferYes(interaction: ButtonInteraction, matchId: string, studentId: string): Promise<void> {
  const match = await acceptMatch(matchId, studentId);
  if (!match) {
    await interaction.editReply({ content: "A classmate already took this one, thanks.", components: [] });
    return;
  }
  await interaction.editReply({
    content: "✅ You are connected. Reply here; I will pass it on. Tap **Resolved** when done.",
    components: [relayRow(matchId)],
  });
  const active = await getActiveMatchForUser(interaction.user.id);
  const item = await getItemById(match.itemId);
  if (!active || !item) return;
  await dm(
    interaction.client,
    active.receiver.discordUserId,
    `🤝 A classmate who finished **${item.title}** is here. Reply in this DM and I will pass it on.`,
    matchId
  );
}

async function handleOfferNo(interaction: ButtonInteraction, matchId: string, studentId: string): Promise<void> {
  await declineOffer(matchId, studentId);
  await interaction.editReply({ content: "No problem.", components: [] });
}

async function handleResolve(interaction: ButtonInteraction, matchId: string, studentId: string): Promise<void> {
  const active = await getActiveMatchForUser(interaction.user.id);
  const resolved = active?.id === matchId ? await resolveMatch(matchId, studentId) : null;
  if (!active || !resolved) {
    await interaction.editReply({ content: "This match is not active any more.", components: [] });
    return;
  }
  await interaction.editReply({ content: "✅ Marked resolved. Thanks for helping each other.", components: [] });
  const other = active.receiver.discordUserId === interaction.user.id ? active.provider : active.receiver;
  await dm(interaction.client, other.discordUserId, "✅ Marked resolved. Your classmate closed this conversation.");
}

async function handleReveal(interaction: ButtonInteraction, matchId: string, studentId: string): Promise<void> {
  const otherDiscordUserId = await revealIdentity(matchId, studentId);
  if (!otherDiscordUserId) {
    await interaction.followUp({ content: "This match is not active any more.", flags: MessageFlags.Ephemeral });
    return;
  }
  await dm(interaction.client, otherDiscordUserId, `👋 Your classmate is <@${interaction.user.id}>.`);
  await interaction.followUp({ content: "Your identity was shared with your classmate.", flags: MessageFlags.Ephemeral });
}

async function handleReport(interaction: ButtonInteraction, matchId: string, studentId: string): Promise<void> {
  const active = await getActiveMatchForUser(interaction.user.id);
  const taUserIds = await reportMatch(matchId, studentId);
  if (taUserIds === null) {
    await interaction.followUp({ content: "This match cannot be reported.", flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.editReply({ content: "🚩 Reported. A TA has been notified. This conversation is closed.", components: [] });
  for (const taId of taUserIds) {
    await dm(interaction.client, taId, `🚩 A peer match was reported. Match id \`${matchId}\`.`);
  }
  if (active?.id !== matchId) return;
  const other = active.receiver.discordUserId === interaction.user.id ? active.provider : active.receiver;
  await dm(interaction.client, other.discordUserId, "This peer conversation has been closed.");
}
