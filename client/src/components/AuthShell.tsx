import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Оболочка auth-страниц: mesh-фон, ambient blobs, бренд сверху.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Mesh + blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" aria-hidden />
      <div
        className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-info/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      {/* Soft grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 dark:opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground) / 0.035) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.035) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
        aria-hidden
      />

      <div className="absolute right-4 top-4 z-10">
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
