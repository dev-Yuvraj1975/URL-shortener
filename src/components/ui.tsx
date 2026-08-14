import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent = "text-indigo-300",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", accent)}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && <div className="rounded-lg bg-white/5 p-2 text-slate-300">{icon}</div>}
      </div>
    </Card>
  );
}

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "indigo" }) {
  const tones = {
    slate: "bg-white/5 text-slate-300 border-white/10",
    green: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    indigo: "bg-indigo-400/10 text-indigo-300 border-indigo-400/20",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  title,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  title?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary:
      "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 disabled:bg-slate-700 disabled:shadow-none",
    ghost: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20",
  } as const;
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
