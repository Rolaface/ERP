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
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
    return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
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

  const totalDed = record.taxDeduction + record.pfDeduction + record.otherDeductions;
  const lop = record.workingDays - record.paidDays;
  const period = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const earningsRows = [
    { label: "Basic Salary", amount: record.basicSalary },
    { label: "House Rent Allowance (HRA)", amount: record.hra },
    { label: "Allowances", amount: record.allowances },
    ...(record.arrears > 0 ? [{ label: "Arrears", amount: record.arrears }] : []),
  ];

  const deductionRows = [
    { label: `PAYE (${record.taxRegime})`, amount: record.taxDeduction },
    { label: "Provident Fund", amount: record.pfDeduction },
    { label: "Other Deductions", amount: record.otherDeductions },
  ];

  const maxRows = Math.max(earningsRows.length, deductionRows.length);
  // Pad arrays
  const ePadded = [...earningsRows, ...Array(maxRows - earningsRows.length).fill(null)];
  const dPadded = [...deductionRows, ...Array(maxRows - deductionRows.length).fill(null)];

  const fmt = (n: number) => n.toLocaleString("en-IN") + ".00";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: "94vh" }}>

        {/* ── Action bar ── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Salary Slip · {period}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={onDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-white transition">
              <Download className="w-3 h-3" /> Download
            </button>
            <button onClick={onEmail}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-white transition">
              <Mail className="w-3 h-3" /> Email
            </button>
            <button onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Document ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="px-8 py-7" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

            {/* Company header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">I</div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">Izyane InovSolutions Pvt. Ltd.</p>
                  <p className="text-[10px] text-slate-500">ERP · Human Resources Division</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Payslip For The Month</p>
                <p className="text-sm font-bold text-slate-900">{period}</p>
              </div>
            </div>

            {/* Employee info + net pay box */}
            <div className="flex gap-5 mt-4 mb-5">
              {/* Left: employee table */}
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Employee Summary</p>
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
                        <td className="text-[11px] text-slate-500 py-0.5 pr-2 w-36 whitespace-nowrap">{l}</td>
                        <td className="text-[11px] text-slate-400 py-0.5 pr-2 w-3">:</td>
                        <td className="text-[11px] font-medium text-slate-800 py-0.5">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right: net pay card */}
              <div className="w-44 shrink-0">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-[#f0faf4] px-4 py-3 border-b border-slate-200">
                    <p className="text-[10px] text-slate-500 leading-none mb-1">Employee Net Pay</p>
                    <p className="text-xl font-bold font-mono text-slate-900">₹{record.netPay.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="px-4 py-2.5 space-y-1.5">
                    {[
                      ["Paid Days", `${record.paidDays}`],
                      ["LOP Days", `${lop}`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{l}</span>
                        <span className="font-semibold text-slate-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Earnings | Deductions table ── */}
            <table className="w-full border-collapse border border-slate-200 text-[11px] mb-0">
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200 w-[38%]">Earnings</th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200 w-[12%]">Amount</th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200 w-[38%]">Deductions</th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200 w-[12%]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td className="px-3 py-2 text-slate-700 border border-slate-200">
                      {ePadded[i]?.label ?? ""}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-800 border border-slate-200">
                      {ePadded[i] ? fmt(ePadded[i]!.amount) : ""}
                    </td>
                    <td className="px-3 py-2 text-slate-700 border border-slate-200">
                      {dPadded[i]?.label ?? ""}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-800 border border-slate-200">
                      {dPadded[i] ? fmt(dPadded[i]!.amount) : ""}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: "#f1f5f9" }}>
                  <td className="px-3 py-2.5 font-bold text-slate-800 border border-slate-300">Gross Earnings</td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono text-slate-900 border border-slate-300">
                    ₹{fmt(record.grossPay)}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-800 border border-slate-300">Total Deductions</td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono text-slate-900 border border-slate-300">
                    ₹{fmt(totalDed)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Net Payable */}
            <div className="flex items-center justify-between px-3 py-2.5 border border-t-0 border-slate-200 bg-slate-50 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Total Net Payable</p>
                <p className="text-[9px] text-slate-400">Gross Earnings − Total Deductions</p>
              </div>
              <p className="text-base font-bold font-mono text-slate-900">₹{fmt(record.netPay)}</p>
            </div>

            {/* Amount in words */}
            <p className="text-right text-[10px] text-slate-500 mb-5">
              Amount In Words:{" "}
              <span className="italic font-medium text-slate-700">{toWords(record.netPay)}</span>
            </p>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 text-center">
              <p className="text-[9px] text-slate-400 italic">
                — This is a system-generated payslip, hence the signature is not required. —
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};