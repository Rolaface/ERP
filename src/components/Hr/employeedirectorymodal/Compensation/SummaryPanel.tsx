import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SummaryPanelProps } from "./types";

const SummaryRow: React.FC<{
  label: string;
  value: string;
  variant?: "default" | "accent" | "negative" | "dimmed";
  topBorder?: boolean;
}> = ({ label, value, variant = "default", topBorder }) => (
  <div
    className={[
      "flex justify-between items-center gap-2 py-1 px-1.5 rounded-md min-w-0",
      topBorder ? "border-t border-theme mt-1 pt-2" : "",
    ].join(" ")}
  >
    <span
      className={`text-xs leading-tight shrink-0 ${
        variant === "dimmed" ? "text-muted" : "text-main"
      }`}
    >
      {label}
    </span>
    <span
      className={`text-xs font-medium tabular-nums text-right min-w-0 truncate ${
        variant === "accent"
          ? "text-primary font-semibold"
          : variant === "negative"
            ? "text-red-500 dark:text-red-400"
            : variant === "dimmed"
              ? "text-muted"
              : "text-main"
      }`}
    >
      {value}
    </span>
  </div>
);

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  salaryResult,
  taxConfig,
  summaryExpanded,
  setSummaryExpanded,
  fmt,
  cur,
}) => (
  <div className="bg-card rounded-lg border border-theme px-3 py-2.5 min-w-0 overflow-hidden lg:sticky lg:top-2">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
        Summary
      </span>
      <button
        type="button"
        onClick={() => setSummaryExpanded((p) => !p)}
        className="lg:hidden flex items-center gap-1 text-[10px] font-medium text-primary"
      >
        {summaryExpanded ? "Less" : "Details"}
        {summaryExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
    </div>

    {salaryResult ? (
      <>
        {/* Always-visible headline numbers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2 text-center min-w-0">
            <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5 truncate">
              Gross / month
            </p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
              {fmt(salaryResult.gross)}
            </p>
          </div>
          <div className="bg-primary/5 rounded-md p-2 text-center min-w-0">
            <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5 truncate">
              Net / month
            </p>
            <p className="text-sm font-bold text-primary tabular-nums truncate">
              {fmt(salaryResult.net)}
            </p>
          </div>
        </div>

        {/* Full breakdown - always shown on lg+, toggled on mobile */}
        <div
          className={`${summaryExpanded ? "block" : "hidden"} lg:block mt-2`}
        >
          <div className="min-w-0">
            <SummaryRow
              label="Monthly base"
              value={cur(salaryResult.resolvedBase)}
            />
            <SummaryRow
              label="Gross (monthly)"
              value={cur(salaryResult.gross)}
            />
            <SummaryRow
              label="Gross (annual)"
              value={cur(salaryResult.gross * 12)}
              variant="dimmed"
            />
            {taxConfig && salaryResult.monthlyTax > 0 && (
              <SummaryRow
                label="Income tax (monthly)"
                value={`− ${cur(salaryResult.monthlyTax)}`}
                variant="negative"
              />
            )}
            {taxConfig && salaryResult.annualTax > 0 && (
              <SummaryRow
                label="Income tax (annual)"
                value={cur(salaryResult.annualTax)}
                variant="dimmed"
              />
            )}
            {salaryResult.deductionsTotal > 0 && (
              <SummaryRow
                label="Total deductions"
                value={`− ${cur(salaryResult.deductionsTotal)}`}
                variant="negative"
              />
            )}
            <SummaryRow
              label="Net pay (monthly)"
              value={cur(salaryResult.net)}
              variant="accent"
              topBorder
            />
            <SummaryRow
              label="Net pay (annual)"
              value={cur(salaryResult.net * 12)}
              variant="dimmed"
            />
          </div>
        </div>
      </>
    ) : (
      <p className="text-xs text-muted italic">
        Enter a base salary to see the calculated summary.
      </p>
    )}
  </div>
);
