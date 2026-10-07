import { ArrowRight } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { MetricBlock } from "../components/ui/MetricBlock";
import { StatusBadge } from "../components/ui/StatusBadge";
import { cn } from "../lib/cn";
import { formatKES, formatNumber } from "../lib/format";
import { dashboard } from "../mocks/dashboard";
import { recentPayments } from "../mocks/landing";

const cta =
  "inline-flex h-12 items-center justify-center gap-2 border-2 border-ink bg-amber px-6 text-[15px] font-bold shadow-hard transition-[transform,box-shadow] duration-100 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-hard-sm";
const link = "inline-flex h-12 items-center gap-2 text-[15px] font-bold underline-offset-4 hover:underline";
const wrap = "mx-auto max-w-6xl px-4 md:px-8";
const label = "font-figure text-xs font-semibold uppercase tracking-[0.06em] text-muted";

const collectedPct = Math.round((dashboard.collected / dashboard.expected) * 100);
const occupancyPct = Math.round((dashboard.occupied / dashboard.units) * 100);

function Hero() {
  return (
    <section className={cn(wrap, "grid gap-14 pb-8 pt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-20")}>
      <div>
        <p className={label}>Property management, reimagined</p>
        <h1 className="mt-5 text-6xl font-extrabold leading-[0.95] tracking-tight md:text-8xl">
          Rent, reconciled. <span className="text-muted">Every month.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg">A single workspace for properties, tenants, rent, payments and maintenance.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#get-started" className={cta}>Get started</a>
          <a href="#platform" className={link}>Explore the platform <ArrowRight className="size-4" aria-hidden="true" /></a>
        </div>
      </div>

      {/* Product fragments, not a browser frame. Stacked on mobile, overlapped on desktop. */}
      <div className="relative flex flex-col gap-5 lg:block lg:h-[540px]" aria-label="Preview of the Rentora dashboard">
        <div className="notch absolute inset-0 hidden bg-sand lg:block" aria-hidden="true" />
        <MetricBlock
          hero
          className="lg:absolute lg:left-0 lg:top-12 lg:w-[84%]"
          label="Collected this month"
          value={formatKES(dashboard.collected)}
          context={`${collectedPct}% of expected rent`}
          delta={{ text: `${dashboard.collectedDeltaPct}%`, direction: "up", good: true }}
        />
        <div className="bg-ink p-4 text-paper lg:absolute lg:bottom-24 lg:left-0 lg:w-40">
          <p className="font-figure text-3xl font-bold tabular-nums">{occupancyPct}%</p>
          <p className="text-sm">{dashboard.occupied} of {dashboard.units} units occupied</p>
          <div className="mt-3 h-2 bg-paper/25" aria-hidden="true"><div className="h-full bg-amber" style={{ width: `${occupancyPct}%` }} /></div>
        </div>
        <div className="border border-line bg-paper p-4 lg:absolute lg:bottom-0 lg:right-0 lg:w-[70%]">
          <p className="font-bold">Payment activity</p>
          <ul className="mt-2 divide-y divide-line">
            {recentPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{p.payer}</p>
                  <p className="font-figure text-xs tabular-nums text-muted">{p.unit} · {formatNumber(p.amount)}</p>
                </div>
                <StatusBadge tone={p.state === "RECONCILED" ? "success" : "warning"}>{p.state === "RECONCILED" ? "Matched" : "Review"}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const scraps = [
  { rot: "-rotate-3 translate-y-1", title: "Spreadsheet", body: "Unit | Paid?\nA102 | yes?\nB204 | ask Jane\nC103 | ???" },
  { rot: "rotate-2 -translate-y-1", title: "SMS", body: "UJ3XXXXXXX Confirmed. Ksh 25,000.00 received from JANE SMITH 07•• ••• 456 at 9:41 PM." },
  { rot: "rotate-3", title: "WhatsApp", body: "Nimetuma rent jana. Please check 🙏\n9:58 PM" },
  { rot: "-rotate-2 translate-y-2", title: "Paper receipt", body: "No. 0042\nRent Oct, KES 20,000\nReceived by hand" },
];

function Problem() {
  const [tidy, setTidy] = useState(false);
  return (
    <section className={cn(wrap, "mt-28 grid gap-12 lg:grid-cols-[1fr_1.3fr]")}>
      <div>
        <p className={label}>The problem</p>
        <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Property management shouldn't live in spreadsheets.</h2>
        <p className="mt-5 max-w-md text-lg">Rent arrives by SMS, WhatsApp and paper. Someone has to match each one by hand, and tenants still ask whether they've paid.</p>
        <button type="button" aria-pressed={tidy} onClick={() => setTidy((t) => !t)} className={cn(cta, "mt-8")}>
          {tidy ? "Scatter it again" : "Bring it into Rentora"}
        </button>
      </div>
      <div>
        <ul className="grid grid-cols-2 gap-4">
          {scraps.map((s) => (
            <li key={s.title} className={cn("border border-line bg-paper p-4 motion-safe:transition-transform motion-safe:duration-300", tidy ? "rotate-0 translate-y-0" : s.rot)}>
              <p className={label}>{s.title}</p>
              <p className="mt-2 whitespace-pre-line font-figure text-sm">{s.body}</p>
            </li>
          ))}
        </ul>
        <div aria-live="polite">
          {tidy && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper p-5 shadow-hard">
              <p><span className="font-bold">A102 · John Doe</span> · October rent · {formatKES(20000)}</p>
              <StatusBadge tone="success">Reconciled</StatusBadge>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const workspace = [
  { t: "Properties", d: "Set up your building once: units, rent, bedrooms, amenities and your own custom details." },
  { t: "Tenants", d: "Invite tenants to their own portal. They see their lease and balance, nothing else." },
  { t: "Leases", d: "Start dates, deposits, due days and expiry dates on one timeline, so renewals never surprise you." },
  { t: "Payments", d: "Invoices are created each month. Balances are worked out from payments, never typed in." },
];

function Workspace() {
  return (
    <section id="platform" className={cn(wrap, "mt-28 scroll-mt-6")}>
      <h2 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        One workspace for the whole building. <span className="text-muted">Everything connected.</span>
      </h2>
      <ul className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
        {workspace.map((w) => (
          <li key={w.t} className="border-t-2 border-ink pt-4">
            <h3 className="text-xl font-extrabold">{w.t}</h3>
            <p className="mt-2 text-muted">{w.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const roles = [
  { id: "owner", label: "Owner", q: "How are my properties performing?", rows: [["Collection rate", `${collectedPct}%`], ["Occupancy", `${occupancyPct}%`], ["Outstanding rent", formatKES(dashboard.outstanding)]] },
  { id: "manager", label: "Manager", q: "What needs my attention today?", rows: [["Overdue rent", "18 tenants"], ["Payments to review", "3"], ["Leases ending in 30 days", "2"]] },
  { id: "tenant", label: "Tenant", q: "What do I need to pay or do?", rows: [["Balance due", formatKES(25000)], ["Next payment", "5 Nov"], ["Receipts", "12 saved"]] },
  { id: "maintenance", label: "Maintenance", q: "What work do I need to complete?", rows: [["Urgent", "1 job"], ["Assigned", "4 jobs"], ["Completed this week", "9 jobs"]] },
];

function Roles() {
  const [active, setActive] = useState(roles[0].id);
  const role = roles.find((r) => r.id === active)!;
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = roles[(roles.findIndex((r) => r.id === active) + d + roles.length) % roles.length];
    setActive(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <section className={cn(wrap, "mt-28")}>
      <p className={label}>Built for the people who use it</p>
      <h2 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Four people, four different days.</h2>
      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
        <div role="tablist" aria-label="Choose a role" onKeyDown={onKey} className="flex flex-wrap gap-2 lg:flex-col">
          {roles.map((r) => (
            <button
              key={r.id}
              id={`tab-${r.id}`}
              role="tab"
              type="button"
              aria-selected={active === r.id}
              aria-controls="role-panel"
              tabIndex={active === r.id ? 0 : -1}
              onClick={() => setActive(r.id)}
              className={cn("h-11 rounded-lg px-4 text-left font-bold", active === r.id ? "bg-ink text-paper" : "hover:bg-sand")}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div id="role-panel" role="tabpanel" aria-labelledby={`tab-${role.id}`} className="rounded-xl border border-line bg-paper p-6 md:p-8">
          <p className="text-2xl font-extrabold tracking-tight md:text-3xl">{role.q}</p>
          <dl className="mt-6 divide-y divide-line">
            {role.rows.map(([k, v]) => (
              <div key={k} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                <dt className="text-muted">{k}</dt>
                <dd className="font-figure text-3xl font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="mt-6 max-w-2xl text-muted">Everyone signs in to their own portal. Nobody sees another person's account unless an owner grants access, and a grant can be removed at any time.</p>
    </section>
  );
}

const steps = [
  ["Payment received", "A tenant pays rent."],
  ["Transaction recorded", "The raw payment is saved untouched."],
  ["Tenant identified", "Matched by unit code or phone."],
  ["Invoice matched", "Applied to the right month."],
  ["Reconciled", "Balance updates. Receipt sent."],
];

function Flow() {
  return (
    <section className={cn(wrap, "mt-28")}>
      <p className={label}>Money that makes sense</p>
      <h2 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">From payment to reconciled, without a spreadsheet.</h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-5">
        {steps.map(([t, d], i) => (
          <li key={t} className={cn("border-t-2 pt-4", i === steps.length - 1 ? "border-amber" : "border-ink")}>
            <p className="font-figure text-sm font-semibold text-muted">Step {i + 1}</p>
            <h3 className="mt-1 text-lg font-extrabold">{t}</h3>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 max-w-2xl">When a payment can't be matched with confidence, Rentora puts it in a review queue for a person to decide. It never guesses with your money.</p>
    </section>
  );
}

function Closing() {
  return (
    <section id="get-started" className={cn(wrap, "mt-28 scroll-mt-6")}>
      <div className="notch bg-sand px-6 py-14 md:px-14 md:py-20">
        <h2 className="max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">Bring your properties into one place.</h2>
        <p className="mt-5 max-w-md text-lg">Set up your building, invite your tenants, and see this month's rent as it arrives.</p>
        <a href="#get-started" className={cn(cta, "mt-8")}>Get started</a>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <header className={cn(wrap, "flex items-center justify-between py-5")}>
        <a href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="size-6 border-2 border-ink bg-amber shadow-hard-sm" aria-hidden="true" />
          Rentora
        </a>
        <nav aria-label="Main" className="hidden gap-8 font-bold md:flex">
          <a href="#platform" className="hover:underline">Platform</a>
          <a href="#get-started" className="hover:underline">Get started</a>
        </nav>
        <a href="#get-started" className="inline-flex h-10 items-center rounded-lg px-4 font-bold hover:bg-sand">Log in</a>
      </header>
      <main id="main">
        <Hero />
        <Problem />
        <Workspace />
        <Roles />
        <Flow />
        <Closing />
      </main>
      <footer className={cn(wrap, "mt-20 border-t border-line py-8 text-sm text-muted")}>Rentora. Rental management built for residential buildings in Kenya.</footer>
    </>
  );
}
