import React from "react";
import { XCircle, Search, CheckCircle } from "lucide-react";
import type { Employee } from "../../../types/employee";

interface CreatePayrollModalProps {
  show: boolean;
  onClose: () => void;
  availableEmployees: Employee[];
  selectedEmployees: string[];
  employeeSearch: string;
  setEmployeeSearch: (search: string) => void;
  onSelectAll: () => void;
  onSelectEmployee: (empId: string) => void;
  onCreate: () => void;
}

export const CreatePayrollModal: React.FC<CreatePayrollModalProps> = ({
  show,
  onClose,
  availableEmployees,
  selectedEmployees,
  employeeSearch,
  setEmployeeSearch,
  onSelectAll,
  onSelectEmployee,
  onCreate,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Create New Payroll</h2>
              <p className="text-teal-100 mt-1">
                Select employees to include in payroll
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, or department..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={onSelectAll}
              className="px-6 py-3 border-2 border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              {selectedEmployees.length === availableEmployees.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <p className="text-teal-800 font-semibold">
              {selectedEmployees.length} of {availableEmployees.length}{" "}
              employees selected
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 overflow-y-auto">
            {availableEmployees.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-400 text-lg">No employees available</p>
                <p className="text-slate-500 text-sm mt-2">
                  All employees are already in payroll
                </p>
              </div>
            ) : (
              availableEmployees.map((employee) => {
                const isSelected = selectedEmployees.includes(employee.id);
                const salary =
                  employee.basicSalary + employee.hra + employee.allowances;

                return (
                  <div
                    key={employee.id}
                    onClick={() => onSelectEmployee(employee.id)}
                    className={`flex items-center gap-4 p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                      isSelected ? "bg-teal-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {employee.name}
                        </p>
                        <p className="text-xs text-slate-500">{employee.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {employee.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {employee.designation}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          Grade: {employee.grade}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">
                          {salary.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">Gross salary</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={selectedEmployees.length === 0}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
              selectedEmployees.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Create Payroll ({selectedEmployees.length})
          </button>
        </div>
      </div>
    </div>
  );
};
