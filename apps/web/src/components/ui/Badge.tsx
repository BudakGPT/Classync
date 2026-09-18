import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { tone as toneOf } from "@/lib/tones";
import type { Tone } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Badge({ tone = "slate", icon: Icon, children, className, size = "sm", dot }: {
  tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string; size?: "xs" | "sm" | "md"; dot?: boolean;
}) {
  const t = toneOf(tone);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset",
        size === "xs" ? "px-1.5 py-px text-[10.5px]" : size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11.5px]",
        t.soft, t.text, t.ring, className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", t.dot)} />}
      {Icon && <Icon className={size === "xs" ? "size-3" : "size-3.5"} strokeWidth={2.25} />}
      {children}
    </span>
  );
}

/** Rounded square icon tile in a tone color. */
export function IconTile({ icon: Icon, tone = "brand", size = "md", className }: {
  icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg"; className?: string;
}) {
  const t = toneOf(tone);
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        t.soft, t.text,
        size === "sm" ? "size-7 rounded-lg" : size === "lg" ? "size-11 rounded-2xl" : "size-9 rounded-xl",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-[18px]"} />
    </span>
  );
}
