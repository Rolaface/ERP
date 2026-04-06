import React, { useState, useEffect } from "react";
import {
  updateItemGroupById,
  createItemGroup,
} from "../../api/itemCategoryApi";
import { getRolaUOMs } from "../../api/itemZraApi";
import { showApiError, showValidationError } from "../../utils/alert";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import ItemGenericSelect from "../selects/ItemGenericSelect";
import { MinimizableModal } from "../common/ModalManagerContext";
import { Button } from "../ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { Layers } from "lucide-react";

/* 
   Default Form State
 */

const emptyForm = {
  id: "",
  groupName: "",
  description: "",
  salesAccount: "",
  sellingPrice: "",
  unitOfMeasurement: "",
  itemType: "",
};

const itemTypeOptions = [
  { value: "1", label: "Raw Material" },
  { value: "2", label: "Finished Product" },
  { value: "3", label: "Service" },
];


const inputClass =
  "h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5 w-full " +
  "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary";

const labelClass =
  "text-[11px] font-medium uppercase tracking-wide text-muted";
/* 
   Component
 */

const ItemsCategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: Record<string, any>) => void;
  initialData?: Record<string, any> | null;
  isEditMode?: boolean;
  modalId?: string;
}> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false, modalId }) => {
  const resolvedModalId = modalId || (isEditMode && initialData?.id
    ? `category-edit-${initialData.id}-${Date.now()}`
    : `category-create-${Date.now()}`);
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "pricing">("details");

  /* 
     Load Data (Edit Safe)
  ──────────────────────────────── */

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...emptyForm,
          ...initialData,
        });
      } else {
        setForm(emptyForm);
      }
      setActiveTab("details");
    }
  }, [isOpen, initialData]);

  /* 
     Change Handler
  ──────────────────────────────── */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* 
     Submit
  ──────────────────────────────── */
const validateForm = () => {
  if (!form.itemType) {
    setActiveTab("details");
    showValidationError("Item Type is required.");
    return false;
  }

  if (!form.groupName?.trim()) {
    setActiveTab("details");
    showValidationError("Category Name is required.");
    return false;
  }

  return true;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (loading) return;
  if (!validateForm()) return;

  setLoading(true);

  try {
    const payload: any = { ...form };

    if (!isEditMode) delete payload.id;

    // Pass to parent - parent handles API call and shows success message
    onSubmit?.(payload);
    handleClose();
  } catch (err: any) {
    showApiError(err);
  } finally {
    setLoading(false);
  }
};

  /* 
     Reset
  ──────────────────────────────── */

  const reset = () => {
    if (initialData) {
      setForm({ ...emptyForm, ...initialData });
    } else {
      setForm(emptyForm);
    }
  };

const handleClose = () => {
  setForm(emptyForm);
  setActiveTab("details");
  setLoading(false);
  onClose();
};

  if (!isOpen) return null;

  /* 
     UI
  ──────────────────────────────── */

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(handleClose, resolvedModalId)}
      title={isEditMode ? "Edit Item Category" : "Add Item Category"}
      subtitle="Manage category configuration"
      icon={Layers}
      customWidth="55vw"
      height="45vh"
    >
      <form onChange={() => markDirty()} onSubmit={handleSubmit} noValidate className="h-full flex flex-col">

        {/* ───── Tabs ───── */}
        <div className="border-b border-theme px-6 bg-app shrink-0">
          <div className="flex gap-6">
            {[
              { key: "details", label: "Category Details" },
              { key: "pricing", label: "Pricing & Accounts" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setActiveTab(tab.key as "details" | "pricing")
                }
                className={`py-3 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.key
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted border-b-2 border-transparent hover:text-main"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ───── Content ───── */}
        <section className="flex-1 overflow-y-auto p-6 bg-app">

          {/* DETAILS TAB */}
          {activeTab === "details" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">

          <label className="flex flex-col gap-0.5">
  <span className={labelClass}>
    Item Type <span className="text-danger">*</span>
  </span>

  <select
    name="itemType"
    value={form.itemType}
    onChange={handleChange}
    required
    className={inputClass}
  >
    <option value="">Select Type</option>
    {itemTypeOptions.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
</label>

             <label className="flex flex-col gap-0.5">
  <span className={labelClass}>
    Category Name <span className="text-danger">*</span>
  </span>

  <input
    type="text"
    name="groupName"
    value={form.groupName}
    onChange={handleChange}
    required
    className={inputClass}
  />
</label>

              <label className="flex flex-col gap-0.5">
  <span className={labelClass}>Description</span>

  <input
    type="text"
    name="description"
    value={form.description}
    onChange={handleChange}
    className={inputClass}
  />
</label>

                <ItemGenericSelect
                  label="UOM"
                  value={form.unitOfMeasurement}
                  fetchData={getRolaUOMs}
                  variant="modal"
                  onChange={(item) =>
                    setForm((prev) => ({
                      ...prev,
                      unitOfMeasurement: item?.id || "",
                    }))
                  }
                />
              </div>
            </>
          )}

          {/* PRICING TAB */}
          {activeTab === "pricing" && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">

        <label className="flex flex-col gap-0.5">
  <span className={labelClass}>Selling Price</span>

  <input
    type="number"
    name="sellingPrice"
    value={form.sellingPrice}
    onChange={handleChange}
    className={`${inputClass} no-spinner`}
  />
</label>

            <label className="flex flex-col gap-0.5">
  <span className={labelClass}>Sales Account</span>

  <input
    type="text"
    name="salesAccount"
    value={form.salesAccount}
    onChange={handleChange}
    className={inputClass}
  />
</label>

            </div>
          )}
        </section>

        {/* ───── Footer ───── */}
        <div className="flex justify-end gap-3 border-t border-theme px-6 py-4 bg-app shrink-0">
          <Button variant="secondary" type="button" onClick={() => handleCloseWithConfirm(handleClose, resolvedModalId)}>
            Cancel
          </Button>

          <Button variant="ghost" type="button" onClick={() => { resetDirty(); reset(); }}>
            Reset
          </Button>

          <Button variant="primary" type="submit" loading={loading}>
            {isEditMode ? "Update Category" : "Save Category"}
          </Button>
        </div>

      </form>
    </MinimizableModal>
  );
};

export default ItemsCategoryModal;