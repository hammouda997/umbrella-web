"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const alreadyInside = panel.contains(document.activeElement);
    if (alreadyInside) return;
    const t = window.setTimeout(() => {
      if (panel.contains(document.activeElement)) return;
      panel
        .querySelector<HTMLElement>(
          "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])",
        )
        ?.focus();
    }, 40);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const width =
    size === "md"
      ? "sm:max-w-lg"
      : size === "xl"
        ? "sm:max-w-4xl"
        : "sm:max-w-2xl";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={() => onCloseRef.current()}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[81] flex w-full max-h-[94dvh] flex-col overflow-hidden rounded-t-2xl border border-cream bg-surface shadow-soft sm:max-h-[90vh] sm:rounded-2xl",
          width,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-cream px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-lg font-extrabold text-ink sm:text-xl"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            data-modal-close
            onClick={() => onCloseRef.current()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream text-ink transition hover:border-brand hover:text-brand"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
            {children}
          </div>
        ) : null}

        {footer ? (
          <footer className="shrink-0 border-t border-cream bg-surface px-4 py-3 sm:px-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
