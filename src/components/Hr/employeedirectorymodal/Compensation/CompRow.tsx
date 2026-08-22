import React from "react";
import { Loader2, Trash2 } from "lucide-react";
import SearchSelect2 from "../../../ui/modal/SearchSelect2";
import { NumericInput } from "../../../ui/modal/modalComponent";
import type { ComponentType } from "../../../../utils/Salary_Employee/salaryengine";
import type { ComponentOption, DisplayRow, RowFlags } from "./types";
import { formatMoney } from "../../../../utils/money";

const FLAG_META: Array<{
  key: keyof RowFlags;
  label: string;
  title: string;
}> = [
  {
    key: "depends_on_payment_days",
    label: "Days",
    title: "Depends on payment days",
  },
  { key: "is_tax_applicable", label: "Tax", title: "Tax applicable" },
  {
    key: "is_income_tax_component",
    label: "IT",
    title: "Income tax component",
  },
  {
    key: "variable_based_on_taxable_salary",
    label: "VTS",
    title: "Variable based on taxable salary",
  },
];

const FlagBadges: React.FC<{ flags?: RowFlags }> = ({ flags }) => {
  if (!flags) return null;
  const active = FLAG_META.filter((f) => flags[f.key] === 1);
  if (!active.length) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap shrink-0">
      {active.map((f) => (
        <span
          key={f.key}
          title={f.title}
          className="shrink-0 inline-flex items-center rounded px-1 py-[1px] text-[8px] font-semibold leading-none bg-app border border-theme text-muted"
        >
          {f.label}
        </span>
      ))}
    </div>
  );
};

// Read-only formula display (view mode / non-editable rows).
const FormulaBox: React.FC<{ formula: string }> = ({ formula }) => (
  <div
    className="flex-1 min-w-0 h-7 flex items-center rounded-md bg-app/60 border border-theme/60 px-1.5 cursor-not-allowed"
    title={`Formula: ${formula}`}
  >
    <p className="text-[10px] font-mono leading-none text-muted/80 italic truncate">
      {formula || "—"}
    </p>
  </div>
);

// Compact "= amount" chip, height-matched to the input beside it.
const ComputedChip: React.FC<{
  amount: number;
  currency?: string;
}> = ({ amount, currency }) => (
  <div
    title="Live computed amount"
    className="shrink-0 h-7 flex items-center gap-1 rounded-md bg-primary/8 border border-primary/25 px-2 whitespace-nowrap"
  >
    <span className="text-[8px] font-semibold text-primary/60">=</span>
    <span className="text-[10px] font-semibold text-primary">
      {formatMoney(currency, amount)}
    </span>
  </div>
);

// Segmented Fixed/Formula pill toggle — compact size, sits directly next
// to the input it controls (see value row below) rather than up in the
// header, so the cause → effect relationship is visually obvious.
const ModeToggle: React.FC<{
  isFormulaMode: boolean;
  disabled: boolean;
  onToggle?: () => void;
}> = ({ isFormulaMode, disabled, onToggle }) => (
  <div
    className={`shrink-0 inline-flex items-center rounded-lg border border-theme bg-app p-0.5 h-7 ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
  >
    {/* Fixed button — only clickable while CURRENTLY in formula mode.
        Must stay the inverse of the Formula button's condition below. */}
    <button
      type="button"
      disabled={disabled}
      onClick={disabled || !isFormulaMode ? undefined : onToggle}
      title={disabled ? undefined : "Fixed amount"}
      className={`px-1.5 py-1 rounded-md text-[8px] font-semibold leading-none whitespace-nowrap transition-colors ${
        !isFormulaMode
          ? "bg-primary text-white shadow-sm"
          : "text-muted hover:text-primary"
      }`}
    >
      Fixed
    </button>
    <button
      type="button"
      disabled={disabled}
      onClick={disabled || isFormulaMode ? undefined : onToggle}
      title={disabled ? undefined : "Formula"}
      className={`px-1.5 py-1 rounded-md text-[8px] font-semibold leading-none whitespace-nowrap transition-colors ${
        isFormulaMode
          ? "bg-primary text-white shadow-sm"
          : "text-muted hover:text-primary"
      }`}
    >
      ƒx
    </button>
  </div>
);

export const CompRow: React.FC<{
  row: DisplayRow;
  editable?: boolean;
  isOverridden?: boolean;
  currency?: string;
  fetchComponentOptions?: (
    type: ComponentType,
    query: string,
  ) => Promise<ComponentOption[]>;
  onAmountChange?: (editId: string, value: number | null) => void;
  onSelectComponent?: (editId: string, option: ComponentOption) => void;
  onReselectComponent?: (editId: string) => void;
  onRemove?: (editId: string) => void;
  onExclude?: (editId: string) => void;
  onResetOverride?: (editId: string) => void;
  onToggleFormulaMode?: (editId: string) => void;
  onFormulaChange?: (editId: string, formula: string) => void;
}> = ({
  row,
  editable,
  isOverridden,
  currency,
  fetchComponentOptions,
  onAmountChange,
  onSelectComponent,
  onReselectComponent,
  onRemove,
  onExclude,
  onResetOverride,
  onToggleFormulaMode,
  onFormulaChange,
}) => {
  const isPendingCustom = row.isCustom && !row.selected;
  const isLoadingDetails = Boolean(row.detailsLoading);

  const isFormulaMode =
    editable && row.amount_based_on_formula !== undefined
      ? row.amount_based_on_formula === 1
      : Boolean(row.isFormula && row.formula);

  const canDelete = Boolean(editable);

  const canToggleMode = Boolean(
    editable && !isPendingCustom && !isLoadingDetails,
  );

  // row.amount always holds the CURRENT COMPUTED value from the salary
  // engine, regardless of mode — safe to show next to the formula input.
  const computedAmount = row.amount ?? 0;

  return (
    <div className="border-b border-theme/30 last:border-0 hover:bg-app/40 transition-colors px-2 py-2 min-w-0">
      {/* ── Header row: name + flags, delete ────────────────────────────── */}
      <div className="flex items-start gap-1.5 min-w-0">
        <div className="flex-1 min-w-0">
          {editable && isPendingCustom ? (
            isLoadingDetails ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted py-1">
                <Loader2 size={12} className="animate-spin text-primary" />
                Loading component…
              </div>
            ) : (
              <SearchSelect2
                label=""
                value=""
                placeholder="Select component…"
                fetchOptions={(q: string) =>
                  fetchComponentOptions?.(row.type, q) ?? Promise.resolve([])
                }
                onChange={(val: any) =>
                  onSelectComponent?.(
                    row.editId,
                    typeof val === "string" ? { label: val, value: val } : val,
                  )
                }
              />
            )
          ) : editable && row.isCustom ? (
            /* Aligned horizontally on one line for custom editable components */
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              {isLoadingDetails ? (
                <div className="flex items-center gap-1.5 text-[11px] text-muted py-1">
                  <Loader2 size={12} className="animate-spin text-primary" />
                  Loading component…
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onReselectComponent?.(row.editId)}
                  title="Click to change component"
                  className="text-left text-[11.5px] font-medium text-main leading-tight truncate hover:text-primary max-w-full shrink-0"
                >
                  {row.name}
                </button>
              )}
              <FlagBadges flags={row.flags} />
            </div>
          ) : (
            /* Aligned horizontally on one line for standard structure components */
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                <p
                  className="text-[11.5px] font-medium text-main leading-tight truncate"
                  title={row.name}
                >
                  {row.name}
                </p>
                {row.isCustom && (
                  <span
                    title="Added only for this employee — not part of the shared structure"
                    className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500"
                  />
                )}
                {isOverridden && (
                  <span
                    title="Overridden for this employee"
                    className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </div>
              <FlagBadges flags={row.flags} />
            </div>
          )}

          {editable && !row.isCustom && isOverridden && (
            <button
              type="button"
              onClick={() => onResetOverride?.(row.editId)}
              className="text-[9px] text-primary/70 hover:text-primary mt-0.5 leading-none focus:outline-none block"
            >
              reset to structure value
            </button>
          )}
        </div>
      </div>

      {/* ── Value row: [toggle] [input] [computed chip] — toggle sits right
             beside the field it switches, so it reads as one control. ──── */}
      {!isPendingCustom && (
        <div className="mt-1 flex items-center gap-1">
          {!isPendingCustom && (
            <ModeToggle
              isFormulaMode={isFormulaMode}
              disabled={!canToggleMode}
              onToggle={() => onToggleFormulaMode?.(row.editId)}
            />
          )}

          {isFormulaMode && editable ? (
            <>
              <input
                type="text"
                value={row.formula}
                onChange={(e) => onFormulaChange?.(row.editId, e.target.value)}
                placeholder="e.g. base * 0.4"
                spellCheck={false}
                className="flex-1 min-w-0 h-7 text-[10px] font-mono rounded-md border border-theme bg-app px-1.5 text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <ComputedChip amount={computedAmount} currency={currency} />
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (row.isCustom) {
                      onRemove?.(row.editId);
                    } else {
                      onExclude?.(row.editId);
                    }
                  }}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md border border-theme text-muted hover:text-red-500 hover:border-red-300"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </>
          ) : isFormulaMode ? (
            <>
              <FormulaBox formula={row.formula || ""} />
              <ComputedChip amount={computedAmount} currency={currency} />

              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (row.isCustom) {
                      onRemove?.(row.editId);
                    } else {
                      onExclude?.(row.editId);
                    }
                  }}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md border border-theme text-muted hover:text-red-500 hover:border-red-300"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </>
          ) : (
            <>
              <NumericInput
                name={row.editId}
                value={row.amount}
                onChange={(val) => editable && onAmountChange?.(row.editId, val)}
                disabled={!editable || isPendingCustom || isLoadingDetails}
                decimalScale={2}
                className="w-full !h-7 !text-[11px] !px-2"
              />

              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (row.isCustom) {
                      onRemove?.(row.editId);
                    } else {
                      onExclude?.(row.editId);
                    }
                  }}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md border border-theme text-muted hover:text-red-500 hover:border-red-300"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};