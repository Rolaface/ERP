import React from "react";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import type {
  ItemFieldSetter,
  ItemFormChangeHandler,
  ItemFormData,
  ItemGroupOption,
} from "./itemModalTypes";

interface BasicDetailsSectionProps {
  form: ItemFormData;
  itemGroups: ItemGroupOption[];
  loadingItemGroups: boolean;
  onFormChange: ItemFormChangeHandler;
  setField: ItemFieldSetter;
  errors?: Partial<Record<keyof ItemFormData, string>>;
}


const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = React.memo(
  ({ form, itemGroups, loadingItemGroups, onFormChange, errors }) => {
    const categoryPlaceholder = "Select Category";

    return (
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-5">
        {/* Item Type */}
        <ModalSelect
          label="Item Type"
          name="itemTypeCode"
          value={form.itemTypeCode}
          onChange={onFormChange}
          placeholder="Select..."
        >
          <option value="1">Raw Material</option>
          <option value="2">Finished Product</option>
          <option value="3">Service</option>
        </ModalSelect>

        {/* Item Category */}
        <ModalSelect
          label="Item Category"
          name="itemGroup"
          value={form.itemGroup}
          onChange={onFormChange}

          required
          error={errors?.itemGroup}
          placeholder={loadingItemGroups ? "Loading..." : categoryPlaceholder}
        >
          {itemGroups.map((group) => (
            <option key={group.id} value={group.groupName}>
              {group.groupName}
            </option>
          ))}
        </ModalSelect>

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

        {/* HSN Code */}
        <ModalInput
          label="HSN Code"
          name="itemClassCode"
          value={form.itemClassCode ?? ""}
          onChange={onFormChange}
          placeholder="e.g. 84713010"
          required
          error={errors?.itemClassCode}
        />
      </div>
    );
  },
);

BasicDetailsSection.displayName = "BasicDetailsSection";

export default BasicDetailsSection;
