import * as React from "react";
import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Оболочка auth-страниц: чистый фон (--body-gradient с body) + бренд сверху.
 * Без mesh и блобов — вход должен выглядеть тем же продуктом, что и кабинет.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Одно очень слабое свечение в тонах primary — как на лендинге */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% -10%, hsl(var(--primary) / 0.10), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10">
        <ThemeToggle />
      </div>

      <Link
        to="/"
        className="mb-7 flex items-center gap-2.5 transition-opacity hover:opacity-90"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-lg font-semibold tracking-tight leading-none">FitPro</span>
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Platform
          </span>
        </div>
      </Link>

      <div className="page-enter w-full max-w-[22rem]">{children}</div>
    </div>
  );
}

/** Карточка auth-страниц: вид задан здесь, страницы её только наполняют. */
export const AuthCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn("glass-elevated w-full border-border/50 shadow-panel", className)}
      {...props}
    />
  ),
);
AuthCard.displayName = "AuthCard";
