import React from "react";
import { Plus } from "lucide-react";
import { CompRow } from "./CompRow";
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
  return (
    <div className="flex flex-col min-w-0 lg:px-4 lg:first:pl-0 lg:last:pr-0">
      {/* Static Section Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-theme/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider truncate ${
              color === "emerald"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {title}
          </span>
          {rowCount > 0 && (
            <span className="text-[10px] font-semibold text-muted shrink-0">({rowCount})</span>
          )}
        </div>
      </div>

      {/* Rows Container */}
      <div className="w-full h-auto overflow-visible">
        <div className="w-full">{rows}</div>
      </div>

      {/* Add Component Button */}
      {isCustomizing && (
        <button
          type="button"
          onClick={onAdd}
          disabled={hasPending}
          title={hasPending ? `Select the pending ${title.toLowerCase()} first` : undefined}
          className={`mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-lg border border-dashed transition-all ${
            hasPending
              ? "border-theme text-muted cursor-not-allowed bg-app/30"
              : "border-theme text-primary hover:bg-primary/5 hover:border-primary/40 shadow-2xs cursor-pointer"
          }`}
        >
          <Plus size={12} /> {addLabel}
        </button>
      )}
    </div>
  );
};

export const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  isCustomizing,
  earningRows,
  deductionRows,
  overrides,
  formulaOverrides,
  hasPendingEarning,
  hasPendingDeduction,
  currency,
  fetchComponentOptions,
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
    {/* Notice we completely deleted the redundant 'ACTIVE STRUCTURE / Override Applied / Reset' bar! */}

    {/* Responsive 2-column grid */}
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:divide-x lg:divide-theme gap-y-4 w-full min-w-0">
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
            currency={currency}
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
            currency={currency}
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
          />
        ))}
      />
    </div>
  </div>
);