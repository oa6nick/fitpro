import type { TooltipProps } from "recharts";

/** Стеклянный тултип для recharts (паттерн Pariall BetAnalytics). */
export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-elevated rounded-panel px-4 py-3 text-sm">
      {label !== undefined && (
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{String(label)}</p>
      )}
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 tabular-nums">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
            aria-hidden
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}
