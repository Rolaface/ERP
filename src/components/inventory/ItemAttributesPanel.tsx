import React from "react";
import type { ItemFormData } from "./itemModalTypes";

interface AttributeCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const AttributeCheckbox: React.FC<AttributeCheckboxProps> = ({
  label,
  description,
  checked,
  onChange,
}) => (
  <label
    className="flex items-start gap-3 cursor-pointer select-none py-2"
    onClick={(e) => {
      e.preventDefault();
      onChange(!checked);
    }}
  >
    <div
      className={[
        "mt-0.5 w-4 h-4 shrink-0 rounded flex items-center justify-center border transition-all",
        checked
          ? "bg-primary border-primary"
          : "bg-card border-theme hover:border-primary/60",
      ].join(" ")}
    >
      {checked && (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <div className="min-w-0">
      <p className="text-[12px] font-semibold text-main leading-tight">{label}</p>
      {description && (
        <p className="text-[11px] text-muted leading-snug mt-0.5">{description}</p>
      )}
    </div>
  </label>
);

interface ItemAttributesPanelProps {
  form: ItemFormData;
  onToggleChange: (name: string, value: string) => void;
  setField: <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => void;
  isZraEnabled: boolean;
}

const ItemAttributesPanel: React.FC<ItemAttributesPanelProps> = React.memo(
  ({ form, onToggleChange, setField, isZraEnabled }) => {
    return (
      <div className="rounded-2xl border border-theme bg-card p-4 h-fit">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
          Attributes
        </p>
        <div className="divide-y divide-theme/60">
          {isZraEnabled && (
            <>
              <AttributeCheckbox
                label="Service Charge"
                checked={form.svcCharge === "Y"}
                onChange={(v) => onToggleChange("svcCharge", v ? "Y" : "N")}
              />
              <AttributeCheckbox
                label="Insurance"
                checked={form.ins === "Y"}
                onChange={(v) => onToggleChange("ins", v ? "Y" : "N")}
              />
              <AttributeCheckbox
                label="Taxable"
                checked={form.taxPreference === "Taxable"}
                onChange={(v) =>
                  onToggleChange("taxPreference", v ? "Taxable" : "Non-Taxable")
                }
              />
            </>
          )}

          <AttributeCheckbox
            label="Track Inventory"
            checked={!!form.trackInventory}
            onChange={(v) => setField("trackInventory", v)}
          />
          <AttributeCheckbox
            label="Allow Sales"
            checked={!!form.allowSales}
            onChange={(v) => setField("allowSales", v)}
          />
          <AttributeCheckbox
            label="Allow Purchase"
            checked={!!form.allowPurchase}
            onChange={(v) => setField("allowPurchase", v)}
          />
        </div>
      </div>
    );
  },
);

ItemAttributesPanel.displayName = "ItemAttributesPanel";

export default ItemAttributesPanel;