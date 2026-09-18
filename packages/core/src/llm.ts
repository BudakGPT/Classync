// The only place that talks to an LLM (CLAUDE.md rule 7). OpenRouter chat completions, JSON-only.
// Callers pass a zod schema; invalid output is retried once, then null. No API key → null, never throws.
import type { z } from "zod";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free";
const TIMEOUT_MS = 20_000;

/** True when an OpenRouter key is configured. Features must degrade gracefully when false. */
export function llmAvailable(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function extractJson(content: string): unknown {
  const match = content.match(/[[{][\s\S]*[\]}]/);
  return match ? JSON.parse(match[0]) : null;
}

async function requestJson(apiKey: string, system: string, user: string): Promise<unknown> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Classync",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const content = (data as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content;
    return typeof content === "string" ? extractJson(content) : null;
  } catch {
    return null;
  }
}

/**
 * Ask the model for a JSON value matching `schema`. Returns null without a key, on network/HTTP
 * failure, or when two attempts both fail validation. Never pass student identities in `user`.
 */
export async function completeJson<T>(schema: z.ZodType<T>, system: string, user: string): Promise<T | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await requestJson(apiKey, system, user);
    if (raw === null) continue;
    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  return null;
}
