import { ExternalLink, MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui";
import { channelUrl } from "@/lib/discord";
import { KIND_TONE } from "@/lib/tones";
import type { RoomSummary } from "@/lib/types";
import { plural } from "@/lib/utils";

/** "ASSIGNMENT" → "Assignment" with its tone. */
export function KindBadge({ kind, size = "sm" }: { kind: string; size?: "xs" | "sm" | "md" }) {
  return (
    <Badge tone={KIND_TONE[kind] ?? "slate"} size={size}>
      {kind.charAt(0) + kind.slice(1).toLowerCase()}
    </Badge>
  );
}

/** W2 colour band: ≥5 open red, 3–4 yellow, else green. */
export function DifficultyBadge({ band, open, answered }: { band: "red" | "yellow" | "green"; open: number; answered: number }) {
  const tone = band === "red" ? "rose" : band === "yellow" ? "amber" : "emerald";
  return (
    <Badge tone={tone} dot>
      {open} open · {answered} answered
    </Badge>
  );
}

/**
 * Read-only room state. Moderation happens in Discord (`/ta close-room`); the web only links.
 * Member count is TA-only information and never leaves the dashboard.
 */
export function RoomBadge({ room, discordGuildId }: { room: RoomSummary | null; discordGuildId: string }) {
  if (!room) return <Badge tone="slate" icon={MessagesSquare}>No room</Badge>;
  const label = `Room ${room.state === "OPEN" ? "open" : "closed"} · ${plural(room.memberCount, "member")}`;
  if (!room.channelId) return <Badge tone="slate" icon={MessagesSquare}>{label}</Badge>;
  return (
    <a
      href={channelUrl(discordGuildId, room.channelId)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full transition hover:opacity-80"
      title="Open the room in Discord"
    >
      <Badge tone={room.state === "OPEN" ? "emerald" : "slate"} icon={MessagesSquare}>
        {label}
        <ExternalLink className="size-3 opacity-70" />
      </Badge>
    </a>
  );
}
