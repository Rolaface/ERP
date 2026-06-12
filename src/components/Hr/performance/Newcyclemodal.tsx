import React, { useState, useMemo, useCallback } from "react";
import { ClipboardList, Trash2, Plus } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { useCycleModal, type NewCyclePayload } from "../../../hooks/appraisal/useCycleModal";
import type { AppraiseeRow, CycleItem } from "../../../api/Appraisalapi/performanceCycleApi";
import DatePickerInput from "../../calendar/DatePickerInput";

const ROWS_PER_PAGE = 5;

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: NewCyclePayload) => void;
  modalId?: string;
  viewData?: CycleItem | null;
  isViewMode?: boolean;
  viewLoading?: boolean;
}

const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">
    {children}
  </p>
);

// ─── Appraisee Table ──────────────────────────────────────────────────────────

interface AppraiseeTableProps {
  allRows: AppraiseeRow[];
  pageRows: AppraiseeRow[];
  loading: boolean;
  isViewMode: boolean;
  pageOffset: number;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  fetchTemplates: (q: string) => Promise<{ label: string; value: string }[]>;
  fetchEmployees: (q: string) => Promise<{ label: string; value: string }[]>;
  onUpdateTemplate: (employeeId: string, templateName: string) => void;
  onUpdateEmployee: (oldId: string, newId: string, newName: string) => void;
  onRemove: (employeeId: string) => void;
  onAddRow: () => void;
}

const AppraiseeTable: React.FC<AppraiseeTableProps> = ({
  allRows,
  pageRows,
  loading,
  isViewMode,
  pageOffset,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  fetchTemplates,
  fetchEmployees,
  onUpdateTemplate,
  onUpdateEmployee,
  onRemove,
  onAddRow,
}) => {
  const total = allRows.length;
  const showingFrom = total === 0 ? 0 : pageOffset + 1;
  const showingTo = Math.min(pageOffset + pageRows.length, total);

  if (loading) {
    return (
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full table-fixed text-xs">
          <thead>
            <tr className="bg-[var(--border)]/10 border-b-2 border-[var(--border)]">
              {["", "No.", "Employee *", "Employee Name", "Appraisal Template", "Department", "Designation", "Branch", ""].map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--border)]/20">
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="px-3 py-2">
                    <div className="h-3 rounded animate-pulse" style={{ width: "70%", background: "rgba(0,0,0,0.07)" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-xs" style={{ minWidth: 720 }}>
          <colgroup>
            <col style={{ width: 32 }} />
            <col style={{ width: 42 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 36 }} />
          </colgroup>

          <thead>
            <tr className="bg-[var(--border)]/10 border-b-2 border-[var(--border)]">
              <th className="px-2 py-2 text-center">
                <input type="checkbox" className="w-3 h-3 accent-[var(--primary)]" disabled={isViewMode} />
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">No.</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Employee <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Employee Name</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Appraisal Template</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Department</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Designation</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Branch</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-[var(--muted)] text-xs opacity-60">
                  No employees found
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => {
                const globalIdx = pageOffset + idx;
                const rowKey = `${globalIdx}-${row.employee || "__empty"}`;

                return (
                  <tr
                    key={rowKey}
                    className={[
                      "border-b border-[var(--border)]/20 transition-colors",
                      idx % 2 === 0 ? "bg-transparent" : "bg-[var(--row-hover)]/10",
                      "hover:bg-[var(--row-hover)]",
                    ].join(" ")}
                  >
                    <td className="px-2 py-1 text-center">
                      <input type="checkbox" className="w-3 h-3 accent-[var(--primary)]" disabled={isViewMode} />
                    </td>
                    <td className="px-2 py-1 text-center text-[var(--muted)] font-medium text-xs">
                      {globalIdx + 1}
                    </td>

                    <td className="px-2 py-1">
                      {isViewMode ? (
                        <span className="block truncate text-xs text-[var(--text)]" title={row.employee}>
                          {row.employee || "—"}
                        </span>
                      ) : (
                        <SearchSelect2
                          label=""
                          value={row.employee}
                          fetchOptions={fetchEmployees}
                          onChange={(val, opt: any) =>
                            onUpdateEmployee(row.employee, val, opt?.label ?? val)
                          }
                          placeholder="Search employee…"
                        />
                      )}
                    </td>

                    <td className="px-3 py-1">
                      <span className="block truncate text-xs text-[var(--text)]" title={row.employee_name}>
                        {row.employee_name || "—"}
                      </span>
                    </td>

                    <td className="px-2 py-1">
                      {isViewMode ? (
                        <span className="block truncate text-xs text-[var(--text)]" title={row.appraisal_template}>
                          {row.appraisal_template || "—"}
                        </span>
                      ) : (
                        <SearchSelect2
                          label=""
                          value={row.appraisal_template}
                          fetchOptions={fetchTemplates}
                          onChange={(val) => onUpdateTemplate(row.employee, val)}
                          placeholder="Select template…"
                        />
                      )}
                    </td>

                    <td className="px-3 py-1">
                      <span className="block truncate text-xs text-[var(--text)]" title={row.department}>
                        {row.department || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-1">
                      <span className="block truncate text-xs text-[var(--text)]" title={row.designation}>
                        {row.designation || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-1">
                      <span className="block truncate text-xs text-[var(--text)]" title={row.branch}>
                        {row.branch || "—"}
                      </span>
                    </td>

                    <td className="px-2 py-1 text-center">
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onRemove(row.employee); }}
                          className="p-1 rounded text-red-400 hover:text-red-600 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] bg-card px-3 py-1.5 flex items-center gap-3">
        {!isViewMode && (
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 text-[11px] text-[var(--primary)] hover:opacity-80 font-medium transition-opacity shrink-0"
          >
            <Plus size={12} />
            Add row
          </button>
        )}

        <div className="flex-1" />

        {total > 0 && (
          <span className="text-[10px] text-[var(--muted)] whitespace-nowrap shrink-0">
            Showing {showingFrom} to {showingTo} of {total} items
          </span>
        )}

        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 1}
          className={[
            "px-2.5 py-1 rounded border text-[10px] font-medium transition-colors shrink-0",
            currentPage === 1
              ? "border-[var(--border)] text-[var(--muted)] opacity-40 cursor-not-allowed"
              : "border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
          ].join(" ")}
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={[
            "px-2.5 py-1 rounded border text-[10px] font-medium transition-colors shrink-0",
            currentPage === totalPages
              ? "border-[var(--border)] text-[var(--muted)] opacity-40 cursor-not-allowed"
              : "border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
          ].join(" ")}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const NewCycleModal = ({
  isOpen,
  onClose,
  onSave,
  modalId = "new-cycle",
  viewData,
  isViewMode = false,
  viewLoading = false,
}: NewCycleModalProps) => {
  const hook = useCycleModal(isOpen, onSave, onClose, modalId, viewData, isViewMode);

  const [appraiseePage, setAppraiseePage] = useState(1);

  const totalAppraisees = hook.appraisees.length;
  const totalPages = Math.max(1, Math.ceil(totalAppraisees / ROWS_PER_PAGE));
  const safePage = Math.min(appraiseePage, totalPages);
  const pageOffset = (safePage - 1) * ROWS_PER_PAGE;

  const paginatedRows = useMemo(
    () => hook.appraisees.slice(pageOffset, pageOffset + ROWS_PER_PAGE),
    [hook.appraisees, pageOffset],
  );

  if (safePage !== appraiseePage) setAppraiseePage(safePage);

  const handleAddRow = useCallback(() => {
    hook.addAppraisee();
    const newTotalPages = Math.ceil((totalAppraisees + 1) / ROWS_PER_PAGE);
    setAppraiseePage(newTotalPages);
  }, [hook, totalAppraisees]);

  const handleUpdateEmployee = useCallback(
    (oldId: string, newId: string, newName: string) => {
      hook.updateAppraiseeEmployee(oldId, newId, newName);
    },
    [hook],
  );

  const footer = isViewMode ? (
    <div className="flex items-center justify-end w-full">
      <button type="button" onClick={hook.handleClose} className="btn btn-outline text-sm px-4 h-8">
        Close
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-between w-full">
      <button type="button" onClick={hook.handleClose} className="btn btn-outline text-sm px-4 h-8">
        Cancel
      </button>
      <button type="button" onClick={hook.handleSave} className="btn btn-primary text-sm px-5 h-8">
        Create Cycle
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={hook.handleClose}
      title={isViewMode ? "View Appraisal Cycle" : "New Appraisal Cycle"}
      subtitle={
        isViewMode
          ? "Read-only view of this performance review cycle"
          : "Configure and launch a new performance review cycle"
      }
      icon={ClipboardList}
      customWidth="70vw"
      height="620px"
      footer={footer}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
          <div className="space-y-4 pb-2">

            {/* Form fields */}
            <div className="grid grid-cols-3 gap-3">
              <ModalInput
                label="Cycle Name"
                required={!isViewMode}
                value={hook.form.cycle_name}
                onChange={(e) => !isViewMode && hook.setField("cycle_name", e.target.value)}
                placeholder="e.g. Annual Review 2025"
                disabled={isViewMode}
              />
              {hook.getError("cycle_name") && (
                <p className="text-[10px] text-red-500 mt-0.5 col-span-3">
                  {hook.getError("cycle_name")}
                </p>
              )}

              <DatePickerInput
                name="start_date"
                label="Start Date"
                required={!isViewMode}
                value={hook.form.start_date}
                onChange={(_, value) => { if (!isViewMode) hook.setField("start_date", value); }}
                disabled={isViewMode}
              />
              {hook.getError("start_date") && (
                <p className="text-[10px] text-red-500 mt-0.5 col-span-3 -mt-2">
                  {hook.getError("start_date")}
                </p>
              )}

              <DatePickerInput
                name="end_date"
                label="End Date"
                required={!isViewMode}
                value={hook.form.end_date}
                onChange={(_, value) => { if (!isViewMode) hook.setField("end_date", value); }}
                disabled={isViewMode}
              />
              {hook.getError("end_date") && (
                <p className="text-[10px] text-red-500 mt-0.5 col-span-3 -mt-2">
                  {hook.getError("end_date")}
                </p>
              )}

              {!isViewMode && (
                <>
                  <SearchSelect2
                    label="Branch"
                    value={hook.filterBranch}
                    fetchOptions={hook.fetchBranches}
                    onChange={(val) => hook.setFilterBranch(val)}
                    placeholder="All branches…"
                  />
                   <SearchSelect2
                    label="Department"
                    value={hook.filterDepartment}
                    fetchOptions={hook.fetchDepartments}
                    onChange={(val) => hook.setFilterDepartment(val)}
                    placeholder="All departments…"
                  />
                  <SearchSelect2
                    label="Designation"
                    value={hook.filterDesignation}
                    fetchOptions={hook.fetchDesignations}
                    onChange={(val) => hook.setFilterDesignation(val)}
                    placeholder="All designations…"
                  />
                </>
              )}
            </div>

            {/* Employees section */}
            <div className="flex items-center justify-between">
              <SectionLabel>{isViewMode ? "Appraisees" : "Employees"}</SectionLabel>
            </div>

            {hook.empError && (
              <p className="text-[11px] text-red-500 -mt-2">{hook.empError}</p>
            )}

            <AppraiseeTable
              allRows={hook.appraisees}
              pageRows={paginatedRows}
              loading={hook.loadingEmps || (isViewMode && viewLoading)}
              isViewMode={isViewMode}
              pageOffset={pageOffset}
              currentPage={safePage}
              totalPages={totalPages}
              onPrev={() => setAppraiseePage((p) => Math.max(1, p - 1))}
              onNext={() => setAppraiseePage((p) => Math.min(totalPages, p + 1))}
              fetchTemplates={hook.fetchTemplates}
              fetchEmployees={hook.fetchEmployees}
              onUpdateTemplate={hook.updateAppraiseeTemplate}
              onUpdateEmployee={handleUpdateEmployee}
              onRemove={hook.removeAppraisee}
              onAddRow={handleAddRow}
            />
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default NewCycleModal;