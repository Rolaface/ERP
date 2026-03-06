import React from "react";
import { FileText, Users, CheckCircle } from "lucide-react";
import type { PayrollRecord } from "../../../types/payrolltypes";

interface ProcessingModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingRecords: PayrollRecord[];
  pendingCount: number;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  show,
  onClose,
  onConfirm,
  pendingRecords,
  pendingCount,
}) => {
  if (!show) return null;

  const totalGross = pendingRecords.reduce((sum, r) => sum + r.grossPay, 0);
  const totalNet = pendingRecords.reduce((sum, r) => sum + r.netPay, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">Confirm Payroll Processing</h2>
          <p className="text-teal-100 mt-1">Review details before processing</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <div className="text-amber-600 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 mb-1">
                Processing {pendingCount} pending payments
              </p>
              <p className="text-sm text-amber-700">
                This will initiate salary transfers to all employees with
                "Pending" status. Please ensure sufficient funds are available
                in the payroll account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Employees
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {pendingCount}
              </p>
              <p className="text-xs text-slate-600 mt-1">To be paid</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <p className="text-xs text-emerald-600 uppercase tracking-wider mb-2">
                Gross Amount
              </p>
              <p className="text-2xl font-bold text-emerald-800">
                ₹{totalGross.toLocaleString()}
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl p-5 border border-teal-200">
              <p className="text-xs text-teal-600 uppercase tracking-wider mb-2">
                Net Payout
              </p>
              <p className="text-2xl font-bold text-teal-800">
                ₹{totalNet.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">
              Payment Breakdown
            </h3>
            <div className="space-y-2">
              {pendingRecords.slice(0, 3).map((emp) => (
                <div key={emp.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {emp.employeeName}
                      </p>
                      <p className="text-xs text-slate-500">{emp.employeeId}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-800">
                    ₹{emp.netPay.toLocaleString()}
                  </p>
                </div>
              ))}
              {pendingCount > 3 && (
                <p className="text-xs text-slate-500 text-center pt-2">
                  +{pendingCount - 3} more employees
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-6 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-teal-500/30 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirm & Process
          </button>
        </div>
      </div>
    </div>
  );
};
