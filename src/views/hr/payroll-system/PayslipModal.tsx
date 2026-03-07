import React from "react";
import { X, Download, Mail } from "lucide-react";
import type { PayrollRecord } from "../../../types/payrolltypes";

interface PayslipModalProps {
  record: PayrollRecord | null;
  onClose: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
}

function toWords(n: number): string {
  if (n === 0) return "Zero Rupees Only";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + convert(num % 100) : "")
      );
    if (num < 100000)
      return (
        convert(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + convert(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        convert(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + convert(num % 100000) : "")
      );
    return (
      convert(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + convert(num % 10000000) : "")
    );
  };
  return convert(n) + " Rupees Only";
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  record,
  onClose,
  onDownload,
  onEmail,
}) => {
  if (!record) return null;

  const totalDed =
    record.taxDeduction + record.pfDeduction + record.otherDeductions;
  const lop = record.workingDays - record.paidDays;
  const period = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const earningsRows = [
    { label: "Basic Salary", amount: record.basicSalary },
    { label: "House Rent Allowance (HRA)", amount: record.hra },
    { label: "Allowances", amount: record.allowances },
    ...(record.arrears > 0
      ? [{ label: "Arrears", amount: record.arrears }]
      : []),
  ];

  const deductionRows = [
    { label: `PAYE (${record.taxRegime})`, amount: record.taxDeduction },
    { label: "Provident Fund", amount: record.pfDeduction },
    { label: "Other Deductions", amount: record.otherDeductions },
  ];

  const maxRows = Math.max(earningsRows.length, deductionRows.length);
  // Pad arrays
  const ePadded = [
    ...earningsRows,
    ...Array(maxRows - earningsRows.length).fill(null),
  ];
  const dPadded = [
    ...deductionRows,
    ...Array(maxRows - deductionRows.length).fill(null),
  ];

  const fmt = (n: number) => n.toLocaleString("en-IN") + ".00";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-card border border-theme rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: "94vh" }}
      >
        {/* ── Action bar ── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-app border-b border-theme">
          <span className="text-xs font-semibold text-muted">
            Salary Slip · {period}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-theme text-main rounded-lg text-[11px] font-semibold hover:bg-muted/5 transition"
            >
              <Download className="w-3 h-3" /> Download
            </button>
            <button
              onClick={onEmail}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-theme text-main rounded-lg text-[11px] font-semibold hover:bg-muted/5 transition"
            >
              <Mail className="w-3 h-3" /> Email
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted/10 rounded-lg text-muted hover:text-main transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Document ── */}
        <div className="flex-1 overflow-y-auto bg-card">
          <div
            className="px-8 py-7"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {/* Company header */}
            <div className="flex items-start justify-between pb-4 border-b border-theme">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                  I
                </div>
                <div>
                  <p className="text-sm font-bold text-main leading-tight">
                    Izyane InovSolutions Pvt. Ltd.
                  </p>
                  <p className="text-[10px] text-muted">
                    ERP · Human Resources Division
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-muted uppercase tracking-wider">
                  Payslip For The Month
                </p>
                <p className="text-sm font-bold text-main">{period}</p>
              </div>
            </div>

            {/* Employee info + net pay box */}
            <div className="flex gap-5 mt-4 mb-5">
              {/* Left: employee table */}
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
                  Employee Summary
                </p>
                <table className="w-full">
                  <tbody>
                    {[
                      ["Employee Name", record.employeeName],
                      ["Designation", record.designation],
                      ["Employee ID", record.employeeId],
                      ["PF Number", record.pfNumber],
                      ["Date of Joining", record.joiningDate],
                      ["Pay Period", period],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td className="text-[11px] text-muted py-0.5 pr-2 w-36 whitespace-nowrap">
                          {l}
                        </td>
                        <td className="text-[11px] text-muted/70 py-0.5 pr-2 w-3">
                          :
                        </td>
                        <td className="text-[11px] font-medium text-main py-0.5">
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right: net pay card */}
              <div className="w-44 shrink-0">
                <div className="border border-theme rounded-lg overflow-hidden">
                  <div className="bg-app px-4 py-3 border-b border-theme">
                    <p className="text-[10px] text-muted leading-none mb-1">
                      Employee Net Pay
                    </p>
                    <p className="text-xl font-bold font-mono text-main">
                      ₹{record.netPay.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="px-4 py-2.5 space-y-1.5">
                    {[
                      ["Paid Days", `${record.paidDays}`],
                      ["LOP Days", `${lop}`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-[11px]">
                        <span className="text-muted">{l}</span>
                        <span className="font-semibold text-main">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Earnings | Deductions table ── */}
            <table className="w-full border-collapse border border-theme text-[11px] mb-0">
              <thead>
                <tr className="bg-app">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted border border-theme w-[38%]">
                    Earnings
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted border border-theme w-[12%]">
                    Amount
                  </th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted border border-theme w-[38%]">
                    Deductions
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted border border-theme w-[12%]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-app"}>
                    <td className="px-3 py-2 text-main border border-theme">
                      {ePadded[i]?.label ?? ""}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-main border border-theme">
                      {ePadded[i] ? fmt(ePadded[i]!.amount) : ""}
                    </td>
                    <td className="px-3 py-2 text-main border border-theme">
                      {dPadded[i]?.label ?? ""}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-main border border-theme">
                      {dPadded[i] ? fmt(dPadded[i]!.amount) : ""}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-app">
                  <td className="px-3 py-2.5 font-bold text-main border border-theme">
                    Gross Earnings
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono text-main border border-theme">
                    ₹{fmt(record.grossPay)}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-main border border-theme">
                    Total Deductions
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono text-main border border-theme">
                    ₹{fmt(totalDed)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Net Payable */}
            <div className="flex items-center justify-between px-3 py-2.5 border border-t-0 border-theme bg-app mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-main">
                  Total Net Payable
                </p>
                <p className="text-[9px] text-muted">
                  Gross Earnings − Total Deductions
                </p>
              </div>
              <p className="text-base font-bold font-mono text-main">
                ₹{fmt(record.netPay)}
              </p>
            </div>

            {/* Amount in words */}
            <p className="text-right text-[10px] text-muted mb-5">
              Amount In Words:{" "}
              <span className="italic font-medium text-main">
                {toWords(record.netPay)}
              </span>
            </p>

            {/* Footer */}
            <div className="border-t border-theme pt-3 text-center">
              <p className="text-[9px] text-muted italic">
                — This is a system-generated payslip, hence the signature is not
                required. —
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
