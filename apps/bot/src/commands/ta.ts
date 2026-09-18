import {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  isTa,
  createItem,
  getGuildByDiscordId,
  getDifficultyList,
  getOpenRequestsForConcept,
  getConceptById,
  createAnswer,
  markRequestsAnswered,
  getConceptsForItem,
  getItemsByGuild,
} from "@classync/core";

export default {
  data: new SlashCommandBuilder()
    .setName("ta")
    .setDescription("TA-only commands")
    .addSubcommand((sub) =>
      sub
        .setName("add-item")
        .setDescription("Manually add a task/assignment")
        .addStringOption((o) => o.setName("title").setDescription("Task title").setRequired(true))
        .addStringOption((o) =>
          o.setName("due").setDescription("Due date (YYYY-MM-DD or YYYY-MM-DD HH:mm, Asia/Jakarta)").setRequired(false)
        )
        .addStringOption((o) =>
          o
            .setName("kind")
            .setDescription("Task type")
            .setRequired(false)
            .addChoices(
              { name: "Assignment", value: "ASSIGNMENT" },
              { name: "Quiz", value: "QUIZ" },
              { name: "Exam", value: "EXAM" },
              { name: "Reading", value: "READING" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName("queue").setDescription("View open help requests ranked by demand")
    )
    .addSubcommand((sub) =>
      sub
        .setName("answer")
        .setDescription("Answer a concept and deliver to all requesters")
        .addStringOption((o) =>
          o.setName("concept").setDescription("Concept ID (from /ta queue)").setRequired(true).setAutocomplete(true)
        )
        .addStringOption((o) => o.setName("body").setDescription("Your answer").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "❌ Server only.", flags: MessageFlags.Ephemeral });
      return;
    }

    // TA gate
    if (!(await isTa(interaction.guildId, interaction.user.id))) {
      await interaction.reply({ content: "❌ TA access required.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sub = interaction.options.getSubcommand();
    const guild = await getGuildByDiscordId(interaction.guildId);
    if (!guild) {
      await interaction.editReply("❌ Run `/setup channel` first.");
      return;
    }

    if (sub === "add-item") {
      const title = interaction.options.getString("title", true);
      const dueRaw = interaction.options.getString("due");
      const kind = (interaction.options.getString("kind") ?? "ASSIGNMENT") as
        | "ASSIGNMENT"
        | "QUIZ"
        | "EXAM"
        | "READING";

      let dueAt: Date | undefined;
      if (dueRaw) {
        // Parse in Asia/Jakarta — store as UTC
        const parsed = new Date(dueRaw.includes(":") ? dueRaw : `${dueRaw}T23:59:00+07:00`);
        if (!isNaN(parsed.getTime())) dueAt = parsed;
      }

      const item = await createItem({ guildId: guild.id, title, dueAt, kind });
      const dueStr = dueAt ? `<t:${Math.floor(dueAt.getTime() / 1000)}:F>` : "No deadline";
      await interaction.editReply(
        `✅ **${item.title}** added!\n📅 Due: ${dueStr}\n🏷️ Kind: ${kind}`
      );
    } else if (sub === "queue") {
      const list = await getDifficultyList(guild.id);
      const open = list.filter((d) => d.open > 0);

      if (open.length === 0) {
        await interaction.editReply("✅ No open help requests right now.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("📋 Help Request Queue")
        .setColor(0xe74c3c)
        .setDescription("Ranked by open requests. Use `/ta answer` to reply.")
        .addFields(
          open.slice(0, 10).map((d) => ({
            name: `#${d.open} open · ${d.band === "red" ? "🔴" : d.band === "yellow" ? "🟡" : "🟢"} ${d.concept.label}`,
            value: `Item: **${d.item.title}** · Answered: ${d.answered}\nID: \`${d.concept.id}\``,
          }))
        );

      await interaction.editReply({ embeds: [embed] });
    } else if (sub === "answer") {
      const conceptId = interaction.options.getString("concept", true);
      const body = interaction.options.getString("body", true);

      const concept = await getConceptById(conceptId);
      if (!concept) {
        await interaction.editReply("❌ Concept not found. Copy the ID from `/ta queue`.");
        return;
      }

      const openRequests = await getOpenRequestsForConcept(conceptId);

      // Create answer in outbox — deliver job will stamp it
      await createAnswer({ conceptId, authorUserId: interaction.user.id, body });
      await markRequestsAnswered(conceptId);

      await interaction.editReply(
        `✅ Answer saved!\n📨 Delivering to **${openRequests.length}** student(s)...\nThe bot will DM them and pin the answer in the announcement channel.`
      );
    }
  },
};
