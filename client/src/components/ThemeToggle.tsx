import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

const ORDER: Theme[] = ["light", "dark", "system"];
const LABELS: Record<Theme, string> = {
  light: "светлая",
  dark: "тёмная",
  system: "как в системе",
};

/**
 * Переключатель темы: цикл светлая → тёмная → системная.
 * Иконка показывает ФАКТИЧЕСКУЮ тему (солнце/луна); режим «как в системе»
 * помечен точкой — иначе иконка монитора читалась как непонятный значок.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Тема: ${LABELS[theme]}. Переключить на «${LABELS[next]}»`}
      title={`Тема: ${LABELS[theme]}`}
      className="relative"
    >
      <Icon className="h-5 w-5" />
      {theme === "system" && (
        <span
          className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary"
          aria-hidden
        />
      )}
    </Button>
  );
}
