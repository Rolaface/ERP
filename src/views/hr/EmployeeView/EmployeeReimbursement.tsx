import React, { useState } from "react";
import { Receipt, Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { AppSubTabs } from "../../../components/ui/app-shell";

const DUMMY_CLAIMS = [
  { id: "1", title: "Travel — Client Visit",  amount: 3500,  date: "10 May 2026", category: "Travel",   status: "Approved" },
  { id: "2", title: "Team Lunch",             amount: 1800,  date: "07 May 2026", category: "Food",     status: "Pending" },
  { id: "3", title: "Internet Reimbursement", amount: 999,   date: "01 May 2026", category: "Utility",  status: "Approved" },
  { id: "4", title: "Conference Fee",         amount: 15000, date: "20 Apr 2026", category: "Training", status: "Rejected" },
];

const statusIcon: Record<string, React.ReactNode> = {
  Approved: <CheckCircle size={13} className="text-green-600" />,
  Pending:  <Clock size={13} className="text-amber-500" />,
  Rejected: <XCircle size={13} className="text-red-500" />,
};

const statusCls: Record<string, string> = {
  Approved: "bg-green-100 text-green-700",
  Pending:  "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-500",
};

const ClaimsList: React.FC = () => (
  <div className="p-4 space-y-3">
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: "Total Claimed",  value: "₹ 21,299", cls: "text-[var(--text)]" },
        { label: "Approved",       value: "₹ 4,499",  cls: "text-green-600" },
        { label: "Pending",        value: "₹ 1,800",  cls: "text-amber-600" },
      ].map((s) => (
        <div
          key={s.label}
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center"
        >
          <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{s.label}</p>
        </div>
      ))}
    </div>

    {DUMMY_CLAIMS.map((claim) => (
      <div
        key={claim.id}
        className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-xl px-5 py-4 hover:bg-[var(--row-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg shrink-0"
            style={{
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color:       "var(--primary)",
            }}
          >
            <Receipt size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">{claim.title}</p>
            <p className="text-xs text-[var(--muted)]">
              {claim.category} · {claim.date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-[var(--text)]">
            ₹ {claim.amount.toLocaleString("en-IN")}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls[claim.status]}`}>
            {statusIcon[claim.status]}
            {claim.status}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const ApplyForm: React.FC = () => (
  <div className="p-4">
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-lg mx-auto space-y-4">
      <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">
        New Expense Claim
      </h3>

      {[
        { label: "Expense Title",    type: "text",   placeholder: "e.g. Travel to client site" },
        { label: "Amount (₹)",       type: "number", placeholder: "0.00" },
        { label: "Expense Date",     type: "date",   placeholder: "" },
      ].map((f) => (
        <div key={f.label}>
          <label className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">
            {f.label}
          </label>
          <input
            type={f.type}
            placeholder={f.placeholder}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>
      ))}

      <div>
        <label className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">
          Category
        </label>
        <select className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors">
          <option>Travel</option>
          <option>Food</option>
          <option>Training</option>
          <option>Utility</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="Brief description of the expense..."
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors resize-none"
        />
      </div>

      <button
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        style={{ background: "var(--primary)" }}
      >
        <Plus size={15} /> Submit Claim
      </button>
    </div>
  </div>
);

const REIMBURSE_TABS = [
  { id: "claims", label: "My Claims" },
  { id: "apply",  label: "Apply New" },
];

const EmployeeReimbursement: React.FC = () => {
  const [tab, setTab] = useState("claims");
  return (
    <div className="h-full flex flex-col">
      <AppSubTabs tabs={REIMBURSE_TABS} activeTab={tab} onChange={setTab} />
      <div className="flex-1 overflow-y-auto">
        {tab === "claims" && <ClaimsList />}
        {tab === "apply"  && <ApplyForm />}
      </div>
    </div>
  );
};

export default EmployeeReimbursement;