import React, { useMemo, useState } from "react";
import { Tag, Settings, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
  categoryId?: string | number;
  modalId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 4;

// ─── Primitives ───────────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <h3 className="text-sm font-semibold text-main mb-3">{children}</h3>;

const Divider = () => <div className="border-t border-theme my-5" />;

// CellSearch — wraps SearchSelect2 for use inside table cells
// Removes the label and tightens padding to fit table rows
interface CellSearchProps {
  value: string;
  fetchOptions: (q: string) => Promise<{ label: string; value: string }[]>;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CellSearch: React.FC<CellSearchProps> = ({
  value,
  fetchOptions,
  onChange,
  placeholder = "Select...",
}) => (
  <div className="px-1 py-0.5">
    <SearchSelect2
      label="" // no label inside table cells
      value={value}
      fetchOptions={fetchOptions}
      onChange={(val) => onChange(val)}
      placeholder={placeholder}
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
  categoryId,
  modalId,
}) => {
  const resolvedModalId =
    modalId ??
    (categoryId
      ? `asset-category-edit-${categoryId}`
      : `asset-category-create`);

  const { handleCloseWithConfirm } = useUnsavedChanges();

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
    addFinanceRow();
    setFinanceBookPage(
      Math.ceil((form.financeBooks.length + 1) / ROWS_PER_PAGE)
    );
  };

  const handleRemoveFinanceRow = (id: string) => {
    removeFinanceRow(id);
    const maxPage = Math.max(
      1,
      Math.ceil((form.financeBooks.length - 1) / ROWS_PER_PAGE)
    );
    setFinanceBookPage((p) => Math.min(p, maxPage));
  };

  const handleAddAccountRow = () => {
    addAccountRow();
    setAccountPage(Math.ceil((form.accounts.length + 1) / ROWS_PER_PAGE));
  };

  const handleRemoveAccountRow = (id: string) => {
    removeAccountRow(id);
    const maxPage = Math.max(
      1,
      Math.ceil((form.accounts.length - 1) / ROWS_PER_PAGE)
    );
    setAccountPage((p) => Math.min(p, maxPage));
  };

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={reset}>
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
            onChange={(e) => patch({ assetCategoryName: e.target.value })}
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
              onChange={(e) =>
                patch({ enableCapitalWorkInProgress: e.target.checked })
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
              onChange={(e) =>
                patch({ nonDepreciableCategory: e.target.checked })
              }
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-xs text-main">Non Depreciable Category</span>
          </label>
        </div>
      </div>




      {/* <div className="mb-5">
        <SectionHeading>Finance Book Detail</SectionHeading>

        <div className="rounded border border-theme mb-2 overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <colgroup>
              <col style={{ width: "28px" }} />
              <col style={{ width: "32px" }} />
              <col /> 
              <col /> 
              <col style={{ width: "120px" }} /> 
              <col style={{ width: "120px" }} /> 
              <col style={{ width: "140px" }} /> 
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
                  Finance Book
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Depreciation Method
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Frequency (Months)
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Total Depreciations
                </th>
                <th className="p-2 border-b border-theme text-left font-medium text-muted text-[11px]">
                  Posting Date
                </th>
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
                    <td className="p-2 border-b border-theme text-muted text-center">
                      {globalIdx + 1}
                    </td>

                    
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.financeBook}
                        fetchOptions={fetchFinanceBooks}
                        onChange={(v) =>
                          changeFinanceRow(row.id, "financeBook", v)
                        }
                        placeholder="Select finance book..."
                      />
                    </td>

                   
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.depreciationMethod}
                        fetchOptions={fetchDepreciationMethods}
                        onChange={(v) =>
                          changeFinanceRow(row.id, "depreciationMethod", v)
                        }
                        placeholder="Select method..."
                      />
                    </td>

                   
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.frequencyOfDepreciation}
                        fetchOptions={fetchFrequencyOptions}
                        onChange={(v) =>
                          changeFinanceRow(
                            row.id,
                            "frequencyOfDepreciation",
                            v
                          )
                        }
                        placeholder="Months..."
                      />
                    </td>

                    
                    <td className="border-b border-theme px-1 py-0.5">
                      <ModalInput
                        label=""
                        name="totalNumberOfDepreciations"
                        type="number"
                        value={row.totalNumberOfDepreciations}
                        placeholder="0"
                        onChange={(e) =>
                          changeFinanceRow(
                            row.id,
                            "totalNumberOfDepreciations",
                            e.target.value
                          )
                        }
                      />
                    </td>

                  
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.depreciationPostingDate}
                        fetchOptions={fetchPostingDateOptions}
                        onChange={(v) =>
                          changeFinanceRow(
                            row.id,
                            "depreciationPostingDate",
                            v
                          )
                        }
                        placeholder="Select date..."
                      />
                    </td>

                    <td className="p-2 border-b border-theme text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveFinanceRow(row.id)}
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
          onNext={() =>
            setFinanceBookPage((p) => Math.min(financeBookTotalPages, p + 1))
          }
        />

        <div className="mt-3">
          <Button variant="secondary" onClick={handleAddFinanceRow}>
            Add row
          </Button>
        </div>
      </div> */}



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

                    {/* Fixed Asset Account — API call on focus */}
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.fixedAssetAccount}
                        fetchOptions={fetchFixedAssetAccounts}
                        onChange={(v) =>
                          changeAccountRow(row.id, "fixedAssetAccount", v)
                        }
                        placeholder="Select account..."
                      />
                    </td>

                    {/* Accumulated Depreciation Account */}
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.accumulatedDepreciationAccount}
                        fetchOptions={fetchAccumulatedDepAccounts}
                        onChange={(v) =>
                          changeAccountRow(
                            row.id,
                            "accumulatedDepreciationAccount",
                            v
                          )
                        }
                        placeholder="Select account..."
                      />
                    </td>

                    {/* Depreciation Expense Account */}
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.depreciationExpenseAccount}
                        fetchOptions={fetchDepExpenseAccounts}
                        onChange={(v) =>
                          changeAccountRow(
                            row.id,
                            "depreciationExpenseAccount",
                            v
                          )
                        }
                        placeholder="Select account..."
                      />
                    </td>

                    {/* CWIP Account */}
                    <td className="border-b border-theme">
                      <CellSearch
                        value={row.capitalWorkInProgressAccount}
                        fetchOptions={fetchCWIPAccounts}
                        onChange={(v) =>
                          changeAccountRow(
                            row.id,
                            "capitalWorkInProgressAccount",
                            v
                          )
                        }
                        placeholder="Select account..."
                      />
                    </td>

                    <td className="p-2 border-b border-theme text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveAccountRow(row.id)}
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
          onNext={() =>
            setAccountPage((p) => Math.min(accountTotalPages, p + 1))
          }
        />

        <div className="mt-3">
          <Button variant="secondary" onClick={handleAddAccountRow}>
            Add row
          </Button>
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
      height="80vh"
      footer={footer}
    >
      <section className="overflow-y-auto h-full">{body}</section>
    </MinimizableModal>
  );
};

export default AssetCategoryModal;