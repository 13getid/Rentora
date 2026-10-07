import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { useId } from "react";
import { cn } from "../../lib/cn";

interface Delta {
  text: string;
  direction: "up" | "down" | "flat";
  good: boolean; // up is not always good: rising overdue rent is bad
}

interface MetricBlockProps {
  label: string;
  value: string;
  context: string; // what the number MEANS
  delta?: Delta;
  action?: { label: string; href: string }; // what the user can DO about it
  hero?: boolean; // use for ONE metric per screen
  className?: string;
}

const deltaIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };

export function MetricBlock({ label, value, context, delta, action, hero, className }: MetricBlockProps) {
  const id = useId();
  const DeltaIcon = delta ? deltaIcon[delta.direction] : null;

  return (
    <article
      aria-labelledby={id}
      className={cn(
        hero ? "border-2 border-ink bg-paper p-6 shadow-hard md:p-8" : "border-t border-line pt-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 id={id} className="font-figure text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          {label}
        </h3>
        {delta && DeltaIcon && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-figure text-sm font-semibold",
              delta.direction === "flat" ? "text-muted" : delta.good ? "text-success" : "text-danger",
            )}
          >
            <DeltaIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">{delta.direction === "down" ? "Down" : "Up"} </span>
            {delta.text}
          </span>
        )}
      </div>
      <p className={cn("mt-4 font-figure font-bold tabular-nums tracking-tight", hero ? "text-4xl md:text-6xl" : "text-3xl")}>
        {value}
      </p>
      <p className="mt-2 text-sm text-muted">{context}</p>
      {action && (
        <a
          href={action.href}
          className="mt-4 inline-flex items-center gap-1 text-sm font-bold underline-offset-4 hover:underline"
        >
          {action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      )}
    </article>
  );
}
