import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Оболочка страниц входа/регистрации/инвайта: фоновые блобы в тонах primary
 * (паттерн Pariall AuthLayout, одноколоночный) + тумблер темы в углу.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-info/15 blur-3xl"
        aria-hidden
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
