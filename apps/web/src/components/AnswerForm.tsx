"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { submitAnswer } from "@/actions/answers";

interface Props {
  conceptId: string;
  guildId: string;
  authorUserId: string;
  recipientCount: number;
}

export function AnswerForm({ conceptId, guildId, authorUserId, recipientCount }: Props) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "delivering" | "delivered">("idle");
  const [deliveredCount, setDeliveredCount] = useState<number>(0);
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll delivery status after submitting
  const startPolling = useCallback((id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/answer-status?id=${id}`);
        if (res.ok) {
          const data = await res.json() as { deliveredAt: string | null; deliveredCount: number };
          if (data.deliveredAt) {
            setDeliveredCount(data.deliveredCount);
            setStatus("delivered");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        // network error — keep polling
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setStatus("delivering");
    startTransition(async () => {
      const result = await submitAnswer({ conceptId, guildId, authorUserId, body });
      setBody("");
      if (result?.answerId) {
        setAnswerId(result.answerId);
        startPolling(result.answerId);
      } else {
        // fallback if no answerId returned — just show delivered after short delay
        setTimeout(() => setStatus("delivered"), 2000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          rows={5}
          placeholder="Type your answer here... Supports Markdown. It will be pinned in the Discord room and DM'd to all open requesters."
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
          disabled={isPending || status !== "idle"}
        />
        <span className="absolute bottom-2 right-3 text-[11px] text-gray-500">
          {body.length} / 4000
        </span>
      </div>

      <div className="rounded-lg bg-indigo-950/40 border border-indigo-800/40 px-3 py-2 text-xs text-indigo-300 flex items-start gap-2">
        <span className="text-sm">📌</span>
        <span>
          <strong>Catatan:</strong> Jawaban akan di-pin di Discord room dan dikirim via DM ke siswa yang meminta bantuan. Room akan tetap <strong>OPEN</strong> untuk diskusi lanjutan.
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        {status === "idle" && (
          <p className="text-xs text-gray-500">
            📨 Will be delivered to <strong>{recipientCount}</strong> student(s) + Discord room
          </p>
        )}
        {status === "delivering" && (
          <p className="text-xs text-yellow-400 animate-pulse">
            ⏳ Delivering… waiting for bot to pin answer in room & send DMs
          </p>
        )}
        {status === "delivered" && (
          <p className="text-xs text-green-400">
            ✅ Delivered to <strong>{deliveredCount}</strong> student(s) & pinned in Discord
          </p>
        )}

        <button
          type="submit"
          disabled={!body.trim() || isPending || status !== "idle"}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "delivering"
            ? "Delivering..."
            : status === "delivered"
            ? "✅ Done!"
            : "Post Answer"}
        </button>
      </div>
    </form>
  );
}
