import { AlertTriangle, CheckCircle2, Circle, Clock, Info } from "lucide-react";
import type { ReactNode } from "react";
import type { InvoiceStatus } from "@rentora/shared";
import { cn } from "../../lib/cn";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

// Every status carries an icon AND text, so colour is never the only signal.
const tones: Record<Tone, { cls: string; Icon: typeof Circle }> = {
  success: { cls: "bg-success-soft text-success", Icon: CheckCircle2 },
  warning: { cls: "bg-warning-soft text-warning", Icon: Clock },
  danger: { cls: "bg-danger-soft text-danger", Icon: AlertTriangle },
  info: { cls: "bg-info-soft text-info", Icon: Info },
  neutral: { cls: "bg-sand text-muted", Icon: Circle },
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const { cls, Icon } = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-figure text-[11px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

// Domain mapping lives next to the generic badge so every page agrees on meaning.
const invoiceTone: Record<InvoiceStatus, Tone> = {
  PAID: "success",
  PENDING: "info",
  PARTIAL: "warning",
  OVERDUE: "danger",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusBadge tone={invoiceTone[status]}>{status}</StatusBadge>;
}
