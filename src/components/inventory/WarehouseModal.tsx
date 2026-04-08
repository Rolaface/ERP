import React, { useState, useEffect } from "react";
import { showValidationError, showApiError } from "../../utils/alert";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { Warehouse } from "lucide-react";
import type { CreateWarehousePayload } from "../../api/WarehouseApi";
import { getCompanyById } from "../../api/companySetupApi";

const emptyForm = {
  warehouse_name: "",
  is_group: "0",
  company: "",
  parent: "",
};

const inputClass =
  "h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5 w-full " +
  "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary";

const labelClass =
  "text-[11px] font-medium uppercase tracking-wide text-muted mb-1 block";

const WarehouseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateWarehousePayload) => void;
  initialData?: Record<string, any> | null;
  isEditMode?: boolean;
  modalId?: string;
}> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false, modalId }) => {
  const resolvedModalId =
    modalId ||
    (isEditMode && initialData?.name
      ? `warehouse-edit-${initialData.name}-${Date.now()}`
      : `warehouse-create-${Date.now()}`);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;

  useEffect(() => {
    const fetchCompany = async () => {
      if (!COMPANY_ID) return;
      try {
        const res = await getCompanyById(COMPANY_ID);
        setForm((prev) => ({
          ...prev,
          company: res?.data?.companyName || "",
        }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompany();
  }, [COMPANY_ID]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm((prev) => ({
          ...prev,
          warehouse_name: initialData.warehouse_name || "",
          is_group: initialData.is_group ? "1" : "0",
          company: initialData.company || prev.company,
          parent: initialData.parent || initialData.parent_warehouse || "",
        }));
      } else {
        setForm((prev) => ({
          ...emptyForm,
          company: prev.company,
        }));
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.warehouse_name?.trim()) {
      showValidationError("Warehouse Name is required.");
      return false;
    }
    if (!form.parent?.trim() && !isEditMode) {
      showValidationError("Parent Warehouse is required.");
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
      const payload: CreateWarehousePayload = {
        warehouse_name: form.warehouse_name.trim(),
        is_group: Number(form.is_group) as 0 | 1,
        company: form.company.trim(),
        parent: form.parent.trim(),
        doctype: "Warehouse",
        is_root: "false",
      };

      onSubmit?.(payload);
      handleClose();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        warehouse_name: initialData.warehouse_name || "",
        is_group: initialData.is_group ? "1" : "0",
        company: initialData.company || prev.company,
        parent: initialData.parent || initialData.parent_warehouse || "",
      }));
    } else {
      setForm((prev) => ({
        ...emptyForm,
        company: prev.company,
      }));
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() =>
        handleCloseWithConfirm(handleClose, resolvedModalId)
      }
      title={isEditMode ? "Edit Warehouse" : "New Warehouse"}
      subtitle="Manage your inventory locations"
      icon={Warehouse}
      customWidth="32vw"
      height="auto"
    >
      <form
        onChange={() => markDirty()}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col"
      >
        <section className="p-6 bg-app flex flex-col gap-5">
          <label>
            <span className={labelClass}>
              Parent Warehouse <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              name="parent"
              value={form.parent}
              onChange={handleChange}
              disabled={isEditMode}
              placeholder="e.g. All Warehouses - RPL"
              className={`${inputClass} ${
                isEditMode ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
          </label>

          <label>
            <span className={labelClass}>
              Warehouse Name <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              name="warehouse_name"
              value={form.warehouse_name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className={labelClass}>Group Node</span>
            <select
              name="is_group"
              value={form.is_group}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="0">Leaf Node (Contains Items)</option>
              <option value="1">Group Node (Contains Sub-Groups)</option>
            </select>
          </label>
        </section>

        <div className="flex justify-end gap-3 border-t border-theme px-6 py-4 bg-app">
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              handleCloseWithConfirm(handleClose, resolvedModalId)
            }
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {isEditMode ? "Update" : "Create New"}
          </Button>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default WarehouseModal;