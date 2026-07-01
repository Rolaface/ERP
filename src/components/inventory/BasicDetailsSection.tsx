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
import HsnSearchPopover from "./Hsnsearchmodal";

interface BasicDetailsSectionProps {
  form: ItemFormData;
  isServiceItem: boolean;
  onFormChange: ItemFormChangeHandler;
  errors?: Partial<Record<keyof ItemFormData, string>>;
  setField: ItemFieldSetter;
}

const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = React.memo(
  ({ form, onFormChange, errors, setField, isServiceItem }) => {
    const [hsnPopoverOpen, setHsnPopoverOpen] = useState(false);
    // Popover anchors to this button, not to the screen center.
    const hsnTriggerRef = useRef<HTMLButtonElement>(null);

    const fetchBrandOptions = useCallback(async (q: string) => getBrands(q), []);

    const handleHsnSelect = useCallback(
      (code: string) => {
        setField("itemClassCode", code);
      },
      [setField],
    );

    return (
      <>
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-6">

          {/* Brand */}
          <SearchSelect2
            label="Brand"
            value={form.brand ?? ""}
            fetchOptions={fetchBrandOptions}
            onChange={(value) => setField("brand", value)}
            placeholder="Search brand..."
            allowCustomInput
            disabled={isServiceItem}
          />

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

          {/* HSN Code — trailing icon button doubles as the popover anchor */}
          <ModalInput
            label="HSN Code"
            name="itemClassCode"
            value={form.itemClassCode ?? ""}
            onChange={onFormChange}
            placeholder="e.g. 84713010"
            required
            error={errors?.itemClassCode}
            trailingIcon={
              <button
                ref={hsnTriggerRef}
                type="button"
                onClick={() => setHsnPopoverOpen((v) => !v)}
                aria-label="Search HSN code"
                tabIndex={-1}
                className="rounded-md p-1 text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-border-focus)]"
              >
                <ScanSearch size={14} strokeWidth={2} />
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
          onSelect={handleHsnSelect}
        />
      </>
    );
  },
);

BasicDetailsSection.displayName = "BasicDetailsSection";

export default BasicDetailsSection;