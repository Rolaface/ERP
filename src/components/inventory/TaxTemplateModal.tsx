import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";

import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { ModalInput } from "../ui/modal/modalComponent";
import SearchSelect2 from "../ui/modal/SearchSelect2"; 
import type { TaxCategoryFormData } from "../../types/tax/taxTemplate";
import { defaultForm, defaultTaxRow } from "../../types/tax/taxTemplate";
import { getGlAccounts } from "../../api/TaxTemplateApi";

const ROWS_PER_PAGE = 5;

interface TaxTemplateModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: TaxCategoryFormData) => void;
  initialData?: TaxCategoryFormData | null;
  isEditMode?: boolean;
}

export const TaxTemplateModal: React.FC<TaxTemplateModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
}) => {
  const modals = useModalStore((state) => state.modals);
  const modal = useMemo(
    () => modals.find((m) => m.id === modalId),
    [modals, modalId]
  );

  const resolvedModalId = modalId;

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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      const data: { name: string; description: string }[] = res?.data ?? [];
      return data.map((opt) => ({
        value: opt.name,
        label: opt.description ? `${opt.name} — ${opt.description}` : opt.name,
      }));
    } catch {
      return [];
    }
  }, []); 

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      taxes: [...prev.taxes, { ...defaultTaxRow }],
    }));
    const newTotal = form.taxes.length + 1;
    setPage(Math.floor((newTotal - 1) / ROWS_PER_PAGE));
  };

  const removeRow = (index: number) => {
    if (form.taxes.length === 1) return;
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
    if (!form.title.trim()) newErrors.title = "Title is required";
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
      const payload = {
        ...form,
        taxes: form.taxes.map((row) => ({
          tax_type: row.tax_type.trim(),
          tax_rate: Number(row.tax_rate),
        })),
      };

      if (modal?.context?.callback) {
        await modal.context.callback(payload);
      }
      
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            reset();
          }}
        >
          Reset
        </Button>
        <Button variant="primary" loading={loading} onClick={handleSubmitInternal}>
          {isEditMode ? "Update" : "Submit"}
        </Button>
      </div>
    </>
  );

  if (!modal) return null;

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Tax Template" : "Add Tax Template"}
      subtitle="Create simple tax template"
      icon={Tag}
      footer={footer}
      customWidth="46vw"
      height="60vh"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="p-4 flex flex-col gap-4">

          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-6">
              <ModalInput
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                error={errors.title}
                required
                placeholder="Template title"
              />
            </div>
            <div className="col-span-6 flex items-center gap-2">
              <input
                type="checkbox"
                name="disabled"
                checked={!form.disabled}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm text-main">Enabled</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-main">Tax Rows</span>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>

          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--border)]/20">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">Tax Type</th>
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
                          value={row.tax_type}
                          onChange={(val) => {
                            const newForm = { ...form };
                            newForm.taxes[actualIdx].tax_type = val || "";
                            setForm(newForm);
                          }}
                          fetchOptions={fetchGlOptions}
                          placeholder="Select tax type"
                          className="text-sm"
                        />
                        {errors[`tax_type_${actualIdx}`] && (
                          <p className="text-xs text-danger mt-1">{errors[`tax_type_${actualIdx}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          name="tax_rate"
                          value={row.tax_rate}
                          onChange={(e) => handleRowChange(actualIdx, e)}
                          className="w-full px-2 py-1 border border-[var(--border)] rounded text-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errors[`tax_rate_${actualIdx}`] && (
                          <p className="text-xs text-danger mt-1">{errors[`tax_rate_${actualIdx}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {totalRows > 1 && (
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
                  className={`w-6 h-6 rounded text-xs ${
                    page === i
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