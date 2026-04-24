import React, { useState, useMemo, useCallback } from "react";
import { Tag, Settings, Pencil, Trash2 } from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { showApiError, showValidationError } from "../../utils/alert";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinanceBookRow {
  id: string;
  financeBook: string;
  depreciationMethod: string;
  frequencyOfDepreciation: string;
  totalNumberOfDepreciations: string;
  depreciationPostingDate: string;
}

interface AccountRow {
  id: string;
  company: string;
  fixedAssetAccount: string;
  accumulatedDepreciationAccount: string;
  depreciationExpenseAccount: string;
  capitalWorkInProgressAccount: string;
}

interface AssetCategoryForm {
  assetCategoryName: string;
  enableCapitalWorkInProgress: boolean;
  nonDepreciableCategory: boolean;
  financeBooks: FinanceBookRow[];
  accounts: AccountRow[];
}

interface AssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: AssetCategoryForm) => void;
  categoryId?: string | number;
  modalId?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultFinanceBookRow = (): FinanceBookRow => ({
  id: crypto.randomUUID(),
  financeBook: "",
  depreciationMethod: "",
  frequencyOfDepreciation: "",
  totalNumberOfDepreciations: "",
  depreciationPostingDate: "",
});

const defaultAccountRow = (): AccountRow => ({
  id: crypto.randomUUID(),
  company: "",
  fixedAssetAccount: "",
  accumulatedDepreciationAccount: "",
  depreciationExpenseAccount: "",
  capitalWorkInProgressAccount: "",
});

const defaultForm = (): AssetCategoryForm => ({
  assetCategoryName: "",
  enableCapitalWorkInProgress: false,
  nonDepreciableCategory: false,
  financeBooks: [defaultFinanceBookRow()],
  accounts: [defaultAccountRow()],
});

// ─── Primitives ───────────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-semibold text-main mb-3">{children}</h3>
);

const Divider = () => <div className="border-t border-theme my-5" />;

const FieldInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`h-8 w-full px-3 text-xs rounded border border-theme bg-app text-main
      placeholder:text-muted focus:outline-none focus:border-primary transition-colors
      ${props.className ?? ""}`}
  />
);

const CellInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="w-full h-7 px-2 text-xs bg-transparent border border-transparent
      focus:border-primary focus:bg-app rounded focus:outline-none transition-colors
      placeholder:text-muted"
  />
);

// ─── Finance Books columns ────────────────────────────────────────────────────

const financeBookColumns: { key: keyof FinanceBookRow; label: string }[] = [
  { key: "financeBook",                label: "Finance Book" },
  { key: "depreciationMethod",         label: "Depreciation Method" },
  { key: "frequencyOfDepreciation",    label: "Frequency of Depreciation(Months)" },
  { key: "totalNumberOfDepreciations", label: "Total Number of Depreciations" },
  { key: "depreciationPostingDate",    label: "Depreciation Posting Date" },
];

// ─── Accounts columns ─────────────────────────────────────────────────────────

const accountColumns: { key: keyof AccountRow; label: string; required?: boolean }[] = [
  { key: "company",                          label: "Company",required: true },
  { key: "fixedAssetAccount",                label: "Fixed Asset Account" },
  { key: "accumulatedDepreciationAccount",   label: "Accumulated Depreciation Account" },
  { key: "depreciationExpenseAccount",       label: "Depreciation Expense Account" },
  { key: "capitalWorkInProgressAccount",     label: "Capital Work In Progress Account" },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: AssetCategoryForm): string | null {
  if (!form.assetCategoryName.trim()) return "Asset Category Name is required.";
  for (const row of form.accounts) {
    if (!row.company.trim()) return "Company is required for all account rows.";
  }
  return null;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const AssetCategoryModal: React.FC<AssetCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categoryId,
  modalId,
}) => {
  const resolvedModalId =
    modalId ||
    (categoryId ? `asset-category-edit-${categoryId}` : `asset-category-create`);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [form, setForm] = useState<AssetCategoryForm>(defaultForm);
  const [internalSaving, setInternalSaving] = useState(false);

  // ── Patch helper ────────────────────────────────────────────
  const patch = useCallback((p: Partial<AssetCategoryForm>) => {
    setForm((prev) => ({ ...prev, ...p }));
    markDirty();
  }, [markDirty]);

  const handleReset = useCallback(() => {
    setForm(defaultForm());
    resetDirty();
  }, [resetDirty]);

  // ── Finance book row ops ────────────────────────────────────
  const addFinanceRow = useCallback(() => {
    setForm((p) => ({ ...p, financeBooks: [...p.financeBooks, defaultFinanceBookRow()] }));
    markDirty();
  }, [markDirty]);

  const removeFinanceRow = useCallback((id: string) => {
    setForm((p) => ({ ...p, financeBooks: p.financeBooks.filter((r) => r.id !== id) }));
    markDirty();
  }, [markDirty]);

  const changeFinanceRow = useCallback((id: string, field: keyof FinanceBookRow, value: string) => {
    setForm((p) => ({
      ...p,
      financeBooks: p.financeBooks.map((r) => r.id === id ? { ...r, [field]: value } : r),
    }));
    markDirty();
  }, [markDirty]);

  // ── Account row ops ─────────────────────────────────────────
  const addAccountRow = useCallback(() => {
    setForm((p) => ({ ...p, accounts: [...p.accounts, defaultAccountRow()] }));
    markDirty();
  }, [markDirty]);

  const removeAccountRow = useCallback((id: string) => {
    setForm((p) => ({ ...p, accounts: p.accounts.filter((r) => r.id !== id) }));
    markDirty();
  }, [markDirty]);

  const changeAccountRow = useCallback((id: string, field: keyof AccountRow, value: string) => {
    setForm((p) => ({
      ...p,
      accounts: p.accounts.map((r) => r.id === id ? { ...r, [field]: value } : r),
    }));
    markDirty();
  }, [markDirty]);

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmitForm = useCallback(async () => {
    if (internalSaving) return;
    const error = validate(form);
    if (error) { showValidationError(error); return; }

    setInternalSaving(true);
    try {
      resetDirty();
      await onSubmit?.(form);
      onClose();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setInternalSaving(false);
    }
  }, [internalSaving, form, resetDirty, onSubmit, onClose]);

  // ── Footer ──────────────────────────────────────────────────
  const footer = useMemo(() => (
    <>
      <Button variant="secondary" onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}>
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleReset}>Reset</Button>
        <Button variant="primary" onClick={handleSubmitForm} disabled={internalSaving}>
          {internalSaving ? "Saving..." : "Submit"}
        </Button>
      </div>
    </>
  ), [handleCloseWithConfirm, onClose, resolvedModalId, handleReset, handleSubmitForm, internalSaving]);

  // ── Body ────────────────────────────────────────────────────
  const body = (
    <div className="p-6 flex flex-col gap-0" onChange={() => markDirty()}>

      {/* Asset Category Name + checkboxes side by side */}
      <div className="flex items-start gap-5 mb-5">
        {/* Left: name field */}
        <div className="flex flex-col gap-1 w-80 shrink-0">
          <label className="text-xs font-medium text-muted">
            Asset Category Name <span className="text-red-500">*</span>
          </label>
          <FieldInput
            value={form.assetCategoryName}
            onChange={(e) => patch({ assetCategoryName: e.target.value })}
            placeholder="Enter asset category name"
          />
        </div>

        {/* Right: checkboxes in the remaining space */}
        <div className="flex flex-col gap-2 pt-5">
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={form.enableCapitalWorkInProgress}
              onChange={(e) => patch({ enableCapitalWorkInProgress: e.target.checked })}
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-xs text-main">Enable Capital Work in Progress Accounting</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={form.nonDepreciableCategory}
              onChange={(e) => patch({ nonDepreciableCategory: e.target.checked })}
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-xs text-main">Non Depreciable Category</span>
          </label>
        </div>
      </div>

      <Divider />

      {/* Finance Book Detail */}
      <div className="mb-5">
        <SectionHeading>Finance Book Detail</SectionHeading>
        <p className="text-xs text-muted mb-3">Finance Books</p>

        <div className="overflow-x-auto rounded border border-theme mb-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-subtle">
                <th className="w-3 p-2 border-b border-theme">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                </th>
                <th className="w-5 p-2 border-b border-theme text-left font-medium text-muted">No.</th>
                {financeBookColumns.map((col) => (
                  <th key={col.key} className="p-2 border-b border-theme text-left font-medium text-muted whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="w-8 p-2 border-b border-theme">
                  <Settings size={12} className="text-muted mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {form.financeBooks.map((row, idx) => (
                <tr key={row.id} className="hover:bg-subtle/50 transition-colors">
                  <td className="p-2 border-b border-theme text-center">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                  </td>
                  <td className="p-2 border-b border-theme text-muted text-center">{idx + 1}</td>
                  {financeBookColumns.map((col) => (
                    <td key={col.key} className="border-b border-theme min-w-[130px]">
                      <CellInput
                        value={row[col.key]}
                        placeholder=""
                        onChange={(e) => changeFinanceRow(row.id, col.key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-2 border-b border-theme text-center">
                    <button
                      type="button"
                      onClick={() => removeFinanceRow(row.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="secondary" onClick={addFinanceRow}>Add row</Button>
      </div>

      <Divider />

      {/* Accounts */}
      <div>
        <SectionHeading>Accounts</SectionHeading>
        <p className="text-xs text-muted mb-3">Accounts</p>

        <div className="overflow-x-auto rounded border border-theme mb-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-subtle">
                <th className="w-3 p-2 border-b border-theme">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                </th>
                <th className="w-5 p-2 border-b border-theme text-left font-medium text-muted">No.</th>
                {accountColumns.map((col) => (
                  <th key={col.key} className="p-2 border-b border-theme text-left font-medium text-muted whitespace-nowrap">
                    {col.label}
                    {col.required && <span className="text-red-500 ml-0.5">*</span>}
                  </th>
                ))}
                <th className="w-8 p-2 border-b border-theme">
                  <Settings size={12} className="text-muted mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {form.accounts.map((row, idx) => (
                <tr key={row.id} className="hover:bg-subtle/50 transition-colors">
                  <td className="p-2 border-b border-theme text-center">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                  </td>
                  <td className="p-2 border-b border-theme text-muted text-center">{idx + 1}</td>
                  {accountColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`border-b border-theme min-w-[150px] ${col.key === "company" ? "font-semibold" : ""}`}
                    >
                      <CellInput
                        value={row[col.key]}
                        placeholder=""
                        onChange={(e) => changeAccountRow(row.id, col.key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-2 border-b border-theme text-center">
                    <button
                      type="button"
                      onClick={() => removeAccountRow(row.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="secondary" onClick={addAccountRow}>Add row</Button>
      </div>

    </div>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={categoryId ? "Edit Asset Category" : "New Asset Category"}
      subtitle="Create and manage asset categories"
      icon={Tag}
      customWidth="60vw"
      height="93vh"
      footer={footer}
    >
      <section className="overflow-y-auto h-full">
        {body}
      </section>
    </MinimizableModal>
  );
};

export default AssetCategoryModal;