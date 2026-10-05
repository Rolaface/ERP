import React from "react";
import { Filter, Loader2 } from "lucide-react";
import FloatingSelect from "./Floatingselect";
import type { SelectOption, SummaryFilters } from "../Types";
import type { LinkSource, ReportFilter } from "../../reportOptions";


const applyBtnCls =
  "h-8 flex items-center gap-1.5 px-4 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const resetBtnCls =
  "h-8 flex items-center px-3 text-xs font-semibold border border-[var(--border)] rounded-md bg-card text-main hover:bg-row-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

interface Props {
  filters: ReportFilter[];
  values: SummaryFilters;
  linkOptions: Partial<Record<LinkSource, SelectOption[]>>;
  leading?: React.ReactNode;
  loading: boolean;
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const FilterBar: React.FC<Props> = ({
  filters, values, linkOptions, leading, loading, onChange, onApply, onReset,
}) => {
  const renderFilter = (f: ReportFilter) => {
   
    if (f.type !== "link" && f.type !== "select") return null;
    const options = f.type === "link" ? linkOptions[f.source] ?? [] : f.options;
    return (
      <FloatingSelect
        key={f.key}
        label={f.label}
        value={values[f.key] ?? ""}
        options={[{ value: "", label: "All" }, ...options]}
        onChange={(v) => onChange(f.key, v)}
      />
    );
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--border)] bg-card px-3 py-2.5">
      {leading}
      {filters.map(renderFilter)}

      <button onClick={onApply} disabled={loading} className={applyBtnCls}>
        {loading ? <Loader2 size={11} className="animate-spin" /> : <Filter size={11} />}
        Apply
      </button>
      <button onClick={onReset} disabled={loading} className={resetBtnCls}>
        Reset
      </button>
    </div>
  );
};

export default FilterBar;