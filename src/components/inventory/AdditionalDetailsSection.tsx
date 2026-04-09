import React from "react";
import Tooltip from "../Tooltip";
import { SectionHeading, TextInput, ToggleField } from "./ItemModalControls";
import type { ItemFormChangeHandler, ItemFormData } from "./itemModalTypes";

interface AdditionalDetailsSectionProps {
  form: ItemFormData;
  onFormChange: ItemFormChangeHandler;
  onToggleChange: (name: string, value: string) => void;
}

const AdditionalDetailsSection: React.FC<AdditionalDetailsSectionProps> =
  React.memo(({ form, onFormChange, onToggleChange }) => (
    <>
      <SectionHeading title="Additional Details" />
      <div className="grid grid-cols-12 items-end gap-x-4 gap-y-4">
        <div className="col-span-12 min-w-0 sm:col-span-6 lg:col-span-2">
          <span className="block min-w-0 truncate text-[11px] font-medium uppercase tracking-wide text-muted">
            Packing Unit
          </span>
          <div className="mt-0.5 grid h-8 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
            <Tooltip content={`Unit: ${form.packingUnit || "N/A"}`}>
              <input
                type="number"
                name="packingUnit"
                value={form.packingUnit}
                onChange={onFormChange}
                className="h-8 min-w-0 rounded-md border border-theme bg-card px-2 text-sm text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
              />
            </Tooltip>
            <span className="shrink-0 text-sm font-bold text-muted">x</span>
            <Tooltip content={`Size: ${form.packingSize || "N/A"}`}>
              <input
                type="number"
                name="packingSize"
                value={form.packingSize}
                onChange={onFormChange}
                className="h-8 min-w-0 rounded-md border border-theme bg-card px-2 text-sm text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
              />
            </Tooltip>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-2">
          <Tooltip content={`SKU: ${form.sku || "N/A"}`}>
            <TextInput
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={onFormChange}
            />
          </Tooltip>
        </div>

        <div className="col-span-4 min-w-[96px] lg:col-span-2">
          <ToggleField
            label="Svc Charge"
            name="svcCharge"
            value={form.svcCharge || "N"}
            onChange={onToggleChange}
          />
        </div>

        <div className="col-span-4 min-w-[96px] lg:col-span-2">
          <ToggleField
            label="Insurance"
            name="ins"
            value={form.ins || "N"}
            onChange={onToggleChange}
          />
        </div>

        <div className="col-span-4 min-w-[96px] lg:col-span-2">
          <ToggleField
            label="Taxable"
            name="taxPreference"
            value={form.taxPreference === "Taxable" ? "Y" : "N"}
            onChange={(name, value) =>
              onToggleChange(name, value === "Y" ? "Taxable" : "Non-Taxable")
            }
          />
        </div>
      </div>
    </>
  ));

AdditionalDetailsSection.displayName = "AdditionalDetailsSection";

export default AdditionalDetailsSection;
