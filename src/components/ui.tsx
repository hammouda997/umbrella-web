"use client";

import {
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertTriangle, Loader2, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-cream bg-cream-soft/30 px-6 py-12 text-center">
      {Icon ? (
        <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      ) : null}
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({ rows = 4, label }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {label ? <p className="text-center text-sm text-ink-muted">{label}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream-soft/70" />
        ))}
      </div>
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-cream bg-surface p-5 shadow-soft", className)}>
      {children}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand"
    >
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        {message}
      </span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-semibold underline-offset-2 hover:underline">
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold" | "success";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-soft",
  secondary: "border border-cream bg-surface text-ink hover:border-brand hover:text-brand",
  ghost: "text-ink-muted hover:bg-cream-soft/60 hover:text-ink",
  danger: "border border-brand/30 bg-brand/5 text-brand hover:bg-brand hover:text-white",
  gold: "bg-gold text-white shadow-sm hover:brightness-110",
  success: "bg-emerald-700 text-white shadow-sm hover:bg-emerald-600",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50",
    BUTTON_VARIANT[variant],
    BUTTON_SIZE[size],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClass(variant, size), className)}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-xl border border-cream bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60";

function FieldShell({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("block text-sm", className)}>
      {label ? (
        <label htmlFor={id} className="mb-1.5 block font-medium text-ink">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-brand">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type FieldProps = { label?: string; hint?: string; error?: string | null; wrapperClassName?: string };

export function TextField({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(inputClass, error && "border-brand", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, "pr-8", className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, "min-h-[88px] resize-y", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  className,
  label = "Rechercher",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, "py-2 pl-9")}
      />
    </label>
  );
}

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "brand" | "gold";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "bg-cream-soft/80 text-ink-muted ring-cream dark:bg-white/10 dark:text-white/80 dark:ring-white/15",
  success:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  warning:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30",
  danger: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/15 dark:text-red-300 dark:ring-red-400/30",
  info: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/30",
  brand: "bg-brand/10 text-brand ring-brand/20",
  gold: "bg-gold/10 text-gold ring-gold/25",
};

export function Badge({
  tone = "neutral",
  children,
  dot = false,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        BADGE_TONE[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as StatusKey];
  if (!meta) return <Badge className={className}>{status.replace(/_/g, " ")}</Badge>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        className,
      )}
      style={{ backgroundColor: meta.color, color: meta.ink ?? "#FFFFFF" }}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "brand" | "gold" | "success";
}) {
  const iconTone = {
    neutral: "bg-cream-soft text-ink",
    brand: "bg-brand/10 text-brand",
    gold: "bg-gold/15 text-gold",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  }[tone];
  return (
    <div className="rounded-2xl border border-cream bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {label}
        </p>
        {Icon ? (
          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", iconTone)}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-cream bg-cream-soft/40 p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              active ? "bg-surface text-brand shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {opt.label}
            {opt.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px]",
                  active ? "bg-brand/10 text-brand" : "bg-cream-soft text-ink-muted",
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-gold text-xs font-bold text-white",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}

export function TableCard({
  children,
  toolbar,
  footer,
  className,
}: {
  children: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-cream bg-surface shadow-soft", className)}>
      {toolbar ? (
        <div className="flex flex-col gap-3 border-b border-cream bg-cream-soft/30 px-4 py-3 md:flex-row md:items-center md:justify-between">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="border-t border-cream px-4 py-3">{footer}</div> : null}
    </div>
  );
}

export const tableClass = "min-w-full text-left text-sm";
export const theadClass =
  "bg-cream-soft/50 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted";
export const thClass = "px-4 py-3 font-semibold";
export const tdClass = "px-4 py-3 align-middle";
export const trClass = "border-t border-cream/70 transition hover:bg-brand/[0.03]";
