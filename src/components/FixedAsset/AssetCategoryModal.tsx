import React, { useMemo, useState } from "react";
import { Layers, Settings, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { ModalInput } from "../ui/modal/modalComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import SearchSelect2 from "../ui/modal/SearchSelect";
import {
  useFALogic,
  type AssetCategoryForm,
  type FinanceBookRow,
  type AccountRow,
} from "../../hooks/useFALogic";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: AssetCategoryForm) => Promise<void>;
  initialData?: Record<string, unknown> | null;
  isEdit?: boolean;
  isViewMode?: boolean;
  modalId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 4;

// ─── Primitives ───────────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <h3 className="text-sm font-semibold text-main mb-3">{children}</h3>;

const Divider = () => <div className="border-t border-theme my-5" />;

interface CellSearchProps {
  value: string;
  fetchOptions: (q: string) => Promise<{ label: string; value: string }[]>;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CellSearch: React.FC<CellSearchProps> = ({
  value,
  fetchOptions,
  onChange,
  placeholder = "Select...",
  disabled = false,
}) => (
  <div className="px-1 py-0.5">
    <SearchSelect2
      label=""
      value={value}
      fetchOptions={fetchOptions}
      onChange={(val) => onChange(val)}
      placeholder={placeholder}
      disabled={disabled}
    />
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

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
          <ChevronLeft size={11} /> Previous
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
          Next <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const AssetCategoryModal: React.FC<AssetCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  isViewMode = false,
  modalId,
}) => {
  const { markDirty, resetDirty, handleCloseWithConfirm, containerRef } =
    useUnsavedChanges();

  const {
    form,
    isSaving,
    patch,
    reset,
    addFinanceRow,
    removeFinanceRow,
    changeFinanceRow,
    addAccountRow,
    removeAccountRow,
    changeAccountRow,
    handleSubmit,
    // fetchOptions — passed to SearchSelect2, API called on focus/click
    fetchFinanceBooks,
    fetchFixedAssetAccounts,
    fetchAccumulatedDepAccounts,
    fetchDepExpenseAccounts,
    fetchCWIPAccounts,
    fetchDepreciationMethods,
    fetchFrequencyOptions,
    fetchPostingDateOptions,
  } = useFALogic(isOpen, onSubmit, onClose);

  const handleClose = () => {
    resetDirty();
    onClose();
  };

  // ── markDirty-wrapped mutators ──────────────────────────────────────────────
  const handlePatch = (data: Partial<AssetCategoryForm>) => {
    if (isViewMode) return;
    markDirty();
    patch(data);
  };

  const handleChangeAccountRow = (
    id: string,
    field: keyof AccountRow,
    value: string,
  ) => {
    if (isViewMode) return;
    markDirty();
    changeAccountRow(id, field, value);
  };

  const handleChangeFinanceRow = (
    id: string,
    field: keyof FinanceBookRow,
    value: string,
  ) => {
    if (isViewMode) return;
    markDirty();
    changeFinanceRow(id, field, value);
  };

  const handleResetForm = () => {
    reset();
    resetDirty();
  };

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [financeBookPage, setFinanceBookPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);

  const financeBookTotalPages = Math.max(
    1,
    Math.ceil(form.financeBooks.length / ROWS_PER_PAGE)
  );
  const accountTotalPages = Math.max(
    1,
    Math.ceil(form.accounts.length / ROWS_PER_PAGE)
  );

  const paginatedFinanceBooks = useMemo(() => {
    const start = (financeBookPage - 1) * ROWS_PER_PAGE;
    return form.financeBooks.slice(start, start + ROWS_PER_PAGE);
  }, [form.financeBooks, financeBookPage]);

  const paginatedAccounts = useMemo(() => {
    const start = (accountPage - 1) * ROWS_PER_PAGE;
    return form.accounts.slice(start, start + ROWS_PER_PAGE);
  }, [form.accounts, accountPage]);

  // ── Row helpers with page auto-advance ─────────────────────────────────────
  const handleAddFinanceRow = () => {
    if (isViewMode) return;
    markDirty();
    addFinanceRow();
    setFinanceBookPage(
      Math.ceil((form.financeBooks.length + 1) / ROWS_PER_PAGE)
    );
  };

  const handleRemoveFinanceRow = (id: string) => {
    if (isViewMode) return;
    markDirty();
    removeFinanceRow(id);
    const maxPage = Math.max(
      1,
      Math.ceil((form.financeBooks.length - 1) / ROWS_PER_PAGE)
    );
    setFinanceBookPage((p) => Math.min(p, maxPage));
  };

  const handleAddAccountRow = () => {
    if (isViewMode) return;
    markDirty();
    addAccountRow();
    setAccountPage(Math.ceil((form.accounts.length + 1) / ROWS_PER_PAGE));
  };

  const handleRemoveAccountRow = (id: string) => {
    if (isViewMode) return;
    markDirty();
    removeAccountRow(id);
    const maxPage = Math.max(
      1,
      Math.ceil((form.accounts.length - 1) / ROWS_PER_PAGE)
    );
    setAccountPage((p) => Math.min(p, maxPage));
  };

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footer = isViewMode ? (
    <Button variant="secondary" onClick={handleClose}>
      Close
    </Button>
  ) : (
    <>
      <Button
        variant="secondary"
        onClick={() => handleCloseWithConfirm(handleClose, modalId)}
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleResetForm}>
          Reset
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Saving..." : "Submit"}
        </Button>
      </div>
    </>
  );

  // ── Body ────────────────────────────────────────────────────────────────────
  const body = (
    <div className="p-6 flex flex-col gap-0">

      {/* ── Header fields ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-5 mb-5">
        {/* Asset Category Name */}
        <div className="w-80 shrink-0">
          <ModalInput
            label="Asset Category Name"
            name="assetCategoryName"
            value={form.assetCategoryName}
            disabled={isViewMode}
            onChange={(e) => handlePatch({ assetCategoryName: e.target.value })}
            placeholder="Enter asset category name"
            required
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col gap-2 pt-5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.enableCapitalWorkInProgress}
              disabled={isViewMode}
              onChange={(e) =>
                handlePatch({ enableCapitalWorkInProgress: e.target.checked })
              }
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-xs text-main">
              Enable Capital Work in Progress Accounting
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.nonDepreciableCategory}
              disabled={isViewMode}
              onChange={(e) =>
                handlePatch({ nonDepreciableCategory: e.target.checked })
              }
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-xs text-main">Non Depreciable Category</span>
          </label>
        </div>
      </div>

      {/* ── Accounts ──────────────────────────────────────────────────────── */}
      <div>
        <SectionHeading>Accounts</SectionHeading>

        <div className="rounded border border-theme mb-2 overflow-x-auto">
          <table className="w-full text-xs border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "28px" }} />
              <col style={{ width: "32px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "32px" }} />
            </colgroup>
            <thead>
              <tr className="bg-subtle">
                <th className="p-2 border-b border-theme">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-primary" />
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted">
                  No.
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Fixed Asset Account
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Accumulated Dep. Account
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Dep. Expense Account
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Capital Work in Progress Account
                </th>
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
                    <td className="p-2 border-b border-theme text-muted text-center">
                      {globalIdx + 1}
                    </td>

                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.fixedAssetAccount}
                        fetchOptions={fetchFixedAssetAccounts}
                        onChange={(v) =>
                          handleChangeAccountRow(row.id, "fixedAssetAccount", v)
                        }
                        placeholder="Select account..."
                        disabled={isViewMode}
                      />
                    </td>

                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.accumulatedDepreciationAccount}
                        fetchOptions={fetchAccumulatedDepAccounts}
                        onChange={(v) =>
                          handleChangeAccountRow(
                            row.id,
                            "accumulatedDepreciationAccount",
                            v
                          )
                        }
                        placeholder="Select account..."
                        disabled={isViewMode}
                      />
                    </td>

                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.depreciationExpenseAccount}
                        fetchOptions={fetchDepExpenseAccounts}
                        onChange={(v) =>
                          handleChangeAccountRow(
                            row.id,
                            "depreciationExpenseAccount",
                            v
                          )
                        }
                        placeholder="Select account..."
                        disabled={isViewMode}
                      />
                    </td>

                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.capitalWorkInProgressAccount}
                        fetchOptions={fetchCWIPAccounts}
                        onChange={(v) =>
                          handleChangeAccountRow(
                            row.id,
                            "capitalWorkInProgressAccount",
                            v
                          )
                        }
                        placeholder="Select account..."
                        disabled={isViewMode}
                      />
                    </td>

                    <td className="p-2 border-b border-theme text-center">
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAccountRow(row.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
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
          onNext={() =>
            setAccountPage((p) => Math.min(accountTotalPages, p + 1))
          }
        />

        {!isViewMode && (
          <div className="mt-3">
            <Button variant="secondary" onClick={handleAddAccountRow}>
              Add row
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() =>
        isViewMode
          ? handleClose()
          : handleCloseWithConfirm(handleClose, modalId)
      }
      title={isEdit ? "Edit Asset Category" : "Create Asset Category"}
      subtitle="Create and manage asset categories"
      icon={Layers}
      customWidth="60vw"
      height="80vh"
      footer={footer}
      formContainerRef={containerRef}
    >
      <section className="overflow-y-auto h-full">{body}</section>
    </MinimizableModal>
  );
};

export default AssetCategoryModal;