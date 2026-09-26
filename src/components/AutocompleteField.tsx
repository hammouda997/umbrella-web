"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { fuzzyFilterOptions } from "@/lib/location-search";
import { bilingualLabel } from "@/lib/place-labels-ar";

type AutocompleteFieldProps = {
  label: string;
  name: string;
  value: string;
  options: string[];
  extraOptions?: string[];
  onChange: (value: string) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  emptyHint?: string;
  bilingual?: boolean;
  governorateKey?: string;
};

type MenuCoords = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

export function AutocompleteField({
  label,
  name,
  value,
  options,
  extraOptions = [],
  onChange,
  onQueryChange,
  placeholder = "Rechercher…",
  disabled = false,
  required = false,
  allowCustom = true,
  emptyHint,
  bilingual = true,
  governorateKey,
}: AutocompleteFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const merged = [...options];
    for (const extra of extraOptions) {
      if (!merged.some((o) => o.toLowerCase() === extra.toLowerCase())) {
        merged.push(extra);
      }
    }
    return fuzzyFilterOptions(merged, query, 80);
  }, [options, extraOptions, query]);

  function updatePosition() {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 12;
    const spaceAbove = r.top - 12;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(280, Math.max(140, openUp ? spaceAbove : spaceBelow));
    setCoords(
      openUp
        ? {
            left: r.left,
            width: r.width,
            maxHeight,
            bottom: window.innerHeight - r.top + 4,
          }
        : {
            left: r.left,
            width: r.width,
            maxHeight,
            top: r.bottom + 4,
          },
    );
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onWin = () => updatePosition();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, filtered.length]);

  function commit(next: string) {
    onChange(next);
    setQuery(next);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const pick = filtered[activeIndex];
      if (pick) commit(pick);
      else if (allowCustom) commit(query.trim());
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const menu =
    open && !disabled && coords && typeof document !== "undefined"
      ? createPortal(
          filtered.length > 0 ? (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              className="overflow-auto rounded-lg border border-cream-soft bg-surface py-1 shadow-soft"
              style={{
                position: "fixed",
                zIndex: 200,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
                top: coords.top,
                bottom: coords.bottom,
              }}
            >
              {filtered.map((opt, index) => (
                <li key={opt} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm transition ${
                      index === activeIndex
                        ? "bg-brand/10 text-brand"
                        : "text-ink hover:bg-cream-soft/60"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(opt)}
                  >
                    {bilingual
                      ? bilingualLabel(opt, governorateKey)
                      : opt.replace(/_/g, " ")}
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <p
              className="rounded-lg border border-cream-soft bg-surface px-3 py-2 text-xs text-ink-muted shadow-soft"
              style={{
                position: "fixed",
                zIndex: 200,
                left: coords.left,
                width: coords.width,
                top: coords.top,
                bottom: coords.bottom,
              }}
            >
              {emptyHint ??
                (allowCustom
                  ? "Aucun résultat — vous pouvez saisir librement."
                  : "Aucun résultat. Affinez la recherche.")}
            </p>
          ) : null,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      <input
        ref={inputRef}
        name={name}
        value={query}
        disabled={disabled}
        required={required}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        className="w-full rounded-lg border border-cream-soft bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:bg-cream-soft/40"
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          setActiveIndex(0);
          onQueryChange?.(next);
        }}
        onBlur={() => {
          if (allowCustom && query.trim() !== value) onChange(query.trim());
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {menu}
    </div>
  );
}
