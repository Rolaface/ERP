// EmployeeSelfService.tsx - Employee portal to view their own payslips
import React, { useState } from "react";
import {
  Download,
  Mail,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { PayrollRecord, Employee } from "../../../types/payrolltypes";

interface EmployeeSelfServiceProps {
  employee: Employee;
  payrollRecords: PayrollRecord[];
}

export const EmployeeSelfService: React.FC<EmployeeSelfServiceProps> = ({
  employee,
  payrollRecords,
}) => {
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(
    null,
  );

  // Filter records for this employee
  const employeeRecords = payrollRecords.filter(
    (r) => r.employeeId === employee.id,
  );
  const currentRecord =
    employeeRecords.find((r) => r.status === "Paid") || employeeRecords[0];

  const handleDownload = (record: PayrollRecord) => {
    alert(
      `Downloading payslip for ${record.employeeName} - ${new Date(record.createdDate).toLocaleDateString()}`,
    );
  };

  const handleEmail = (record: PayrollRecord) => {
    alert(`Payslip sent to ${record.email}`);
  };

  return (
    <div className="min-h-screen bg-app p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-2xl shadow-sm border border-theme p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 border border-[var(--primary)]/20 rounded-full flex items-center justify-center text-primary text-2xl font-extrabold">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-main">
                  {employee.name}
                </h1>
                <p className="text-muted">
                  {employee.designation} • {employee.department}
                </p>
                <p className="text-sm text-muted">Employee ID: {employee.id}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted uppercase mb-1">
                Current Month Salary
              </p>
              <p className="text-3xl font-extrabold text-primary tabular-nums">
                ₹{currentRecord?.netPay.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl shadow-sm border border-theme p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-success/10 border border-success/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-xs text-muted uppercase">Gross Salary</p>
            </div>
            <p className="text-2xl font-extrabold text-main tabular-nums">
              ₹{currentRecord?.grossPay.toLocaleString() || "0"}
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-theme p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-danger/10 border border-danger/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-danger" />
              </div>
              <p className="text-xs text-muted uppercase">Deductions</p>
            </div>
            <p className="text-2xl font-extrabold text-danger tabular-nums">
              ₹{currentRecord?.totalDeductions.toLocaleString() || "0"}
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-theme p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 border border-[var(--primary)]/20 rounded-xl">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted uppercase">Working Days</p>
            </div>
            <p className="text-2xl font-extrabold text-main tabular-nums">
              {currentRecord?.paidDays || 0}/{currentRecord?.workingDays || 22}
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-theme p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 border border-[var(--primary)]/20 rounded-xl">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted uppercase">Payslips</p>
            </div>
            <p className="text-2xl font-extrabold text-main tabular-nums">
              {employeeRecords.length}
            </p>
          </div>
        </div>

        {/* Current Payslip Details */}
        {currentRecord && (
          <div className="bg-card rounded-2xl shadow-sm border border-theme p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-main">
                Current Payslip
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(currentRecord)}
                  className="px-4 py-2 border border-theme text-main rounded-xl hover:bg-muted/5 flex items-center gap-2 font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleEmail(currentRecord)}
                  className="px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 flex items-center gap-2 font-extrabold"
                >
                  <Mail className="w-4 h-4" />
                  Email to Me
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Earnings */}
              <div className="bg-success/5 rounded-2xl p-6 border border-success/20">
                <h3 className="font-extrabold text-success mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Earnings
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-main">Basic Salary</span>
                    <span className="font-semibold">
                      ₹{currentRecord.basicSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-main">HRA</span>
                    <span className="font-semibold">
                      ₹{currentRecord.hra.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-main">Allowances</span>
                    <span className="font-semibold">
                      ₹{currentRecord.allowances.toLocaleString()}
                    </span>
                  </div>
                  {currentRecord.overtimePay > 0 && (
                    <div className="flex justify-between bg-card px-3 py-2 rounded-xl border border-theme">
                      <span className="text-main">Overtime</span>
                      <span className="font-semibold text-main">
                        ₹{currentRecord.overtimePay.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentRecord.totalBonus > 0 && (
                    <div className="flex justify-between bg-card px-3 py-2 rounded-xl border border-theme">
                      <span className="text-main">Bonus</span>
                      <span className="font-semibold text-main">
                        ₹{currentRecord.totalBonus.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentRecord.arrears > 0 && (
                    <div className="flex justify-between bg-warning/10 px-3 py-2 rounded-xl border border-warning/20">
                      <span className="text-warning font-medium">Arrears</span>
                      <span className="font-bold text-warning">
                        ₹{currentRecord.arrears.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-success/20 mt-2">
                    <span className="font-extrabold text-main">
                      Gross Salary
                    </span>
                    <span className="font-extrabold text-lg text-main tabular-nums">
                      ₹{currentRecord.grossPay.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-danger/5 rounded-2xl p-6 border border-danger/20">
                <h3 className="font-extrabold text-danger mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Deductions
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-main">
                      PAYE ({currentRecord.taxRegime})
                    </span>
                    <span className="font-semibold">
                      ₹{currentRecord.taxDeduction.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-main">Provident Fund</span>
                    <span className="font-semibold">
                      ₹{currentRecord.pfDeduction.toLocaleString()}
                    </span>
                  </div>
                  {currentRecord.esiDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-main">ESI</span>
                      <span className="font-semibold">
                        ₹{currentRecord.esiDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-main">Professional Tax</span>
                    <span className="font-semibold">
                      ₹{currentRecord.professionalTax.toLocaleString()}
                    </span>
                  </div>
                  {currentRecord.loanDeduction > 0 && (
                    <div className="flex justify-between bg-card px-3 py-2 rounded-xl border border-theme">
                      <span className="text-main">Loan EMI</span>
                      <span className="font-semibold">
                        ₹{currentRecord.loanDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentRecord.advanceDeduction > 0 && (
                    <div className="flex justify-between bg-card px-3 py-2 rounded-xl border border-theme">
                      <span className="text-main">Advance Recovery</span>
                      <span className="font-semibold">
                        ₹{currentRecord.advanceDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-danger/20 mt-2">
                    <span className="font-extrabold text-main">
                      Total Deductions
                    </span>
                    <span className="font-extrabold text-lg text-main tabular-nums">
                      ₹{currentRecord.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="mt-6 bg-primary rounded-2xl p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/80 text-sm mb-1">
                    Net Salary (Take Home)
                  </p>
                  <p className="text-4xl font-bold">
                    ₹{currentRecord.netPay.toLocaleString()}
                  </p>
                  <p className="text-white/80 text-xs mt-2">
                    Payment Status:{" "}
                    <span className="font-semibold">
                      {currentRecord.status}
                    </span>
                    {currentRecord.paymentDate &&
                      ` • Paid on ${currentRecord.paymentDate}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payslip History */}
        <div className="bg-card rounded-2xl shadow-sm border border-theme p-6">
          <h2 className="text-xl font-extrabold text-main mb-4">
            Payslip History
          </h2>
          <div className="space-y-3">
            {employeeRecords.length === 0 ? (
              <p className="text-muted text-center py-8">
                No payslip records available
              </p>
            ) : (
              employeeRecords.map((record) => (
                <div
                  key={record.id}
                  className="border border-theme rounded-xl p-4 hover:bg-muted/5 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold text-main">
                            {new Date(record.createdDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-sm text-muted">
                            Created:{" "}
                            {new Date(record.createdDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted">Net Pay</p>
                        <p className="text-lg font-extrabold text-main tabular-nums">
                          ₹{record.netPay.toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === "Paid"
                            ? "bg-success/10 text-success"
                            : record.status === "Pending"
                              ? "bg-warning/10 text-warning"
                              : "bg-row-hover/40 text-main"
                        }`}
                      >
                        {record.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPayslip(record)}
                          className="p-2 text-muted hover:text-primary hover:bg-muted/5 rounded-lg"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(record)}
                          className="p-2 text-muted hover:text-main hover:bg-muted/5 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Employee Details */}
        <div className="bg-card rounded-2xl shadow-sm border border-theme p-6">
          <h2 className="text-xl font-extrabold text-main mb-4">My Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted uppercase mb-1">Employee ID</p>
              <p className="font-semibold text-main">{employee.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">Email</p>
              <p className="font-semibold text-main">{employee.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">Department</p>
              <p className="font-semibold text-main">{employee.department}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">Designation</p>
              <p className="font-semibold text-main">{employee.designation}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">Grade</p>
              <p className="font-semibold text-main">{employee.grade}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">Joining Date</p>
              <p className="font-semibold text-main">{employee.joiningDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">PAN Number</p>
              <p className="font-semibold text-main">{employee.panNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">PF Number</p>
              <p className="font-semibold text-main">{employee.pfNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">Bank Account</p>
              <p className="font-semibold text-main">{employee.bankAccount}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">IFSC Code</p>
              <p className="font-semibold text-main">{employee.ifscCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Payslip Modal */}
      {selectedPayslip && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPayslip(null)}
        >
          <div
            className="bg-card border border-theme rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content similar to PayslipModal */}
            <div className="bg-primary text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Salary Slip</h2>
                  <p className="text-white/80 mt-1">
                    {new Date(selectedPayslip.createdDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-2 hover:bg-white/15 rounded-lg"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-4xl font-extrabold text-primary tabular-nums">
                  ₹{selectedPayslip.netPay.toLocaleString()}
                </p>
                <p className="text-muted mt-1">Net Salary</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDownload(selectedPayslip)}
                  className="flex-1 px-6 py-3 border border-theme text-main rounded-xl hover:bg-muted/5 flex items-center justify-center gap-2 font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
                <button
                  onClick={() => handleEmail(selectedPayslip)}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 font-extrabold"
                >
                  <Mail className="w-5 h-5" />
                  Email Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
