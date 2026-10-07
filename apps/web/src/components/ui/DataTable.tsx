import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number; // present = sortable
  align?: "left" | "right";
  primary?: boolean; // the row's identity: bold on desktop, the card title on mobile
}

interface DataTableProps<T> {
  caption: string; // announced by screen readers
  columns: Column<T>[];
  rows: T[]; // already filtered by the parent (see FilterBar)
  getRowId: (row: T) => string;
  pageSize?: number;
  rowAction?: (row: T) => ReactNode;
}

const pagerBtn =
  "grid size-10 place-items-center rounded-lg border border-line bg-paper hover:border-ink disabled:pointer-events-none disabled:opacity-40";

// Level 0: no boxes, just one strong header rule and hairline row separators.
// Desktop renders a real <table>; mobile renders stacked cards from the same columns.
export function DataTable<T>({ caption, columns, rows, getRowId, pageSize = 5, rowAction }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount - 1); // filters can shrink the list under us
  const start = current * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const primary = columns.find((c) => c.primary) ?? columns[0];
  const others = columns.filter((c) => c !== primary);

  return (
    <div>
      <table className="hidden w-full border-collapse md:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-ink">
            {columns.map((c) => {
              const dir = sort && sort.key === c.key ? sort.dir : null;
              const Icon = dir === null ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : c.sortValue ? "none" : undefined}
                  className={cn(
                    "py-3 pr-4 font-figure text-xs font-semibold uppercase tracking-[0.06em] text-muted",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn("inline-flex items-center gap-1 uppercase hover:text-ink", c.align === "right" && "flex-row-reverse")}
                    >
                      {c.header}
                      <Icon className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
            {rowAction && (
              <th scope="col" className="w-14">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={getRowId(row)} className="border-b border-line transition-colors hover:bg-paper">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn("py-4 pr-4", c.primary && "font-bold", c.align === "right" && "text-right font-figure tabular-nums")}
                >
                  {c.cell(row)}
                </td>
              ))}
              {rowAction && <td className="py-2 text-right">{rowAction(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-line border-y border-line md:hidden">
        {visible.map((row) => (
          <li key={getRowId(row)} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{primary.cell(row)}</span>
              {rowAction?.(row)}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {others.map((c) => (
                <div key={c.key}>
                  <dt className="font-figure text-xs font-semibold uppercase tracking-[0.06em] text-muted">{c.header}</dt>
                  <dd className="mt-0.5 font-figure tabular-nums">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <nav aria-label={`${caption} pagination`} className="mt-4 flex items-center justify-between gap-3 text-sm">
        <p className="text-muted" aria-live="polite">
          {total === 0 ? "No rows" : `Showing ${start + 1}–${Math.min(start + pageSize, total)} of ${total}`}
        </p>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className={pagerBtn}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next page" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} className={pagerBtn}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
}
