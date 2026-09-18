"use server";

import { createAnswer, getConceptDetail, markRequestsAnswered } from "@classync/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { taGuildOrNull } from "@/lib/session";

const inputSchema = z.object({
  conceptId: z.string().min(1),
  body: z.string().trim().min(1).max(4_000),
});

/**
 * W3: write the answer to the outbox (deliveredAt = null). The bot's deliver job DMs
 * requesters, pins it in Discord and stamps delivery. The author is always the session user.
 */
export async function submitAnswer(input: { conceptId: string; body: string }): Promise<{ answerId: string }> {
  const { conceptId, body } = inputSchema.parse(input);

  const concept = await getConceptDetail(conceptId);
  if (!concept) throw new Error("Concept not found");

  const gate = await taGuildOrNull(concept.item.guildId);
  if (!gate) throw new Error("TA access required");

  const answer = await createAnswer({ conceptId, authorUserId: gate.userId, body });
  await markRequestsAnswered(conceptId);

  revalidatePath(`/g/${gate.guild.id}/concepts/${conceptId}`);
  revalidatePath(`/g/${gate.guild.id}`);
  return { answerId: answer.id };
}
