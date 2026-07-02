// ComponentsPanel.tsx
import React, { useState } from "react";
import { RotateCcw, Plus, ChevronDown, Settings2 } from "lucide-react";
import { Badge } from "./Badge";
import { CompRow } from "./CompRow";
import { fmt } from "./salaryHelpers";
import type { ComponentsPanelProps } from "./types";

const SectionCard: React.FC<{
  title: string;
  color: "emerald" | "red";
  rows: React.ReactNode;
  rowCount: number;
  isCustomizing: boolean;
  hasPending: boolean;
  onAdd: () => void;
  
  addLabel: string;
}> = ({ title, color, rows, rowCount, isCustomizing, hasPending, onAdd, addLabel }) => {
  const [open, setOpen] = useState(true);

  return (
    // min-w-0 is mandatory here — without it, this card refuses to shrink
    // below its content's natural width and forces the grid (and the whole
    // modal) to overflow horizontally instead of wrapping to one column.
    <div className="bg-card rounded-lg border border-theme px-3 py-2.5 flex flex-col min-w-0">
      <div className="flex items-center justify-between pb-1.5 border-b border-theme">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-1 min-w-0"
        >
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform ${
              color === "emerald"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            } ${open ? "" : "-rotate-90"}`}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-widest truncate ${
              color === "emerald"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {title}
          </span>
          {rowCount > 0 && (
            <span className="text-[9px] text-muted shrink-0">({rowCount})</span>
          )}
        </button>

        <Settings2 size={12} className="text-muted shrink-0" />
      </div>

      {open && (
        <>
          {/* overflow-x-auto is a safety net: if this card is ever squeezed
              narrower than the content can comfortably fit, it scrolls
              internally instead of blowing out the page layout again. */}
          <div className="max-h-[280px] overflow-y-auto overflow-x-auto pr-0.5 scroll-thin">
            <div className="min-w-[280px]">{rows}</div>
          </div>

          {isCustomizing && (
            <button
              type="button"
              onClick={onAdd}
              disabled={hasPending}
              title={hasPending ? `Select the pending ${title.toLowerCase()} first` : undefined}
              className={`mt-1.5 w-full flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-md border border-dashed transition-colors ${
                hasPending
                  ? "border-theme text-muted cursor-not-allowed"
                  : "border-theme text-primary hover:bg-primary/5 hover:border-primary/40"
              }`}
            >
              <Plus size={11} /> {addLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  hasCustomizations,
  customizationCount,
  isCustomizing,
  earningRows,
  deductionRows,
  overrides,
  formulaOverrides,
  hasPendingEarning,
  hasPendingDeduction,
  currencyPrefix,
  fetchComponentOptions,
  handleResetAllCustomizations,
  handleToggleCustomize,
  handleAddCustomComponent,
  handleAmountChange,
  handleSelectCustomComponent,
  handleReselectCustomComponent,
  handleRemoveCustomComponent,
   handleExcludeComponent,
  handleResetOverride,
  handleToggleCustomFormulaMode,
  handleCustomFormulaChange,
}) => (
  <div className="min-w-0 w-full h-full flex flex-col min-h-0">
    <div className="flex items-center justify-between mb-2 gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
          Components
        </span>
        {hasCustomizations && (
          <Badge tone="muted">{customizationCount} changed</Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isCustomizing && hasCustomizations && (
          <button
            type="button"
            onClick={handleResetAllCustomizations}
            title="Clear all employee-specific overrides and custom components"
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border border-theme text-muted hover:text-red-500 hover:border-red-300 transition-colors"
          >
            <RotateCcw size={10} /> Reset
          </button>
        )}
        <button
          type="button"
          onClick={handleToggleCustomize}
          className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-colors ${
            isCustomizing
              ? "border-primary text-primary bg-primary/5"
              : "border-theme text-muted hover:text-main hover:border-theme"
          }`}
        >
          {isCustomizing ? "Done customizing" : "Customize"}
        </button>
      </div>
    </div>

    {isCustomizing && (
      <div className="mb-2 rounded-md bg-primary/5 border border-primary/20 px-2 py-1.5">
        <p className="text-[10px] text-primary leading-snug">
          Editing amounts, formulas, and components here applies to this
          employee only — the shared salary structure is unchanged. New
          components fetch their formula and tax attributes automatically once
          selected.
        </p>
      </div>
    )}

    {/* CSS Grid auto-fit: reflows based on THIS container's real rendered
        width, not the browser viewport and not flex-wrap guesswork. Two
        columns appear only when there's genuinely ≥~300px per card
        available; otherwise it drops straight to one column - the modal
        can never be forced wider than its own bounds by this grid. */}
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3 w-full min-w-0">
      <SectionCard
        title="Earnings"
        color="emerald"
        rowCount={earningRows.length}
        isCustomizing={isCustomizing}
        hasPending={hasPendingEarning}
        onAdd={() => handleAddCustomComponent("Earning")}
        addLabel="Add Earning"
        rows={earningRows.map((row) => (
          <CompRow
            key={row.editId}
            row={row}
            editable={isCustomizing}
            isOverridden={
              !row.isCustom &&
              (row.editId in overrides || row.editId in formulaOverrides)
            }
            currencyPrefix={currencyPrefix}
            fetchComponentOptions={fetchComponentOptions}
            onAmountChange={(id, val) =>
              handleAmountChange(id, val, row.isCustom)
            }
            onSelectComponent={handleSelectCustomComponent}
            onReselectComponent={handleReselectCustomComponent}
            onRemove={handleRemoveCustomComponent}
            onExclude={handleExcludeComponent}
            onResetOverride={handleResetOverride}
            onToggleFormulaMode={(id) =>
              handleToggleCustomFormulaMode(id, row.isCustom)
            }
            onFormulaChange={(id, formula) =>
              handleCustomFormulaChange(id, formula, row.isCustom)
              
            }
            fmt={fmt}
          />
        ))}
      />

      <SectionCard
        title="Deductions"
        color="red"
        rowCount={deductionRows.length}
        isCustomizing={isCustomizing}
        hasPending={hasPendingDeduction}
        onAdd={() => handleAddCustomComponent("Deduction")}
        addLabel="Add Deduction"
        rows={deductionRows.map((row) => (
          <CompRow
            key={row.editId}
            row={row}
            editable={isCustomizing}
            isOverridden={
              !row.isCustom &&
              (row.editId in overrides || row.editId in formulaOverrides)
            }
            currencyPrefix={currencyPrefix}
            fetchComponentOptions={fetchComponentOptions}
            onAmountChange={(id, val) =>
              handleAmountChange(id, val, row.isCustom)
            }
            onSelectComponent={handleSelectCustomComponent}
            onReselectComponent={handleReselectCustomComponent}
            onRemove={handleRemoveCustomComponent}
            onResetOverride={handleResetOverride}
            onToggleFormulaMode={(id) =>
              handleToggleCustomFormulaMode(id, row.isCustom)
            }
            onFormulaChange={(id, formula) =>
              handleCustomFormulaChange(id, formula, row.isCustom)
            }
            fmt={fmt}
          />
        ))}
      />
    </div>
  </div>
);