// EditModal.tsx
import React, { useState } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import type { PayrollRecord, Bonus } from "../../../types/payrolltypes";
import { BONUS_TYPES } from "../../../views/hr/payroll-system/constants";
// import { BONUS_TYPES } from "../constants";

interface EditModalProps {
  record: PayrollRecord | null;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: any) => void;
}

const Field: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  helper?: string;
}> = ({ label, value, onChange, helper }) => (
  <div>
    <label className="block text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-3 py-2.5 border border-theme rounded-lg text-sm text-main bg-app focus:outline-none focus:border-primary transition font-mono"
    />
    {helper && <p className="text-[10px] text-muted mt-1">{helper}</p>}
  </div>
);

export const EditModal: React.FC<EditModalProps> = ({
  record,
  onClose,
  onSave,
  onChange,
}) => {
  const [bonuses, setBonuses] = useState<Bonus[]>(record?.bonuses ?? []);
  const [addingBonus, setAddingBonus] = useState(false);
  const [newBonus, setNewBonus] = useState({
    bonusType: "Performance",
    amount: 0,
    label: "",
  });

  if (!record) return null;

  const handleAddBonus = () => {
    if (!newBonus.label.trim() || newBonus.amount <= 0) return;
    const b: Bonus = {
      id: `BON${Date.now()}`,
      label: newBonus.label,
      bonusType: newBonus.bonusType as Bonus["bonusType"],
      amount: newBonus.amount,
      approved: false,
      date: new Date().toISOString(),
    };
    const updated = [...bonuses, b];
    setBonuses(updated);
    onChange("bonuses", updated);
    onChange(
      "totalBonus",
      updated.reduce((s, b) => s + b.amount, 0),
    );
    setNewBonus({ bonusType: "Performance", amount: 0, label: "" });
    setAddingBonus(false);
  };

  const handleRemoveBonus = (id: string) => {
    const updated = bonuses.filter((b) => b.id !== id);
    setBonuses(updated);
    onChange("bonuses", updated);
    onChange(
      "totalBonus",
      updated.reduce((s, b) => s + b.amount, 0),
    );
  };

  const estimatedGross =
    record.basicSalary +
    record.hra +
    record.allowances +
    record.arrears +
    bonuses.reduce((s, b) => s + b.amount, 0) +
    (record.overtimePay ?? 0);
  const estimatedNet = estimatedGross - Math.round(estimatedGross * 0.24) - 500;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-theme overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary px-6 py-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold">Edit Salary</h2>
              <p className="text-xs text-white/70 mt-0.5">
                {record.employeeName} · {record.employeeId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/15 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Salary fields */}
          <div>
            <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-3">
              Earnings
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Basic Salary"
                value={record.basicSalary}
                onChange={(v) => onChange("basicSalary", v)}
              />
              <Field
                label="HRA"
                value={record.hra}
                onChange={(v) => onChange("hra", v)}
              />
              <Field
                label="Allowances"
                value={record.allowances}
                onChange={(v) => onChange("allowances", v)}
              />
              <Field
                label="Arrears"
                value={record.arrears}
                onChange={(v) => onChange("arrears", v)}
                helper="Pending salary arrears"
              />
              <Field
                label="Overtime Pay"
                value={record.overtimePay}
                onChange={(v) => onChange("overtimePay", v)}
              />
              <Field
                label="Other Deductions"
                value={record.otherDeductions}
                onChange={(v) => onChange("otherDeductions", v)}
              />
            </div>
          </div>

          {/* Bonus section */}
          <div className="rounded-xl border border-theme bg-app p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-extrabold text-main">Bonuses</p>
              <button
                onClick={() => setAddingBonus((a) => !a)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:opacity-90 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Bonus
              </button>
            </div>

            {addingBonus && (
              <div className="bg-card border border-theme rounded-xl p-4 mb-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                      Type
                    </label>
                    <select
                      value={newBonus.bonusType}
                      onChange={(e) =>
                        setNewBonus((p) => ({
                          ...p,
                          bonusType: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-theme rounded-lg text-xs bg-app text-main focus:outline-none focus:border-primary"
                    >
                      {BONUS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {bt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Q4 Performance"
                      value={newBonus.label}
                      onChange={(e) =>
                        setNewBonus((p) => ({ ...p, label: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-theme rounded-lg text-xs bg-app text-main focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newBonus.amount || ""}
                      onChange={(e) =>
                        setNewBonus((p) => ({
                          ...p,
                          amount: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-theme rounded-lg text-xs bg-app text-main focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddBonus}
                  className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
                >
                  Add Bonus
                </button>
              </div>
            )}

            {bonuses.length === 0 ? (
              <p className="text-xs text-muted text-center py-3">
                No bonuses added
              </p>
            ) : (
              <div className="space-y-2">
                {bonuses.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 bg-card border border-theme rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-main truncate">
                        {b.label}
                      </p>
                      <p className="text-[10px] text-muted">{b.bonusType}</p>
                    </div>
                    <span className="text-sm font-extrabold text-primary font-mono">
                      ₹{b.amount.toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={() => handleRemoveBonus(b.id)}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estimated net */}
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                Estimated Net Pay
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                After approximate deductions (~24%)
              </p>
            </div>
            <p className="text-2xl font-extrabold text-primary tabular-nums font-mono">
              ₹{Math.max(0, estimatedNet).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-theme px-6 py-4 bg-app flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-theme text-main rounded-lg text-sm font-semibold hover:bg-card transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
};
