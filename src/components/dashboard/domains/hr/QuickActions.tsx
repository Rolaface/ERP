import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  tone: "primary" | "success" | "warning" | "neutral";
  action: () => void;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickActionItem[] = [
    {
      id: "expense-claim",
      label: "Expense Claim",
      description: "Submit reimbursements",
      tone: "warning",
      action: () => navigate("/hr/emp-expenses"),
    },
    {
      id: "payslip",
      label: "Payslip",
      description: "View salary & payroll",
      tone: "neutral",
      action: () => navigate("/hr/emp-financials", { state: { tab: "salary-slip" } }),
    },
  ];

  const toneStyles: Record<QuickActionItem["tone"], string> = {
    primary:
      "border-[var(--primary)]/15 bg-[var(--primary)]/6 text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/10",
    success:
      "border-emerald-500/15 bg-emerald-500/6 text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/10",
    warning:
      "border-amber-500/15 bg-amber-500/6 text-amber-600 hover:border-amber-500/30 hover:bg-amber-500/10",
    neutral:
      "border-blue-500/15 bg-blue-500/6 text-blue-600 hover:border-blue-500/30 hover:bg-blue-500/10",
  };

  return (

    <div className="h-full flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">

      {/* Header */}
      <span className="text-xs font-semibold text-[var(--foreground)]">Quick Actions</span>

      {/* Both buttons side by side, fill remaining height */}
      <div className="flex flex-row gap-2 flex-1">
        {quickActions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.action}
            className={`
              group relative flex flex-1 items-center justify-between gap-2 overflow-hidden
              rounded-xl border px-3 py-0 text-left transition-all duration-200 hover:shadow-sm
              ${toneStyles[item.tone]}
            `}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-current opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <h4 className="relative z-10 truncate text-[12px] font-semibold tracking-tight">
              {item.label}
            </h4>
            <ArrowRight className="relative z-10 h-3.5 w-3.5 shrink-0 opacity-40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-80" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;