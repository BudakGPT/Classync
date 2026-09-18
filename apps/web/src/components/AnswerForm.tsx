"use client";

import { useState, useTransition } from "react";
import { submitAnswer } from "@/actions/answers";

interface Props {
  conceptId: string;
  guildId: string;
  authorUserId: string;
  recipientCount: number;
}

export function AnswerForm({ conceptId, guildId, authorUserId, recipientCount }: Props) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "delivering" | "done">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setStatus("delivering");
    startTransition(async () => {
      await submitAnswer({ conceptId, guildId, authorUserId, body });
      setBody("");
      setStatus("done");
      setTimeout(() => setStatus("idle"), 4000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder="Type your answer here... It will be DM'd to all open requesters and pinned in the channel."
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
        disabled={isPending}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          📨 Will be delivered to <strong>{recipientCount}</strong> student(s)
        </p>

        <button
          type="submit"
          disabled={!body.trim() || isPending}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "delivering" ? "Delivering..." : status === "done" ? "✅ Delivered!" : "Post Answer"}
        </button>
      </div>
    </form>
  );
}
