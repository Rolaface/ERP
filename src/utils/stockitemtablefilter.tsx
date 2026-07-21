import React from "react";
import {
  Download,
  Loader2,
  Upload,
  ClipboardEdit,
  Search,
} from "lucide-react";

interface ItemsTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  hideZeroStock: boolean;
  onHideZeroStockChange: (value: boolean) => void;
  onBulkUpload: () => void;
  onStockCorrection: () => void;
  onExport: () => void;
  isExporting: boolean;
  exportDisabled?: boolean;
}

const ItemsTableFilters: React.FC<ItemsTableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  
  
  onBulkUpload,
  onStockCorrection,
  onExport,
  isExporting,
  exportDisabled,
}) => {
  return (
  <div className="bg-card border border-[var(--border)] rounded-lg px-3 py-2 flex items-center">

    {/* Search */}
    <div className="relative w-72">
      <Search
        size={11}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search items..."
        className="h-7 w-full pl-7 pr-2.5 text-[11px] border border-[var(--border)] bg-app rounded-md text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>

    {/* Middle Buttons */}
    <div className="flex items-center gap-2 ml-4">
      <button
        onClick={onStockCorrection}
        className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all"
      >
        <ClipboardEdit size={11} />
        Stock Correction
      </button>

      <button
        onClick={onBulkUpload}
        className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all"
      >
        <Upload size={11} />
        Bulk Upload
      </button>
    </div>

    {/* Export Right */}
    <div className="ml-auto">
      <button
        onClick={onExport}
        disabled={isExporting || exportDisabled}
        className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Download size={11} />
        )}
        {isExporting ? "Exporting…" : "Export"}
      </button>
    </div>

  </div>
);
};

export default ItemsTableFilters;