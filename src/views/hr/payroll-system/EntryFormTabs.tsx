// EntryFormTabs.tsx — New Payroll Entry: Overview, Employees, Accounting tabs
// Fields aligned to Create Payroll Entry API payload

import React from "react";
import { Edit2 } from "lucide-react";
import type { PayrollEntry, Employee } from "../../../types/payrolltypes";

// ── Primitives ────────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
    {children}{required && <span className="text-danger ml-0.5">*</span>}
  </label>
);

const inputCls  = "w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition";
const selectCls = "w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main focus:outline-none focus:border-primary transition cursor-pointer";

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB
// Maps to payload: payroll_frequency, posting_date, start_date, end_date,
//                  currency, exchange_rate, payroll_payable_account,
//                  deduct_tax_for_unsubmitted_tax_exemption_proof,
//                  salary_slip_based_on_timesheet
// ─────────────────────────────────────────────────────────────────────────────
interface OverviewTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onChange }) => (
  <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
    <div className="grid grid-cols-3 gap-5">
      <div>
        <Label required>Payroll Name</Label>
        <input
          type="text"
          value={data.payrollName}
          onChange={e => onChange("payrollName", e.target.value)}
          placeholder="e.g. May 2026 Payroll"
          className={inputCls}
        />
      </div>
      <div>
        {/* payload: posting_date */}
        <Label required>Posting Date</Label>
        <input
          type="date"
          value={data.postingDate}
          onChange={e => onChange("postingDate", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        {/* payload: payroll_frequency */}
        <Label required>Payroll Frequency</Label>
        <select
          value={data.payrollFrequency}
          onChange={e => onChange("payrollFrequency", e.target.value)}
          className={selectCls}
        >
          <option value="">Select frequency</option>
          <option value="Monthly">Monthly</option>
          <option value="Biweekly">Biweekly</option>
          <option value="Weekly">Weekly</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-5">
      <div>
        {/* payload: start_date */}
        <Label required>Pay Period Start</Label>
        <input
          type="date"
          value={data.startDate}
          onChange={e => onChange("startDate", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        {/* payload: end_date */}
        <Label required>Pay Period End</Label>
        <input
          type="date"
          value={data.endDate}
          onChange={e => onChange("endDate", e.target.value)}
          className={inputCls}
        />
      </div>
    </div>

    <div className="grid grid-cols-3 gap-5">
      <div>
        {/* payload: currency */}
        <Label required>Currency</Label>
        <select
          value={data.currency}
          onChange={e => onChange("currency", e.target.value)}
          className={selectCls}
        >
          <option value="INR">INR — Indian Rupee</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
        </select>
      </div>
      <div>
        {/* payload: exchange_rate */}
        <Label required>Exchange Rate</Label>
        <input
          type="number"
          min={1}
          step={0.01}
          value={data.exchangeRate ?? 93}
          onChange={e => onChange("exchangeRate", parseFloat(e.target.value) || 1)}
          className={inputCls}
        />
      </div>
      <div>
        <Label required>Company</Label>
        <input
          type="text"
          value={data.company}
          onChange={e => onChange("company", e.target.value)}
          className={inputCls}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-5">
      <div>
        {/* payload: payroll_payable_account */}
        <Label required>Payroll Payable Account</Label>
        <select
          value={data.payrollPayableAccount}
          onChange={e => onChange("payrollPayableAccount", e.target.value)}
          className={selectCls}
        >
          <option value="Payroll Payable - RPL">Payroll Payable - RPL</option>
          <option value="Payroll Payable - I">Payroll Payable - I</option>
          <option value="Payroll Payable - II">Payroll Payable - II</option>
        </select>
      </div>
      <div className="flex items-end">
        {/* payload hint */}
        <p className="text-[10px] text-muted leading-relaxed">
          Default account used for posting payroll journal entries. Must match your company's chart of accounts.
        </p>
      </div>
    </div>

    {/* Toggles */}
    <div className="grid grid-cols-2 gap-4">
      {[
        {
          field: "deductTaxForProof",
          label: "Deduct Tax for Unsubmitted Proof",
          desc:  "Apply TDS even if investment proofs are not yet submitted (payload: deduct_tax_for_unsubmitted_tax_exemption_proof)",
        },
        {
          field: "salarySlipTimesheet",
          label: "Salary Slip Based on Timesheet",
          desc:  "Calculate pay using logged timesheet hours (payload: salary_slip_based_on_timesheet)",
        },
      ].map(({ field, label, desc }) => (
        <label
          key={field}
          className="flex items-start gap-3 p-4 bg-app border border-theme rounded-xl cursor-pointer hover:border-primary/40 transition"
        >
          <input
            type="checkbox"
            checked={!!(data as any)[field]}
            onChange={e => onChange(field, e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary cursor-pointer shrink-0"
          />
          <div>
            <p className="text-xs font-bold text-main">{label}</p>
            <p className="text-[10px] text-muted mt-0.5">{desc}</p>
          </div>
        </label>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES TAB
// Maps to payload: employees[].employee (the employee ID / doc name)
//                  employees[].is_salary_withheld (always 0 here)
// ─────────────────────────────────────────────────────────────────────────────
interface EmployeesTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  employees: Employee[];
  onEditEmployee?: (emp: Employee) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  data, onChange, employees, onEditEmployee,
}) => {
  const active = employees.filter(e => e.isActive);
  const toggleEmp = (id: string) => {
    const next = data.selectedEmployees.includes(id)
      ? data.selectedEmployees.filter(i => i !== id)
      : [...data.selectedEmployees, id];
    onChange("selectedEmployees", next);
  };
  const selectAll = () => {
    const all = active.map(e => e.id);
    onChange("selectedEmployees", data.selectedEmployees.length === all.length ? [] : all);
  };

  return (
    <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
      {/* Filter row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { field: "branch",      label: "Branch",      ph: "All branches" },
          { field: "department",  label: "Department",  ph: "All departments" },
          { field: "designation", label: "Designation", ph: "All designations" },
          { field: "grade",       label: "Grade",       ph: "All grades" },
        ].map(({ field, label, ph }) => (
          <div key={field}>
            <Label>{label}</Label>
            <input
              type="text"
              value={(data as any)[field] ?? ""}
              onChange={e => onChange(field, e.target.value)}
              placeholder={ph}
              className={inputCls}
            />
          </div>
        ))}
      </div>

      {/* Select-all bar */}
      <div className="flex items-center justify-between py-2.5 px-4 bg-app border border-theme rounded-xl">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-main">
          <input
            type="checkbox"
            checked={data.selectedEmployees.length === active.length && active.length > 0}
            onChange={selectAll}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          Select All Employees
        </label>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {data.selectedEmployees.length}/{active.length} selected
        </span>
      </div>

      {/* Payload note */}
      <p className="text-[10px] text-muted px-1">
        Selected employee IDs map to <code className="bg-app px-1 rounded">employees[].employee</code> in the API payload.
        Each entry is submitted with <code className="bg-app px-1 rounded">is_salary_withheld: 0</code> by default.
      </p>

      {/* Employee list */}
      <div className="border border-theme rounded-xl overflow-hidden">
        {active.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">No active employees found</div>
        ) : (
          active.map((emp, i) => {
            const isSel    = data.selectedEmployees.includes(emp.id);
            const gross    = emp.basicSalary + emp.hra + emp.allowances;
            const initials = emp.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div
                key={emp.id}
                onClick={() => toggleEmp(emp.id)}
                className={`flex items-center gap-4 p-4 border-b border-theme last:border-0 cursor-pointer transition-colors ${
                  isSel ? "bg-primary/5" : i % 2 === 1 ? "bg-app hover:bg-primary/3" : "bg-card hover:bg-app"
                }`}
              >
                <input type="checkbox" checked={isSel} onChange={() => {}} className="w-4 h-4 accent-primary cursor-pointer shrink-0" />

                <div className={`w-9 h-9 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 transition-colors ${
                  isSel ? "bg-primary text-white" : "bg-app text-muted"
                }`}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-main leading-tight">{emp.name}</p>
                    {/* This is the value sent as employees[].employee in the payload */}
                    <p className="text-[10px] text-muted font-mono">{emp.id}</p>
                  </div>
                  <p className="text-xs text-muted">{emp.department}</p>
                  <p className="text-xs text-muted">{emp.designation}</p>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-main tabular-nums">₹{gross.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted">Gross</p>
                  </div>
                </div>

                {onEditEmployee && (
                  <button
                    onClick={e => { e.stopPropagation(); onEditEmployee(emp); }}
                    className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING TAB
// Maps to payload: payment_account, bank_account, cost_center, project
// ─────────────────────────────────────────────────────────────────────────────
interface AccountingTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  employees: Employee[];
}

export const AccountingTab: React.FC<AccountingTabProps> = ({ data, onChange, employees }) => {
  const selectedEmps = employees.filter(e => data.selectedEmployees.includes(e.id));
  const totalGross   = selectedEmps.reduce((s, e) => s + e.basicSalary + e.hra + e.allowances, 0);

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
      <div className="grid grid-cols-2 gap-5">
        <div>
          {/* payload: payment_account */}
          <Label required>Payment Account</Label>
          <select
            value={data.paymentAccount}
            onChange={e => onChange("paymentAccount", e.target.value)}
            className={selectCls}
          >
            <option value="">Select account</option>
            <option value="HDFC Bank - RPL">HDFC Bank - RPL</option>
            <option value="current-hdfc">Current A/C — HDFC Bank</option>
            <option value="current-icici">Current A/C — ICICI Bank</option>
            <option value="current-sbi">Current A/C — SBI</option>
          </select>
        </div>

        <div>
          {/* payload: bank_account */}
          <Label required>Bank Account</Label>
          <select
            value={data.bankAccount ?? ""}
            onChange={e => onChange("bankAccount", e.target.value)}
            className={selectCls}
          >
            <option value="">Select bank account</option>
            <option value="HDFC Current Account - HDFC Bank">HDFC Current Account - HDFC Bank</option>
            <option value="ICICI Current Account - ICICI Bank">ICICI Current Account - ICICI Bank</option>
            <option value="SBI Current Account - SBI">SBI Current Account - SBI</option>
          </select>
        </div>

        <div>
          {/* payload: cost_center (optional) */}
          <Label>Cost Center</Label>
          <input
            type="text"
            value={data.costCenter}
            onChange={e => onChange("costCenter", e.target.value)}
            placeholder="e.g. Main - RPL"
            className={inputCls}
          />
        </div>

        <div>
          {/* payload: project (optional) */}
          <Label>Project</Label>
          <input
            type="text"
            value={data.project}
            onChange={e => onChange("project", e.target.value)}
            placeholder="e.g. Internal Payroll Q2"
            className={inputCls}
          />
        </div>

        <div>
          <Label>Letter Head</Label>
          <input
            type="text"
            value={data.letterHead}
            onChange={e => onChange("letterHead", e.target.value)}
            placeholder="e.g. Izyane Official"
            className={inputCls}
          />
        </div>
      </div>

      {/* Payload preview */}
      {data.selectedEmployees.length > 0 && (
        <div className="rounded-xl border border-theme bg-app p-4 font-mono text-[11px] text-muted overflow-x-auto">
          <p className="text-[10px] font-extrabold text-main uppercase tracking-wider mb-3 font-sans">API Payload Preview</p>
          <pre className="whitespace-pre-wrap break-all leading-relaxed">{JSON.stringify({
            payroll_frequency:    data.payrollFrequency || "Monthly",
            posting_date:         data.postingDate,
            start_date:           data.startDate,
            end_date:             data.endDate,
            exchange_rate:        data.exchangeRate ?? 93,
            payroll_payable_account: data.payrollPayableAccount,
            payment_account:      data.paymentAccount,
            bank_account:         data.bankAccount ?? "",
            ...(data.costCenter ? { cost_center: data.costCenter } : {}),
            ...(data.project    ? { project: data.project }        : {}),
            currency:             data.currency,
            deduct_tax_for_unsubmitted_tax_exemption_proof: data.deductTaxForProof ? 1 : 0,
            salary_slip_based_on_timesheet:                 data.salarySlipTimesheet ? 1 : 0,
            employees: data.selectedEmployees.map(id => ({ employee: id, is_salary_withheld: 0 })),
          }, null, 2)}</pre>
        </div>
      )}

      {/* Summary card */}
      {data.selectedEmployees.length > 0 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-5">
          <p className="text-xs font-extrabold text-success uppercase tracking-wider mb-4">Payroll Summary</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Employees",   value: data.selectedEmployees.length },
              { label: "Est. Gross",  value: `₹${totalGross.toLocaleString("en-IN")}` },
              { label: "Currency",    value: data.currency },
              { label: "Frequency",   value: data.payrollFrequency || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-success/70 uppercase tracking-wider">{label}</p>
                <p className="text-lg font-extrabold text-success mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory note */}
      <div className="rounded-xl bg-info/5 border border-info/20 p-4">
        <p className="text-xs font-extrabold text-info mb-2">Statutory Deductions (Auto-calculated)</p>
        <div className="grid grid-cols-3 gap-3 text-xs text-info/70">
          <div>• Provident Fund (PF) — 12% of Basic</div>
          <div>• ESI — 0.75% (if gross ≤ ₹21,000)</div>
          <div>• Professional Tax — ₹200/month</div>
          <div>• Income Tax — As per IT Declaration</div>
          <div>• Employer PF — 12% (additional)</div>
          <div>• Employer ESI — 3.25%</div>
        </div>
      </div>
    </div>
  );
};