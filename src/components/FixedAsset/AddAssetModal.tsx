import React, { useState, useEffect, useRef } from "react";
import { Package } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getLocationOptions } from "../../api/location";
import DatePickerInput from "../calendar/DatePickerInput";
import { getItemCodeOptions } from "../../api/assetapi";
import { getFinanceBooks } from "../../api/faapi";

import { getEmployeeOptions } from "../../api/assetMovementapi";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import { showApiError, showSuccess } from "../../utils/alert";
import type {
  AssetForm,
  AddAssetModalProps,
  AssetTab,
} from "../../types/Asset.types";
import {
  ASSET_TAB_LABELS,
  DEFAULT_ASSET_FORM,
  getAssetTabs,
} from "../../types/Asset.types";
import { useAssetLogic } from "../../hooks/useAssetLogic";
import { getAssetById, updateAsset } from "../../api/assetapi";
import CostCenterSelect from "../../components/selects/CostCenterSelect";

const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  modalId,
}) => {
  const {
    checkLocationExists,
    createMaintainedLocation,
    handleCreateAsset,
    fetchAssetCategories,
  } = useAssetLogic();

  // ── Stable ID: computed once per mount ──
  const resolvedModalId = useRef(
    modalId ??
      (mode === "edit" && initialData?.assetName
        ? `asset-edit-${initialData.assetName}-${Date.now()}`
        : `asset-create-${Date.now()}`),
  ).current;

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [form, setForm] = useState<AssetForm>({
    ...DEFAULT_ASSET_FORM,
    assetType: "",
    ...initialData,
  });
  const [activeTab, setActiveTab] = useState<AssetTab>("details");
  const [submitting, setSubmitting] = useState(false);

  // ── Dynamic tabs based on calculateDepreciation ──
  const activeTabs = getAssetTabs(form.calculateDepreciation);

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      setActiveTab("details");

      // CREATE mode
      if (mode === "create") {
        setForm({ ...DEFAULT_ASSET_FORM });
        return;
      }

      // EDIT mode
      if (mode === "edit" && initialData?.assetName) {
        try {
          const data = await getAssetById(initialData.assetName);

          setForm({
            ...DEFAULT_ASSET_FORM,

            assetName: data.asset_name || "",
            itemCode: data.item_code || "",
            assetCategory: data.asset_category || "",
            location: data.location || "",
            assetType: data.asset_type || "",

            maintenanceRequired: !!data.maintenance_required,
            calculateDepreciation: !!data.calculate_depreciation,

            purchaseDate: data.purchase_date || "",
            availableForUseDate: data.available_for_use_date || "",

            netPurchaseAmount: data.net_purchase_amount || 0,
            assetQuantity: data.asset_quantity || 1,

            assetOwner: data.asset_owner || "",
            assetOwnerCompany: data.asset_owner_company || "",

            status: data.status || "Draft",
            custodian: data.custodian || "",
            department: data.department || "",
            financeBooks: (data.finance_books || []).map((fb: any) => ({
              financeBook: fb.finance_book || "",

              depreciationMethod:
                fb.depreciation_method === "Straight Line"
                  ? "Straight Line Method"
                  : fb.depreciation_method || "Straight Line Method",

              frequencyOfDepreciation:
                fb.frequency_of_depreciation === 1
                  ? "Monthly"
                  : fb.frequency_of_depreciation === 2
                    ? "Quarterly"
                    : fb.frequency_of_depreciation === 3
                      ? "Half-Yearly"
                      : "Yearly",

              totalNumberOfDepreciations: fb.total_number_of_depreciations || 0,

              depreciationStartDate: fb.depreciation_start_date || "",

              expectedValueAfterUsefulLife:
                fb.expected_value_after_useful_life || 0,

              rateOfDepreciation: fb.rate_of_depreciation || 0,
            })),
          });
        } catch (err) {
          console.error("GET BY ID ERROR", err);
        }
      }
    };

    loadData();
  }, [isOpen, mode, initialData]);

  // If depreciation tab is active but checkbox gets unchecked, go back to details
  useEffect(() => {
    if (!form.calculateDepreciation && activeTab === "depreciation") {
      setActiveTab("details");
    }
  }, [form.calculateDepreciation]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    let finalValue: any = value;

    if (type === "checkbox") {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    if (
      name === "netPurchaseAmount" ||
      name === "assetQuantity" ||
      name === "insuredValue" ||
      name === "totalNumberOfDepreciations" ||
      name === "expectedValueAfterUsefulLife" ||
      name === "rateOfDepreciation"
    ) {
      finalValue = Number(value);
    }

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    markDirty();
  };

  const fetchFinanceBooks = async () => {
    const data = await getFinanceBooks();
    return data.map((item: any) => ({
      label: item.label,
      value: item.value,
    }));
  };

  const handleSubmitForm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const enteredLocation = (form.location || "").trim();

      if (!enteredLocation) {
        throw new Error("Location is required");
      }
      let resolvedLocation = enteredLocation;

      // ── Step 1: Resolve location silently (no confirmation) ──
      if (enteredLocation) {
        const existingLocation = await checkLocationExists(enteredLocation);
        if (existingLocation) {
          // Location already exists — use it as-is
          resolvedLocation = existingLocation;
        } else {
          // Not found — createMaintainedLocation does a final re-check before creating
          resolvedLocation = await createMaintainedLocation(enteredLocation);
        }
      }

      // ── Step 2: Submit asset ──
      if (mode === "edit" && initialData?.assetName) {
        await updateAsset(initialData.assetName, {
          asset_name: form.assetName,
          item_code: form.itemCode,
          asset_category: form.assetCategory,
          location: resolvedLocation,
          asset_type: form.assetType,

          maintenance_required: form.maintenanceRequired ? 1 : 0,
          calculate_depreciation: form.calculateDepreciation ? 1 : 0,

          net_purchase_amount: Number(form.netPurchaseAmount || 0),
          asset_quantity: Number(form.assetQuantity || 1),
          available_for_use_date: form.availableForUseDate,

          asset_owner: form.assetOwner,
          asset_owner_company: form.assetOwnerCompany,

          status: form.status,
          custodian: form.custodian,
          department: form.department,
        });
      } else {
        await handleCreateAsset(form, resolvedLocation);
      }

      showSuccess(
        mode === "edit"
          ? "Asset updated successfully"
          : "Asset created successfully",
      );

      resetDirty();
      onClose();

      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.FIXED_ASSET_LIST);
    } catch (err) {
      showApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const idx = activeTabs.indexOf(activeTab);
    if (idx < activeTabs.length - 1) setActiveTab(activeTabs[idx + 1]);
  };

  const handleReset = async () => {
    resetDirty();
    setForm({ ...DEFAULT_ASSET_FORM, ...initialData });
  };

  const footerContent = (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={handleReset}
      onSubmit={handleSubmitForm}
      onNext={handleNext}
      currentTab={activeTabs.indexOf(activeTab)}
      totalTabs={activeTabs.length}
      saving={submitting}
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={mode === "edit" ? "Edit Asset" : "New Asset"}
      subtitle="Create and manage asset details"
      icon={Package}
      footer={footerContent}
      maxWidth="4xl"
      height="78vh"
    >
      <form
        id="assetForm"
        className="h-full flex flex-col"
        autoComplete="off"
        onChange={markDirty}
      >
        {/* ── Tabs ── */}
        <div className="bg-app border-b border-theme px-6 shrink-0">
          <div className="flex gap-8">
            {activeTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all
                  ${
                    activeTab === tab
                      ? "text-primary border-b-[3px] border-primary"
                      : "text-muted border-b-[3px] border-transparent hover:text-main"
                  }`}
              >
                {ASSET_TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="overflow-y-auto px-4 py-4 flex flex-col gap-6">
          {/* ────────── DETAILS TAB ────────── */}
          {activeTab === "details" && (
            <>
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 items-end">
                <ModalInput
                  label="Asset Name *"
                  name="assetName"
                  value={form.assetName}
                  onChange={handleChange}
                  placeholder="Enter asset name"
                  className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                />
                <SearchSelect2
                  label="Item Code *"
                  value={form.itemCode}
                  fetchOptions={getItemCodeOptions}
                  allowCustomInput
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, itemCode: val || "" }));
                    markDirty();
                  }}
                  onInputChange={(input) => {
                    setForm((prev) => ({ ...prev, itemCode: input || "" }));
                  }}
                  placeholder="Search or type item code"
                />
                <SearchSelect2
                  label="Asset Category"
                  value={form.assetCategory}
                  fetchOptions={fetchAssetCategories}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, assetCategory: val }));
                    markDirty();
                  }}
                  placeholder="Search category"
                />
                <SearchSelect2
                  label="Location *"
                  value={form.location}
                  fetchOptions={getLocationOptions}
                  allowCustomInput
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, location: val || "" }));
                    markDirty();
                  }}
                  onInputChange={(input) => {
                    setForm((prev) => ({ ...prev, location: input || "" }));
                  }}
                  placeholder="Search or type location"
                />
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-end">
                <ModalSelect
                  label="Asset Type"
                  name="assetType"
                  value={form.assetType}
                  onChange={handleChange}
                  options={[
                    { value: " ", label: " " },
                    { value: "Existing Asset", label: "Existing Asset" },
                    { value: "Composite Asset", label: "Composite Asset" },
                    {
                      value: "Composite Component",
                      label: "Composite Component",
                    },
                  ]}
                  className="w-full border border-theme rounded text-[11px] text-main bg-card"
                />
                <label className="flex items-center gap-2 pb-1 whitespace-nowrap">
                  <input
                    type="checkbox"
                    name="maintenanceRequired"
                    checked={form.maintenanceRequired}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-xs text-main">
                    Maintenance Required
                  </span>
                </label>
                <label className="flex items-center gap-2 pb-1 whitespace-nowrap">
                  <input
                    type="checkbox"
                    name="calculateDepreciation"
                    checked={form.calculateDepreciation}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-xs text-main">
                    Calculate Depreciation
                  </span>
                </label>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">
                  Purchase Details
                </p>

                {/* ── No type selected: show placeholder ── */}
                {form.assetType === "" && (
                  <div className="py-4 text-center text-[11px] text-muted">
                    Select an Asset Type above to see purchase fields.
                  </div>
                )}

                {/* ── Existing Asset / Composite Asset ── */}
                {(form.assetType === "Existing Asset" ||
                  form.assetType === "Composite Asset") && (
                  <>
                    <div className="grid grid-cols-[1fr_1fr] gap-3 items-end">
                      <DatePickerInput
                        label="Purchase Date *"
                        name="purchaseDate"
                        value={(form as any).purchaseDate ?? ""}
                        onChange={(name, value) => {
                          setForm((prev) => ({ ...prev, [name]: value }));
                          markDirty();
                        }}
                      />
                      <ModalInput
                        label={`Net Purchase Amount (INR)${form.assetType === "Existing Asset" ? " *" : ""}`}
                        name="netPurchaseAmount"
                        value={form.netPurchaseAmount}
                        onChange={handleChange}
                        inputMode="numeric"
                        placeholder="0.00"
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_1fr] gap-3 items-end">
                      <DatePickerInput
                        label={`Available for Use Date${form.assetType === "Existing Asset" ? " *" : ""}`}
                        name="availableForUseDate"
                        value={form.availableForUseDate}
                        onChange={(name, value) => {
                          setForm((prev) => ({ ...prev, [name]: value }));
                          markDirty();
                        }}
                      />
                      <ModalInput
                        label="Asset Quantity"
                        name="assetQuantity"
                        value={form.assetQuantity}
                        onChange={handleChange}
                        inputMode="numeric"
                        placeholder="1"
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                    </div>
                  </>
                )}

                {/* ── Composite Component ── */}
                {(form.assetType === "Composite Component" ||
                  form.assetType === " " ||
                  !form.assetType?.trim()) && (
                  <>
                    <div className="grid grid-cols-[1fr_1fr] gap-3 items-end">
                      <ModalInput
                        label="Purchase Receipt *"
                        name="purchaseReceipt"
                        value={form.purchaseReceipt}
                        onChange={handleChange}
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                      <ModalInput
                        label="Net Purchase Amount (INR) *"
                        name="netPurchaseAmount"
                        value={form.netPurchaseAmount}
                        onChange={handleChange}
                        inputMode="numeric"
                        placeholder="0.00"
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_1fr] gap-3 items-end">
                      <ModalInput
                        label="Purchase Invoice *"
                        name="purchaseInvoice"
                        value={form.purchaseInvoice}
                        onChange={handleChange}
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                      <ModalInput
                        label="Asset Quantity"
                        name="assetQuantity"
                        value={form.assetQuantity}
                        onChange={handleChange}
                        inputMode="numeric"
                        placeholder="1"
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_1fr] gap-3">
                      <DatePickerInput
                        label="Available for Use Date *"
                        name="availableForUseDate"
                        value={form.availableForUseDate}
                        onChange={(name, value) => {
                          setForm((prev) => ({ ...prev, [name]: value }));
                          markDirty();
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ────────── DEPRECIATION TAB ────────── */}
          {activeTab === "depreciation" && (
            <>
              {/* Finance Books table */}
              <div>
                <div className="flex items-center justify-between border-b border-theme pb-1 mb-3">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">
                    Finance Books
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        financeBooks: [
                          ...prev.financeBooks,
                          {
                            financeBook: "",
                            depreciationMethod: "Straight Line Method",
                            totalNumberOfDepreciations: 0,
                            frequencyOfDepreciation: "Yearly",
                            depreciationStartDate: "",
                            expectedValueAfterUsefulLife: 0,
                            rateOfDepreciation: 0,
                          },
                        ],
                      }));
                      markDirty();
                    }}
                    className="text-[11px] text-primary font-medium hover:underline"
                  >
                    + Add Row
                  </button>
                </div>

                {form.financeBooks.length === 0 ? (
                  <div className="rounded border border-dashed border-theme py-6 text-center text-[11px] text-muted">
                    No finance books added. Click{" "}
                    <span className="text-primary font-medium">+ Add Row</span>{" "}
                    to add one.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded border border-theme">
                    <table className="w-full text-[11px] text-main">
                      <thead>
                        <tr className="bg-app border-b border-theme">
                          <th className="py-2 px-3 text-left font-semibold text-muted">
                            Finance Book
                          </th>
                          <th className="py-2 px-3 text-left font-semibold text-muted">
                            Method
                          </th>
                          <th className="py-2 px-3 text-left font-semibold text-muted">
                            No. of Depreciations
                          </th>
                          <th className="py-2 px-3 text-left font-semibold text-muted">
                            Frequency
                          </th>
                          <th className="py-2 px-3 text-left font-semibold text-muted">
                            Dep. posting Date
                          </th>
                          <th className="py-2 px-3 text-left font-semibold text-muted">
                            Salvage Value
                          </th>
                          <th className="py-2 px-3 text-center font-semibold text-muted w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.financeBooks.map((fb, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-theme last:border-0 hover:bg-app/50"
                          >
                            <td className="py-1.5 px-3">
                              <SearchSelect2
                                label=""
                                value={fb.financeBook}
                                fetchOptions={fetchFinanceBooks}
                                onChange={(val) => {
                                  const updated = [...form.financeBooks];
                                  updated[idx] = {
                                    ...updated[idx],
                                    financeBook: val || "",
                                  };
                                  setForm((prev) => ({
                                    ...prev,
                                    financeBooks: updated,
                                  }));
                                  markDirty();
                                }}
                                placeholder="Select Finance Book"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <select
                                value={fb.depreciationMethod}
                                onChange={(e) => {
                                  const updated = [...form.financeBooks];
                                  updated[idx] = {
                                    ...updated[idx],
                                    depreciationMethod: e.target.value as any,
                                  };
                                  setForm((prev) => ({
                                    ...prev,
                                    financeBooks: updated,
                                  }));
                                  markDirty();
                                }}
                                className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                              >
                                <option value="Straight Line Method">
                                  Straight Line
                                </option>
                                <option value="Double Declining Balance">
                                  Double Declining
                                </option>
                                <option value="Written Down Value">
                                  Written Down Value
                                </option>
                                <option value="Manual">Manual</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="number"
                                value={fb.totalNumberOfDepreciations}
                                onChange={(e) => {
                                  const updated = [...form.financeBooks];
                                  updated[idx] = {
                                    ...updated[idx],
                                    totalNumberOfDepreciations: Number(
                                      e.target.value,
                                    ),
                                  };
                                  setForm((prev) => ({
                                    ...prev,
                                    financeBooks: updated,
                                  }));
                                  markDirty();
                                }}
                                className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <select
                                value={fb.frequencyOfDepreciation}
                                onChange={(e) => {
                                  const updated = [...form.financeBooks];
                                  updated[idx] = {
                                    ...updated[idx],
                                    frequencyOfDepreciation: e.target
                                      .value as any,
                                  };
                                  setForm((prev) => ({
                                    ...prev,
                                    financeBooks: updated,
                                  }));
                                  markDirty();
                                }}
                                className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                              >
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Half-Yearly">Half-Yearly</option>
                                <option value="Yearly">Yearly</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="date"
                                value={fb.depreciationStartDate}
                                onChange={(e) => {
                                  const updated = [...form.financeBooks];
                                  updated[idx] = {
                                    ...updated[idx],
                                    depreciationStartDate: e.target.value,
                                  };
                                  setForm((prev) => ({
                                    ...prev,
                                    financeBooks: updated,
                                  }));
                                  markDirty();
                                }}
                                className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="number"
                                value={fb.expectedValueAfterUsefulLife}
                                onChange={(e) => {
                                  const updated = [...form.financeBooks];
                                  updated[idx] = {
                                    ...updated[idx],
                                    expectedValueAfterUsefulLife: Number(
                                      e.target.value,
                                    ),
                                  };
                                  setForm((prev) => ({
                                    ...prev,
                                    financeBooks: updated,
                                  }));
                                  markDirty();
                                }}
                                placeholder="0.00"
                                className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    financeBooks: prev.financeBooks.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  }));
                                  markDirty();
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Remove row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ────────── MORE INFO TAB ────────── */}
          {activeTab === "moreInfo" && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">
                  Accounting Dimensions
                </p>
                <div className="grid grid-cols-[1fr_3fr] gap-3">
                  <CostCenterSelect
                    value={form.costCenter}
                    onChange={(value) => {
                      setForm((prev) => ({ ...prev, costCenter: value }));
                      markDirty();
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">
                  Ownership
                </p>
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <ModalSelect
                    label="Asset Owner"
                    name="assetOwner"
                    value={form.assetOwner}
                    onChange={handleChange}
                    options={[
                      { value: "Company", label: "Company" },
                      { value: "Employee", label: "Employee" },
                      { value: "Customer", label: "Customer" },
                    ]}
                    className="w-full border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <ModalInput
                    label="Asset Owner Company"
                    name="assetOwnerCompany"
                    value={form.assetOwnerCompany}
                    onChange={handleChange}
                    disabled
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">
                  Insurance
                </p>
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <ModalInput
                    label="Policy Number"
                    name="policyNumber"
                    value={form.policyNumber}
                    onChange={handleChange}
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <ModalInput
                    label="Insurance Start Date"
                    name="insuranceStartDate"
                    value={form.insuranceStartDate}
                    onChange={handleChange}
                    type="date"
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <ModalInput
                    label="Insurer"
                    name="insurer"
                    value={form.insurer}
                    onChange={handleChange}
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <ModalInput
                    label="Insurance End Date"
                    name="insuranceEndDate"
                    value={form.insuranceEndDate}
                    onChange={handleChange}
                    type="date"
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <ModalInput
                    label="Insured Value"
                    name="insuredValue"
                    value={form.insuredValue}
                    onChange={handleChange}
                    inputMode="numeric"
                    placeholder="0.00"
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <label className="flex items-center gap-2 pb-1">
                    <input
                      type="checkbox"
                      name="comprehensiveInsurance"
                      checked={form.comprehensiveInsurance}
                      onChange={handleChange}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-xs text-main">
                      Comprehensive Insurance
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">
                  Additional Info
                </p>
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-3">
                  <ModalSelect
                    label="Status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    options={[
                      { value: "Draft", label: "Draft" },
                      { value: "Submitted", label: "Submitted" },
                      { value: "In Maintenance", label: "In Maintenance" },
                      { value: "Out of Order", label: "Out of Order" },
                      { value: "Scrapped", label: "Scrapped" },
                    ]}
                    className="w-full border border-theme rounded text-[11px] text-main bg-card"
                  />
                 <SearchSelect2
  label="Custodian"
  value={form.custodianLabel || ""}
  fetchOptions={getEmployeeOptions}
  onChange={(value, option) => {
    setForm((prev) => ({
      ...prev,
      custodian: value,         
      custodianLabel: option.label, 
    }));
    markDirty();
  }}
  placeholder="Search employee..."
/>
                  <ModalInput
                    label="Department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default AddAssetModal;
