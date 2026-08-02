import React, { useState, useCallback, useRef } from "react";
import { ScanSearch } from "lucide-react";
import { ModalInput } from "../ui/modal/modalComponent";
import type {
  ItemFieldSetter,
  ItemFormChangeHandler,
  ItemFormData,
} from "./itemModalTypes";
import { getBrands, getItemGroups } from "../../api/itemApi";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import HsnSearchPopover from "./Hsnsearchpopover";
import MtvItemPickerModal from "./MtvItemPickerModal";

interface BasicDetailsSectionProps {
  form: ItemFormData;
  isServiceItem: boolean;
  isZraEnabled?: boolean;
  onFormChange: ItemFormChangeHandler;
  errors?: Partial<Record<keyof ItemFormData, string>>;
  setField: ItemFieldSetter;
}

const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = React.memo(
  ({ form, onFormChange, errors, setField, isServiceItem, isZraEnabled = false }) => {
    const [hsnPopoverOpen, setHsnPopoverOpen] = useState(false);
    const [mtvPickerOpen, setMtvPickerOpen] = useState(false);
    // Popover anchors to this button, not to the screen center.
    const hsnTriggerRef = useRef<HTMLButtonElement>(null);

    const fetchBrandOptions = useCallback(
      async (q: string) => getBrands(q),
      [],
    );

    const handleHsnSelect = useCallback(
      (code: string) => {
        setField("itemClassCode", code);
      },
      [setField],
    );

    const handleMtvToggle = useCallback(
      (checked: boolean) => {
        setField("isMtvItem", checked);
        if (!checked) {
          setField("mtvRrp", "");
          setField("mtvItemCode", "");
          setField("mtvManufacturerTpin", "");
        }
      },
      [setField],
    );

    const handleMtvSelect = useCallback(
      (selection: {
        itemCode: string;
        itemName: string;
        itemDescription: string;
        itemClassCode: string;
        itemTypeCode: string;
        packagingUnitCode: string;
        quantityUnitCode: string;
        originNationCode: string;
        rrp: string;
        manufacturerTpin: string;
      }) => {
        setField("itemName", selection.itemName || form.itemName);
        setField("description", selection.itemDescription || "");
        setField("itemClassCode", selection.itemClassCode || "");
        setField("itemTypeCode", selection.itemTypeCode || "");
        setField("packagingUnitCode", selection.packagingUnitCode || "");
        setField("packaging_uom", selection.packagingUnitCode || "");
        setField("unitOfMeasureCd", selection.quantityUnitCode || "");
        setField("originNationCode", selection.originNationCode || "");
        setField("sku", selection.itemCode || "");
        setField("mtvItemCode", selection.itemCode || "");
        setField("mtvManufacturerTpin", selection.manufacturerTpin || "");
        setField("mtvRrp", selection.rrp || "");
        setField("brand", selection.itemName || "")
      },
      [form.itemName, setField],
    );

    return (
      <>
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-5">
          {/* Item Category */}
          <SearchSelect2
            label="Item Category"
            value={form.itemGroup ?? ""}
            fetchOptions={async (q) => {
              const list = await getItemGroups(q || undefined);
              return list.map((g) => ({
                label: g.label,
                value: g.value,
                subLabel: g.description !== g.label ? g.description : undefined,
              }));
            }}
            onChange={(value) => setField("itemGroup", value)}
            placeholder="Search category..."
            required
            error={errors?.itemGroup}
          />

          {/* Item Name */}
          <ModalInput
            label="Item Name"
            name="itemName"
            value={form.itemName ?? ""}
            onChange={onFormChange}
            required
            error={errors?.itemName}
          />

          {/* Description */}
          <ModalInput
            label="Description"
            name="description"
            value={form.description ?? ""}
            onChange={onFormChange}
            required
            error={errors?.description}
          />

          {/* Brand / MTV Item */}
          <div className="flex min-w-0 items-end gap-2">
            {isZraEnabled ? (
              <label className="flex h-[25px] items-center gap-2 rounded border border-[var(--border)] bg-card px-2 text-[10px] font-medium text-main shadow-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.isMtvItem)}
                  onChange={(event) => handleMtvToggle(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[var(--border)] text-primary focus:ring-primary"
                />
                <span className="whitespace-nowrap">MTV Item</span>
              </label>
            ) : null}
            <div className="min-w-0 flex-1">
              {form.isMtvItem && isZraEnabled ? (
                <div className="flex flex-col">
                  <span className="mb-1 block text-[10px] font-medium text-main">
                    Brand
                  </span>
                  <button
                    type="button"
                    onClick={() => setMtvPickerOpen(true)}
                    className="flex h-[25px] w-full items-center justify-between rounded border border-[var(--border)] bg-card px-2 text-left text-[11px] text-main transition-all hover:border-primary/50"
                  >
                    <span className="truncate">
                      {form.mtvItemCode
                        ? `${form.itemName} (${form.mtvItemCode})`
                        : "Select MTV imported item..."}
                    </span>
                  </button>
                </div>
              ) : (
                <SearchSelect2
                  label="Brand"
                  value={form.brand ?? ""}
                  fetchOptions={fetchBrandOptions}
                  onChange={(value) => setField("brand", value)}
                  placeholder="Search brand..."
                  allowCustomInput
                  disabled={isServiceItem}
                />
              )}
            </div>
          </div>
          {/* HSN Code — trailing icon button doubles as the popover anchor */}
          {/* HSN Code — trailing button is a full-height attached action zone,
    visually separated by a divider so it reads as "search this field",
    not just a decorative icon. */}
<ModalInput
  label="HSN Code"
  name="itemClassCode"
  value={form.itemClassCode ?? ""}
  onChange={onFormChange}
  placeholder="Search or tpye..."
  required
  error={errors?.itemClassCode}
  trailingIcon={
    <button
      ref={hsnTriggerRef}
      type="button"
      onClick={() => setHsnPopoverOpen((v) => !v)}
      aria-label="Browse HSN codes"
      title="Browse HSN codes"
      tabIndex={-1}
      className="group flex h-full w-7 shrink-0 cursor-pointer items-center justify-center rounded-r border-l border-theme bg-primary/5 text-primary transition-colors hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-border-focus)] focus-visible:ring-inset"
    >
      <ScanSearch
        size={13}
        strokeWidth={2}
        className="transition-transform group-hover:scale-110 group-active:scale-95"
      />
    </button>
  }
/>
        </div>

        {/* Anchored to the button above — opens beside the field, not as a
            second full-screen modal. */}
        <HsnSearchPopover
          triggerRef={hsnTriggerRef}
          open={hsnPopoverOpen}
          onClose={() => setHsnPopoverOpen(false)}
          value={form.itemClassCode}
          onSelect={handleHsnSelect}
        />

        <MtvItemPickerModal
          isOpen={mtvPickerOpen}
          onClose={() => setMtvPickerOpen(false)}
          onSelectItem={handleMtvSelect}
          initialManufacturerTpin={form.mtvManufacturerTpin ?? ""}
        />
      </>
    );
  },
);

BasicDetailsSection.displayName = "BasicDetailsSection";

export default BasicDetailsSection;
