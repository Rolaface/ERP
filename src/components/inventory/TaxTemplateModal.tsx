import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../components/common/ModalManagerContext";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { Button } from "../ui/modal/formComponent";
import { ModalInput } from "../ui/modal/modalComponent";
import SearchSelect2 from "../ui/modal/SearchSelect2"; 
import type { TaxCategoryFormData } from "../../types/tax/taxTemplate";
import { defaultForm, defaultTaxRow } from "../../types/tax/taxTemplate";
import { getGlAccounts } from "../../api/TaxTemplateApi";

const ROWS_PER_PAGE = 5;

interface TaxCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: TaxCategoryFormData) => void;
  initialData?: TaxCategoryFormData | null;
  isEditMode?: boolean;
  modalId?: string;
}

const TaxTemplateModal: React.FC<TaxCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
}) => {
  const resolvedModalId =
    modalId ||
    (isEditMode
      ? `tax-template-edit-${Date.now()}`
      : `tax-template-create-${Date.now()}`);

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
  };

  const handleCloseWithWarning = () =>
    handleCloseWithConfirm(() => {
      resetDirty();
      reset();
      onClose();
    }, resolvedModalId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    markDirty();
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
    markDirty();
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
    markDirty();
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
    markDirty();
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

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit?.({
        ...form,
        taxes: form.taxes.map((row) => ({
          tax_type: row.tax_type.trim(),
          tax_rate: Number(row.tax_rate),
        })),
      });
      resetDirty();
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={handleCloseWithWarning}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            resetDirty();
            reset();
          }}
        >
          Reset
        </Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>
          {isEditMode ? "Update" : "Submit"}
        </Button>
      </div>
    </>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleCloseWithWarning}
      title={isEditMode ? "Edit Tax Template" : "Add Tax Template"}
      subtitle="Create simple tax template"
      icon={Tag}
      footer={footer}
      customWidth="46vw"
      height="60vh"
    >
      <form
        onChange={() => markDirty()}
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="p-4 flex flex-col gap-4">

          {/* ── Title + Disabled ── */}
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-6">
              <ModalInput
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                error={errors.title}
              />
            </div>
            <div className="col-span-3 flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="disabled"
                  checked={form.disabled}
                  onChange={handleChange}
                  className="accent-primary"
                />
                Disabled
              </label>
            </div>
          </div>

          {/* ── TAX RATES TABLE ── */}
          <div className="bg-card rounded-lg p-2 shadow-sm">
            <h3 className="text-sm font-semibold text-main mb-2">Tax Rates</h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="px-2 py-2 text-left text-muted font-medium w-[40px]">
                      No.
                    </th>
                    <th className="px-2 py-2 text-left text-muted font-medium">
                      Tax <span className="text-danger">*</span>
                    </th>
                    <th className="px-2 py-2 text-left text-muted font-medium w-[130px]">
                      Tax Rate
                    </th>
                    <th className="w-[40px]" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, idx) => {
                    const globalIndex = page * ROWS_PER_PAGE + idx;
                    return (
                      <tr
                        key={globalIndex}
                        className="border-b border-theme row-hover"
                      >
                        {/* No. */}
                        <td className="px-2 py-1 text-[11px] text-muted">
                          {globalIndex + 1}
                        </td>

                        {/* ── Tax → SearchSelect2 (DB search) ── */}
                        <td className="px-1 py-1">
                          <SearchSelect2
                            label=""
                            value={row.tax_type}
                            onChange={(value) => {
                              // Simulate synthetic event for handleRowChange
                              handleRowChange(globalIndex, {
                                target: {
                                  name: "tax_type",
                                  value,
                                },
                              } as React.ChangeEvent<HTMLInputElement>);
                            }}
                            fetchOptions={fetchGlOptions} // ← stable ref, no flicker
                            placeholder="Search tax..."
                            error={errors[`tax_type_${globalIndex}`]}
                          />
                        </td>

                        {/* Tax Rate */}
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            name="tax_rate"
                            value={row.tax_rate === 0 ? "" : row.tax_rate}
                            onChange={(e) => handleRowChange(globalIndex, e)}
                            placeholder="0"
                            className={`w-full py-1 px-2 border rounded text-[11px] bg-card text-main
                              focus:outline-none focus:ring-1 focus:ring-primary no-spinner
                              ${
                                errors[`tax_rate_${globalIndex}`]
                                  ? "border-danger"
                                  : "border-theme"
                              }`}
                          />
                          {errors[`tax_rate_${globalIndex}`] && (
                            <p className="text-[10px] text-danger mt-0.5">
                              {errors[`tax_rate_${globalIndex}`]}
                            </p>
                          )}
                        </td>

                        {/* Delete row */}
                        <td className="px-1 py-1">
                          <button
                            type="button"
                            onClick={() => removeRow(globalIndex)}
                            disabled={form.taxes.length === 1}
                            className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20
                              transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Add Row + Pagination ── */}
            <div className="mt-3 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 bg-primary hover:bg-[var(--primary-600)]
                  text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus size={13} />
                Add Row
              </button>

              {(totalRows > ROWS_PER_PAGE || page > 0) && (
                <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                  <span className="text-[11px] text-muted whitespace-nowrap">
                    Showing {page * ROWS_PER_PAGE + 1} to{" "}
                    {Math.min((page + 1) * ROWS_PER_PAGE, totalRows)} of{" "}
                    {totalRows} rows
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-2.5 py-1 bg-card text-main border border-theme
                        rounded text-[11px] disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={(page + 1) * ROWS_PER_PAGE >= totalRows}
                      className="px-2.5 py-1 bg-card text-main border border-theme
                        rounded text-[11px] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default TaxTemplateModal;