// EditEmployeePayrollModal.tsx — uses MinibleModal + Input primitives
import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import type { PayrollRecord } from "../../../types/Payroll/payrolltypes";
import { MinibleModal, Btn, Input } from "./Ui";

interface Props {
  record:   PayrollRecord | null;
  onClose:  () => void;
  onSave:   (updated: PayrollRecord) => void;
  onChange: (field: keyof PayrollRecord, value: number) => void;
}

const EditEmployeePayrollModal: React.FC<Props> = ({ record, onClose, onSave, onChange }) => {
  const [local, setLocal] = useState<PayrollRecord | null>(null);

  useEffect(() => { setLocal(record ? { ...record } : null); }, [record]);

  if (!local) return null;

  const update = (field: keyof PayrollRecord, v: number) => {
    setLocal(prev => prev ? { ...prev, [field]: v } : prev);
    onChange(field, v);
  };

  const estimatedGross =
    local.basicSalary + local.hra + local.allowances +
    local.overtimePay + local.totalBonus;

  return (
    <MinibleModal
      open={!!record}
      onClose={onClose}
      title="Edit Employee Payroll"
      subtitle={`${local.employeeName} · ${local.employeeId}`}
      size="lg"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn icon={<Save className="w-4 h-4" />} onClick={() => { onSave(local); onClose(); }}>
            Save Changes
          </Btn>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Basic Salary" type="number" value={local.basicSalary}
            onChange={v => update("basicSalary", Number(v))} />
          <Input label="HRA" type="number" value={local.hra}
            onChange={v => update("hra", Number(v))} />
          <Input label="Allowances" type="number" value={local.allowances}
            onChange={v => update("allowances", Number(v))} />
          <Input label="Overtime Pay" type="number" value={local.overtimePay}
            onChange={v => update("overtimePay", Number(v))} />
          <Input label="Bonus" type="number" value={local.totalBonus}
            onChange={v => update("totalBonus", Number(v))} />
          <Input label="Professional Tax" type="number" value={local.professionalTax}
            onChange={v => update("professionalTax", Number(v))} />
        </div>

        {/* Gross preview */}
        <div className="flex items-center justify-between bg-app border border-theme rounded-xl px-5 py-3">
          <span className="text-sm font-semibold text-muted">Estimated Gross</span>
          <span className="text-lg font-extrabold text-success tabular-nums font-mono">
            {estimatedGross.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </MinibleModal>
  );
};

export default EditEmployeePayrollModal;