import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconTile } from "./Badge";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon, tone = "brand", action, className }: {
  title: ReactNode; subtitle?: ReactNode; icon?: LucideIcon; tone?: Tone; action?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="truncate text-xs text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  );
}

/** Standard page top: eyebrow, title, subtitle, actions on the right. */
export function PageHeader({ title, subtitle, actions, eyebrow, children, className }: {
  title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[14px] text-ink-3">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Compact KPI card. `value` may be a string for privacy-floor messages. */
export function StatCard({ label, value, icon, tone = "brand", footer, highlight, className }: {
  label: string; value: ReactNode; icon: LucideIcon; tone?: Tone; footer?: ReactNode; highlight?: boolean; className?: string;
}) {
  return (
    <Card className={cn("p-5", highlight && "border-rose-200 bg-rose-50/60", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-3">{label}</span>
        <IconTile icon={icon} tone={tone} size="sm" />
      </div>
      <div className="mt-2">
        {typeof value === "number" ? (
          <span className="text-[28px] font-extrabold leading-none tracking-tight text-ink tabular">{value}</span>
        ) : (
          <span className="block text-[13px] font-semibold leading-snug text-ink-2">{value}</span>
        )}
      </div>
      {footer && <div className="mt-3 text-xs text-ink-3">{footer}</div>}
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, tone = "slate", className, children }: {
  icon: LucideIcon; title: string; description?: ReactNode; tone?: Tone; className?: string; children?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <IconTile icon={Icon} tone={tone} size="lg" />
      <h3 className="mt-4 text-[15px] font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-3">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
