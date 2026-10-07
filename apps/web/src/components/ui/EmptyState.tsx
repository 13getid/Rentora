import type { ReactNode } from "react";

interface EmptyStateProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

// An empty screen is an invitation to act, so it gets Level 2 emphasis.
export function EmptyState({ eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col gap-6 border-2 border-ink bg-paper p-6 shadow-hard md:flex-row md:items-center md:p-8">
      {/* A house built from three shapes: roof, wall, sun. Decorative only. */}
      <svg viewBox="0 0 120 120" className="size-28 shrink-0" aria-hidden="true">
        <rect x="8" y="50" width="64" height="62" fill="#f5a524" stroke="#161616" strokeWidth="3" />
        <path d="M4 50 L40 10 L76 50 Z" fill="#161616" />
        <circle cx="90" cy="34" r="20" fill="#e8e5dd" stroke="#161616" strokeWidth="3" />
      </svg>
      <div>
        <p className="font-figure text-xs font-semibold uppercase tracking-[0.06em] text-muted">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-md text-muted">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </section>
  );
}
