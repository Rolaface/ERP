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
      </>
    );
  },
);

BasicDetailsSection.displayName = "BasicDetailsSection";

export default BasicDetailsSection;
