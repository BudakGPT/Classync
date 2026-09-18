/** Accent palette keys. Map to classes with `tone(t)` from src/lib/tones.ts. */
export type Tone = "brand" | "sky" | "teal" | "emerald" | "amber" | "orange" | "rose" | "violet" | "slate";

/** Room summary as returned by @classync/core dashboard read models. */
export interface RoomSummary {
  state: "OPEN" | "CLOSED";
  channelId: string | null;
  memberCount: number;
}
