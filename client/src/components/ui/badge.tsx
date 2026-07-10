import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive dark:text-destructive-soft",
        outline: "text-foreground",
        // Семантические статусы — работают в обеих темах через токены.
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        info: "border-transparent bg-info/15 text-info",
        neutral: "border-transparent bg-muted text-muted-foreground",
        // Tone-варианты воронки клиентов (единственное место с палитрами).
        sky: "border-transparent bg-sky-500/12 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
        indigo:
          "border-transparent bg-indigo-500/12 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
        violet:
          "border-transparent bg-violet-500/12 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
        slate:
          "border-transparent bg-slate-500/12 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
        orange:
          "border-transparent bg-orange-500/12 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
        zinc: "border-transparent bg-zinc-500/12 text-zinc-600 dark:bg-zinc-400/15 dark:text-zinc-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
