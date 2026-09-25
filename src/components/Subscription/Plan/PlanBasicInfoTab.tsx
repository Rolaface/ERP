import React from "react";
import { Check } from "lucide-react";
import { ModalInput, ModalTextarea, ToggleSwitch } from "../../ui/modal/modalComponent";
import { PLAN_CATALOG } from "../../../hooks/Subscription/Plan/useplan";
import type { PlanFieldSetter, PlanFormErrors, PlanFormState, PlanProductCode, PlanStatus } from "../../../types/Subscription/Plan/plan";
import { PlanField, PlanProductBadge } from "./PlanShared";
import { NumericInput } from "../../ui/modal/modalComponent";


const noop = () => { };

const STATUS_OPTIONS = [
  { label: "Draft (Hidden)", value: "Draft" },
  { label: "Active (Live)", value: "Active" },
];

export const PlanBasicInfoTab: React.FC<{
  form: PlanFormState;
  errors: PlanFormErrors;
  isEditMode: boolean;
  suggestedCode: string;
  onFieldChange: PlanFieldSetter;
  onToggleProduct: (code: PlanProductCode, checked: boolean) => void;
}> = ({ form, errors, isEditMode, suggestedCode, onFieldChange, onToggleProduct }) => (
  <div>
    <PlanField label="Products" required error={errors.products}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PLAN_CATALOG.map((product) => {
          const selected = form.products.includes(product.code);
          return (
            <button
              key={product.code}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => onToggleProduct(product.code, !selected)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-[var(--border)] bg-card hover:border-primary/40"
                }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary" : "border-[var(--border)] bg-card"
                  }`}
              >
                {selected && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              <span className="min-w-0">
                <PlanProductBadge code={product.code} />
                <span className="mt-0.5 block truncate text-[11px] text-muted">{product.name}</span>
              </span>
            </button>
          );
        })}
      </div>
    </PlanField>

    <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-[2fr_1.1fr_0.8fr]">
      <ModalInput
        label="Plan Name"
        name="name"
        value={form.name}
        onChange={(e) => onFieldChange("name", e.target.value)}
        required
        maxLength={100}
        placeholder="e.g. Enterprise Core & Lending Bundle"
        error={errors.name}
      />
      <ModalInput
        label="Plan Code"
        name="planCode"
        value={form.planCode}
        onChange={(e) => onFieldChange("planCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
        maxLength={40}
        disabled={isEditMode}
        placeholder={suggestedCode ? `Auto: ${suggestedCode}` : "Custom or auto-generated"}
        error={errors.planCode}
      />
      <PlanField label="User Limit" error={errors.userLimit}>
        <NumericInput
          name="userLimit"
          value={form.userLimit}
          onChange={(v) => onFieldChange("userLimit", v)}
          decimalScale={0}
          placeholder="e.g. 25"
          className={`w-full ${errors.userLimit ? "border-danger" : ""}`}
        />
      </PlanField>
    </div>

    <div className="mt-4">
      <ModalTextarea
        label="Description"
        name="description"
        value={form.description}
        onChange={(e) => onFieldChange("description", e.target.value)}
        maxLength={500}
        placeholder="Short description of what this plan includes"
        className="!h-20"
      />
    </div>

    <div className="mt-4">
      <ToggleSwitch
        name="status"
        label="Publishing Status"
        checked={form.status === "Active"}
        onChange={noop}
        options={STATUS_OPTIONS}
        value={form.status}
        onValueChange={(v) => onFieldChange("status", v as PlanStatus)}
      />
    </div>
  </div>
);