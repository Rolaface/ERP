// PayrollConfirmationModal.tsx
import React from "react";
import { X, CheckCircle, AlertCircle, Users, DollarSign } from "lucide-react";
import type { PayrollRecord } from "../../../types/payrolltypes";

interface PayrollConfirmationModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  records: PayrollRecord[];
}

export const PayrollConfirmationModal: React.FC<
  PayrollConfirmationModalProps
> = ({ show, onClose, onConfirm, records }) => {
  if (!show) return null;

  const totalGross = records.reduce((sum, r) => sum + r.grossPay, 0);
  const totalDeductions = records.reduce(
    (sum, r) => sum + r.totalDeductions,
    0,
  );
  const totalNet = records.reduce((sum, r) => sum + r.netPay, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-card rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-muted p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertCircle className="w-7 h-7" />
                Confirm Payroll Run
              </h2>
              <p className="opacity-90 mt-1">
                Review employee details before processing
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-app rounded-lg p-4 border border-theme">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-muted" />
                <p className="text-xs text-muted font-medium">Employees</p>
              </div>
              <p className="text-3xl font-bold text-muted">{records.length}</p>
            </div>

            <div className="bg-app rounded-lg p-4 border border-theme">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text muted" />
                <p className="text-xs text-muted font-medium">Gross Total</p>
              </div>
              <p className="text-2xl font-bold text-muted">
                ₹{(totalGross / 1000).toFixed(0)}K
              </p>
            </div>

            <div className="bg-app rounded-lg p-4 border border-theme">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-muted" />
                <p className="text-xs text-muted font-medium">Deductions</p>
              </div>
              <p className="text-2xl font-bold text-muted">
                ₹{(totalDeductions / 1000).toFixed(0)}K
              </p>
            </div>

            <div className="bg-app rounded-lg p-4 border border-theme">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-muted" />
                <p className="text-xs text-muted font-medium">Net Payout</p>
              </div>
              <p className="text-2xl font-bold text-muted">
                ₹{(totalNet / 1000).toFixed(0)}K
              </p>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-card border border-theme rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="w-full">
              <thead className="table-head sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Department
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Gross Pay
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Deductions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Net Pay
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={record.id}
                    className={`border-b border-theme ${
                      index % 2 === 0 ? "bg-card" : "bg-app"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-main text-sm">
                          {record.employeeName}
                        </p>
                        <p className="text-xs text-muted">
                          {record.employeeId}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-main">
                      {record.department}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-main text-sm">
                      ₹{record.grossPay.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-danger text-sm">
                      ₹{record.totalDeductions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-success text-sm">
                      ₹{record.netPay.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-warning text-muted text-xs font-semibold rounded-full">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warning Message */}
          <div className="bg-warning rounded-lg p-4 border border-theme">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <div className="text-white">
                <p className="font-semibold text-sm mb-1">
                  Confirm Before Processing
                </p>
                <p className="text-xs opacity-90">
                  This action will process payroll for {records.length}{" "}
                  employees with a total payout of ₹{totalNet.toLocaleString()}.
                  Once confirmed, payments will be initiated and salary slips
                  will be generated.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-theme p-6 bg-app flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-theme text-main rounded-lg row-hover font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-success text-white rounded-lg hover:bg-[var(--success)] font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirm & Process Payroll
          </button>
        </div>
      </div>
    </div>
  );
};
