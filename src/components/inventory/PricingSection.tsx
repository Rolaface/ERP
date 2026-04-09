import React from "react";
import Tooltip from "../Tooltip";
import { SectionHeading, SelectInput, TextInput } from "./ItemModalControls";
import type {
  ItemFormChangeHandler,
  ItemFormData,
  SupplierOption,
} from "./itemModalTypes";

interface PricingSectionProps {
  form: ItemFormData;
  suppliers: SupplierOption[];
  loadingSuppliers: boolean;
  onFormChange: ItemFormChangeHandler;
}

const PricingSection: React.FC<PricingSectionProps> = React.memo(
  ({ form, suppliers, loadingSuppliers, onFormChange }) => (
    <>
      <SectionHeading title="Sales & Purchase" />
      <div className="grid grid-cols-1 items-end gap-x-4 gap-y-4 md:grid-cols-5">
        <div className="min-w-0">
          <Tooltip content={`Selling Price: ${form.sellingPrice || "N/A"}`}>
            <TextInput
              label="Selling Price"
              name="sellingPrice"
              type="number"
              value={form.sellingPrice}
              onChange={onFormChange}
              className="no-spinner"
            />
          </Tooltip>
        </div>

        <div className="min-w-0">
          <Tooltip content={`Sales Account: ${form.salesAccount || "N/A"}`}>
            <TextInput
              label="Sales Account"
              name="salesAccount"
              value={form.salesAccount}
              onChange={onFormChange}
              placeholder="e.g. 4000-Sales"
            />
          </Tooltip>
        </div>

        <div className="min-w-0">
          <Tooltip content={`Buying Price: ${form.buyingPrice || "N/A"}`}>
            <TextInput
              label="Buying Price"
              name="buyingPrice"
              type="number"
              value={form.buyingPrice}
              onChange={onFormChange}
              placeholder="0.00"
              className="no-spinner"
            />
          </Tooltip>
        </div>

        <div className="min-w-0">
          <Tooltip
            content={`Purchase Account: ${form.purchaseAccount || "N/A"}`}
          >
            <TextInput
              label="Purchase Account"
              name="purchaseAccount"
              value={form.purchaseAccount}
              onChange={onFormChange}
              placeholder="e.g. 5000-COGS"
            />
          </Tooltip>
        </div>

        <div className="min-w-0">
          <Tooltip
            content={`Preferred Vendor: ${form.preferredVendor || "N/A"}`}
          >
            <SelectInput
              label="Preferred Vendor"
              name="preferredVendor"
              value={form.preferredVendor}
              onChange={onFormChange}
              disabled={loadingSuppliers}
            >
              <option value="">
                {loadingSuppliers ? "Loading suppliers..." : "Select Supplier"}
              </option>
              {!loadingSuppliers &&
                suppliers.map((supplier) => (
                  <option key={supplier.value} value={supplier.value}>
                    {supplier.label}
                  </option>
                ))}
            </SelectInput>
          </Tooltip>
        </div>
      </div>
    </>
  ),
);

PricingSection.displayName = "PricingSection";

export default PricingSection;
