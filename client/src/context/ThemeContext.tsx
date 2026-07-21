import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/** Только явный выбор: светлая / тёмная (без «как в системе»). */
export type Theme = "light" | "dark";

const STORAGE_KEY = "fitpro-theme";
const THEME_COLORS = { light: "#f4f1eb", dark: "#0b0f0e" } as const;

interface ThemeState {
  theme: Theme;
  /** Совпадает с theme — оставлено для графиков/совместимости. */
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
    // Миграция со старого «system»: один раз фиксируем фактическую тему.
    if (v === "system") {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const fixed: Theme = dark ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, fixed);
      return fixed;
    }
  } catch {
    /* приватный режим */
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute("content", THEME_COLORS[theme]));
  }, [theme]);

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ок */
    }
    setThemeState(next);
  };

  const value = useMemo(
    () => ({ theme, resolvedTheme: theme, setTheme }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme должен использоваться внутри ThemeProvider");
  return ctx;
}
