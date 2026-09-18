"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CircleCheck, Loader2, Send } from "lucide-react";
import { submitAnswer } from "@/actions/answers";
import { Button } from "@/components/ui";
import { cn, plural } from "@/lib/utils";

type Phase = { kind: "idle" } | { kind: "delivering"; answerId: string } | { kind: "delivered"; count: number } | { kind: "error"; message: string };

const POLL_MS = 3_000;
const MAX_BODY = 4_000;

/** W3: submit → outbox → "Delivering…" → "Delivered to N" once the bot stamps the answer. */
export function AnswerForm({ conceptId, recipientCount }: { conceptId: string; recipientCount: number }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (phase.kind !== "delivering") return;
    const { answerId } = phase;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/answer-status?id=${encodeURIComponent(answerId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { deliveredAt: string | null; deliveredCount: number };
        if (data.deliveredAt) {
          setPhase({ kind: "delivered", count: data.deliveredCount });
          router.refresh();
        }
      } catch {
        // transient network error: keep polling
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase, router]);

  const send = () => {
    const text = body.trim();
    if (!text) return setPhase({ kind: "error", message: "Write an answer first." });
    startTransition(async () => {
      try {
        const { answerId } = await submitAnswer({ conceptId, body: text });
        setBody("");
        setPhase({ kind: "delivering", answerId });
      } catch (err) {
        setPhase({ kind: "error", message: err instanceof Error ? err.message : "Could not save the answer." });
      }
    });
  };

  return (
    <div className="space-y-3 px-5 pb-5 pt-4">
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); if (phase.kind === "error") setPhase({ kind: "idle" }); }}
        rows={6}
        maxLength={MAX_BODY}
        disabled={pending}
        placeholder="Explain the intuition first, then the steps. Markdown is fine; Discord renders it."
        className="w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-sm leading-relaxed text-ink shadow-card outline-none transition placeholder:text-ink-3/70 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-xs", phase.kind === "error" ? "font-semibold text-rose-600" : "text-ink-3")}>
          {phase.kind === "error"
            ? phase.message
            : `${body.trim().length}/${MAX_BODY} · DM to ${plural(recipientCount, "open requester")}, pinned in Discord, kept for the next student.`}
        </p>
        <div className="flex items-center gap-3">
          <DeliveryStatus phase={phase} />
          <Button variant="primary" icon={Send} loading={pending} onClick={send} disabled={phase.kind === "delivering"}>
            Send answer
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeliveryStatus({ phase }: { phase: Phase }) {
  if (phase.kind === "delivering") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700" aria-live="polite">
        <Loader2 className="size-3.5 animate-spin" />Delivering…
      </span>
    );
  }
  if (phase.kind === "delivered") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700" aria-live="polite">
        <CircleCheck className="size-3.5" />Delivered to {phase.count}
      </span>
    );
  }
  return null;
}
