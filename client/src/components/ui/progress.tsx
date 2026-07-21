import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Значение 0–100. */
  value: number;
  "aria-label"?: string;
}

/** Лёгкий прогресс-бар без Radix: трек на muted, заливка primary. */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted/80", className)}
        {...props}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-spring"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
