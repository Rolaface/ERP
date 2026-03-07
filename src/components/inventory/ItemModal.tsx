/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */

import React, { useState, useEffect, useCallback } from "react";
import { showApiError, showLoading, closeSwal } from "../../utils/alert";
import { toast } from "sonner";
import { updateItemByItemCode, createItem } from "../../api/itemApi";

import { getItemGroupById } from "../../api/itemCategoryApi";

import Modal from "../ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { useCompanySelection } from "../../hooks/useCompanySelection";
import { getItemFieldConfigs } from "../../config/companyConfigResolver";
import { DynamicField } from "../DynamicField";
import { API } from "../../config/api";

type FormState = Record<string, any>;

const emptyForm: Record<string, any> = {
  id: "",
  itemName: "",
  itemGroup: "",
  itemClassCode: "",
  itemTypeCode: "",
  originNationCode: "",
  packagingUnitCode: "",
  svcCharge: "",
  ins: "",
  sellingPrice: "",
  buyingPrice: "",
  unitOfMeasureCd: "",
  description: "",
  sku: "",
  taxPreference: "",
  preferredVendor: "",
  salesAccount: "",
  purchaseAccount: "",
  taxCategory: " ",
  taxType: "",
  taxCode: "",
  taxName: "",
  taxDescription: "",
  taxPerct: "",
  dimensionUnit: "",
  weight: "",
  valuationMethod: "",
  trackingMethod: "",
  reorderLevel: "",
  minStockLevel: "",
  maxStockLevel: "",
  brand: "",
  weightUnit: "",
  dimensionLength: "",
  dimensionWidth: "",
  dimensionHeight: "",
};

const itemTypeCodeOptions = [
  { value: "1", label: "Raw Material" },
  { value: "2", label: "Finished Product" },
  { value: "3", label: "Service" },
];

const TAX_CONFIGS = {
  "Non-Export": {
    taxType: "Standard Rated",
    taxPerct: "16",
    taxCode: "A",
    taxDescription:
      "Applies to products and services subject to VAT at 16% by default.",
  },
  LPO: {
    taxType: "Zero-Rated",
    taxPerct: "0",
    taxCode: "C2",
    taxDescription:
      "Applies to transactions involving customers or projects granted exemption from paying taxes.",
  },
  Export: {
    taxType: "Export",
    taxPerct: "0",
    taxCode: "C1",
    taxDescription:
      "Applies to goods or services exported outside the country and exempt from VAT.",
  },
};

const ItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  // onSubmit?: (data: Record<string, any>) => void;
  onSubmit?: (res: any) => void;

  initialData?: Record<string, any> | null;
  isEditMode?: boolean;
}> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false }) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetchingItem, setFetchingItem] = useState(false);
  const [itemCategoryDetails, setItemCategoryDetails] = useState<any>(null);
  const isServiceItem = Number(form.itemTypeCode) === 3;
  const { companyCode } = useCompanySelection();
  const fieldConfigs = getItemFieldConfigs(companyCode);

  const [activeTab, setActiveTab] = useState<
    "details" | "taxDetails" | "inventoryDetails"
  >("details");

  // Cascading item class dropdown states
  const [itemClassOptions, setItemClassOptions] = useState<
    Array<{ cd: string; cdNm: string; lvl: string }>
  >([]);
  const [loadingItemClasses, setLoadingItemClasses] = useState(false);
  const [selectedLevel1, setSelectedLevel1] = useState("");
  const [selectedLevel2, setSelectedLevel2] = useState("");
  const [selectedLevel3, setSelectedLevel3] = useState("");
  const [selectedLevel4, setSelectedLevel4] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setForm(isEditMode && initialData ? initialData : emptyForm);
    setActiveTab("details");

    // Clear level selections when opening in add mode
    if (!isEditMode) {
      setSelectedLevel1("");
      setSelectedLevel2("");
      setSelectedLevel3("");
      setSelectedLevel4("");
    }

    // Fetch item class list when modal opens
    void fetchItemClassList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode, initialData]);

  // Populate cascading selections from existing itemClassCode when editing
  useEffect(() => {
    if (
      !isEditMode ||
      !initialData?.itemClassCode ||
      itemClassOptions.length === 0
    ) {
      return;
    }

    const code = String(initialData.itemClassCode);
    const codeLength = code.length;

    // Helper to check if a code exists in options
    const codeExists = (checkCode: string) => {
      return itemClassOptions.some((opt) => opt.cd === checkCode);
    };

    // Determine level based on code length (each level adds 2 characters)
    // Level 1: 2 chars, Level 2: 4 chars, Level 3: 6 chars, Level 4: 8 chars
    if (codeLength >= 2) {
      const level1Code = code.substring(0, 2);
      if (codeExists(level1Code)) {
        setSelectedLevel1(level1Code);
      }
    }
    if (codeLength >= 4) {
      const level2Code = code.substring(0, 4);
      if (codeExists(level2Code)) {
        setSelectedLevel2(level2Code);
      }
    }
    if (codeLength >= 6) {
      const level3Code = code.substring(0, 6);
      if (codeExists(level3Code)) {
        setSelectedLevel3(level3Code);
      }
    }
    if (codeLength >= 8) {
      const level4Code = code.substring(0, 8);
      if (codeExists(level4Code)) {
        setSelectedLevel4(level4Code);
      }
    }
  }, [isEditMode, initialData, itemClassOptions]);

  // Fetch item class list from API
  const fetchItemClassList = useCallback(async () => {
    try {
      setLoadingItemClasses(true);
      const response = await fetch(API.lookup.getItemClasses);

      const data = await response.json();

      const mapped = data.map((item: any) => ({
        cd: item.itemClsCd || item.cd || "",
        cdNm: item.itemClsNm || item.cdNm || "",
        lvl: item.itemClsLvl || item.lvl || "1",
      }));
      setItemClassOptions(mapped || []);
    } catch (err) {
      toast.error("Failed to load item class list");
      console.error(err);
      setItemClassOptions([]);
    } finally {
      setLoadingItemClasses(false);
    }
  }, []);

  // Helper function to get codes by level and parent
  const getCodesByLevel = (level: string, parentCode?: string) => {
    return itemClassOptions.filter((option) => {
      if (option.lvl !== level) return false;

      // Level 1 has no parent
      if (level === "1") return true;

      // For other levels, check if code starts with parent prefix
      if (!parentCode) return false;

      const prefixLength = parseInt(level) * 2;
      const parentPrefix = parentCode.substring(0, prefixLength - 2);
      const codePrefix = option.cd.substring(0, prefixLength - 2);

      return codePrefix === parentPrefix;
    });
  };

  // Handle level selection - clear child levels when parent changes
  const handleLevelChange = (level: number, value: string) => {
    switch (level) {
      case 1:
        setSelectedLevel1(value);
        setSelectedLevel2("");
        setSelectedLevel3("");
        setSelectedLevel4("");
        break;
      case 2:
        setSelectedLevel2(value);
        setSelectedLevel3("");
        setSelectedLevel4("");
        break;
      case 3:
        setSelectedLevel3(value);
        setSelectedLevel4("");
        break;
      case 4:
        setSelectedLevel4(value);
        break;
    }

    // Update form with the final selected code (Level 3 or 4 required for submission)
    const finalCode =
      level === 4
        ? value || selectedLevel3 || selectedLevel2 || selectedLevel1
        : level === 3
          ? value || selectedLevel2 || selectedLevel1
          : level === 2
            ? value || selectedLevel1
            : value;

    setForm((prev) => ({ ...prev, itemClassCode: finalCode }));
  };

  // Validate Item Details section
  const validateItemDetails = () => {
    // First, validate Item Class Level for ZRA company
    if (companyCode === "ZRA") {
      if (!selectedLevel3 && !selectedLevel4) {
        if (selectedLevel1 && !selectedLevel2) {
          toast.error(
            "Item Class Level 1 alone is not sufficient. Please select at least Level 3 or higher.",
          );
          return false;
        } else if (selectedLevel2 && !selectedLevel3) {
          toast.error(
            "Item Class Level 2 is not sufficient. Please select at least Level 3 or higher.",
          );
          return false;
        } else if (!selectedLevel1) {
          toast.error("Please select an Item Class Level.");
          return false;
        } else {
          toast.error("Please select at least Item Class Level 3 to proceed.");
          return false;
        }
      }
    }

    // Then validate other required Item Details and Sales & Purchase fields
    const requiredFields = [
      { field: "itemTypeCode", label: "Item Type" },
      { field: "itemGroup", label: "Item Category" },
      { field: "itemName", label: "Items Name" },
      { field: "description", label: "Description" },
      { field: "packagingUnitCode", label: "Packaging Unit" },
      { field: "originNationCode", label: "Country Code" },
      { field: "unitOfMeasureCd", label: "Unit of Measurement" },
      { field: "svcCharge", label: "Service Charge" },
      { field: "ins", label: "INSURANCE" },
      { field: "sku", label: "SKU" },
      { field: "sellingPrice", label: "Selling Price", isNumeric: true },
      { field: "salesAccount", label: "Sales Account" },
      { field: "buyingPrice", label: "Buying Price", isNumeric: true },
      { field: "purchaseAccount", label: "Purchase Account" },
      { field: "taxPreference", label: "Tax Preference" },
      { field: "preferredVendor", label: "Preferred Vendor" },
    ];

    for (const { field, label, isNumeric } of requiredFields) {
      const fieldValue = form[field];
      const isEmpty = isNumeric
        ? fieldValue === "" || fieldValue === null || fieldValue === undefined
        : !fieldValue || String(fieldValue).trim() === "";

      if (isEmpty) {
        toast.error(
          `${label} is required. Please fill in all required fields.`,
        );
        return false;
      }
    }

    return true;
  };

  // Validate Tax Details section
  const validateTaxDetails = () => {
    if (!form.taxCategory || String(form.taxCategory).trim() === "") {
      toast.error("Please select a Tax Category.");
      return false;
    }

    return true;
  };

  // Handle form submission based on active tab
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If on Item Details tab, validate and move to Tax Details
    if (activeTab === "details") {
      if (validateItemDetails()) {
        toast.success("Item details validated. Please complete Tax Details.");
        setActiveTab("taxDetails");
      }
      return;
    }

    // If on Tax Details tab, validate tax details and submit to API
    if (activeTab === "taxDetails") {
      if (!validateTaxDetails()) {
        return;
      }

      try {
        setLoading(true);

        showLoading(isEditMode ? "Updating Item..." : "Creating Item...");

        const payload = {
          ...form,
          itemTypeCode: Number(form.itemTypeCode),
        };

        let response;

        if (isEditMode && initialData?.id) {
          response = await updateItemByItemCode(initialData.id, payload);
        } else {
          response = await createItem(payload);
        }

        closeSwal();

        if (!response || ![200, 201].includes(response.status_code)) {
          showApiError(response);
          return;
        }

        onSubmit?.(response);

        // Show success message and close modal
        toast.success(
          isEditMode
            ? "Item updated successfully!"
            : "Item created successfully!",
        );
        handleClose();
      } catch (err: any) {
        closeSwal();
        console.error("Item save failed:", err);
        showApiError(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // If on Inventory Details tab, just submit (inventory details are optional)
    if (activeTab === "inventoryDetails") {
      try {
        setLoading(true);

        showLoading(isEditMode ? "Updating Item..." : "Creating Item...");

        const payload = {
          ...form,
          itemTypeCode: Number(form.itemTypeCode),
        };

        let response;

        if (isEditMode && initialData?.id) {
          response = await updateItemByItemCode(initialData.id, payload);
        } else {
          response = await createItem(payload);
        }

        closeSwal();

        if (!response || ![200, 201].includes(response.status_code)) {
          showApiError(response);
          return;
        }

        onSubmit?.(response);

        toast.success(
          isEditMode
            ? "Item updated successfully!"
            : "Item created successfully!",
        );
        handleClose();
      } catch (err: any) {
        closeSwal();
        console.error("Item save failed:", err);
        showApiError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const loadItemCategoryDetailsById = async (id: string) => {
    try {
      const response = await getItemGroupById(id);
      if (!response || response.status_code !== 200) return;
      setForm((p) => ({ ...p, item_group: response.data.name }));
      setItemCategoryDetails(response.data);
    } catch (err) {
      showApiError("Error loading item category details");
    }
  };

  const handleForm = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // Auto-populate tax details when tax category changes
    if (name === "taxCategory") {
      const taxConfig = TAX_CONFIGS[value as keyof typeof TAX_CONFIGS];
      if (taxConfig) {
        setForm((prev) => ({
          ...prev,
          [name]: value,
          taxType: taxConfig.taxType,
          taxPerct: taxConfig.taxPerct,
          taxCode: taxConfig.taxCode,
          taxDescription: taxConfig.taxDescription,
        }));
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicFieldChange = (name: string, value: any) => {
    // If itemTypeCode changes, clear the itemGroup since it needs to be refiltered
    if (name === "itemTypeCode") {
      setForm((prev) => ({ ...prev, [name]: value, itemGroup: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = async (data: { name: string; id: string }) => {
    setForm((prev) => ({ ...prev, itemGroup: data.name }));
    await loadItemCategoryDetailsById(data.id);
  };

  const reset = () => {
    setForm(emptyForm);
    setSelectedLevel1("");
    setSelectedLevel2("");
    setSelectedLevel3("");
    setSelectedLevel4("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Item" : "Add Item"}
      subtitle="Create and manage item details"
      maxWidth="6xl"
      height="90vh"
    >
      <form onSubmit={handleSubmit} noValidate className="h-full flex flex-col">
        {/* Tabs */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === "details"
                  ? "text-primary border-b-[3px] border-primary"
                  : "text-muted border-b-[3px] border-transparent hover:text-main"
              }`}
            >
              Item Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("taxDetails")}
              className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === "taxDetails"
                  ? "text-primary border-b-[3px] border-primary"
                  : "text-muted border-b-[3px] border-transparent hover:text-main"
              }`}
            >
              Tax Details
            </button>
            <button
              type="button"
              disabled={isServiceItem}
              onClick={() => !isServiceItem && setActiveTab("inventoryDetails")}
              className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2
    ${
      activeTab === "inventoryDetails" && !isServiceItem
        ? "text-primary border-b-[3px] border-primary"
        : "text-muted border-b-[3px] border-transparent hover:text-main"
    }
    ${isServiceItem ? "opacity-50 cursor-not-allowed" : ""}
  `}
            >
              Inventory Details
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <section className="flex-1 overflow-y-auto p-4 space-y-6 bg-app">
          <div className="gap-6 max-h-screen overflow-auto p-4">
            {activeTab === "details" && (
              <>
                <h3 className="mb-4 text-lg font-semibold text-main underline">
                  Items Information
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {fieldConfigs.map((fieldConfig) => {
                      // Special rendering for itemClassCode - use cascading dropdowns
                      if (fieldConfig.fieldName === "itemClassCode") {
                        return (
                          <React.Fragment key="itemClassCode">
                            {/* Level 1 */}
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="font-medium text-muted">
                                Item Class Level 1{" "}
                                <span className="text-red-500">*</span>
                              </span>
                              <select
                                value={selectedLevel1}
                                onChange={(e) =>
                                  handleLevelChange(1, e.target.value)
                                }
                                disabled={loadingItemClasses}
                                required
                                className="rounded border border-theme bg-card text-main px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              >
                                <option value="">
                                  {loadingItemClasses
                                    ? "Loading..."
                                    : "Select Level 1 (Required)"}
                                </option>
                                {getCodesByLevel("1").map((option) => (
                                  <option key={option.cd} value={option.cd}>
                                    {option.cd} - {option.cdNm}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Level 2 */}
                            {selectedLevel1 &&
                              getCodesByLevel("2", selectedLevel1).length >
                                0 && (
                                <div className="flex flex-col gap-1 text-sm">
                                  <span className="font-medium text-muted">
                                    Item Class Level 2
                                  </span>
                                  <select
                                    value={selectedLevel2}
                                    onChange={(e) =>
                                      handleLevelChange(2, e.target.value)
                                    }
                                    className="rounded border border-theme bg-card text-main px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                  >
                                    <option value="">
                                      Select Level 2 (Optional)
                                    </option>
                                    {getCodesByLevel("2", selectedLevel1).map(
                                      (option) => (
                                        <option
                                          key={option.cd}
                                          value={option.cd}
                                        >
                                          {option.cd} - {option.cdNm}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                              )}

                            {/* Level 3 */}
                            {selectedLevel2 &&
                              getCodesByLevel("3", selectedLevel2).length >
                                0 && (
                                <div className="flex flex-col gap-1 text-sm">
                                  <span className="font-medium text-muted">
                                    Item Class Level 3{" "}
                                    <span className="text-red-500">*</span>
                                  </span>
                                  <select
                                    value={selectedLevel3}
                                    onChange={(e) =>
                                      handleLevelChange(3, e.target.value)
                                    }
                                    className="rounded border border-theme bg-card text-main px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                  >
                                    <option value="">
                                      Select Level 3 (Required)
                                    </option>
                                    {getCodesByLevel("3", selectedLevel2).map(
                                      (option) => (
                                        <option
                                          key={option.cd}
                                          value={option.cd}
                                        >
                                          {option.cd} - {option.cdNm}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                              )}

                            {/* Level 4 */}
                            {selectedLevel3 &&
                              getCodesByLevel("4", selectedLevel3).length >
                                0 && (
                                <div className="flex flex-col gap-1 text-sm">
                                  <span className="font-medium text-muted">
                                    Item Class Level 4
                                  </span>
                                  <select
                                    value={selectedLevel4}
                                    onChange={(e) =>
                                      handleLevelChange(4, e.target.value)
                                    }
                                    className="rounded border border-theme bg-card text-main px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                  >
                                    <option value="">
                                      Select Level 4 (Optional)
                                    </option>
                                    {getCodesByLevel("4", selectedLevel3).map(
                                      (option) => (
                                        <option
                                          key={option.cd}
                                          value={option.cd}
                                        >
                                          {option.cd} - {option.cdNm}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                              )}
                          </React.Fragment>
                        );
                      }

                      // Regular DynamicField for other fields
                      return (
                        <DynamicField
                          key={fieldConfig.fieldName}
                          config={fieldConfig}
                          value={form[fieldConfig.fieldName]}
                          onChange={handleDynamicFieldChange}
                          onApiChange={
                            fieldConfig.fieldName === "itemGroup"
                              ? handleCategoryChange
                              : undefined
                          }
                          filterValue={form.itemTypeCode}
                        />
                      );
                    })}
                  </div>
                </div>

                <h3 className="py-6 text-lg font-semibold text-main underline">
                  Sales & Purchase
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Input
                      label="Selling Price"
                      name="sellingPrice"
                      type="number"
                      placeholder="Enter selling price"
                      value={form.sellingPrice || ""}
                      onChange={handleForm}
                      className="w-full col-span-3"
                      required
                    />
                    <Input
                      label="Sales Account"
                      name="salesAccount"
                      placeholder="Enter sales account"
                      value={form.salesAccount || ""}
                      onChange={handleForm}
                      className="w-full col-span-3"
                      required
                    />
                    <Input
                      label="Buying Price"
                      name="buyingPrice"
                      type="number"
                      placeholder="Enter buying price"
                      value={form.buyingPrice || ""}
                      onChange={handleForm}
                      className="w-full"
                      required
                    />
                    <Input
                      label="Purchase Account"
                      name="purchaseAccount"
                      placeholder="Enter purchase account"
                      value={form.purchaseAccount || ""}
                      onChange={handleForm}
                      className="w-full"
                      required
                    />
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-muted">
                        Tax Preference <span className="text-red-500">*</span>
                      </span>
                      <select
                        name="taxPreference"
                        value={form.taxPreference || ""}
                        onChange={handleForm}
                        className="rounded border border-theme bg-card text-main px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      >
                        <option value="">Select tax preference</option>
                        <option value="Taxable">Taxable</option>
                        <option value="Non-Taxable">Non-Taxable</option>
                      </select>
                    </label>
                    <Input
                      label="Preferred Vendor"
                      name="preferredVendor"
                      placeholder="Enter preferred vendor"
                      value={form.preferredVendor || ""}
                      onChange={handleForm}
                      className="w-full col-span-3"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "taxDetails" && (
              <>
                {/* Tax Category Selector */}
                <div className="mb-8 ">
                  <label className="block text-sm font-semibold text-main mb-3">
                    Tax Category
                  </label>
                  <select
                    name="taxCategory"
                    value={form.taxCategory}
                    onChange={handleForm}
                    className="w-full md:w-96 px-4 py-3 text-base border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Non-Export">Non-Export</option>
                    <option value="Export">Export</option>
                    <option value="LPO">Local Purchase Order</option>
                  </select>

                  <p className="mt-2 text-sm text-muted">
                    {form.taxCategory === "Non-Export" &&
                      "Standard tax rates for domestic sales"}
                    {form.taxCategory === "Export" &&
                      "Zero-rated or exempt tax for international sales"}
                    {form.taxCategory === "LPO" &&
                      "Tax rates applicable to local purchases"}
                  </p>
                </div>

                {/* Dynamic Tax Form based on selected category */}
                <div className="bg-app rounded-lg p-6 border border-theme">
                  <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    {form.taxCategory === "Non-Export" &&
                      "Non-Export Tax Details"}
                    {form.taxCategory === "Export" && "Export Tax Details"}
                    {form.taxCategory === "LPO" &&
                      "Local Purchase Order Tax Details"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input
                      label="Tax Type"
                      name="taxType"
                      value={form.taxType || ""}
                      onChange={handleForm}
                      placeholder="e.g. VAT"
                      className="w-full"
                      disabled
                    />
                    <Input
                      label="Tax Code"
                      name="taxCode"
                      value={form.taxCode || ""}
                      onChange={handleForm}
                      placeholder="V001"
                      className="w-full"
                      disabled
                    />
                    <Input
                      label="Tax Name"
                      name="taxName"
                      value={form.taxName || ""}
                      onChange={handleForm}
                      placeholder="Standard VAT"
                      className="w-full"
                      readOnly
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Description"
                        name="taxDescription"
                        value={form.taxDescription || ""}
                        onChange={handleForm}
                        placeholder="12% VAT on Non-Export"
                        className="w-full"
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-muted">
                        Tax Percentage (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          name="taxPerct"
                          value={form.taxPerct || ""}
                          onChange={handleForm}
                          placeholder="12"
                          className="w-full px-3 py-2 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-card text-muted cursor-not-allowed"
                          disabled
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted font-medium">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="mt-6 bg-card border border-theme rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-main mb-2">
                    Current Configuration
                  </h4>
                  <div className="text-sm text-muted space-y-1">
                    <p>
                      <span className="font-medium">Category:</span>{" "}
                      {form.taxCategory === "Non-Export" && "Non-Export"}
                      {form.taxCategory === "Export" && "Export"}
                      {form.taxCategory === "LPO" && "Local Purchase Order"}
                    </p>
                    <p>
                      <span className="font-medium">Tax Type:</span>{" "}
                      {form.taxType || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Tax Code:</span>{" "}
                      {form.taxCode || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Tax Rate:</span>{" "}
                      {form.taxPerct ? `${form.taxPerct}%` : "N/A"}
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "inventoryDetails" && (
              <>
                <h3 className=" mb-2 text-lg font-semibold text-main underline">
                  Inventory Details
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Input
                      label="Brand"
                      name="brand"
                      value={form.brand}
                      onChange={handleForm}
                      className="w-full"
                      disabled={isServiceItem}
                    />

                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-muted text-sm">
                        Dimensions (L × W × H)
                      </span>
                      <div className="flex items-center gap-1">
                        <Input
                          label=""
                          name="dimensionLength"
                          placeholder="L"
                          value={form.dimensionLength || ""}
                          onChange={handleForm}
                          className="w-full text-center text-xs"
                        />

                        <span className="text-muted font-medium">×</span>

                        <Input
                          label=""
                          name="dimensionWidth"
                          placeholder="W"
                          value={form.dimensionWidth || ""}
                          onChange={handleForm}
                          className="w-full text-center text-xs"
                        />

                        <span className="text-muted font-medium">×</span>

                        <Input
                          label=""
                          name="dimensionHeight"
                          placeholder="H"
                          value={form.dimensionHeight || ""}
                          onChange={handleForm}
                          className="w-full text-center text-xs"
                        />

                        <select
                          name="dimensionUnit"
                          value={form.dimensionUnit || "cm"}
                          onChange={handleForm}
                          className="w-16 px-1 py-1.5 text-xs border border-theme bg-card text-main rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="cm">cm</option>
                          <option value="in">in</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-muted text-sm">
                        Weight
                      </span>
                      <div className="flex gap-2">
                        <Input
                          label=""
                          name="weight"
                          placeholder="0"
                          value={form.weight}
                          onChange={handleForm}
                          className="flex-1"
                        />
                        <select
                          name="weightUnit"
                          value={form.weightUnit}
                          onChange={handleForm}
                          // className="w-28 rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          className="w-16 px-1 py-1.5 text-xs border border-theme bg-card text-main rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="gm">gm</option>
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                    </div>

                    {/* Valuation Method */}
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-muted">
                        Valuation Method
                      </span>
                      <select
                        name="valuationMethod"
                        value={form.valuationMethod}
                        onChange={handleForm}
                        className="rounded border border-theme bg-card text-main px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                      >
                        <option value="">Select...</option>
                        <option value="FIFO">FIFO</option>
                        <option value="WAC">WAC</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className=" mt-6 col-span-full lg:col-span-4 xl:col-span-3 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="trackInventory"
                      name="trackInventory"
                      checked={form.trackInventory || false}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          trackInventory: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 accent-primary border-theme rounded cursor-pointer"
                    />
                    <label
                      htmlFor="trackInventory"
                      className="text-sm font-medium text-main cursor-pointer select-none"
                    >
                      Track Inventory
                    </label>
                  </div>

                  {form.trackInventory && (
                    <div className="ml-8 max-w-md">
                      <label className="block text-sm font-medium text-muted mb-1">
                        Tracking Method
                      </label>
                      <select
                        name="trackingMethod"
                        value={form.trackingMethod || ""}
                        onChange={handleForm}
                        className="w-full rounded-md border border-theme bg-card text-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select tracking method...</option>
                        <option value="none">Normal (No tracking)</option>
                        <option value="batch">Batch</option>
                        <option value="serial">Serial Number (SR No)</option>
                        <option value="imei">IMEI</option>
                      </select>
                    </div>
                  )}
                </div>

                <h3 className=" mt-12 text-lg font-semibold text-main underline">
                  Stock Level Tracking
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Input
                      label="Min Stock Level"
                      name="minStockLevel"
                      value={form.minStockLevel}
                      onChange={handleForm}
                      className="w-full col-span-3"
                    />
                    <Input
                      label="Max Stock Level"
                      name="maxStockLevel"
                      value={form.maxStockLevel}
                      onChange={handleForm}
                      className="w-full col-span-3"
                    />
                    <Input
                      label="Re-order Level"
                      name="reorderLevel"
                      value={form.reorderLevel}
                      onChange={handleForm}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
        {/*  FOOTER INSIDE FORM */}
        <div className="flex justify-end gap-2 border-t border-theme px-6 py-4">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>

          <Button variant="danger" type="button" onClick={reset}>
            Reset
          </Button>

          <Button variant="primary" loading={loading} type="submit">
            {activeTab === "details" ? "Next" : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Input component with required support
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, className = "", ...props }, ref) => (
  <label className="flex flex-col gap-1 text-sm w-full">
    <span className="font-medium text-muted">
      {label}
      {props.required && <span className="text-red-500 ml-1">*</span>}
    </span>
    <input
      ref={ref}
      className={`rounded border border-theme px-3 py-2 bg-card text-main 
focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
        props.disabled ? "bg-app text-muted cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    />
  </label>
));
Input.displayName = "Input";

export default ItemModal;
