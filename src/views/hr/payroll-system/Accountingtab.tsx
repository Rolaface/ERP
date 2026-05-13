import React, { useMemo, useState } from "react";

import type { PayrollEntry, Employee } from "../../../types/payrolltypes";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { getAllBankAccounts } from "../../../api/BankAccountApi";
import { getPayrollPaymentAccounts } from "../../../api/faapi";
import CostCenterSelect from "../../../components/selects/CostCenterSelect";
import ProjectSelect from "../../../components/selects/ProjectSelect";
const Label: React.FC<{
  children: React.ReactNode;
  required?: boolean;
}> = ({ children, required }) => (
  <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
    {children}
    {required && <span className="text-danger ml-0.5">*</span>}
  </label>
);

interface AccountingTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  employees: Employee[];
}

export const AccountingTab: React.FC<AccountingTabProps> = ({
  data,
  onChange,
  employees,
}) => {
  const selectedEmps = employees.filter((e) =>
    data.selectedEmployees.includes(e.id),
  );
  const totalGross = selectedEmps.reduce(
    (s, e) => s + e.basicSalary + e.hra + e.allowances,
    0,
  );

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
      <div className="grid grid-cols-2 gap-5">
        <div>
          <SearchSelect2
            label="Payment Account"
            value={data.paymentAccount}
            placeholder="Search payment account..."
            fetchOptions={(q) =>
              getPayrollPaymentAccounts(
                JSON.parse(localStorage.getItem("company-info") || "{}")?.state
                  ?.companyName || "",
                q,
              )
            }
            onChange={(val: any) => {
              const value = typeof val === "string" ? val : val?.value;

              onChange("paymentAccount", value);
            }}
          />
        </div>

        <div>
          <SearchSelect2
            label="Bank Account"
            value={data.bankAccount}
            placeholder="Search bank account..."
            fetchOptions={async (q) => {
              const resp = await getAllBankAccounts({
                company: true,
                search: q,
                page: 1,
                page_size: 20,
              });

              console.log("BANK RESP", resp);

              return (resp?.data || []).map((item: any) => ({
                label: `${item.bankName || "Unknown Bank"}${
                  item.currency ? ` (${item.currency})` : ""
                }`,

                value: item.id || item.name || "",
              }));
            }}
            onChange={(val: any) => {
              const value = typeof val === "string" ? val : val?.value || "";

              onChange("bankAccount", value);
            }}
          />
        </div>

        <div>
          {/* payload: cost_center (optional) */}

          <CostCenterSelect
            value={data.costCenter}
            onChange={(value: string) => onChange("costCenter", value)}
          />
        </div>

        <div>
          <ProjectSelect
            value={data.project}
            onChange={(value: string) => onChange("project", value)}
          />
        </div>

        {/* <div>
          <Label>Letter Head</Label>
          <input
            type="text"
            value={data.letterHead}
            onChange={(e) => onChange("letterHead", e.target.value)}
            placeholder="e.g. Izyane Official"
          />
        </div> */}
      </div>

      {/* Summary card */}
      {data.selectedEmployees.length > 0 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-5">
          <p className="text-xs font-extrabold text-success uppercase tracking-wider mb-4">
            Payroll Summary
          </p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Employees", value: data.selectedEmployees.length },
              {
                label: "Est. Gross",
                value: `₹${totalGross.toLocaleString("en-IN")}`,
              },
              { label: "Currency", value: data.currency },
              { label: "Frequency", value: data.payrollFrequency || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-success/70 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-lg font-extrabold text-success mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory note */}
      <div className="rounded-xl bg-info/5 border border-info/20 p-4"></div>
    </div>
  );
};
