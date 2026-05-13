// PayslipModal.tsx — uses MinibleModal shell
import React from "react";
import { Download, Mail } from "lucide-react";
import type { PayrollRecord } from "../../../types/payrolltypes";
import { MinibleModal, Btn } from "./Ui";
import { toWords } from "./utils";

interface Props {
  record:      PayrollRecord | null;
  onClose:     () => void;
  onDownload?: () => void;
  onEmail?:    () => void;
}

export const PayslipModal: React.FC<Props> = ({ record, onClose, onDownload, onEmail }) => {
  if (!record) return null;

  const totalDed = record.taxDeduction + record.pfDeduction + record.otherDeductions;
  const lop      = record.workingDays - record.paidDays;
  const period   = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const fmt      = (n: number) => n.toLocaleString("en-IN") + ".00";

  const earningRows = [
    { label: "Basic Salary",               amount: record.basicSalary },
    { label: "House Rent Allowance (HRA)", amount: record.hra         },
    { label: "Allowances",                 amount: record.allowances  },
    ...(record.arrears > 0 ? [{ label: "Arrears", amount: record.arrears }] : []),
  ];
  const deductionRows = [
    { label: `Income Tax (${record.taxRegime})`, amount: record.taxDeduction  },
    { label: "Provident Fund",                   amount: record.pfDeduction   },
    { label: "Other Deductions",                 amount: record.otherDeductions },
  ];
  const maxRows = Math.max(earningRows.length, deductionRows.length);
  const ePad = [...earningRows,   ...Array(maxRows - earningRows.length).fill(null)];
  const dPad = [...deductionRows, ...Array(maxRows - deductionRows.length).fill(null)];

  return (
    <MinibleModal
      open={!!record}
      onClose={onClose}
      title={`Salary Slip · ${period}`}
      subtitle={`${record.employeeName} · ${record.employeeId}`}
      size="lg"
      footer={
        <>
          <Btn variant="outline" icon={<Mail className="w-3.5 h-3.5" />} size="sm" onClick={onEmail}>Email</Btn>
          <Btn icon={<Download className="w-3.5 h-3.5" />} size="sm" onClick={onDownload}>Download</Btn>
        </>
      }
    >
      {/* Company header */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">I</div>
          <div>
            <p className="text-sm font-bold text-slate-900">Izyane InovSolutions Pvt. Ltd.</p>
            <p className="text-[10px] text-slate-500">ERP · Human Resources Division</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Payslip For The Month</p>
          <p className="text-sm font-bold text-slate-900">{period}</p>
        </div>
      </div>

      {/* Employee info + net pay */}
      <div className="flex gap-5 mb-5">
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Employee Summary</p>
          <table className="w-full">
            <tbody>
              {[
                ["Employee Name",    record.employeeName],
                ["Designation",      record.designation],
                ["Employee ID",      record.employeeId],
                ["PF Number",        record.pfNumber],
                ["Date of Joining",  record.joiningDate],
                ["Pay Period",       period],
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
        <div className="w-44 shrink-0">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-[#f0faf4] px-4 py-3 border-b border-slate-200">
              <p className="text-[10px] text-slate-500 mb-1">Employee Net Pay</p>
              <p className="text-xl font-bold font-mono text-slate-900">₹{record.netPay.toLocaleString("en-IN")}</p>
            </div>
            <div className="px-4 py-2.5 space-y-1.5">
              {[["Paid Days", `${record.paidDays}`], ["LOP Days", `${lop}`]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-[11px]">
                  <span className="text-slate-500">{l}</span>
                  <span className="font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Earnings / Deductions table */}
      <table className="w-full border-collapse border border-slate-200 text-[11px] mb-0">
        <thead>
          <tr style={{ background: "#f8f9fa" }}>
            {["Earnings", "Amount", "Deductions", "Amount"].map((h, i) => (
              <th key={i} className={`${i % 2 === 0 ? "text-left" : "text-right"} px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td className="px-3 py-2 text-slate-700 border border-slate-200">{ePad[i]?.label ?? ""}</td>
              <td className="px-3 py-2 text-right font-mono text-slate-800 border border-slate-200">{ePad[i] ? fmt(ePad[i]!.amount) : ""}</td>
              <td className="px-3 py-2 text-slate-700 border border-slate-200">{dPad[i]?.label ?? ""}</td>
              <td className="px-3 py-2 text-right font-mono text-slate-800 border border-slate-200">{dPad[i] ? fmt(dPad[i]!.amount) : ""}</td>
            </tr>
          ))}
          <tr style={{ background: "#f1f5f9" }}>
            <td className="px-3 py-2.5 font-bold text-slate-800 border border-slate-300">Gross Earnings</td>
            <td className="px-3 py-2.5 text-right font-bold font-mono text-slate-900 border border-slate-300">₹{fmt(record.grossPay)}</td>
            <td className="px-3 py-2.5 font-bold text-slate-800 border border-slate-300">Total Deductions</td>
            <td className="px-3 py-2.5 text-right font-bold font-mono text-slate-900 border border-slate-300">₹{fmt(totalDed)}</td>
          </tr>
        </tbody>
      </table>

      {/* Net Payable */}
      <div className="flex items-center justify-between px-3 py-2.5 border border-t-0 border-slate-200 bg-slate-50 mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Total Net Payable</p>
          <p className="text-[9px] text-slate-400">Gross Earnings − Total Deductions</p>
        </div>
        <p className="text-base font-bold font-mono text-slate-900">₹{fmt(record.netPay)}</p>
      </div>

      <p className="text-right text-[10px] text-slate-500 mb-4">
        Amount In Words:{" "}
        <span className="italic font-medium text-slate-700">{toWords(record.netPay)}</span>
      </p>

      <div className="border-t border-slate-200 pt-3 text-center">
        <p className="text-[9px] text-slate-400 italic">
          — This is a system-generated payslip, hence the signature is not required. —
        </p>
      </div>
    </MinibleModal>
  );
};