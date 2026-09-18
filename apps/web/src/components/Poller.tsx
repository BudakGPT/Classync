"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Polls every 5s by calling router.refresh() — refreshes server component data. */
export function Poller({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
