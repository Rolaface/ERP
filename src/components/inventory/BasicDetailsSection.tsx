import React from "react";
import Tooltip from "../Tooltip";
import ItemGenericSelect from "../selects/ItemGenericSelect";
import {
  getCountries,
  getRolaCountries,
  getRolaUOMs,
  getUOMs,
} from "../../api/itemZraApi";
import { useCompanySelection } from "../../hooks/useCompanySelection";
import { SelectInput, TextAreaInput, TextInput } from "./ItemModalControls";
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
}

const isRolaCompany = (companyCode: string) => {
  const normalized = companyCode?.toUpperCase();
  return normalized === "ROLA" || normalized === "COMP-00004";
};

const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = React.memo(
  ({ form, itemGroups, loadingItemGroups, onFormChange, setField }) => {
    const { companyCode } = useCompanySelection();
    const useRolaLookups = isRolaCompany(companyCode);
    const fetchCountries = useRolaLookups ? getRolaCountries : getCountries;
    const fetchUoms = useRolaLookups ? getRolaUOMs : getUOMs;

    const categoryPlaceholder = form.itemTypeCode
      ? "Select Category"
      : "Select Item Type first";

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-5">
          <Tooltip content={`Item Type: ${form.itemTypeCode || "N/A"}`}>
            <SelectInput
              label="Item Type"
              name="itemTypeCode"
              value={form.itemTypeCode}
              onChange={onFormChange}
              required
            >
              <option value="">Select Item Type</option>
              <option value="1">Raw Material</option>
              <option value="2">Finished Product</option>
              <option value="3">Service</option>
            </SelectInput>
          </Tooltip>

          <Tooltip content={`Item Category: ${form.itemGroup || "N/A"}`}>
            <SelectInput
              label="Item Category"
              name="itemGroup"
              value={form.itemGroup}
              onChange={onFormChange}
              disabled={!form.itemTypeCode || loadingItemGroups}
              required
            >
              <option value="">
                {loadingItemGroups ? "Loading..." : categoryPlaceholder}
              </option>
              {form.itemTypeCode &&
                itemGroups.map((group) => (
                  <option key={group.id} value={group.groupName}>
                    {group.groupName}
                  </option>
                ))}
            </SelectInput>
          </Tooltip>

          <Tooltip content={`Item Name: ${form.itemName || "N/A"}`}>
            <TextInput
              label="Item Name"
              name="itemName"
              value={form.itemName}
              onChange={onFormChange}
              required
            />
          </Tooltip>

          <Tooltip content={`HSN: ${form.itemClassCode || "N/A"}`}>
            <TextInput
              label="HSN Code"
              name="itemClassCode"
              value={form.itemClassCode}
              onChange={onFormChange}
              placeholder="e.g. 84713010"
              required
            />
          </Tooltip>

          <Tooltip content={`UOM: ${form.unitOfMeasureCd || "N/A"}`}>
            <ItemGenericSelect
              label="Unit of Measurement"
              value={form.unitOfMeasureCd}
              fetchData={fetchUoms}
              onChange={({ id }) => setField("unitOfMeasureCd", id)}
              required
            />
          </Tooltip>
        </div>

        <div className="grid grid-cols-12 gap-x-4 gap-y-4">
          <div className="col-span-12 md:col-span-3">
            <Tooltip
              content={`Country of Origin: ${form.originNationCode || "N/A"}`}
            >
              <ItemGenericSelect
                label="Country of Origin"
                value={form.originNationCode}
                fetchData={fetchCountries}
                displayField={useRolaLookups ? "name" : undefined}
                onChange={({ id }) => setField("originNationCode", id)}
                required
              />
            </Tooltip>
          </div>

          <div className="col-span-12 md:col-span-9">
            <Tooltip content={`Description: ${form.description || "N/A"}`}>
              <TextAreaInput
                label="Description"
                name="description"
                value={form.description}
                onChange={onFormChange}
                rows={2}
                required
                className="h-16 resize-none"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    );
  },
);

BasicDetailsSection.displayName = "BasicDetailsSection";

export default BasicDetailsSection;
