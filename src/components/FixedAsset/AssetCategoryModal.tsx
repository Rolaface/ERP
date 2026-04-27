import React, { useState, useMemo, useCallback } from "react";
import { Tag, Settings, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { showApiError, showValidationError } from "../../utils/alert";
import type {  } from "../../types/company";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE =4;

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

// ─── Pagination Controls ──────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  onPrev: () => void;
  onNext: () => void;
}

const TablePagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRows,
  onPrev,
  onNext,
}) => {
  if (totalPages <= 1) return null;

  const startRow = (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(currentPage * ROWS_PER_PAGE, totalRows);

  return (
    <div className="flex items-center justify-between mt-2 px-1">
      <span className="text-[10px] text-muted">
        {startRow}–{endRow} of {totalRows} rows
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-theme
            text-muted hover:text-main hover:border-primary transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={11} />
          Previous
        </button>
        <span className="text-[10px] text-muted px-1">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-theme
            text-muted hover:text-main hover:border-primary transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
};

// ─── Finance Books columns ────────────────────────────────────────────────────

const financeBookColumns: { key: keyof FinanceBookRow; label: string }[] = [
  { key: "financeBook",                label: "Finance Book" },
  { key: "depreciationMethod",         label: "Depreciation Method" },
  { key: "frequencyOfDepreciation",    label: "Frequency (Months)" },
  { key: "totalNumberOfDepreciations", label: "Total Depreciations" },
  { key: "depreciationPostingDate",    label: "Posting Date" },
];

// ─── Accounts columns ─────────────────────────────────────────────────────────

const accountColumns: { key: keyof AccountRow; label: string; required?: boolean }[] = [
  { key: "company",                          label: "Company", required: true },
  { key: "fixedAssetAccount",                label: "Fixed Asset Account" },
  { key: "accumulatedDepreciationAccount",   label: "Accumulated Dep. Account" },
  { key: "depreciationExpenseAccount",       label: "Dep. Expense Account" },
  { key: "capitalWorkInProgressAccount",     label: "Capital Work in Progress Account" },
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

  // ── Pagination state ────────────────────────────────────────
  const [financeBookPage, setFinanceBookPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);

  // ── Patch helper ────────────────────────────────────────────
  const patch = useCallback((p: Partial<AssetCategoryForm>) => {
    setForm((prev) => ({ ...prev, ...p }));
    markDirty();
  }, [markDirty]);

  const handleReset = useCallback(() => {
    setForm(defaultForm());
    setFinanceBookPage(1);
    setAccountPage(1);
    resetDirty();
  }, [resetDirty]);

  // ── Finance book row ops ────────────────────────────────────
  const addFinanceRow = useCallback(() => {
    setForm((p) => {
      const updated = [...p.financeBooks, defaultFinanceBookRow()];
      // Jump to the last page after adding
      const newPage = Math.ceil(updated.length / ROWS_PER_PAGE);
      setFinanceBookPage(newPage);
      return { ...p, financeBooks: updated };
    });
    markDirty();
  }, [markDirty]);

  const removeFinanceRow = useCallback((id: string) => {
    setForm((p) => {
      const updated = p.financeBooks.filter((r) => r.id !== id);
      // Clamp page if needed
      const maxPage = Math.max(1, Math.ceil(updated.length / ROWS_PER_PAGE));
      setFinanceBookPage((prev) => Math.min(prev, maxPage));
      return { ...p, financeBooks: updated };
    });
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
    setForm((p) => {
      const updated = [...p.accounts, defaultAccountRow()];
      const newPage = Math.ceil(updated.length / ROWS_PER_PAGE);
      setAccountPage(newPage);
      return { ...p, accounts: updated };
    });
    markDirty();
  }, [markDirty]);

  const removeAccountRow = useCallback((id: string) => {
    setForm((p) => {
      const updated = p.accounts.filter((r) => r.id !== id);
      const maxPage = Math.max(1, Math.ceil(updated.length / ROWS_PER_PAGE));
      setAccountPage((prev) => Math.min(prev, maxPage));
      return { ...p, accounts: updated };
    });
    markDirty();
  }, [markDirty]);

  const changeAccountRow = useCallback((id: string, field: keyof AccountRow, value: string) => {
    setForm((p) => ({
      ...p,
      accounts: p.accounts.map((r) => r.id === id ? { ...r, [field]: value } : r),
    }));
    markDirty();
  }, [markDirty]);

  // ── Paginated slices ────────────────────────────────────────
  const paginatedFinanceBooks = useMemo(() => {
    const start = (financeBookPage - 1) * ROWS_PER_PAGE;
    return form.financeBooks.slice(start, start + ROWS_PER_PAGE);
  }, [form.financeBooks, financeBookPage]);

  const paginatedAccounts = useMemo(() => {
    const start = (accountPage - 1) * ROWS_PER_PAGE;
    return form.accounts.slice(start, start + ROWS_PER_PAGE);
  }, [form.accounts, accountPage]);

  const financeBookTotalPages = Math.max(1, Math.ceil(form.financeBooks.length / ROWS_PER_PAGE));
  const accountTotalPages = Math.max(1, Math.ceil(form.accounts.length / ROWS_PER_PAGE));

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

      {/* Asset Category Name + checkboxes */}
      <div className="flex items-start gap-5 mb-5">
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


        <div className="rounded border border-theme mb-2">
          <table className="w-full text-xs border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "28px" }} />
              <col style={{ width: "32px" }} />
              {financeBookColumns.map((col) => (
                <col key={col.key} />
              ))}
              <col style={{ width: "32px" }} />
            </colgroup>
            <thead>
              <tr className="bg-subtle">
                <th className="p-2 border-b border-theme">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted">No.</th>
                {financeBookColumns.map((col) => (
                  <th key={col.key} className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                    {col.label}
                  </th>
                ))}
                <th className="p-2 border-b border-theme">
                  <Settings size={12} className="text-muted mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedFinanceBooks.map((row, idx) => {
                const globalIdx = (financeBookPage - 1) * ROWS_PER_PAGE + idx;
                return (
                  <tr key={row.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-2 border-b border-theme text-center">
                      <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                    </td>
                    <td className="p-2 border-b border-theme text-muted text-center">{globalIdx + 1}</td>
                    {financeBookColumns.map((col) => (
                      <td key={col.key} className="border-b border-theme">
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
                );
              })}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={financeBookPage}
          totalPages={financeBookTotalPages}
          totalRows={form.financeBooks.length}
          onPrev={() => setFinanceBookPage((p) => Math.max(1, p - 1))}
          onNext={() => setFinanceBookPage((p) => Math.min(financeBookTotalPages, p + 1))}
        />

        <div className="mt-3">
          <Button variant="secondary" onClick={addFinanceRow}>Add row</Button>
        </div>
      </div>

      <Divider />

      {/* Accounts */}
      <div>
        <SectionHeading>Accounts</SectionHeading>

        <div className="rounded border border-theme mb-2">
          <table className="w-full text-xs border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "28px" }} />
              <col style={{ width: "32px" }} />
              {accountColumns.map((col) => (
                <col key={col.key} />
              ))}
              <col style={{ width: "32px" }} />
            </colgroup>
            <thead>
              <tr className="bg-subtle">
                <th className="p-2 border-b border-theme">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted">No.</th>
                {accountColumns.map((col) => (
                  <th key={col.key} className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                    {col.label}
                    {col.required && <span className="text-red-500 ml-0.5">*</span>}
                  </th>
                ))}
                <th className="p-2 border-b border-theme">
                  <Settings size={12} className="text-muted mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.map((row, idx) => {
                const globalIdx = (accountPage - 1) * ROWS_PER_PAGE + idx;
                return (
                  <tr key={row.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-2 border-b border-theme text-center">
                      <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                    </td>
                    <td className="p-2 border-b border-theme text-muted text-center">{globalIdx + 1}</td>
                    {accountColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`border-b border-theme ${col.key === "company" ? "font-semibold" : ""}`}
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
                );
              })}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={accountPage}
          totalPages={accountTotalPages}
          totalRows={form.accounts.length}
          onPrev={() => setAccountPage((p) => Math.max(1, p - 1))}
          onNext={() => setAccountPage((p) => Math.min(accountTotalPages, p + 1))}
        />

        <div className="mt-3">
          <Button variant="secondary" onClick={addAccountRow}>Add row</Button>
        </div>
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