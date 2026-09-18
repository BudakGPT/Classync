"use server";

import { auth } from "@/auth";
import { getItemById, getConceptById } from "@classync/core";
import { revalidatePath } from "next/cache";

/**
 * Server action to close a private concept discussion room.
 * Constraint: Rooms can ONLY be closed after the task due date has passed (now >= item.dueAt).
 */
export async function closeRoomAction(roomId: string, conceptId: string, guildId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const concept = await getConceptById(conceptId);
  if (!concept) throw new Error("Concept not found");

  const item = await getItemById(concept.itemId);
  if (item?.dueAt && Date.now() < item.dueAt.getTime()) {
    throw new Error(
      `Cannot close rooms before the assignment due date (${new Date(item.dueAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}).`
    );
  }

  // Placeholder: awaiting Erik's bot schema update for TopicRoom
  revalidatePath(`/g/${guildId}`);
  revalidatePath(`/g/${guildId}/concepts/${conceptId}`);

  return { success: true, message: "Placeholder: Room marked as closed (waiting for bot sync)" };
}

/**
 * Server action to reopen a closed private concept room.
 */
export async function reopenRoomAction(roomId: string, conceptId: string, guildId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Placeholder: awaiting Erik's bot schema update for TopicRoom
  revalidatePath(`/g/${guildId}`);
  revalidatePath(`/g/${guildId}/concepts/${conceptId}`);

  return { success: true, message: "Placeholder: Room reopened (waiting for bot sync)" };
}

/**
 * Server action for bulk cleanup: close all concept rooms under an assignment.
 * Constraint: Disabled until task due date has passed.
 */
export async function closeTaskRoomsAction({
  itemId,
  guildId,
  closedById,
  deleteDiscord,
}: {
  itemId: string;
  guildId?: string;
  closedById?: string;
  deleteDiscord?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const item = await getItemById(itemId);
  if (!item) throw new Error("Task not found");

  if (item.dueAt && Date.now() < item.dueAt.getTime()) {
    throw new Error(
      `Cannot close rooms before the assignment due date (${new Date(item.dueAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}).`
    );
  }

  if (guildId) {
    revalidatePath(`/g/${guildId}`);
    revalidatePath(`/g/${guildId}/items/${itemId}`);
  }

  return { success: true, message: "Placeholder: All task rooms closed (waiting for bot sync)" };
}
