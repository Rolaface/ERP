// TaxDeduction.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getEmployeeById } from "../../../api/employeeapi";

interface TaxDeductionProps {
  employeeId: string;
}

const TaxDeduction: React.FC<TaxDeductionProps> = ({ employeeId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await getEmployeeById(employeeId);
        if (!mounted) return;
        setData(resp);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load statutory deductions");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const statutory = data?.payrollInfo?.statutoryDeductions || {};
  const rows = useMemo(
    () => [
      { label: "NAPSA (Employee Rate)", value: statutory?.napsaEmployeeRate, unit: "%" },
      { label: "NAPSA (Employer Rate)", value: statutory?.napsaEmployerRate, unit: "%" },
      { label: "NHIMA Rate", value: statutory?.nhimaRate, unit: "%" },
      { label: "PAYE Amount", value: statutory?.payeAmount, unit: "" },
    ],
    [statutory?.napsaEmployeeRate, statutory?.napsaEmployerRate, statutory?.nhimaRate, statutory?.payeAmount],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-app border border-theme rounded-xl p-4">
        <div>
          <h2 className="text-sm font-extrabold text-main">Statutory Deductions</h2>
          <p className="text-xs text-muted mt-0.5">Live data from employee payroll profile</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-theme bg-app p-6 text-sm text-muted">Loading…</div>
      ) : error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-6">
          <div className="text-sm font-bold text-danger">Failed to load</div>
          <div className="text-xs text-danger/80 mt-1">{error}</div>
        </div>
      ) : (
        <div className="border border-theme rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-app border-b border-theme">
              <tr>
                <th className="px-5 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-left">Type</th>
                <th className="px-5 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={`border-b border-theme last:border-0 ${i % 2 === 1 ? "bg-app" : "bg-card"}`}>
                  <td className="px-5 py-3 text-xs font-semibold text-main">{r.label}</td>
                  <td className="px-5 py-3 text-right text-xs font-mono font-semibold text-main tabular-nums">
                    {r.value ?? "—"}{r.value !== undefined && r.value !== null && r.unit ? r.unit : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaxDeduction;