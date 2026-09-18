"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/cn";

export function ThemeToggle({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "on-dark" | "on-light";
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      title={isDark ? "Thème clair" : "Thème sombre"}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
        tone === "on-dark" &&
          "border-white/25 bg-white/10 text-white hover:bg-white/15",
        tone === "on-light" &&
          "border-cream bg-surface text-ink hover:border-brand hover:text-brand",
        tone === "default" &&
          "border-cream bg-surface text-ink hover:border-brand hover:text-brand",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      <span className="hidden sm:inline">{isDark ? "Clair" : "Sombre"}</span>
    </button>
  );
}
