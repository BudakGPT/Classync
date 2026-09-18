"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { setAuthEnabled } from "@/actions/roster";
import { Badge, Button } from "@/components/ui";

/** Guild.authEnabled switch. The bot reads it on the next `/setup`; nothing in Discord changes here. */
export function AuthToggle({ guildId, enabled }: { guildId: string; enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const flip = () =>
    startTransition(async () => {
      try {
        setError(null);
        await setAuthEnabled({ guildId, enabled: !enabled });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update the setting.");
      }
    });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge tone={enabled ? "emerald" : "slate"} size="md" dot>
        {enabled ? "Verification gate on" : "Verification gate off"}
      </Badge>
      <Button variant={enabled ? "secondary" : "primary"} size="sm" icon={enabled ? ShieldOff : ShieldCheck} loading={pending} onClick={flip}>
        {enabled ? "Turn off" : "Turn on"}
      </Button>
      {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
    </div>
  );
}
