import React, { useMemo } from "react";
import type { Column } from "../../components/ui/Table/type";
import type { MappedEmployee } from "../../utils/payroll_Utils/mapPayrollVerificationData";
import { avatarBg, fmtMoney, initials } from "../../utils/payroll_Utils/payrollPreview.utils";

export function usePayrollTableColumns(currency: string): Column<MappedEmployee>[] {
  return useMemo(
    () => [
      {
        key: "name",
        header: "Employee",
        sortable: true,
        align: "left",
        minWidth: "200px",
        render: (emp) => (
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${avatarBg(emp.id)}`}>
              {initials(emp.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold truncate leading-tight text-main">{emp.name}</p>
              <p className="text-[9px] text-muted font-mono leading-tight">{emp.id}</p>
              {emp.isError && (
                <p className="text-[9px] text-danger leading-tight truncate max-w-[150px]" title={emp.errorMessage ?? ""}>
                  ⚠ {emp.errorMessage}
                </p>
              )}
            </div>
          </div>
        ),
      },
      { key: "department", header: "Dept", sortable: true, minWidth: "130px", align: "left", truncate: true },
      {
        key: "totalWorkingDays", header: "Work Days", sortable: true, align: "left", minWidth: "90px",
        render: (emp) => <span className="tabular-nums">{emp.totalWorkingDays || "—"}</span>,
      },
      {
        key: "paymentDays", header: "Paid Days", sortable: true, align: "left", minWidth: "90px",
        render: (emp) => <span className="tabular-nums">{emp.paymentDays || "—"}</span>,
      },
      {
        key: "leaveWithoutPay", header: "LWP", sortable: true, align: "left", minWidth: "70px",
        render: (emp) => <span className="tabular-nums text-muted">{emp.leaveWithoutPay > 0 ? emp.leaveWithoutPay : "—"}</span>,
      },
      {
        key: "gross", header: "Gross", sortable: true, align: "left", minWidth: "140px",
        render: (emp) => <span className="tabular-nums font-bold text-main">{emp.isError ? "—" : fmtMoney(emp.gross, currency)}</span>,
      },
      {
        key: "totalDeductions", header: "Deductions", sortable: true, align: "left", minWidth: "140px",
        render: (emp) => <span className="tabular-nums text-danger">{emp.isError ? "—" : fmtMoney(emp.totalDeductions, currency)}</span>,
      },
      {
        key: "netPay", header: "Net Pay", sortable: true, align: "left", minWidth: "140px",
        render: (emp) => <span className="tabular-nums font-extrabold text-success">{emp.isError ? "—" : fmtMoney(emp.netPay, currency)}</span>,
      },
      { key: "actions", header: "", minWidth: "40px", align: "center", render: () => <span className="text-muted text-xs">›</span> },
    ],
    [currency],
  );
}