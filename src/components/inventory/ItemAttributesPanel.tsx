import React from "react";
import type { ItemFormData } from "./itemModalTypes";

interface AttributeCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const AttributeCheckbox: React.FC<AttributeCheckboxProps> = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}) => (
  <label
    className={[
      "group -mx-2 flex select-none gap-3 rounded-lg px-2 py-2.5 transition-colors",
      description ? "items-start" : "items-center",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-app",
    ].join(" ")}
    onClick={(e) => {
      e.preventDefault();
      if (disabled) return;
      onChange(!checked);
    }}
  >
    <span
      className={[
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-all duration-150",
        description && "mt-0.5",
        !disabled && "group-active:scale-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-border-focus)] focus-visible:ring-offset-1",
        checked
          ? "border-primary bg-primary shadow-sm"
          : ["border-theme bg-card", !disabled && "group-hover:border-primary/60"]
              .filter(Boolean)
              .join(" "),
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        className={[
          "h-3 w-3 text-white transition-all duration-150",
          checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
        ].join(" ")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
    <span className="min-w-0">
      <p className="text-[12.5px] font-semibold leading-tight text-main">
        {label}
      </p>
      {description && (
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          {description}
        </p>
      )}
    </span>
  </label>
);

interface ItemAttributesPanelProps {
  form: ItemFormData;
  onToggleChange: (name: string, value: string) => void;
  setField: <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => void;
  isZraEnabled: boolean;
}

const SERVICE_CATEGORY_VALUES = ["service", "services"];

const ItemAttributesPanel: React.FC<ItemAttributesPanelProps> = React.memo(
  ({ form, onToggleChange, setField, isZraEnabled }) => {
    const isServiceCategory = SERVICE_CATEGORY_VALUES.includes(
      (form.itemGroup ?? "").trim().toLowerCase(),
    );

    return (
      <div className="h-fit rounded-2xl border border-theme bg-card p-4">
        <p className="mb-2 border-b border-theme pb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          Attributes
        </p>
        <div>
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
            disabled={isServiceCategory}
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