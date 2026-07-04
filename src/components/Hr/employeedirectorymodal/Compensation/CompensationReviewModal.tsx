import React, { useEffect, useState } from "react";
import { 
  FaTimes, 
  FaMoneyBillWave, 
  FaSlidersH, 
  FaUndo, 
  FaCheck, 
  FaCalculator, 
  FaExclamationCircle,
  FaMinus,
  FaExpand
} from "react-icons/fa";
import { Minus, X } from "lucide-react";
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
  children?: React.ReactNode;
};

const fmtNum = (n: number) => (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

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
  children,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isMinimized) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isMinimized]);

  if (!isOpen) return null;

  const cur = (n: number) => `${currencyPrefix} ${fmtNum(n)}`.trim();

  // Minimized Floating Bar State
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-6 z-50 bg-card border border-theme shadow-2xl rounded-xl px-4 py-2.5 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-main">Compensation Review: {employeeName}</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-theme/60 pl-3">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1.5 text-muted hover:text-primary rounded-lg hover:bg-app transition-colors"
            title="Restore Window"
          >
            <FaExpand className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-app transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150">
      
      {/* Outer Modal Container */}
      <div 
        className="relative w-full w-[96vw] max-w-[1400px] h-[90vh] max-h-[850px] bg-card rounded-2xl shadow-2xl border border-theme flex flex-col overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-theme bg-app/50 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FaSlidersH className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 truncate">
              <h2 className="text-sm font-semibold text-main leading-tight flex items-center gap-2 truncate">
                <span>Customize & Review Compensation</span>
                {hasCustomizations && (
                  <span className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                    Customized
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-muted truncate">
                {employeeName || "Employee"} • <span className="font-medium text-main">{salaryStructureName || "Custom Structure"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasCustomizations && onResetCustomizations && (
              <button
                type="button"
                onClick={onResetCustomizations}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-red-500/20 shadow-2xs mr-1"
                title="Reset all overrides to structure defaults"
              >
                <FaUndo className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Reset to Structure Defaults</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-main hover:bg-app transition-colors"
              title="Minimize Window"
            >
              <Minus className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-main hover:bg-app transition-colors"
              title="Close"
            >
              <FaTimes className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-theme bg-app/30 dark:bg-app/10 relative min-h-0">
          
          {/* Left Canvas Area */}
          <div className={`h-auto overflow-visible p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between ${isDrawerOpen ? "w-full lg:w-[80%]" : "w-full"}`}>
            
            {/* Compact Top Bar: Title + Tiny Inline Base Salary Field on the exact same horizontal line */}
            <div className="flex items-center justify-between mb-3 shrink-0 gap-3">
              <div className="flex items-center gap-3 flex-wrap min-w-0">

                {/* Inline Base Salary Field using custom NumericInput */}
                {onBaseSalaryChange !== undefined && (
                  <div className="flex items-center gap-1.5 bg-card border border-theme rounded-md px-2 py-0.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0">
                      Base Salary:
                    </span>
                    <div className="relative flex items-center">
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
              </div>

              {/* Floating Drawer Button anchored strictly to the far RIGHT side */}
              {!isDrawerOpen && (
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 bg-card border border-theme rounded-md shadow-2xs hover:bg-app transition-all flex items-center justify-center shrink-0 ml-auto"
                  title="Show Summary"
                >
                  <DrawerToggleIcon isOpen={false} />
                </button>
              )}
            </div>

            {/* Components Container */}
            <div className="flex-1 h-auto overflow-visible">
              {children || (
                <div className="p-8 text-center border border-dashed border-theme rounded-xl text-muted text-xs bg-card">
                  No components loaded.
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Sidebar */}
          {isDrawerOpen && (
            <div className="w-full sm:w-[260px] lg:w-[20%] min-w-[240px] max-w-[280px] bg-card/90 dark:bg-card p-3.5 sm:p-4 flex flex-col justify-between shrink-0 animate-in slide-in-from-right duration-200 border-l border-theme h-auto">
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
                      <div className="bg-card p-2.5 rounded-lg border border-theme shadow-2xs relative overflow-hidden border-l-4 border-l-emerald-500">
                        <span className="text-[9px] text-muted font-bold block uppercase tracking-wider">
                          Gross / Month
                        </span>
                        <span className="text-sm sm:text-base font-bold text-main tabular-nums truncate block mt-0.5">
                          {cur(salaryResult.gross)}
                        </span>
                      </div>

                      <div className="bg-card p-2.5 rounded-lg border border-theme shadow-2xs relative overflow-hidden border-l-4 border-l-primary">
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
                        <span className="font-semibold text-main tabular-nums">{cur(salaryResult.resolvedBase)}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted">
                        <span>Gross (Annual)</span>
                        <span className="font-semibold text-main tabular-nums">{cur(salaryResult.gross * 12)}</span>
                      </div>
                      
                      <hr className="border-theme/80 my-1" />

                      {salaryResult.monthlyTax > 0 && (
                        <div className="flex justify-between items-center text-red-500 dark:text-red-400 font-medium">
                          <span>Income Tax (Mo)</span>
                          <span className="tabular-nums">− {cur(salaryResult.monthlyTax)}</span>
                        </div>
                      )}
                      {salaryResult.deductionsTotal > 0 && (
                        <div className="flex justify-between items-center text-red-500 dark:text-red-400 font-medium">
                          <span>Todat Deductions</span>
                          <span className="tabular-nums">− {cur(salaryResult.deductionsTotal)}</span>
                        </div>
                      )}

                      <hr className="border-theme/80 my-1" />

                      <div className="flex justify-between items-center font-bold text-main pt-0.5 text-xs">
                        <span>Net Pay (Mo)</span>
                        <span className="text-primary tabular-nums">{cur(salaryResult.net)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted font-medium">
                        <span>Net Pay (Yr)</span>
                        <span className="tabular-nums font-semibold text-main">{cur(salaryResult.net * 12)}</span>
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-2.5 border-t border-theme bg-app/50 shrink-0 z-10">
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

      </div>
    </div>
  );
};

export default CompensationReviewModal;