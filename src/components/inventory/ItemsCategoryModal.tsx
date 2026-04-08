import React, { useState, useEffect } from "react";
import { showValidationError, showApiError } from "../../utils/alert";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { Layers } from "lucide-react";
import type { CreateItemGroupPayload } from "../../api/itemGroupApi";

const emptyForm = {
  item_group_name: "",
  is_group: "0",
  parent: "",
};

const inputClass =
  "h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5 w-full " +
  "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary";

const labelClass =
  "text-[11px] font-medium uppercase tracking-wide text-muted";


const ItemsCategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateItemGroupPayload) => void;
  initialData?: Record<string, any> | null; 
  isEditMode?: boolean;
  modalId?: string;
}> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false, modalId }) => {
  const resolvedModalId = modalId || (isEditMode && initialData?.name
    ? `item-group-edit-${initialData.name}-${Date.now()}`
    : `item-group-create-${Date.now()}`);
    
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          item_group_name: initialData.item_group_name || "",
          is_group: initialData.is_group !== undefined ? String(initialData.is_group) : "0",
          parent: initialData.parent || initialData.parent_item_group || "",
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.item_group_name?.trim()) {
      showValidationError("Item Group Name is required.");
      return false;
    }
    if (!form.parent?.trim() && !isEditMode) {
      showValidationError("Parent Item Group is required.");
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
      const payload: CreateItemGroupPayload = {
        item_group_name: form.item_group_name.trim(),
        is_group: Number(form.is_group) as 0 | 1,
        parent: form.parent.trim(),
        doctype: "Item Group",
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
      setForm({
        item_group_name: initialData.item_group_name || "",
        is_group: initialData.is_group !== undefined ? String(initialData.is_group) : "0",
        parent: initialData.parent || initialData.parent_item_group || "",
      });
    } else {
      setForm(emptyForm);
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
      onClose={() => handleCloseWithConfirm(handleClose, resolvedModalId)}
      title={isEditMode ? "Edit Item Group" : "Add Item Group"}
      subtitle="Manage Item Group Hierarchy"
      icon={Layers}
      customWidth="35vw"
      height="45vh"
    >
      <form onChange={() => markDirty()} onSubmit={handleSubmit} noValidate className="h-full flex flex-col">

        <section className="flex-1 overflow-y-auto p-6 bg-app">
          <div className="grid grid-cols-1 gap-5">

            <label className="flex flex-col gap-0.5">
              <span className={labelClass}>
                Parent Group <span className="text-danger">*</span>
              </span>
              <input
                type="text"
                name="parent"
                value={form.parent}
                onChange={handleChange}
                placeholder="e.g. All Item Groups, Services..."
                required
                className={inputClass}
                disabled={isEditMode}
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className={labelClass}>
                Item Group Name <span className="text-danger">*</span>
              </span>
              <input
                type="text"
                name="item_group_name"
                value={form.item_group_name}
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

          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-theme px-6 py-4 bg-app shrink-0">
          <Button variant="secondary" type="button" onClick={() => handleCloseWithConfirm(handleClose, resolvedModalId)}>
            Cancel
          </Button>

          <Button variant="ghost" type="button" onClick={() => { resetDirty(); reset(); }}>
            Reset
          </Button>

          <Button variant="primary" type="submit" loading={loading}>
            {isEditMode ? "Update Group" : "Save Group"}
          </Button>
        </div>

      </form>
    </MinimizableModal>
  );
};

export default ItemsCategoryModal;