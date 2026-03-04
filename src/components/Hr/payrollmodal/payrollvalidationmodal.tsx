// PayrollValidationModal.tsx
// ERP-grade pre-payroll validation screen — shows blockers, warnings, and infos
// before allowing a payroll run. Inspired by Darwinbox / SAP SuccessFactors patterns.

import React, { useState, useMemo } from "react";
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ShieldCheck,
  Ban,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Banknote,
  Users,
  FileText,
  Shield,
  Calendar,
} from "lucide-react";
import type {
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
} from "../../../types/payrolltypes";

interface PayrollValidationModalProps {
  show: boolean;
  result: ValidationResult | null;
  isRunning: boolean;
  onClose: () => void;
  onProceed: () => void; // called only when canProceed === true
  onRevalidate: () => void;
}

// ── Category icons & labels ───────────────────────────────────────────────────
const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  banking: {
    icon: <Banknote className="w-4 h-4" />,
    label: "Banking",
    color: "text-info",
  },
  compliance: {
    icon: <Shield className="w-4 h-4" />,
    label: "Compliance",
    color: "text-primary",
  },
  attendance: {
    icon: <Calendar className="w-4 h-4" />,
    label: "Attendance",
    color: "text-warning",
  },
  salary: {
    icon: <Users className="w-4 h-4" />,
    label: "Salary",
    color: "text-danger",
  },
  tax: {
    icon: <FileText className="w-4 h-4" />,
    label: "Tax",
    color: "text-success",
  },
};

// ── Severity styles ───────────────────────────────────────────────────────────
const SEV: Record<
  ValidationSeverity,
  {
    bg: string;
    border: string;
    icon: React.ReactNode;
    badge: string;
    label: string;
  }
> = {
  error: {
    bg: "bg-danger/5",
    border: "border-danger/30",
    icon: <Ban className="w-4 h-4 text-danger" />,
    badge: "bg-danger/10 text-danger",
    label: "Blocker",
  },
  warning: {
    bg: "bg-warning/5",
    border: "border-warning/30",
    icon: <AlertTriangle className="w-4 h-4 text-warning" />,
    badge: "bg-warning/10 text-warning",
    label: "Warning",
  },
  info: {
    bg: "bg-info/5",
    border: "border-info/30",
    icon: <Info className="w-4 h-4 text-info" />,
    badge: "bg-info/10 text-info",
    label: "Info",
  },
};

// ── Single issue card ─────────────────────────────────────────────────────────
const IssueCard: React.FC<{ issue: ValidationIssue }> = ({ issue }) => {
  const [open, setOpen] = useState(false);
  const s = SEV[issue.severity];
  const cat = CATEGORY_META[issue.category];

  return (
    <div
      className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden transition-all`}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <span className="mt-0.5 shrink-0">{s.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-0.5">
            <span className="text-xs font-extrabold text-main">
              {issue.title}
            </span>
            {!issue.canProceed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                BLOCKS PAYROLL
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}
            >
              {s.label}
            </span>
            <span
              className={`text-[10px] font-semibold flex items-center gap-1 ${cat.color}`}
            >
              {cat.icon} {cat.label}
            </span>
          </div>
          <p className="text-xs text-muted leading-snug">{issue.description}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2 ml-2">
          <span className="text-[10px] text-muted font-mono bg-app px-2 py-0.5 rounded">
            {issue.code}
          </span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 pt-0 ml-7 space-y-2 border-t border-theme/40">
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">
                Employee
              </p>
              <p className="text-xs font-semibold text-main">
                {issue.employeeName}
              </p>
              <p className="text-[10px] text-muted">
                {issue.employeeId} · {issue.department}
              </p>
            </div>
            {issue.field && (
              <div>
                <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">
                  Affected Field
                </p>
                <code className="text-[11px] bg-app px-2 py-0.5 rounded font-mono text-main">
                  {issue.field}
                </code>
              </div>
            )}
          </div>
          {issue.suggestedAction && (
            <div className="rounded-lg bg-card border border-theme p-3">
              <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">
                Suggested Action
              </p>
              <p className="text-xs text-main">{issue.suggestedAction}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Category filter tab ───────────────────────────────────────────────────────
const CatTab: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}> = ({ label, count, active, onClick, color = "text-muted" }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
      active
        ? "bg-primary text-white shadow-sm"
        : "text-muted hover:bg-app hover:text-main"
    }`}
  >
    {label}
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${active ? "bg-white/20 text-white" : "bg-app text-muted"}`}
    >
      {count}
    </span>
  </button>
);

// ── Main modal ────────────────────────────────────────────────────────────────
export const PayrollValidationModal: React.FC<PayrollValidationModalProps> = ({
  show,
  result,
  isRunning,
  onClose,
  onProceed,
  onRevalidate,
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | ValidationSeverity>(
    "all",
  );
  const [activeCat, setActiveCat] = useState<string>("all");

  const allIssues = result
    ? [...result.errors, ...result.warnings, ...result.infos]
    : [];

  const filteredIssues = useMemo(() => {
    let out = allIssues;
    if (activeFilter !== "all")
      out = out.filter((i) => i.severity === activeFilter);
    if (activeCat !== "all") out = out.filter((i) => i.category === activeCat);
    return out;
  }, [allIssues, activeFilter, activeCat]);

  const categories = useMemo(() => {
    const cats = new Set(allIssues.map((i) => i.category));
    return Array.from(cats);
  }, [allIssues]);

  if (!show || !result) return null;

  const { canProceed, summary } = result;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div
        className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-theme overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div
          className={`px-6 py-5 border-b border-theme flex items-start justify-between ${
            !canProceed
              ? "bg-danger/5"
              : summary.warnings > 0
                ? "bg-warning/5"
                : "bg-success/5"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl mt-0.5 ${!canProceed ? "bg-danger/10" : summary.warnings > 0 ? "bg-warning/10" : "bg-success/10"}`}
            >
              {!canProceed ? (
                <Ban className="w-5 h-5 text-danger" />
              ) : summary.warnings > 0 ? (
                <AlertTriangle className="w-5 h-5 text-warning" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-success" />
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-main">
                {!canProceed
                  ? "Payroll Blocked — Validation Failed"
                  : summary.warnings > 0
                    ? "Validation Passed with Warnings"
                    : "All Checks Passed — Ready to Process"}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {summary.totalChecked} employee
                {summary.totalChecked !== 1 ? "s" : ""} validated ·{" "}
                {summary.blockers > 0 && (
                  <span className="text-danger font-bold">
                    {summary.blockers} blocker
                    {summary.blockers !== 1 ? "s" : ""} ·{" "}
                  </span>
                )}
                {summary.warnings > 0 && (
                  <span className="text-warning font-bold">
                    {summary.warnings} warning
                    {summary.warnings !== 1 ? "s" : ""} ·{" "}
                  </span>
                )}
                {summary.infos > 0 && (
                  <span className="text-info font-bold">
                    {summary.infos} info
                  </span>
                )}
                {summary.totalIssues === 0 && (
                  <span className="text-success font-bold">
                    No issues found
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-app text-muted hover:text-main transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SUMMARY STAT STRIP ── */}
        <div className="grid grid-cols-4 border-b border-theme">
          {[
            {
              label: "Checked",
              value: summary.totalChecked,
              icon: <Users className="w-4 h-4" />,
              color: "text-main",
              bg: "bg-app",
            },
            {
              label: "Blockers",
              value: summary.blockers,
              icon: <Ban className="w-4 h-4" />,
              color: summary.blockers > 0 ? "text-danger" : "text-muted",
              bg: summary.blockers > 0 ? "bg-danger/5" : "bg-app",
            },
            {
              label: "Warnings",
              value: summary.warnings,
              icon: <AlertTriangle className="w-4 h-4" />,
              color: summary.warnings > 0 ? "text-warning" : "text-muted",
              bg: summary.warnings > 0 ? "bg-warning/5" : "bg-app",
            },
            {
              label: "Info",
              value: summary.infos,
              icon: <Info className="w-4 h-4" />,
              color: "text-info",
              bg: "bg-info/5",
            },
          ].map(({ label, value, icon, color, bg }) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-5 py-4 ${bg} border-r border-theme last:border-r-0`}
            >
              <span className={color}>{icon}</span>
              <div>
                <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted uppercase tracking-wider">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── ISSUE LIST ── */}
        <div className="flex flex-col" style={{ maxHeight: "55vh" }}>
          {/* Filter bar */}
          {allIssues.length > 0 && (
            <div className="px-5 py-3 border-b border-theme bg-app flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider mr-1">
                Severity:
              </span>
              <CatTab
                label="All"
                count={allIssues.length}
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <CatTab
                label="Blockers"
                count={result.errors.length}
                active={activeFilter === "error"}
                onClick={() => setActiveFilter("error")}
              />
              <CatTab
                label="Warnings"
                count={result.warnings.length}
                active={activeFilter === "warning"}
                onClick={() => setActiveFilter("warning")}
              />
              <CatTab
                label="Info"
                count={result.infos.length}
                active={activeFilter === "info"}
                onClick={() => setActiveFilter("info")}
              />

              <div className="w-px h-4 bg-theme mx-1" />
              <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider mr-1">
                Category:
              </span>
              <CatTab
                label="All"
                count={allIssues.length}
                active={activeCat === "all"}
                onClick={() => setActiveCat("all")}
              />
              {categories.map((cat) => (
                <CatTab
                  key={cat}
                  label={CATEGORY_META[cat]?.label ?? cat}
                  count={allIssues.filter((i) => i.category === cat).length}
                  active={activeCat === cat}
                  onClick={() => setActiveCat(cat)}
                />
              ))}
            </div>
          )}

          {/* Scrollable issues */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {filteredIssues.length === 0 && allIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="p-4 bg-success/10 rounded-full">
                  <ShieldCheck className="w-10 h-10 text-success" />
                </div>
                <p className="text-sm font-bold text-main">
                  All validation checks passed!
                </p>
                <p className="text-xs text-muted text-center max-w-xs">
                  No issues found across banking, compliance, attendance,
                  salary, and tax checks. You can safely proceed with payroll.
                </p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-8 text-muted text-xs">
                No issues match the selected filter.
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 border-t border-theme bg-app flex items-center justify-between gap-3">
          {/* Left info */}
          <div className="text-xs text-muted">
            {!canProceed ? (
              <span className="flex items-center gap-1.5 text-danger font-semibold">
                <Ban className="w-3.5 h-3.5" />
                Resolve all blockers before proceeding
              </span>
            ) : summary.warnings > 0 ? (
              <span className="flex items-center gap-1.5 text-warning font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Warnings found — you may still proceed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-success font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Ready to run payroll
              </span>
            )}
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRevalidate}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 border border-theme text-muted hover:text-main rounded-lg text-xs font-semibold hover:bg-card transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`}
              />
              Re-validate
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-theme text-main rounded-lg text-xs font-semibold hover:bg-card transition"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              disabled={!canProceed || isRunning}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-extrabold transition shadow-sm ${
                canProceed && !isRunning
                  ? "bg-success text-white hover:opacity-90 shadow-success/30"
                  : "bg-app text-muted cursor-not-allowed"
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> Confirm & Process
                  Payroll
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
