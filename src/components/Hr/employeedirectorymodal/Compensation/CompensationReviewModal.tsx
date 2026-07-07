import React, { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  FaUndo,
  FaCheck,
  FaMoneyBillWave,
  FaExclamationCircle,
} from "react-icons/fa";
import { useModalStore } from "../../../../store/modalStore";
import { MinimizableModal } from "../../../common/MinimizableModal";
import { NumericInput } from "../../../ui/modal/modalComponent";
import type { SalaryResult } from "../salaryengine";

export type CompensationReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  currencyPrefix: string;
  salaryResult?: SalaryResult | null;
  salaryStructureName?: string;
  hasCustomizations?: boolean;
  onResetCustomizations?: () => void;
  onSave?: () => void;
  baseSalaryInput?: number | null;
  onBaseSalaryChange?: (val: number | null) => void;
  onBaseSalaryFocus?: () => void;
  onBaseSalaryBlur?: () => void;
  grossSalaryInput?: number | null;
  onGrossSalaryChange?: (val: number | null) => void;
  onGrossSalaryFocus?: () => void;
  onGrossSalaryBlur?: () => void;
  children?: React.ReactNode;
};

const fmtNum = (n: number) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const DrawerToggleIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    className="w-3.5 h-3.5 text-muted hover:text-main transition-colors shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
    <line x1="15" y1="3" x2="15" y2="21" />
    {isOpen ? (
      <polyline points="10 15 13 12 10 9" />
    ) : (
      <polyline points="11 15 8 12 11 9" />
    )}
  </svg>
);

export const CompensationReviewModal: React.FC<CompensationReviewModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  currencyPrefix,
  salaryResult,
  salaryStructureName,
  hasCustomizations = false,
  onResetCustomizations,
  onSave,
  baseSalaryInput,
  onBaseSalaryChange,
  onBaseSalaryFocus,
  onBaseSalaryBlur,
  grossSalaryInput,
  onGrossSalaryChange,
  onGrossSalaryFocus,
  onGrossSalaryBlur,
  children,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Store-backed modal id. We own its lifecycle since this component
  // isn't opened through GlobalModalHandler's openXModal() helpers —
  // MinimizableModal needs a real store entry to read/set `minimized` on.
  const modalIdRef = useRef<string | null>(null);
  const [modalId, setModalId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !modalIdRef.current) {
      const id = useModalStore.getState().openModal(
        "compensationReview",
        null,
        false,
        undefined,
        {
          title: "Customize & Review Compensation",
          subtitle: employeeName || "Employee",
          icon: SlidersHorizontal,
        },
      );
      modalIdRef.current = id;
      setModalId(id);
    }

    if (!isOpen && modalIdRef.current) {
      useModalStore.getState().closeModal(modalIdRef.current);
      modalIdRef.current = null;
      setModalId(null);
    }
  }, [isOpen, employeeName]);

  // Cleanup on unmount, in case parent unmounts without flipping isOpen first.
  useEffect(() => {
    return () => {
      if (modalIdRef.current) {
        useModalStore.getState().closeModal(modalIdRef.current);
      }
    };
  }, []);

  if (!isOpen || !modalId) return null;

  const cur = (n: number) => `${currencyPrefix} ${fmtNum(n)}`.trim();

  const summaryBar = (
    <div className="flex items-center justify-between gap-3 text-white/90">
      <p className="text-xs truncate">
        {employeeName || "Employee"} •{" "}
        <span className="font-medium text-white">
          {salaryStructureName || "Custom Structure"}
        </span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        {hasCustomizations && (
          <span className="text-[10px] font-medium bg-white/15 text-white border border-white/20 px-2 py-0.5 rounded-full">
            Customized
          </span>
        )}
        {hasCustomizations && onResetCustomizations && (
          <button
            type="button"
            onClick={onResetCustomizations}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors border border-white/20"
            title="Reset all overrides to structure defaults"
          >
            <FaUndo className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        )}
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-end gap-2 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-3.5 py-1.5 text-xs font-medium text-muted hover:text-main bg-card hover:bg-app border border-theme rounded-md transition-all"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          onSave?.();
          onClose();
        }}
        className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-2xs transition-all active:scale-[0.98]"
      >
        <FaCheck className="w-2.5 h-2.5" />
        <span>Apply & Close</span>
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={true}
      onClose={onClose}
      title="Customize & Review Compensation"
      subtitle={employeeName || "Employee"}
      icon={SlidersHorizontal}
      summaryBar={summaryBar}
      footer={footer}
      customWidth="min(1400px, 96vw)"
      height="min(850px, 90dvh)"
    >
      <div className="flex flex-col -mx-4 -my-3 min-h-0">
        {/*
          Shared top bar — Base Salary / Gross Salary fields + the "show
          summary" toggle live here now, spanning the FULL width above
          both columns. This is the fix for the misalignment: previously
          this bar only sat above the left canvas, so EARNINGS/DEDUCTIONS
          started lower than SUMMARY. Now every column's first heading
          starts right after this same shared bar, at the same y-position.
        */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-3 pb-3 border-b border-theme/60 shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {onBaseSalaryChange !== undefined && (
              <div className="flex items-center gap-1.5 bg-card border border-theme rounded-md px-2 py-0.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0">
                  Base Salary / Month:
                </span>
                {/*
                  onFocus/onBlur live on this wrapper div, not on
                  NumericInput itself. React's synthetic focus/blur events
                  bubble (via focusin/focusout under the hood), so focusing
                  the inner <input> inside NumericInput bubbles up and
                  fires these handlers — same pattern the main
                  CompensationTab panel already relies on. This lets us
                  set activeField.current = "base" without touching the
                  shared NumericInput component at all.
                */}
                <div
                  className="relative flex items-center"
                  onFocus={onBaseSalaryFocus}
                  onBlur={onBaseSalaryBlur}
                >
                  <span className="text-[10px] font-semibold text-muted mr-1 shrink-0">
                    {currencyPrefix}
                  </span>
                  <NumericInput
                    name="modal-base-salary"
                    value={baseSalaryInput ?? null}
                    onChange={(val) => onBaseSalaryChange(val ?? null)}
                    placeholder="0.00"
                    decimalScale={2}
                    className="!w-20 sm:!w-24 !h-6 !text-[11px] !font-bold !tabular-nums !px-1.5 !bg-transparent !border-0 focus:!outline-none !shadow-none"
                  />
                </div>
              </div>
            )}

            {onGrossSalaryChange !== undefined && (
              <div className="flex items-center gap-1.5 bg-card border border-theme rounded-md px-2 py-0.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0">
                  Gross Salary/Month:
                </span>
                <div
                  className="relative flex items-center"
                  onFocus={onGrossSalaryFocus}
                  onBlur={onGrossSalaryBlur}
                >
                  <span className="text-[10px] font-semibold text-muted mr-1 shrink-0">
                    {currencyPrefix}
                  </span>
                  <NumericInput
                    name="modal-gross-salary"
                    value={grossSalaryInput ?? null}
                    onChange={(val) => onGrossSalaryChange(val ?? null)}
                    placeholder="0.00"
                    decimalScale={2}
                    className="!w-20 sm:!w-24 !h-6 !text-[11px] !font-bold !tabular-nums !px-1.5 !bg-transparent !border-0 focus:!outline-none !shadow-none"
                  />
                </div>
              </div>
            )}
          </div>

          {!isDrawerOpen && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 bg-card border border-theme rounded-md shadow-2xs hover:bg-app transition-all flex items-center justify-center shrink-0"
              title="Show Summary"
            >
              <DrawerToggleIcon isOpen={false} />
            </button>
          )}
        </div>

        {/* Columns row — both start immediately below the shared bar above,
            so their header lines land on the same horizontal line. */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-theme min-h-0">
          {/* Left Canvas Area */}
          <div
            className={`h-auto overflow-visible p-4 sm:p-5 transition-all duration-300 ${
              isDrawerOpen ? "w-full lg:w-[80%]" : "w-full"
            }`}
          >
            {children || (
              <div className="p-8 text-center border border-dashed border-theme rounded-xl text-muted text-xs bg-card">
                No components loaded.
              </div>
            )}
          </div>

          {/* Right Summary Sidebar — top padding matches the left canvas's
              (p-4 sm:p-5 vs pt-4 sm:pt-5 here) so the SUMMARY heading lines
              up with EARNINGS / DEDUCTIONS exactly. */}
          {isDrawerOpen && (
            <div className="w-full sm:w-[260px] lg:w-[20%] min-w-[240px] max-w-[280px] bg-card/90 dark:bg-card px-3.5 sm:px-4 pt-4 sm:pt-5 pb-3.5 sm:pb-4 flex flex-col justify-between shrink-0 h-auto">
              <div className="space-y-3 sticky top-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                    <FaMoneyBillWave className="text-emerald-500 w-3 h-3 shrink-0" />
                    <span>Summary</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-md border border-theme hover:bg-app transition-all flex items-center justify-center"
                    title="Hide sidebar"
                  >
                    <DrawerToggleIcon isOpen={true} />
                  </button>
                </div>

                {salaryResult ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="bg-card p-2.5 rounded-lg border border-theme shadow-2xs border-l-4 border-l-emerald-500">
                        <span className="text-[9px] text-muted font-bold block uppercase tracking-wider">
                          Gross / Month
                        </span>
                        <span className="text-sm sm:text-base font-bold text-main tabular-nums truncate block mt-0.5">
                          {cur(salaryResult.gross)}
                        </span>
                      </div>

                      <div className="bg-card p-2.5 rounded-lg border border-theme shadow-2xs border-l-4 border-l-primary">
                        <span className="text-[9px] text-primary font-bold block uppercase tracking-wider">
                          Net / Month
                        </span>
                        <span className="text-sm sm:text-base font-bold text-main tabular-nums truncate block mt-0.5">
                          {cur(salaryResult.net)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-app/50 dark:bg-app/20 rounded-lg border border-theme/80 p-2.5 space-y-1.5 text-[11px] shadow-inner">
                      <div className="flex justify-between items-center text-muted">
                        <span>Monthly Base</span>
                        <span className="font-semibold text-main tabular-nums">
                          {cur(salaryResult.resolvedBase)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted">
                        <span>Gross (Annual)</span>
                        <span className="font-semibold text-main tabular-nums">
                          {cur(salaryResult.gross * 12)}
                        </span>
                      </div>

                      <hr className="border-theme/80 my-1" />

                      {salaryResult.monthlyTax > 0 && (
                        <div className="flex justify-between items-center text-red-500 dark:text-red-400 font-medium">
                          <span>Income Tax (Mo)</span>
                          <span className="tabular-nums">
                            − {cur(salaryResult.monthlyTax)}
                          </span>
                        </div>
                      )}
                      {salaryResult.deductionsTotal > 0 && (
                        <div className="flex justify-between items-center text-red-500 dark:text-red-400 font-medium">
                          <span>Total Deductions</span>
                          <span className="tabular-nums">
                            − {cur(salaryResult.deductionsTotal)}
                          </span>
                        </div>
                      )}

                      <hr className="border-theme/80 my-1" />

                      <div className="flex justify-between items-center font-bold text-main pt-0.5 text-xs">
                        <span>Net Pay (Mo)</span>
                        <span className="text-primary tabular-nums">
                          {cur(salaryResult.net)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted font-medium">
                        <span>Net Pay (Yr)</span>
                        <span className="tabular-nums font-semibold text-main">
                          {cur(salaryResult.net * 12)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-theme rounded-lg bg-card text-muted text-[11px]">
                    <FaExclamationCircle className="w-4 h-4 mx-auto mb-1 text-amber-500/70" />
                    Enter a base salary to preview calculations.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default CompensationReviewModal;