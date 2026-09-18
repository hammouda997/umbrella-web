"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type AutocompleteFieldProps = {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
};

export function AutocompleteField({
  label,
  name,
  value,
  options,
  onChange,
  placeholder = "Rechercher…",
  disabled = false,
  required = false,
  allowCustom = true,
}: AutocompleteFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options
      .filter((opt) => opt.toLowerCase().includes(q))
      .slice(0, 40);
  }, [options, query]);

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

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      <input
        name={name}
        value={query}
        disabled={disabled}
        required={required}
        autoComplete="off"
        placeholder={disabled ? "Choisir gouvernorat d’abord" : placeholder}
        className="w-full rounded-lg border border-cream-soft bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:bg-cream-soft/40"
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          setActiveIndex(0);
          if (allowCustom) onChange(next);
        }}
        onBlur={() => {
          if (allowCustom) onChange(query.trim());
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {open && !disabled && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-cream-soft bg-surface py-1 shadow-soft"
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
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
