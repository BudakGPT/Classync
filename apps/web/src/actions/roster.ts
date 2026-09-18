"use server";

import { parseRosterFile, saveRosterEntries, setGuildAuthEnabled, type ParsedRoster } from "@classync/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { taGuildOrNull } from "@/lib/session";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const uploadSchema = z.object({
  guildId: z.string().min(1),
  defaultRole: z.enum(["STUDENT", "TA"]),
});
const toggleSchema = z.object({ guildId: z.string().min(1), enabled: z.boolean() });

export interface UploadResult {
  added: number;
  updated: number;
  detectedClasses: string[];
  parsedBy: ParsedRoster["parsedBy"];
}

/** Roster upload (.xlsx/.xls/.csv). Parsed in core, upserted by (guild, NPM). TA-gated. */
export async function uploadRoster(formData: FormData): Promise<UploadResult> {
  const { guildId, defaultRole } = uploadSchema.parse({
    guildId: formData.get("guildId"),
    defaultRole: formData.get("defaultRole"),
  });
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a spreadsheet first.");
  if (file.size > MAX_FILE_BYTES) throw new Error("File is larger than 2 MB.");

  const gate = await taGuildOrNull(guildId);
  if (!gate) throw new Error("TA access required");

  const parsed = await parseRosterFile(Buffer.from(await file.arrayBuffer()), { defaultRole });
  if (parsed.entries.length === 0) throw new Error("No rows with both an NPM and a name were found.");
  const saved = await saveRosterEntries(gate.guild.id, parsed.entries);

  revalidatePath(`/g/${gate.guild.id}/roster`);
  return { added: saved.added, updated: saved.updated, detectedClasses: parsed.detectedClasses, parsedBy: parsed.parsedBy };
}

/** Flips Guild.authEnabled. Discord roles/channels only change on the next `/setup` run by the bot. */
export async function setAuthEnabled(input: { guildId: string; enabled: boolean }): Promise<{ enabled: boolean }> {
  const { guildId, enabled } = toggleSchema.parse(input);
  const gate = await taGuildOrNull(guildId);
  if (!gate) throw new Error("TA access required");

  const guild = await setGuildAuthEnabled(gate.guild.id, enabled);
  revalidatePath(`/g/${gate.guild.id}/roster`);
  return { enabled: guild.authEnabled };
}
