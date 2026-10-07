import { Trash2 } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import { INVOICE_STATUSES } from "@rentora/shared";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DataTable, type Column } from "../components/ui/DataTable";
import { EmptyState } from "../components/ui/EmptyState";
import { FilterBar } from "../components/ui/FilterBar";
import { MetricBlock } from "../components/ui/MetricBlock";
import { MetricBlockSkeleton, TableSkeleton } from "../components/ui/Skeleton";
import { InvoiceStatusBadge, StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/Toast";
import { formatKES, formatNumber } from "../lib/format";
import { dashboard } from "../mocks/dashboard";
import { tenants, type Tenant } from "../mocks/tenants";

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mt-20">
      <div className="mb-6 border-b border-line pb-3">
        <h2 id={id} className="text-2xl font-extrabold tracking-tight">{title}</h2>
        {note && <p className="mt-1 max-w-2xl text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

const swatches = [
  { name: "ink", cls: "bg-ink text-paper", use: "Text, borders, hard shadows" },
  { name: "canvas", cls: "bg-canvas border border-line", use: "Page background" },
  { name: "sand", cls: "bg-sand", use: "Signature panels" },
  { name: "paper", cls: "bg-paper border border-line", use: "Data surfaces" },
  { name: "amber", cls: "bg-amber", use: "Accent, with ink text" },
  { name: "success", cls: "bg-success-soft text-success", use: "Paid, reconciled" },
  { name: "warning", cls: "bg-warning-soft text-warning", use: "Partial, expiring" },
  { name: "danger", cls: "bg-danger-soft text-danger", use: "Overdue, failed" },
  { name: "info", cls: "bg-info-soft text-info", use: "Pending, neutral news" },
];

export default function Styleguide() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [removing, setRemoving] = useState<Tenant | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      tenants.filter(
        (t) => (status === "ALL" || t.status === status) && `${t.name} ${t.unit}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, status],
  );

  const collectedPct = Math.round((dashboard.collected / dashboard.expected) * 100);
  const occupancyPct = Math.round((dashboard.occupied / dashboard.units) * 100);

  const columns: Column<Tenant>[] = [
    { key: "name", header: "Tenant", primary: true, cell: (t) => t.name, sortValue: (t) => t.name },
    { key: "unit", header: "Unit", cell: (t) => t.unit, sortValue: (t) => t.unit },
    { key: "rent", header: "Rent", align: "right", cell: (t) => formatNumber(t.rent), sortValue: (t) => t.rent },
    { key: "balance", header: "Balance", align: "right", cell: (t) => formatNumber(t.balance), sortValue: (t) => t.balance },
    { key: "status", header: "Status", cell: (t) => <InvoiceStatusBadge status={t.status} /> },
  ];

  const previewLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  };

  const confirmRemove = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast({ title: "Tenant archived", description: `${removing?.name} no longer appears in active lists.`, tone: "success" });
      setRemoving(null);
    }, 900);
  };

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8">
      {/* Level 3: the one cut-corner panel on this page */}
      <header className="notch bg-sand px-6 py-10 md:px-12 md:py-16">
        <p className="font-figure text-sm font-semibold text-muted">Rentora design system</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">
          Loud where it matters. <span className="text-muted">Quiet everywhere else.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg">
          Hard borders and shadows are rationed to the few things a person must notice. Tables, lists and forms stay calm so they can be read all day.
        </p>
      </header>

      <Section title="Metric blocks" note="One hero per screen. Every figure says what it means and what to do next.">
        {loading ? (
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <MetricBlockSkeleton hero />
            <div className="grid gap-8">
              <MetricBlockSkeleton />
              <MetricBlockSkeleton />
            </div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <MetricBlock
              hero
              label="Collected this month"
              value={formatKES(dashboard.collected)}
              context={`${collectedPct}% of ${formatKES(dashboard.expected)} expected rent`}
              delta={{ text: `${dashboard.collectedDeltaPct}%`, direction: "up", good: true }}
              action={{ label: "See who has paid", href: "#table" }}
            />
            <div className="grid content-start gap-8">
              <MetricBlock
                label="Outstanding rent"
                value={formatKES(dashboard.outstanding)}
                context={`${dashboard.outstandingTenants} tenants have not paid in full`}
                delta={{ text: `${dashboard.outstandingDeltaPct}%`, direction: "up", good: false }}
                action={{ label: "View outstanding", href: "#table" }}
              />
              <MetricBlock
                label="Occupancy"
                value={`${occupancyPct}%`}
                context={`${dashboard.occupied} of ${dashboard.units} units occupied`}
                delta={{ text: "0%", direction: "flat", good: true }}
              />
            </div>
          </div>
        )}
        <Button variant="ghost" className="mt-6" onClick={previewLoading}>Preview loading state</Button>
      </Section>

      <Section title="Colour" note="Amber is always a fill with ink text, never text on white. Semantic colours pair dark text with a soft tint.">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {swatches.map((s) => (
            <li key={s.name} className={`flex h-28 flex-col justify-between p-3 ${s.cls}`}>
              <span className="font-figure font-bold">{s.name}</span>
              <span className="text-sm">{s.use}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type" note="Manrope for reading and headlines. Space Grotesk for money, codes and labels, with tabular digits so columns align.">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-5xl font-extrabold leading-none tracking-tight">Rent, reconciled.</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">Every month, on time.</p>
            <p className="mt-3 max-w-md">Body text is 15px at medium weight, with line lengths kept under 70 characters so it stays comfortable.</p>
          </div>
          <div className="font-figure">
            <p className="text-5xl font-bold tabular-nums tracking-tight">{formatKES(1240000)}</p>
            <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-muted">{formatKES(98500)}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Label style, 12px</p>
          </div>
        </div>
      </Section>

      <Section title="Buttons and status" note="Primary buttons press toward their shadow on hover. Statuses always combine an icon with text.">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Add property</Button>
          <Button variant="dark">Search</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Archive tenant</Button>
          <Button loading>Saving</Button>
          <Button disabled>Unavailable</Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {INVOICE_STATUSES.map((s) => <InvoiceStatusBadge key={s} status={s} />)}
          <StatusBadge tone="neutral">DRAFT</StatusBadge>
        </div>
      </Section>

      <Section title="Tenants table" note="Search, filter, sort and paginate. Below 768px each row becomes a card.">
        <div id="table" className="scroll-mt-6 space-y-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchLabel="Search tenants by name or unit"
            placeholder="Search name or unit"
            filters={[
              {
                id: "status",
                label: "Filter by status",
                value: status,
                onChange: setStatus,
                options: [{ value: "ALL", label: "All statuses" }, ...INVOICE_STATUSES.map((s) => ({ value: s, label: s }))],
              },
            ]}
          />
          {loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              eyebrow="No tenants match"
              title="Nothing fits those filters."
              description="Try a different name or unit, or clear the filters to see everyone again."
              action={<Button onClick={() => { setSearch(""); setStatus("ALL"); }}>Clear filters</Button>}
            />
          ) : (
            <DataTable
              caption="Tenants"
              columns={columns}
              rows={filtered}
              getRowId={(t) => t.id}
              rowAction={(t) => (
                <Button variant="ghost" className="size-10 px-0" aria-label={`Archive ${t.name}`} onClick={() => setRemoving(t)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              )}
            />
          )}
        </div>
      </Section>

      <Section title="Empty state" note="An empty screen is the first step of a task, not an apology.">
        <EmptyState
          eyebrow="No properties yet"
          title="Your portfolio starts here."
          description="Add your building to begin tracking units, tenants and rent."
          action={<Button>Add property</Button>}
        />
      </Section>

      <Section title="Feedback" note="Dialogs name the consequence. Toasts confirm in the same words as the action.">
        <div className="flex flex-wrap gap-4">
          <Button variant="dark" onClick={() => toast({ title: "Payment reconciled", description: "KES 25,000 matched to invoice 2026-10 for B204.", tone: "success" })}>
            Show success toast
          </Button>
          <Button variant="dark" onClick={() => toast({ title: "Payment could not be reconciled", description: "We couldn't match this transaction to an invoice. Review the payment.", tone: "danger" })}>
            Show error toast
          </Button>
        </div>
      </Section>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && !busy && setRemoving(null)}
        title={`Archive ${removing?.name ?? "tenant"}?`}
        description="They will disappear from active lists and lose portal access. Invoices and payment history are kept."
        confirmLabel="Archive tenant"
        tone="danger"
        loading={busy}
        onConfirm={confirmRemove}
      />
    </main>
  );
}
