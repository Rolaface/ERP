// SearchBar.tsx
import React from "react";
import { Search, X } from "lucide-react";

export const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  resultCount: number;
  totalCount: number;
}> = ({ value, onChange, resultCount, totalCount }) => {
  const isFiltered = value.trim().length > 0;
  return (
    <div className="flex items-center gap-2 w-full max-w-sm">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search name, ID, dept…"
          className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-app border border-theme rounded-lg text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
        />
        {isFiltered && (
          <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-app text-muted hover:text-main transition">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {isFiltered && <span className="text-[10px] font-semibold text-muted shrink-0">{resultCount} of {totalCount}</span>}
    </div>
  );
};