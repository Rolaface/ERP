import React from "react";
import { ModalInput,ModalSelect } from "../ui/modal/modalComponent";
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

/**
 * Sales & Purchase section of the Item Details tab.
 * Renders: Selling Price | Sales Account | Buying Price | Purchase Account | Preferred Vendor
 * Matches the target screenshot layout exactly.
 */
const PricingSection: React.FC<PricingSectionProps> = React.memo(
  ({ form, suppliers, loadingSuppliers, onFormChange }) => (
    <>
      {/* Section heading — uppercase label as in screenshot */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted pt-1">
        Sales &amp; Purchase
      </p>

      <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-5">
        {/* Selling Price */}
        <ModalInput
          label="Selling Price"
          name="sellingPrice"
          type="number"
          value={form.sellingPrice ?? ""}
          onChange={onFormChange}
          className="no-spinner"
        />

        {/* Sales Account */}
        <ModalInput
          label="Sales Account"
          name="salesAccount"
          value={form.salesAccount ?? ""}
          onChange={onFormChange}
          placeholder="e.g. 4000-Sales"
        />

        {/* Buying Price */}
        <ModalInput
          label="Buying Price"
          name="buyingPrice"
          type="number"
          value={form.buyingPrice ?? ""}
          onChange={onFormChange}
          placeholder="0.00"
          className="no-spinner"
        />

        {/* Purchase Account */}
        <ModalInput
          label="Purchase Account"
          name="purchaseAccount"
          value={form.purchaseAccount ?? ""}
          onChange={onFormChange}
          placeholder="e.g. 5000-COGS"
        />

        {/* Preferred Vendor */}
        <ModalSelect
          label="Preferred Vendor"
          name="preferredVendor"
          value={form.preferredVendor ?? ""}
          onChange={onFormChange}
          disabled={loadingSuppliers}
          placeholder={loadingSuppliers ? "Loading suppliers..." : "Select Supplier"}
        >
          {!loadingSuppliers &&
            suppliers.map((supplier) => (
              <option key={supplier.value} value={supplier.value}>
                {supplier.label}
              </option>
            ))}
        </ModalSelect>
      </div>
    </>
  ),
);

PricingSection.displayName = "PricingSection";

export default PricingSection;