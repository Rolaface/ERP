import React from "react";
import Tooltip from "../Tooltip";
import {
  CheckboxField,
  FieldLabel,
  SectionHeading,
  SelectInput,
  TextInput,
} from "./ItemModalControls";
import type {
  ItemFieldSetter,
  ItemFormChangeHandler,
  ItemFormData,
} from "./itemModalTypes";

interface InventorySectionProps {
  form: ItemFormData;
  isServiceItem: boolean;
  onFormChange: ItemFormChangeHandler;
  setField: ItemFieldSetter;
}

const InventorySection: React.FC<InventorySectionProps> = React.memo(
  ({ form, isServiceItem, onFormChange, setField }) => (
    <>
      <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Tooltip content={`Brand: ${form.brand || "N/A"}`}>
          <TextInput
            label="Brand"
            name="brand"
            value={form.brand}
            onChange={onFormChange}
            disabled={isServiceItem}
            placeholder="Brand name"
          />
        </Tooltip>

        <div className="flex min-w-0 flex-col gap-0.5">
          <FieldLabel label="Dimensions (L x W x H)" />
          <div className="flex h-8 items-center gap-1">
            <input
              type="number"
              name="dimensionLength"
              value={form.dimensionLength}
              onChange={onFormChange}
              placeholder="L"
              min="0"
              className="h-8 min-w-0 flex-1 rounded-md border border-theme bg-card px-1 text-center text-sm text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            />
            <span className="shrink-0 text-sm font-bold text-muted">x</span>
            <input
              type="number"
              name="dimensionWidth"
              value={form.dimensionWidth}
              onChange={onFormChange}
              placeholder="W"
              min="0"
              className="h-8 min-w-0 flex-1 rounded-md border border-theme bg-card px-1 text-center text-sm text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            />
            <span className="shrink-0 text-sm font-bold text-muted">x</span>
            <input
              type="number"
              name="dimensionHeight"
              value={form.dimensionHeight}
              onChange={onFormChange}
              placeholder="H"
              min="0"
              className="h-8 min-w-0 flex-1 rounded-md border border-theme bg-card px-1 text-center text-sm text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            />
            <select
              name="dimensionUnit"
              value={form.dimensionUnit || "cm"}
              onChange={onFormChange}
              className="h-8 w-14 shrink-0 rounded-md border border-theme bg-card px-1 text-sm text-main focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <FieldLabel label="Weight" />
          <div className="flex h-8 items-center gap-1">
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={onFormChange}
              className="h-8 min-w-0 flex-1 rounded-md border border-theme bg-card px-2.5 text-sm text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            />
            <select
              name="weightUnit"
              value={form.weightUnit || "kg"}
              onChange={onFormChange}
              className="h-8 w-16 shrink-0 rounded-md border border-theme bg-card px-1 text-sm text-main focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="gm">gm</option>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
              <option value="oz">oz</option>
            </select>
          </div>
        </div>

        <Tooltip content={`Valuation Method: ${form.valuationMethod || "N/A"}`}>
          <SelectInput
            label="Valuation Method"
            name="valuationMethod"
            value={form.valuationMethod}
            onChange={onFormChange}
          >
            <option value="">Select...</option>
            <option value="FIFO">FIFO</option>
            <option value="WAC">WAC</option>
          </SelectInput>
        </Tooltip>
      </div>

      <SectionHeading title="Inventory Tracking" />
      <div className="mt-[-6px] flex flex-wrap items-end gap-5">
        <CheckboxField
          id="has_batch_no"
          label="Has Batch Number"
          checked={form.has_batch_no}
          onChange={(checked) => setField("has_batch_no", checked)}
        />
        <CheckboxField
          id="has_expiry_date"
          label="Has Expiry Date"
          checked={form.has_expiry_date}
          onChange={(checked) => setField("has_expiry_date", checked)}
        />
        <CheckboxField
          id="trackInventory"
          label="Track Inventory"
          checked={form.trackInventory}
          onChange={(checked) => setField("trackInventory", checked)}
        />
        <div className="w-full max-w-[220px]">
          <SelectInput
            label="Tracking Method"
            name="trackingMethod"
            value={form.trackingMethod}
            onChange={onFormChange}
            disabled={!form.trackInventory}
          >
            <option value="">Select method...</option>
            <option value="none">Normal</option>
            <option value="batch">Batch</option>
            <option value="serial">Serial</option>
            <option value="imei">IMEI</option>
          </SelectInput>
        </div>
      </div>

      <SectionHeading title="Stock Level Tracking" />
      <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        <Tooltip content={`Min Stock Level: ${form.minStockLevel || "N/A"}`}>
          <TextInput
            label="Min Stock Level"
            name="minStockLevel"
            value={form.minStockLevel}
            onChange={onFormChange}
            placeholder="0"
          />
        </Tooltip>
        <Tooltip content={`Max Stock Level: ${form.maxStockLevel || "N/A"}`}>
          <TextInput
            label="Max Stock Level"
            name="maxStockLevel"
            value={form.maxStockLevel}
            onChange={onFormChange}
            placeholder="0"
          />
        </Tooltip>
        <Tooltip content={`Re-order Level: ${form.reorderLevel || "N/A"}`}>
          <TextInput
            label="Re-order Level"
            name="reorderLevel"
            value={form.reorderLevel}
            onChange={onFormChange}
            placeholder="0"
          />
        </Tooltip>
      </div>
    </>
  ),
);

InventorySection.displayName = "InventorySection";

export default InventorySection;
