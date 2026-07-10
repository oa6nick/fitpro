import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

const ORDER: Theme[] = ["light", "dark", "system"];
const LABELS: Record<Theme, string> = {
  light: "светлая",
  dark: "тёмная",
  system: "системная",
};

/** Переключатель темы: цикл светлая → тёмная → системная. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Переключить тему (сейчас: ${LABELS[theme]})`}
      title={`Тема: ${LABELS[theme]}`}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
