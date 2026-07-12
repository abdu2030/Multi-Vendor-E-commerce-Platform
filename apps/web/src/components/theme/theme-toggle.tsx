"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-extrabold text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
      onClick={toggleTheme}
      type="button"
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <span className={`absolute h-3.5 w-3.5 rounded-full transition ${isDark ? "scale-100 bg-amber-300" : "scale-75 bg-stone-900"}`} />
        <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition dark:bg-stone-900 ${isDark ? "translate-x-1 -translate-y-1 scale-90" : "translate-x-3 scale-0"}`} />
      </span>
      {compact ? null : <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
