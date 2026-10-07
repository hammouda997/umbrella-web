"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type TypeaheadOption<T> = {
  id: string;
  label: string;
  hint?: string;
  value: T;
};

export function TypeaheadSelect<T>({
  label,
  placeholder = "Rechercher…",
  options,
  value,
  displayValue,
  onSelect,
  onClear,
  loading = false,
  emptyText = "Aucun résultat",
  disabled = false,
}: {
  label: string;
  placeholder?: string;
  options: TypeaheadOption<T>[];
  value: T | null;
  displayValue: string;
  onSelect: (option: TypeaheadOption<T>) => void;
  onClear?: () => void;
  loading?: boolean;
  emptyText?: string;
  disabled?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (!open) setQuery(displayValue);
  }, [displayValue, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options
      .filter((opt) =>
        `${opt.label} ${opt.hint ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function pick(opt: TypeaheadOption<T>) {
    onSelect(opt);
    setQuery(opt.label);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(displayValue);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
    if (e.key === "Enter" && open && filtered[highlight]) {
      e.preventDefault();
      pick(filtered[highlight]!);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium text-ops-ink">
        {label}
        <div className="relative mt-1.5">
          <input
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            disabled={disabled}
            value={open ? query : displayValue}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (!e.target.value && onClear) onClear();
            }}
            onFocus={() => {
              setQuery(displayValue);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-xl border border-ops-card bg-ops-surface px-3 py-2.5 pr-16 text-sm outline-none ring-ops-accent focus:ring-2 disabled:opacity-50"
          />
          <span className="absolute inset-y-0 right-2 flex items-center gap-0.5 text-ops-ink/40">
            {value && onClear ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Effacer"
                className="rounded-md p-1 hover:text-ops-ink"
                onClick={(e) => {
                  e.preventDefault();
                  onClear();
                  setQuery("");
                  setOpen(true);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <ChevronDown className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </label>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-ops-card bg-ops-surface py-1 shadow-lg"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-ops-ink/45">Chargement…</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ops-ink/45">{emptyText}</li>
          ) : (
            filtered.map((opt, i) => {
              const selected = Boolean(displayValue) && displayValue === opt.label;
              return (
                <li key={opt.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(opt)}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition",
                      i === highlight
                        ? "bg-ops-accent/10 text-ops-ink"
                        : "text-ops-ink/80 hover:bg-ops-page",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {opt.label}
                      </span>
                      {opt.hint ? (
                        <span className="mt-0.5 block truncate text-[11px] text-ops-ink/45">
                          {opt.hint}
                        </span>
                      ) : null}
                    </span>
                    {selected ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ops-accent" />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
