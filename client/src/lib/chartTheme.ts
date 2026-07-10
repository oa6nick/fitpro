import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Цвета для recharts. SVG-атрибуты не понимают hsl(var(--x)) надёжно при смене
 * темы без ремаунта, поэтому читаем вычисленные токены и ре-рендерим график
 * через зависимость от resolvedTheme.
 */
export function useChartColors() {
  const { resolvedTheme } = useTheme();
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const hsl = (name: string) => `hsl(${style.getPropertyValue(name).trim()})`;
    return {
      theme: resolvedTheme,
      primary: hsl("--primary"),
      success: hsl("--success"),
      warning: hsl("--warning"),
      info: hsl("--info"),
      destructive: hsl("--destructive"),
      border: hsl("--border"),
      mutedFg: hsl("--muted-foreground"),
    };
  }, [resolvedTheme]);
}

export const CHART_AXIS = {
  tickLine: false,
  axisLine: false,
  fontSize: 12,
} as const;
