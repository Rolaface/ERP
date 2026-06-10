import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, ReceiptText } from "lucide-react";
import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import {
  ModalInput,
  NumericInput,
} from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import ModalFooter from "../../components/common/ModalFooter"
import type { TaxCategoryFormData } from "../../types/tax/taxTemplate";
import { defaultForm, defaultTaxRow } from "../../types/tax/taxTemplate";
import { getGlAccounts } from "../../api/TaxTemplateApi";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

const ROWS_PER_PAGE = 4;

interface TaxTemplateModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: TaxCategoryFormData) => void;
  initialData?: TaxCategoryFormData | null;
  isEditMode?: boolean;
  isViewMode?: boolean;
}

export const TaxTemplateModal: React.FC<TaxTemplateModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  isViewMode = false,
}) => {
  const modals = useModalStore((state) => state.modals);
  const modal = useMemo(
    () => modals.find((m) => m.id === modalId),
    [modals, modalId]
  );

  const resolvedModalId = modalId;
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [form, setForm] = useState<TaxCategoryFormData>(
    initialData ?? defaultForm
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? defaultForm);
      setErrors({});
      setPage(0);
    }
  }, [isOpen, initialData]);

  const reset = () => {
    setForm(initialData ?? defaultForm);
    setErrors({});
    setPage(0);
    resetDirty();
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // inline length errors
    if (name === "title_code") {
      setErrors((prev) => ({
        ...prev,
        title_code: value.length > 20 ? "Name cannot exceed 20 characters" : "",
      }));
    }
    if (name === "title_desc") {
      setErrors((prev) => ({
        ...prev,
        title_desc: value.length > 50 ? "Description cannot exceed 50 characters" : "",
      }));
    }
  };

  const handleRowChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      taxes: prev.taxes.map((row, i) =>
        i === index ? { ...row, [name]: value } : row
      ),
    }));
  };

  const fetchGlOptions = useCallback(async (search: string) => {
    try {
      const res = await getGlAccounts(search || undefined);
      const data: { name: string; account_type: string; account_name: string }[] = res?.data ?? [];
      return data.map((opt) => ({
        value: opt.name,
        label: opt.account_name,
        subLabel: opt.account_type || "",
      }));
    } catch {
      return [];
    }
  }, []);

  const addRow = () => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      taxes: [...prev.taxes, { ...defaultTaxRow }],
    }));
    const newTotal = form.taxes.length + 1;
    setPage(Math.floor((newTotal - 1) / ROWS_PER_PAGE));
  };

  const removeRow = (index: number) => {
    if (form.taxes.length === 1) return;
    markDirty();
    setForm((prev) => ({
      ...prev,
      taxes: prev.taxes.filter((_, i) => i !== index),
    }));
    const newTotal = form.taxes.length - 1;
    const maxPage = Math.max(0, Math.ceil(newTotal / ROWS_PER_PAGE) - 1);
    setPage((p) => Math.min(p, maxPage));
  };

  const totalRows = form.taxes.length;
  const paginatedRows = form.taxes.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title_code.trim()) newErrors.title_code = "Name is required";
    if (form.title_code.length > 20) newErrors.title_code = "Name max 20 characters";
    if (form.title_desc.length > 50) newErrors.title_desc = "Description max 50 characters";
    form.taxes.forEach((row, i) => {
      if (!row.tax_type.trim()) newErrors[`tax_type_${i}`] = "Tax is required";
      if (row.tax_rate < 0) newErrors[`tax_rate_${i}`] = "Invalid rate";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInternal = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const combinedTitle = form.title_desc.trim()
        ? `${form.title_code.trim()} | ${form.title_desc.trim()}`
        : form.title_code.trim();

      const payload = {
        ...form,
        title: combinedTitle,
        taxes: form.taxes.map((row) => ({
          tax_type: row.tax_type.trim(),
          tax_rate: Number(row.tax_rate),
        })),
      };

      if (modal?.context?.callback) {
        await modal.context.callback(payload);
      }

      resetDirty();
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const footer = isViewMode ? (
    <ModalFooter
      onCancel={onClose}
      cancelLabel="Close"
    />
  ) : (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={reset}
      onSubmit={handleSubmitInternal}
      isSubmitting={loading}
      submitLabel={isEditMode ? "Update" : "Save"}
      resetLabel="Reset"
    />
  );

  if (!modal) return null;

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={isViewMode ? onClose : () => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={
        isViewMode
          ? "View Tax Template"
          : isEditMode
            ? "Edit Tax Template"
            : "Create Tax Template"
      }
      subtitle={isViewMode ? "Read-only view of this tax template" : "Create tax template"}
      icon={ReceiptText}
      footer={footer}
      customWidth="46vw"
      height="66vh"
    >
     <form
        onChange={isViewMode ? undefined : markDirty}
        onSubmit={(e) => e.preventDefault()}
        className={`h-full flex flex-col ${isViewMode ? "pointer-events-none select-none" : ""}`}
      >
        <div className="p-4 flex flex-col gap-4">

          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4 flex flex-col">
              <ModalInput
                label="Name"
                name="title_code"
                value={form.title_code}
                onChange={handleChange}
                error={errors.title_code}
                required
                placeholder="e.g. TAX01"
                disabled={isViewMode}
              />
              <div className="min-h-[20px]" />
            </div>
            <div className="col-span-8 flex flex-col">
              <ModalInput
                label="Description"
                name="title_desc"
                value={form.title_desc}
                onChange={handleChange}
                error={errors.title_desc}
                placeholder="Template description (optional)"
                disabled={isViewMode}
              />
              <div className="min-h-[20px]" />
            </div>
            <div className="col-span-6 flex items-center gap-2">
              <input
                type="checkbox"
                name="disabled"
                checked={!form.disabled}
                onChange={handleChange}
                className="w-4 h-4"
                disabled={isViewMode}
              />
              <span className="text-sm text-main">Enabled</span>
            </div>
          </div>

          {/* Add Row — hidden in view mode */}
          {!isViewMode && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-main"></span>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
              >
                <Plus size={14} /> Add Row
              </button>
            </div>
          )}

          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--border)]/20">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                    GL Accounts <span className="text-danger">*</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">Rate (%)</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, idx) => {
                  const actualIdx = page * ROWS_PER_PAGE + idx;
                  return (
                    <tr key={actualIdx} className="border-t border-[var(--border)]/20">
                      <td className="px-3 py-2">
                        <SearchSelect2
                          label=""
                          value={row.tax_type_display || row.tax_type}

                          onChange={(val, option) => {
                            markDirty();
                            setForm((prev) => ({
                              ...prev,
                              taxes: prev.taxes.map((row, i) =>
                                i === actualIdx
                                  ? {
                                    ...row,
                                    tax_type: val || "",
                                    tax_type_display: option?.label || val || "",
                                  }
                                  : row
                              ),
                            }));
                          }}
                          fetchOptions={fetchGlOptions}
                          placeholder="Select tax type"
                        />
                        {errors[`tax_type_${actualIdx}`] && (
                          <p className="text-xs text-danger mt-1">{errors[`tax_type_${actualIdx}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <ModalInput
                          label=""
                          type="number"
                          name="tax_rate"
                          value={row.tax_rate === 0 ? "" : row.tax_rate}
                          onChange={(e) => handleRowChange(actualIdx, e)}
                          error={errors[`tax_rate_${actualIdx}`]}
                          className="w-full no-spinner"
                        />
                        {errors[`tax_rate_${actualIdx}`] && (
                          <p className="text-xs text-danger mt-1">{errors[`tax_rate_${actualIdx}`]}</p>
                        )}
                      </td>
                     <td className="px-3 py-2 text-center">
                        {!isViewMode && totalRows > 1 && (   
                          <button
                            type="button"
                            onClick={() => removeRow(actualIdx)}
                            className="text-muted hover:text-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalRows > ROWS_PER_PAGE && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: Math.ceil(totalRows / ROWS_PER_PAGE) }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`w-6 h-6 rounded text-xs ${page === i
                    ? "bg-primary text-white"
                    : "bg-[var(--border)] text-muted hover:bg-primary/20"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default TaxTemplateModal;
