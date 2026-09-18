"use server";

import { createAnswer, markRequestsAnswered } from "@classync/core";
import { revalidatePath } from "next/cache";

interface SubmitAnswerParams {
  conceptId: string;
  guildId: string;
  authorUserId: string;
  body: string;
}

export async function submitAnswer({ conceptId, guildId, authorUserId, body }: SubmitAnswerParams) {
  // Write to outbox — bot deliver job picks it up every 10s
  const answer = await createAnswer({ conceptId, authorUserId, body });
  await markRequestsAnswered(conceptId);

  // Revalidate the concept page and guild overview
  revalidatePath(`/g/${guildId}/concepts/${conceptId}`);
  revalidatePath(`/g/${guildId}`);

  return { answerId: answer.id };
}

