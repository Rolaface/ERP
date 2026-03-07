import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import type { Employee } from "../../../types/payrolltypes";

type PayrollEditForm = Employee & {
  basicSalary?: number;
  hra?: number;
  allowances?: number;
  overtimePay?: number;
  bonus?: number;
  professionalTax?: number;
};

interface EditEmployeePayrollModalProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (updatedEmployee: Employee) => void;
}

const EditEmployeePayrollModal: React.FC<EditEmployeePayrollModalProps> = ({
  open,
  employee,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<PayrollEditForm | null>(null);

  useEffect(() => {
    setForm(employee);
  }, [employee]);

  if (!open || !form) return null;

  const update = (field: keyof PayrollEditForm, value: any) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = () => {
    onSave(form as Employee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-theme overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme bg-app">
          <div>
            <h2 className="text-lg font-extrabold text-main">
              Edit Employee Payroll
            </h2>
            <p className="text-sm text-muted">
              {form.name} • {form.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/5 rounded-lg text-muted hover:text-main transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Field
              label="Basic Salary"
              value={Number(form.basicSalary ?? 0)}
              onChange={(v) => update("basicSalary", v)}
            />

            <Field
              label="HRA"
              value={Number(form.hra ?? 0)}
              onChange={(v) => update("hra", v)}
            />

            <Field
              label="Allowances"
              value={Number(form.allowances ?? 0)}
              onChange={(v) => update("allowances", v)}
            />

            <Field
              label="Overtime Pay"
              value={Number(form.overtimePay ?? 0)}
              onChange={(v) => update("overtimePay", v)}
            />

            <Field
              label="Bonus"
              value={Number(form.bonus ?? 0)}
              onChange={(v) => update("bonus", v)}
            />

            <Field
              label="Professional Tax"
              value={Number(form.professionalTax ?? 0)}
              onChange={(v) => update("professionalTax", v)}
            />
          </div>

          {/* Summary */}
          <div className="bg-app border border-theme rounded-xl p-4 flex justify-between">
            <span className="font-semibold text-main">Estimated Gross</span>
            <span className="font-extrabold text-primary tabular-nums">
              ₹
              {(
                Number(form.basicSalary ?? 0) +
                Number(form.hra ?? 0) +
                Number(form.allowances ?? 0) +
                Number(form.overtimePay ?? 0) +
                Number(form.bonus ?? 0)
              ).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme flex justify-end gap-3 bg-app">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-theme rounded-xl text-main hover:bg-muted/5 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:opacity-90 flex items-center gap-2 font-extrabold"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeePayrollModal;

/* ---------- Reusable Field ---------- */

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <label className="block text-sm font-semibold text-main mb-2">
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-4 py-3 bg-card border border-theme rounded-xl text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)]"
    />
  </div>
);
