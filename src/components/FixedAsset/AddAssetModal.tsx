import React, { useState, useEffect, useRef } from "react";
import { Package } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import { showApiError, showSuccess } from "../../utils/alert";
import type { AssetForm, AddAssetModalProps, AssetTab } from "../../types/Asset.types";
import { ASSET_TABS, ASSET_TAB_LABELS, DEFAULT_ASSET_FORM } from "../../types/Asset.types";

const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  modalId,
}) => {
  // ── Stable ID: computed once per mount, never changes on re-render ──
  const resolvedModalId = useRef(
    modalId ??
      (mode === "edit" && initialData?.assetName
        ? `asset-edit-${initialData.assetName}-${Date.now()}`
        : `asset-create-${Date.now()}`),
  ).current;

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [form, setForm] = useState<AssetForm>({ ...DEFAULT_ASSET_FORM, ...initialData });
  const [activeTab, setActiveTab] = useState<AssetTab>("details");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      setForm({ ...DEFAULT_ASSET_FORM, ...initialData });
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    markDirty();
  };

  const handleSubmitForm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(form);
      }
      showSuccess(
        mode === "edit" ? "Asset updated successfully" : "Asset created successfully",
      );
      resetDirty();
      onClose();
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.FIXED_ASSET_LIST);
    } catch (err) {
      showApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const idx = ASSET_TABS.indexOf(activeTab);
    if (idx < ASSET_TABS.length - 1) setActiveTab(ASSET_TABS[idx + 1]);
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
      currentTab={ASSET_TABS.indexOf(activeTab)}
      totalTabs={ASSET_TABS.length}
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
            {ASSET_TABS.map((tab) => (
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

          {activeTab === "details" && (
            <>
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 items-end">
                <ModalInput label="Asset Name *" name="assetName" value={form.assetName} onChange={handleChange} placeholder="Enter asset name" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                <ModalInput label="Item Code *" name="itemCode" value={form.itemCode} onChange={handleChange} placeholder="Enter item code" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                <ModalInput label="Asset Category" name="assetCategory" value={form.assetCategory} onChange={handleChange} placeholder="e.g. Computers" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                <ModalInput label="Location *" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Head Office" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-end">
                <ModalSelect
                  label="Asset Type"
                  name="assetType"
                  value={form.assetType}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Select type" },
                    { value: "Movable", label: "Movable" },
                    { value: "Immovable", label: "Immovable" },
                  ]}
                  className="w-full border border-theme rounded text-[11px] text-main bg-card"
                />
                <label className="flex items-center gap-2 pb-1 whitespace-nowrap">
                  <input type="checkbox" name="maintenanceRequired" checked={form.maintenanceRequired} onChange={handleChange} className="w-3.5 h-3.5 accent-primary" />
                  <span className="text-xs text-main">Maintenance Required</span>
                </label>
                <label className="flex items-center gap-2 pb-1 whitespace-nowrap">
                  <input type="checkbox" name="calculateDepreciation" checked={form.calculateDepreciation} onChange={handleChange} className="w-3.5 h-3.5 accent-primary" />
                  <span className="text-xs text-main">Calculate Depreciation</span>
                </label>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">Purchase Details</p>
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 items-end">
                  <ModalInput label="Purchase Receipt *" name="purchaseReceipt" value={form.purchaseReceipt} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Net Purchase Amount (INR) *" name="netPurchaseAmount" value={form.netPurchaseAmount} onChange={handleChange} inputMode="numeric" placeholder="0.00" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Purchase Invoice *" name="purchaseInvoice" value={form.purchaseInvoice} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Asset Quantity" name="assetQuantity" value={form.assetQuantity} onChange={handleChange} inputMode="numeric" placeholder="1" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                </div>
                <div className="mt-3 grid grid-cols-[1fr_3fr] gap-3">
                  <ModalInput label="Available for Use Date *" name="availableForUseDate" value={form.availableForUseDate} onChange={handleChange} type="date" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                </div>
              </div>
            </>
          )}

          {activeTab === "moreInfo" && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">Accounting Dimensions</p>
                <div className="grid grid-cols-[1fr_3fr] gap-3">
                  <ModalInput label="Cost Center" name="costCenter" value={form.costCenter} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">Ownership</p>
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <ModalSelect label="Asset Owner" name="assetOwner" value={form.assetOwner} onChange={handleChange} options={[{ value: "Company", label: "Company" }, { value: "Employee", label: "Employee" }, { value: "Customer", label: "Customer" }]} className="w-full border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Asset Owner Company" name="assetOwnerCompany" value={form.assetOwnerCompany} onChange={handleChange} disabled className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">Insurance</p>
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <ModalInput label="Policy Number" name="policyNumber" value={form.policyNumber} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Insurance Start Date" name="insuranceStartDate" value={form.insuranceStartDate} onChange={handleChange} type="date" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Insurer" name="insurer" value={form.insurer} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Insurance End Date" name="insuranceEndDate" value={form.insuranceEndDate} onChange={handleChange} type="date" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Insured Value" name="insuredValue" value={form.insuredValue} onChange={handleChange} inputMode="numeric" placeholder="0.00" className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Comprehensive Insurance" name="comprehensiveInsurance" value={form.comprehensiveInsurance} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">Additional Info</p>
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-3">
                  <ModalSelect label="Status" name="status" value={form.status} onChange={handleChange} options={[{ value: "Draft", label: "Draft" }, { value: "Submitted", label: "Submitted" }, { value: "In Maintenance", label: "In Maintenance" }, { value: "Out of Order", label: "Out of Order" }, { value: "Scrapped", label: "Scrapped" }]} className="w-full border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Custodian" name="custodian" value={form.custodian} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
                  <ModalInput label="Department" name="department" value={form.department} onChange={handleChange} className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card" />
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