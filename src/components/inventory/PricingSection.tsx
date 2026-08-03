import React, { useCallback } from "react";
import { ModalInput } from "../ui/modal/modalComponent";
import SearchSelect2 from "../ui/modal/SearchSelect2";

import { getSupplierList } from "../../api/lookupApi";
import type {
  ItemFormChangeHandler,
  ItemFormData,
  
} from "./itemModalTypes";

interface PricingSectionProps {
  form: ItemFormData;
  onFormChange: ItemFormChangeHandler;
  isZraEnabled?: boolean;
}

const PricingSection: React.FC<PricingSectionProps> = React.memo(
  ({ form, onFormChange, isZraEnabled = false }) => {

const fetchSupplierOptions = useCallback(async (q: string) => {
  try {
    const raw = await getSupplierList({ search: q, page: 1, page_size: 50 });
    return raw; 
  } catch {
    return [];
  }
}, []);

    const handleSupplierChange = useCallback(
  (_: string, option: any) => {
    onFormChange({
      target: { name: "preferredVendor", value: option?.value ?? "" },
    } as React.ChangeEvent<HTMLInputElement>);
    onFormChange({
      target: { name: "preferredVendorName", value: option?.label ?? "" },
    } as React.ChangeEvent<HTMLInputElement>);
  },
  [onFormChange],
);

    return (
      <>
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

          {/* Preferred Vendor — SearchSelect2 */}
         <SearchSelect2
  label="Preferred Vendor"
  value={form.preferredVendorName ?? form.preferredVendor ?? ""}
  onChange={handleSupplierChange}
  fetchOptions={fetchSupplierOptions}
  placeholder="Search supplier..."
/>

          {isZraEnabled && Boolean(form.isMtvItem) ? (
            <ModalInput
              label="RRP"
              name="mtvRrp"
              type="number"
              value={form.mtvRrp ?? ""}
              onChange={onFormChange}
              readOnly
              disabled
              placeholder="RRP"
            />
          ) : null}
        </div>
      </>
    );
  },
);

PricingSection.displayName = "PricingSection";

export default PricingSection;