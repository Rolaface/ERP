import React, { useState, useEffect } from "react";
import {
  updateItemGroupById,
  createItemGroup,
} from "../../api/itemCategoryApi";
import { getRolaUOMs } from "../../api/itemZraApi";
import { showApiError } from "../../utils/alert";
import ItemGenericSelect from "../selects/ItemGenericSelect";
import Modal from "../ui/modal/modal";
import { Button } from "../ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";

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

/* 
   Component
 */

const ItemsCategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: Record<string, any>) => void;
  initialData?: Record<string, any> | null;
  isEditMode?: boolean;
}> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = { ...form };

      if (!isEditMode) delete payload.id;

      let response;

      if (isEditMode && initialData?.id) {
        response = await updateItemGroupById(initialData.id, payload);
      } else {
        response = await createItemGroup(payload);
      }

      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return;
      }

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
    onClose();
  };

  if (!isOpen) return null;

  /* 
     UI
  ──────────────────────────────── */

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Item Category" : "Add Item Category"}
      subtitle="Manage category configuration"
      customWidth="50vw"
      height="45vh"
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">

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

                <ModalSelect
                  label="Item Type"
                  name="itemType"
                  value={form.itemType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  {itemTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </ModalSelect>

                <ModalInput
                  label="Category Name"
                  name="groupName"
                  value={form.groupName}
                  onChange={handleChange}
                  required
                />

                <ModalInput
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />

                <ItemGenericSelect
                  label="Unit of Measure"
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

              <ModalInput
                label="Selling Price"
                name="sellingPrice"
                type="number"
                value={form.sellingPrice}
                onChange={handleChange}
              />

              <ModalInput
                label="Sales Account"
                name="salesAccount"
                value={form.salesAccount}
                onChange={handleChange}
              />

            </div>
          )}
        </section>

        {/* ───── Footer ───── */}
        <div className="flex justify-end gap-3 border-t border-theme px-6 py-4 bg-app shrink-0">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>

          <Button variant="ghost" type="button" onClick={reset}>
            Reset
          </Button>

          <Button variant="primary" type="submit" loading={loading}>
            {isEditMode ? "Update Category" : "Save Category"}
          </Button>
        </div>

      </form>
    </Modal>
  );
};

export default ItemsCategoryModal;