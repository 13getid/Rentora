import { Search } from "lucide-react";
import { useId, type ReactNode } from "react";

interface FilterDef {
  id: string;
  label: string; // read by screen readers, since the select shows no visible label
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  placeholder?: string;
  filters?: FilterDef[];
  actions?: ReactNode;
}

// Level 1: a calm white bar. Native <select> keeps keyboard and mobile pickers free.
export function FilterBar({ search, onSearchChange, searchLabel, placeholder, filters, actions }: FilterBarProps) {
  const uid = useId();
  return (
    <div role="search" className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <label htmlFor={uid} className="sr-only">{searchLabel}</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={uid}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg bg-canvas pl-10 pr-3 text-[15px] placeholder:text-muted"
        />
      </div>
      {filters?.map((f) => (
        <div key={f.id}>
          <label htmlFor={`${uid}-${f.id}`} className="sr-only">{f.label}</label>
          <select
            id={`${uid}-${f.id}`}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="h-11 w-full rounded-lg bg-canvas px-3 text-[15px] font-semibold md:w-auto"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}
      {actions}
    </div>
  );
}
