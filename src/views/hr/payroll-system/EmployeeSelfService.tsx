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
import type { PayrollRecord, Employee } from "../../../types/Payroll/payrolltypes";

interface EmployeeSelfServiceProps {
  employee: Employee;
  payrollRecords: PayrollRecord[];
}

export const EmployeeSelfService: React.FC<EmployeeSelfServiceProps> = ({
  employee,
  payrollRecords,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {employee.name}
                </h1>
                <p className="text-slate-600">
                  {employee.designation} • {employee.department}
                </p>
                <p className="text-sm text-slate-500">
                  Employee ID: {employee.id}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase mb-1">
                Current Month Salary
              </p>
              <p className="text-3xl font-bold text-green-600">
                {currentRecord?.netPay.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-slate-500 uppercase">Gross Salary</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {currentRecord?.grossPay.toLocaleString() || "0"}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xs text-slate-500 uppercase">Deductions</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {currentRecord?.totalDeductions.toLocaleString() || "0"}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-slate-500 uppercase">Working Days</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {currentRecord?.paidDays || 0}/{currentRecord?.workingDays || 22}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-slate-500 uppercase">Payslips</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {employeeRecords.length}
            </p>
          </div>
        </div>

        {/* Current Payslip Details */}
        {currentRecord && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Current Payslip
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(currentRecord)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleEmail(currentRecord)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email to Me
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Earnings */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Earnings
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Basic Salary</span>
                    <span className="font-semibold">
                      {currentRecord.basicSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">HRA</span>
                    <span className="font-semibold">
                      {currentRecord.hra.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Allowances</span>
                    <span className="font-semibold">
                      {currentRecord.allowances.toLocaleString()}
                    </span>
                  </div>
                  {currentRecord.overtimePay > 0 && (
                    <div className="flex justify-between bg-white px-3 py-2 rounded">
                      <span className="text-slate-700">Overtime</span>
                      <span className="font-semibold text-green-700">
                        {currentRecord.overtimePay.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentRecord.totalBonus > 0 && (
                    <div className="flex justify-between bg-white px-3 py-2 rounded">
                      <span className="text-slate-700">Bonus</span>
                      <span className="font-semibold text-green-700">
                        {currentRecord.totalBonus.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentRecord.arrears > 0 && (
                    <div className="flex justify-between bg-amber-100 px-3 py-2 rounded">
                      <span className="text-amber-800 font-medium">
                        Arrears
                      </span>
                      <span className="font-bold text-amber-700">
                        {currentRecord.arrears.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t-2 border-green-300 mt-2">
                    <span className="font-bold text-green-900">
                      Gross Salary
                    </span>
                    <span className="font-bold text-lg text-green-700">
                      {currentRecord.grossPay.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Deductions
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">
                      Income Tax ({currentRecord.taxRegime})
                    </span>
                    <span className="font-semibold">
                      {currentRecord.taxDeduction.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Provident Fund</span>
                    <span className="font-semibold">
                      {currentRecord.pfDeduction.toLocaleString()}
                    </span>
                  </div>
                  {currentRecord.esiDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">ESI</span>
                      <span className="font-semibold">
                        {currentRecord.esiDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-700">Professional Tax</span>
                    <span className="font-semibold">
                      {currentRecord.professionalTax.toLocaleString()}
                    </span>
                  </div>
                  {currentRecord.loanDeduction > 0 && (
                    <div className="flex justify-between bg-white px-3 py-2 rounded">
                      <span className="text-slate-700">Loan EMI</span>
                      <span className="font-semibold">
                        {currentRecord.loanDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentRecord.advanceDeduction > 0 && (
                    <div className="flex justify-between bg-white px-3 py-2 rounded">
                      <span className="text-slate-700">Advance Recovery</span>
                      <span className="font-semibold">
                        {currentRecord.advanceDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t-2 border-red-300 mt-2">
                    <span className="font-bold text-red-900">
                      Total Deductions
                    </span>
                    <span className="font-bold text-lg text-red-700">
                      {currentRecord.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="mt-6 bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-100 text-sm mb-1">
                    Net Salary (Take Home)
                  </p>
                  <p className="text-4xl font-bold">
                    {currentRecord.netPay.toLocaleString()}
                  </p>
                  <p className="text-green-100 text-xs mt-2">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Payslip History
          </h2>
          <div className="space-y-3">
            {employeeRecords.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No payslip records available
              </p>
            ) : (
              employeeRecords.map((record) => (
                <div
                  key={record.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {new Date(record.createdDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-sm text-slate-600">
                            Created:{" "}
                            {new Date(record.createdDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Net Pay</p>
                        <p className="text-lg font-bold text-green-600">
                          {record.netPay.toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : record.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {record.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPayslip(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(record)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">My Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">
                Employee ID
              </p>
              <p className="font-semibold text-slate-800">{employee.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Email</p>
              <p className="font-semibold text-slate-800">{employee.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">
                Department
              </p>
              <p className="font-semibold text-slate-800">
                {employee.department}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">
                Designation
              </p>
              <p className="font-semibold text-slate-800">
                {employee.designation}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Grade</p>
              <p className="font-semibold text-slate-800">{employee.grade}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">
                Joining Date
              </p>
              <p className="font-semibold text-slate-800">
                {employee.joiningDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">
                PAN Number
              </p>
              <p className="font-semibold text-slate-800">
                {employee.panNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">PF Number</p>
              <p className="font-semibold text-slate-800">
                {employee.pfNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">
                Bank Account
              </p>
              <p className="font-semibold text-slate-800">
                {employee.bankAccount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">IFSC Code</p>
              <p className="font-semibold text-slate-800">
                {employee.ifscCode}
              </p>
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
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content similar to PayslipModal */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Salary Slip</h2>
                  <p className="text-teal-100 mt-1">
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
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-green-600">
                  {selectedPayslip.netPay.toLocaleString()}
                </p>
                <p className="text-slate-600 mt-1">Net Salary</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDownload(selectedPayslip)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
                <button
                  onClick={() => handleEmail(selectedPayslip)}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
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
