// PayslipModal.tsx
import React from "react";
import { X, Download, Mail } from "lucide-react";
import type { PayrollRecord } from "../../../types/payrolltypes";

const fmtINR = (n: number) => Number(n || 0).toLocaleString("en-IN");

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
    if (num < 1000) {
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + convert(num % 100) : "")
      );
    }
    if (num < 100000) {
      return (
        convert(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + convert(num % 1000) : "")
      );
    }
    if (num < 10000000) {
      return (
        convert(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + convert(num % 100000) : "")
      );
    }
    return (
      convert(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + convert(num % 10000000) : "")
    );
  };
  return convert(n) + " Rupees Only";
}

interface PayslipModalProps {
  record: PayrollRecord | null;
  onClose: () => void;
  onDownload: () => void;
  onEmail: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  record,
  onClose,
  onDownload,
  onEmail,
}) => {
  if (!record) return null;

  const totalDed =
    record.taxDeduction +
    record.pfDeduction +
    record.esiDeduction +
    record.professionalTax +
    record.otherDeductions;
  const lop = record.workingDays - record.paidDays;
  const period = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const fmt = (n: number) => fmtINR(n) + ".00";

  const earnRows = [
    { label: "Basic Salary", amt: record.basicSalary },
    { label: "House Rent Allowance (HRA)", amt: record.hra },
    { label: "Allowances", amt: record.allowances },
    ...(record.overtimePay > 0
      ? [{ label: "Overtime Pay", amt: record.overtimePay }]
      : []),
    ...(record.totalBonus > 0
      ? [{ label: "Bonus", amt: record.totalBonus }]
      : []),
    ...(record.arrears > 0 ? [{ label: "Arrears", amt: record.arrears }] : []),
  ];
  const dedRows = [
    { label: `PAYE (${record.taxRegime} Regime)`, amt: record.taxDeduction },
    { label: "Provident Fund (12%)", amt: record.pfDeduction },
    { label: "Professional Tax", amt: record.professionalTax },
    ...(record.esiDeduction > 0
      ? [{ label: "ESI (0.75%)", amt: record.esiDeduction }]
      : []),
    { label: "Other Deductions", amt: record.otherDeductions },
  ];

  const rows = Math.max(earnRows.length, dedRows.length);
  const ep = [...earnRows, ...Array(rows - earnRows.length).fill(null)];
  const dp = [...dedRows, ...Array(rows - dedRows.length).fill(null)];

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "93vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500">
            Salary Slip · {period}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-white transition"
            >
              <Download className="w-3 h-3" /> Download
            </button>
            <button
              onClick={onEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-white transition"
            >
              <Mail className="w-3 h-3" /> Email
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div
            className="px-8 py-7"
            style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}
          >
            {/* Company header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  I
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 leading-none">
                    Izyane InovSolutions Pvt. Ltd.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    HR & Payroll Division
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                  Payslip For The Month
                </p>
                <p className="text-sm font-extrabold text-slate-900">
                  {period}
                </p>
              </div>
            </div>

            {/* Employee info + Net Pay box */}
            <div className="flex gap-5 mb-5">
              <div className="flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Employee Summary
                </p>
                <table className="w-full">
                  <tbody>
                    {[
                      ["Employee Name", record.employeeName],
                      ["Designation", record.designation],
                      ["Employee ID", record.employeeId],
                      ["PF Number", record.pfNumber],
                      ["PAN Number", record.panNumber],
                      ["Date of Joining", record.joiningDate],
                      ["Pay Period", period],
                      ["Pay Date", record.paymentDate ?? "Pending"],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td className="text-[11px] text-slate-500 py-[3px] pr-2 w-36 whitespace-nowrap">
                          {l}
                        </td>
                        <td className="text-[11px] text-slate-400 pr-2 w-3">
                          :
                        </td>
                        <td className="text-[11px] font-semibold text-slate-800">
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Net pay highlight */}
              <div className="w-44 shrink-0 self-start">
                <div className="rounded-xl border-2 border-slate-200 overflow-hidden">
                  <div
                    className="px-4 py-3 border-b border-slate-200"
                    style={{ background: "#f0faf5" }}
                  >
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">
                      Net Pay
                    </p>
                    <p className="text-xl font-extrabold text-slate-900 font-mono">
                      ₹{fmtINR(record.netPay)}
                    </p>
                  </div>
                  <div className="px-4 py-2.5 space-y-1.5 bg-white">
                    {[
                      ["Paid Days", record.paidDays],
                      ["LOP Days", lop],
                      ["Working Days", record.workingDays],
                    ].map(([l, v]) => (
                      <div
                        key={String(l)}
                        className="flex justify-between text-[11px]"
                      >
                        <span className="text-slate-500">{l}</span>
                        <span className="font-bold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings / Deductions table */}
            <table
              className="w-full text-[11px] border-collapse"
              style={{ border: "1px solid #e2e8f0" }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Earnings", "Amount", "Deductions", "Amount"].map(
                    (h, i) => (
                      <th
                        key={i}
                        className={`py-2 px-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500 ${i % 2 === 1 ? "text-right" : "text-left"}`}
                        style={{
                          border: "1px solid #e2e8f0",
                          width: i % 2 === 0 ? "38%" : "12%",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                  <tr
                    key={i}
                    style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    <td
                      className="px-3 py-[7px] text-slate-700"
                      style={{ border: "1px solid #e2e8f0" }}
                    >
                      {ep[i]?.label ?? ""}
                    </td>
                    <td
                      className="px-3 py-[7px] text-right font-mono text-slate-800"
                      style={{ border: "1px solid #e2e8f0" }}
                    >
                      {ep[i] ? fmt(ep[i]!.amt) : ""}
                    </td>
                    <td
                      className="px-3 py-[7px] text-slate-700"
                      style={{ border: "1px solid #e2e8f0" }}
                    >
                      {dp[i]?.label ?? ""}
                    </td>
                    <td
                      className="px-3 py-[7px] text-right font-mono text-slate-800"
                      style={{ border: "1px solid #e2e8f0" }}
                    >
                      {dp[i] ? fmt(dp[i]!.amt) : ""}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: "#f1f5f9", fontWeight: 700 }}>
                  <td
                    className="px-3 py-2.5 text-slate-800"
                    style={{ border: "1px solid #cbd5e1" }}
                  >
                    Gross Earnings
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-mono text-slate-900"
                    style={{ border: "1px solid #cbd5e1" }}
                  >
                    ₹{fmt(record.grossPay)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-slate-800"
                    style={{ border: "1px solid #cbd5e1" }}
                  >
                    Total Deductions
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-mono text-slate-900"
                    style={{ border: "1px solid #cbd5e1" }}
                  >
                    ₹{fmt(totalDed)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Net payable */}
            <div
              className="flex items-center justify-between px-3 py-2.5 border border-t-0 border-slate-200 mb-3"
              style={{ background: "#f8fafc" }}
            >
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
                  Total Net Payable
                </p>
                <p className="text-[9px] text-slate-400">
                  Gross Earnings − Total Deductions
                </p>
              </div>
              <p className="text-sm font-extrabold font-mono text-slate-900">
                ₹{fmt(record.netPay)}
              </p>
            </div>

            <p className="text-right text-[10px] text-slate-500 mb-5">
              Amount In Words:{" "}
              <em className="not-italic font-semibold text-slate-700">
                {toWords(record.netPay)}
              </em>
            </p>

            <div className="border-t border-slate-200 pt-3 text-center">
              <p className="text-[9px] italic text-slate-400">
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
