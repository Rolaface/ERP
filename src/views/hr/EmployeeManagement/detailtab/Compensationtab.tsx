import React from "react";
import { DollarSign, CreditCard } from "lucide-react";
import { fmt, fmtMoney } from "../detailtab/Employeehelpers";
import { Field, Section } from "../detailtab/Employeeuiprimitives";

interface Props {
  emp: any;
  currency: string;
}

export const CompensationTab: React.FC<Props> = ({ emp, currency }) => (
  <div className="space-y-5">
    {/* ── Salary ── */}
    <Section title="Salary" icon={<DollarSign className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Field label="Salary Structure" value={fmt(emp.salary_structure)} />
        <Field label="Currency" value={fmt(emp.salary_currency)} />
        <Field label="Salary Mode" value={fmt(emp.salary_mode)} />
        <Field label="CTC / Gross" value={fmtMoney(emp.ctc, currency)} />
      </div>

      {/* CTC highlight bar */}
      <div className="mt-4 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <span className="text-xs font-semibold text-main">Total CTC</span>
        <span className="text-base font-bold text-primary">
          {fmtMoney(emp.ctc, currency) || "—"}
        </span>
      </div>
    </Section>

    {/* ── Bank Account ── */}
    <Section title="Bank Account" icon={<CreditCard className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Field label="Bank Name" value={fmt(emp.bank_name)} />
        <Field label="Account Number" value={fmt(emp.bank_ac_no)} mono />
        <Field label="Account Type" value={fmt(emp.account_type)} />
        <Field label="Branch Code" value={fmt(emp.branch_code)} mono />
      </div>
    </Section>
  </div>
);