import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANT = {
  primary: "bg-brand-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(23_23_59/0.18)] hover:bg-brand-700",
  secondary: "border border-line bg-surface text-ink shadow-card hover:border-line-strong hover:bg-subtle",
  ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
  discord: "bg-discord text-white hover:bg-[#4752c4]",
};
const SIZE = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-9 gap-2 rounded-xl px-3.5 text-sm",
  lg: "h-11 gap-2 rounded-xl px-5 text-[15px]",
};
const ICON = { sm: "size-3.5", md: "size-4", lg: "size-[18px]" };
const BASE = "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55";

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof SIZE;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
}

/** Plain button. Usable from server components as a form submit (`type="submit"`). */
export function Button({ variant = "secondary", size = "md", icon: Icon, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANT[variant], SIZE[size], className)}
    >
      {loading ? <Loader2 className={cn(ICON[size], "animate-spin")} /> : Icon && <Icon className={ICON[size]} />}
      {children}
    </button>
  );
}

/** Next.js link styled as a button; `external` opens in a new tab (Discord jump links). */
export function ButtonLink({ href, variant = "secondary", size = "md", icon: Icon, external, className, children }: {
  href: string; variant?: ButtonVariant; size?: ButtonSize; icon?: LucideIcon; external?: boolean; className?: string; children: ReactNode;
}) {
  const classes = cn(BASE, VARIANT[variant], SIZE[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {Icon && <Icon className={ICON[size]} />}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {Icon && <Icon className={ICON[size]} />}
      {children}
    </Link>
  );
}
