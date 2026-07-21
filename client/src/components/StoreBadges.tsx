import { cn } from "@/lib/utils";

type Kind = "rustore" | "appstore" | "googleplay";

const META: Record<
  Kind,
  { title: string; sub: string; accent: string }
> = {
  rustore: {
    title: "RuStore",
    sub: "Скачать",
    accent: "from-[#0077FF] to-[#0055CC]",
  },
  appstore: {
    title: "App Store",
    sub: "Загрузить в",
    accent: "from-[#1c1c1e] to-[#3a3a3c]",
  },
  googleplay: {
    title: "Google Play",
    sub: "Доступно в",
    accent: "from-[#01875f] to-[#34a853]",
  },
};

/** Бейджи магазинов: RuStore (активен) · App Store / Google Play — «скоро». */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3 sm:gap-4", className)}>
      <StoreBadge kind="rustore" href="https://www.rustore.ru/" />
      <StoreBadge kind="appstore" soon />
      <StoreBadge kind="googleplay" soon />
    </div>
  );
}

export function StoreBadge({
  kind,
  soon,
  href,
}: {
  kind: Kind;
  soon?: boolean;
  href?: string;
}) {
  const meta = META[kind];
  const inner = (
    <span
      className={cn(
        "relative flex h-[52px] min-w-[158px] items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br px-3.5 text-left text-white shadow-surface transition-transform",
        meta.accent,
        soon ? "cursor-default opacity-90" : "hover:-translate-y-0.5 hover:shadow-panel",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
        {kind === "rustore" && <RuStoreIcon />}
        {kind === "appstore" && <AppleIcon />}
        {kind === "googleplay" && <PlayIcon />}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-white/75">
          {soon ? "Скоро" : meta.sub}
        </span>
        <span className="block truncate text-sm font-semibold tracking-tight">{meta.title}</span>
      </span>
      {soon && (
        <span className="absolute right-2 top-2 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
          soon
        </span>
      )}
    </span>
  );

  if (soon || !href) {
    return (
      <span className="inline-flex" aria-label={`${meta.title} — скоро`}>
        {inner}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex"
      aria-label={`${meta.title} — открыть`}
    >
      {inner}
    </a>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M3.6 2.2 13.3 12 3.6 21.8c-.4-.3-.6-.8-.6-1.3V3.5c0-.5.2-1 .6-1.3z" />
      <path fill="#FBBC04" d="m13.3 12 2.7-2.7 4.6 2.6c.6.4.6 1.3 0 1.7l-4.6 2.6L13.3 12z" />
      <path fill="#4285F4" d="M13.3 12 3.6 2.2c.4-.3.9-.4 1.4-.2l11 6.3L13.3 12z" />
      <path fill="#34A853" d="M13.3 12 16 14.7l-11 6.3c-.5.3-1.1.2-1.4-.2L13.3 12z" />
    </svg>
  );
}

function RuStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2zm0 2.2 6.5 3.25v8.1L12 18.8l-6.5-3.25v-8.1L12 4.2z" />
      <path d="M12 7.5 8 9.5v5l4 2 4-2v-5l-4-2zm0 2.1 1.8.9v2.8L12 14.3l-1.8-.9v-2.8l1.8-.9z" />
    </svg>
  );
}
