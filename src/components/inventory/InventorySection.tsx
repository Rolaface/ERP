import React, { useCallback } from "react";
import Tooltip from "../Tooltip";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { getBrands } from "../../api/itemApi";
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


const fieldLabel = "block text-[10px] font-medium text-main mb-1";


const SectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-muted">
    {title}
  </p>
);


interface InlineCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const InlineCheckbox: React.FC<InlineCheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled,
}) => (
  <div className="flex flex-col min-w-0 w-fit">
    <span className={fieldLabel}>{label}</span>
    <div className="flex items-center gap-2 select-none">
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={[
          "w-7 h-7 rounded-md border flex items-center justify-center transition-all",
          checked
            ? "bg-primary border-primary"
            : "bg-card border-theme hover:border-primary/60",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        {checked && (
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <span className="text-[11px] text-main">{checked ? "Yes" : "No"}</span>
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────

const InventorySection: React.FC<InventorySectionProps> = React.memo(
  ({ form, isServiceItem, onFormChange, setField }) => {

    const fetchBrandOptions = useCallback(
      async (q: string) => getBrands(q),
      [],
    );

    return (
      <>
        {/* ── Row 1: Brand | Dimensions | Weight | Valuation Method ── */}
        <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">

          {/* Brand — async search via Frappe search_link */}
          <div className="min-w-0">
            <SearchSelect2
              label="Brand"
              value={form.brand ?? ""}
              fetchOptions={fetchBrandOptions}
              onChange={(value) => setField("brand", value)}
              placeholder="Search brand..."
              allowCustomInput
              disabled={isServiceItem}
            />
          </div>

          {/* Dimensions: L x W x H + unit */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={fieldLabel}>Dimensions (L x W x H)</span>
            <div className="flex h-[28px] items-center gap-1">
              <input
                type="number"
                name="dimensionLength"
                value={form.dimensionLength ?? ""}
                onChange={onFormChange}
                placeholder="L"
                min="0"
                className="h-[28px] min-w-0 flex-1 rounded border border-[var(--border)] bg-card px-1 text-center text-[11px] text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner hover:border-primary/40 transition-all"
              />
              <span className="shrink-0 text-sm font-bold text-muted">x</span>
              <input
                type="number"
                name="dimensionWidth"
                value={form.dimensionWidth ?? ""}
                onChange={onFormChange}
                placeholder="W"
                min="0"
                className="h-[28px] min-w-0 flex-1 rounded border border-[var(--border)] bg-card px-1 text-center text-[11px] text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner hover:border-primary/40 transition-all"
              />
              <span className="shrink-0 text-sm font-bold text-muted">x</span>
              <input
                type="number"
                name="dimensionHeight"
                value={form.dimensionHeight ?? ""}
                onChange={onFormChange}
                placeholder="H"
                min="0"
                className="h-[28px] min-w-0 flex-1 rounded border border-[var(--border)] bg-card px-1 text-center text-[11px] text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner hover:border-primary/40 transition-all"
              />
              <select
                name="dimensionUnit"
                value={form.dimensionUnit || "cm"}
                onChange={onFormChange}
                className="h-[28px] w-14 shrink-0 rounded border border-[var(--border)] bg-card px-1 text-[11px] text-main focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/40 transition-all"
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>

          {/* Weight + unit */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={fieldLabel}>Weight</span>
            <div className="flex h-[28px] items-center gap-1">
              <input
                type="number"
                name="weight"
                value={form.weight ?? ""}
                onChange={onFormChange}
                className="h-[28px] min-w-0 flex-1 rounded border border-[var(--border)] bg-card px-2 text-[11px] text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary no-spinner hover:border-primary/40 transition-all"
              />
              <select
                name="weightUnit"
                value={form.weightUnit || "kg"}
                onChange={onFormChange}
                className="h-[28px] w-16 shrink-0 rounded border border-[var(--border)] bg-card px-1 text-[11px] text-main focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/40 transition-all"
              >
                <option value="gm">gm</option>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
                <option value="oz">oz</option>
              </select>
            </div>
          </div>

          {/* Valuation Method */}
          <ModalSelect
            label="Valuation Method"
            name="valuationMethod"
            value={form.valuationMethod ?? ""}
            onChange={onFormChange}
            placeholder="Select..."
          >
            <option value="FIFO">FIFO</option>
            <option value="WAC">WAC</option>
          </ModalSelect>
        </div>

        {/* ── Inventory Tracking ── */}
        <SectionHeading title="Inventory Tracking" />
        <div className="mt-1 flex flex-wrap items-end gap-5">
          <InlineCheckbox
            id="has_batch_no"
            label="Has Batch Number"
            checked={!!form.has_batch_no}
            onChange={(checked) => setField("has_batch_no", checked)}
          />
          <InlineCheckbox
            id="has_expiry_date"
            label="Has Expiry Date"
            checked={!!form.has_expiry_date}
            onChange={(checked) => setField("has_expiry_date", checked)}
          />
          <InlineCheckbox
            id="trackInventory"
            label="Track Inventory"
            checked={!!form.trackInventory}
            onChange={(checked) => setField("trackInventory", checked)}
          />
          <div className="w-full max-w-[220px]">
            <ModalSelect
              label="Tracking Method"
              name="trackingMethod"
              value={form.trackingMethod ?? ""}
              onChange={onFormChange}
              disabled={!form.trackInventory}
              placeholder="Select method..."
            >
              <option value="none">Normal</option>
              <option value="batch">Batch</option>
              <option value="serial">Serial</option>
              <option value="imei">IMEI</option>
            </ModalSelect>
          </div>
        </div>

        {/* ── Stock Level Tracking ── */}
        <SectionHeading title="Stock Level Tracking" />
        <div className="mt-1 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <ModalInput
            label="Min Stock Level"
            name="minStockLevel"
            value={form.minStockLevel ?? ""}
            onChange={onFormChange}
            placeholder="0"
          />
          <ModalInput
            label="Max Stock Level"
            name="maxStockLevel"
            value={form.maxStockLevel ?? ""}
            onChange={onFormChange}
            placeholder="0"
          />
          <ModalInput
            label="Re-order Level"
            name="reorderLevel"
            value={form.reorderLevel ?? ""}
            onChange={onFormChange}
            placeholder="0"
          />
        </div>
      </>
    );
  },
);

InventorySection.displayName = "InventorySection";

export default InventorySection;