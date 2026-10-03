"use client";

import { useEffect, useRef } from "react";

type Options = {
  enabled?: boolean;
  /** Max gap between keystrokes to treat as wedge input (ms). */
  interKeyMs?: number;
  minLength?: number;
  onScan: (code: string) => void;
};

/**
 * Captures HID keyboard-wedge scanners (HENEX cradle, etc.) when focus is
 * NOT inside a text field. Dedicated scan inputs handle Enter themselves to
 * avoid double-submit.
 */
export function useHidScanner({
  enabled = true,
  interKeyMs = 80,
  minLength = 3,
  onScan,
}: Options) {
  const buffer = useRef("");
  const lastKeyAt = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    function reset() {
      buffer.current = "";
      lastKeyAt.current = 0;
    }

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isField =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        Boolean(target?.isContentEditable);

      if (isField) return;

      const now = Date.now();
      if (lastKeyAt.current && now - lastKeyAt.current > interKeyMs) {
        buffer.current = "";
      }
      lastKeyAt.current = now;

      if (e.key === "Enter") {
        const code = buffer.current.trim();
        reset();
        if (code.length >= minLength) {
          e.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer.current += e.key;
        if (buffer.current.length > 64) {
          buffer.current = buffer.current.slice(-64);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, interKeyMs, minLength]);
}
