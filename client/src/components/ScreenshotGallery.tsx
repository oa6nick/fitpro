import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScreenShot = {
  src: string;
  title: string;
  text: string;
  role?: string;
};

/**
 * Горизонтальная phone-галерея + полноэкранный lightbox
 * (стрелки, Esc, клик по фону, свайп-friendly кнопки).
 */
export function ScreenshotGallery({
  screens,
  className,
}: {
  screens: ScreenShot[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const show = useCallback((i: number) => {
    setIndex(i);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + screens.length) % screens.length);
  }, [screens.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % screens.length);
  }, [screens.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, prev, next]);

  const current = screens[index];

  return (
    <>
      <div className={cn("scroll-rail -mx-4 overflow-x-auto px-4 pb-3", className)}>
        <div className="flex snap-x snap-mandatory gap-5 md:justify-center md:gap-6">
          {screens.map((s, i) => (
            <figure key={s.src} className="w-[200px] shrink-0 snap-center sm:w-[220px]">
              <button
                type="button"
                onClick={() => show(i)}
                className="group relative mx-auto block w-full overflow-hidden rounded-[1.85rem] border border-border bg-card p-1.5 text-left shadow-panel ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:ring-white/5"
                aria-label={`Открыть «${s.title}» крупно`}
              >
                <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5">
                  <div className="h-1.5 w-16 rounded-full bg-foreground/12" />
                </div>
                <div className="overflow-hidden rounded-[1.4rem] bg-muted/30">
                  <img
                    src={s.src}
                    alt={`${s.title} — мобильный экран FitPro`}
                    loading="lazy"
                    width={780}
                    height={1688}
                    className="block aspect-[9/19.5] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <Expand className="h-3.5 w-3.5" />
                </span>
              </button>
              <figcaption className="mt-3.5 text-center">
                {s.role && (
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {s.role}
                  </span>
                )}
                <p className={cn("text-sm font-semibold", s.role && "mt-1.5")}>{s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
                <button
                  type="button"
                  onClick={() => show(i)}
                  className="mt-1.5 text-[11px] font-medium text-primary hover:underline"
                >
                  Открыть
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {open && current && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${current.title} — просмотр`}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5 sm:top-5"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
            aria-label="Предыдущий"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
            aria-label="Следующий"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div
            className="flex max-h-[min(92dvh,920px)] w-full max-w-md flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-[min(100%,380px)] overflow-hidden rounded-[2rem] border border-white/15 bg-[#111] p-2 shadow-2xl ring-1 ring-white/10">
              <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-3">
                <div className="h-1.5 w-20 rounded-full bg-white/20" />
              </div>
              <img
                src={current.src}
                alt={current.title}
                className="mx-auto max-h-[min(78dvh,760px)] w-full rounded-[1.55rem] object-contain object-top"
              />
            </div>
            <div className="text-center text-white">
              {current.role && (
                <span className="inline-flex rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {current.role}
                </span>
              )}
              <p className="mt-2 text-lg font-semibold tracking-tight">{current.title}</p>
              <p className="mt-1 max-w-sm text-sm text-white/70">{current.text}</p>
              <p className="mt-3 text-xs tabular-nums text-white/45">
                {index + 1} / {screens.length} · ← → Esc
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
