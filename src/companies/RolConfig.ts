import type { FieldConfig } from "../types/fieldConfig.types";

// COMP-00004 Configuration - Uses TEXT INPUTS (no API calls)
export const COMP_00004_ITEM_FIELDS: FieldConfig[] = [
  // Item Type - Static dropdown
  {
    fieldName: "itemTypeCode",
    fieldType: "static-select",
    label: "Item Type",
    required: true,
    colSpan: 1,
    options: [
      { value: "", label: "select type" },
      { value: "1", label: "Raw Material" },
      { value: "2", label: "Finished Product" },
      { value: "3", label: "Service" },
    ],
  },

  // Item Group - TEXT INPUT (no API)
  {
    fieldName: "itemGroup",
    fieldType: "api-select",
    label: "Item Category",
    required: true,
    colSpan: 1,
    apiFunctionName: "ItemCategorySelect",
    customComponent: "ItemCategorySelect",
  },

  // Item Name
  {
    fieldName: "itemName",
    fieldType: "text-input",
    label: "Items Name",
    required: true,
    colSpan: 1,
  },

  // Description
  {
    fieldName: "description",
    fieldType: "textarea",
    label: "Description",
    colSpan: 1,
  },

  // Item Class - TEXT INPUT (no API)
  {
    fieldName: "itemClassCode",
    fieldType: "text-input",
    label: "Item Class",
    colSpan: 1,
    placeholder: "Enter item class",
  },

  // Packaging Unit - TEXT INPUT (no API)
  {
    fieldName: "packagingUnitCode",
    fieldType: "text-input",
    label: "Packaging Unit",
    colSpan: 1,
    placeholder: "e.g., Box, Carton",
  },

  // Country Code - TEXT INPUT (no API)
  {
    fieldName: "originNationCode",
    fieldType: "text-input",
    label: "Country Code",
    colSpan: 1,
    placeholder: "e.g., US, UK, IN",
  },

  // Unit of Measure - TEXT INPUT (no API)
  {
    fieldName: "unitOfMeasureCd",
    fieldType: "api-select",
    label: "Unit of Measurement",
    colSpan: 1,
    apiFunctionName: "getRolaUOMs",
    customComponent: "ItemGenericSelect",
  },
  // Service Charge
  {
    fieldName: "svcCharge",
    fieldType: "static-select",
    label: "Service Charge",
    required: true,
    colSpan: 1,
    options: [
      { value: "Y", label: "Y" },
      { value: "N", label: "N" },
    ],
  },

  // Insurance
  {
    fieldName: "ins",
    fieldType: "static-select",
    label: "INSURANCE",
    required: true,
    colSpan: 1,
    options: [
      { value: "Y", label: "Y" },
      { value: "N", label: "N" },
    ],
  },

  // SKU
  {
    fieldName: "sku",
    fieldType: "text-input",
    label: "SKU",
    colSpan: 1,
  },
];
