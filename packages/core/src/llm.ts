import { z } from "zod";

const AnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.string().nullable().optional(), // ISO 8601 string or null
  kind: z.enum(["ASSIGNMENT", "QUIZ", "EXAM", "READING"]).default("ASSIGNMENT"),
});

export type ParsedAnnouncement = z.infer<typeof AnnouncementSchema>;

/**
 * Parse an announcement message into structured data.
 * Falls back gracefully: title = first line, no due date, kind = ASSIGNMENT.
 * PRIVACY RULE: Never pass student IDs or names to the LLM.
 */
export async function parseAnnouncement(
  messageText: string
): Promise<ParsedAnnouncement> {
  const fallback: ParsedAnnouncement = {
    title: messageText.split("\n")[0]?.slice(0, 200) ?? "Untitled",
    dueAt: null,
    kind: "ASSIGNMENT",
  };

  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Extract the task title, due date (ISO 8601, Asia/Jakarta timezone, or null), and kind (ASSIGNMENT|QUIZ|EXAM|READING) from this announcement. Reply with JSON only, no explanation.\n\nAnnouncement:\n${messageText}`,
        },
      ],
    });

    const raw = response.content[0];
    if (raw.type !== "text") return fallback;

    // Try to extract JSON from the response
    const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = AnnouncementSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (parsed.success) return parsed.data;

    // Retry once with stricter prompt
    const retry = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Reply with ONLY valid JSON matching this schema: {"title":"string","dueAt":"ISO8601 or null","kind":"ASSIGNMENT|QUIZ|EXAM|READING"}. Announcement: ${messageText}`,
        },
      ],
    });

    const retryRaw = retry.content[0];
    if (retryRaw.type !== "text") return fallback;

    const retryMatch = retryRaw.text.match(/\{[\s\S]*\}/);
    if (!retryMatch) return fallback;

    const retryParsed = AnnouncementSchema.safeParse(JSON.parse(retryMatch[0]));
    return retryParsed.success ? retryParsed.data : fallback;
  } catch {
    return fallback;
  }
}
