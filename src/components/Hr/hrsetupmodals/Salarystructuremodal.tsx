import React, { useEffect, useState } from "react";
import { LayoutList, Save, X, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { getSalaryComponentOptions } from "../../../api/payrollConfigApi";
import {
  ModalInput,
  ModalSelect,
} from "../../../components/ui/modal/modalComponent";
import {
  createSalaryStructure,
  updateSalaryStructure,
  type SalaryStructure,
  type StructureComponentRow,
} from "../../../api/payrollConfigApi";
import { showApiError, showSuccess } from "../../../utils/alert";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { searchSalaryComponents } from "../../../api/resolversapifun";

interface UnifiedRow {
  salary_component: string;
  type: "Earning" | "Deduction" | "Flexible";
}

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: SalaryStructure | null;
  earningComponents: string[];
  deductionComponents: string[];
  onSuccess?: () => void;
}

function toUnified(
  earnings: StructureComponentRow[],
  deductions: StructureComponentRow[],
): UnifiedRow[] {
  return [
    ...(earnings ?? []).map((r) => ({ ...r, type: "Earning" as const })),
    ...(deductions ?? []).map((r) => ({ ...r, type: "Deduction" as const })),
  ];
}

function fromUnified(rows: UnifiedRow[]) {
  return {
    earnings: rows
      .filter((r) => r.type === "Earning" || r.type === "Flexible")
      .map(({ salary_component }) => ({ salary_component })),
    deductions: rows
      .filter((r) => r.type === "Deduction")
      .map(({ salary_component }) => ({ salary_component })),
  };
}

const ITEMS_PER_PAGE = 5;

export const SalaryStructureModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  earningComponents,
  deductionComponents,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);

  const [structureName, setStructureName] = useState("");
  const [isActive, setIsActive] = useState<"Yes" | "No">("Yes");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<UnifiedRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [earningOptions, setEarningOptions] = useState<string[]>([]);
  const [deductionOptions, setDeductionOptions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStructureName(initialData?.name ?? "");
      setIsActive(initialData?.is_active ?? "Yes");
      setDescription(initialData?.description ?? "");
      const initialRows = toUnified(
        initialData?.earnings ?? [],
        initialData?.deductions ?? [],
      );
      setRows(
        initialRows.length > 0
          ? initialRows
          : [{ salary_component: "", type: "Earning" }],
      );
      setPage(0);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen) {
      loadComponents();
    }
  }, [isOpen]);

  const loadComponents = async () => {
    try {
      const data = await getSalaryComponentOptions();
      const earnings = data
        .filter((c) => c.type === "Earning")
        .map((c) => c.salary_component);
      const deductions = data
        .filter((c) => c.type === "Deduction")
        .map((c) => c.salary_component);
      setEarningOptions(earnings);
      setDeductionOptions(deductions);
    } catch (err) {
      console.error("Failed to load components");
    }
  };

  // pagination
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedRows = rows.slice(
    safePage * ITEMS_PER_PAGE,
    (safePage + 1) * ITEMS_PER_PAGE,
  );

  const addRow = () => {
    setRows((prev) => [...prev, { salary_component: "", type: "Earning" }]);
    const newTotal = rows.length + 1;
    setPage(Math.max(0, Math.ceil(newTotal / ITEMS_PER_PAGE) - 1));
  };

  const updateRow = <K extends keyof UnifiedRow>(
    globalIdx: number,
    key: K,
    value: UnifiedRow[K],
  ) =>
    setRows((prev) => {
      const next = [...prev];
      next[globalIdx] = { ...next[globalIdx], [key]: value };
      if (key === "type") next[globalIdx].salary_component = "";
      return next;
    });

  const removeRow = (globalIdx: number) => {
    const newTotal = rows.length - 1;
    const newTotalPages = Math.max(1, Math.ceil(newTotal / ITEMS_PER_PAGE));
    if (safePage >= newTotalPages) setPage(newTotalPages - 1);
    setRows((prev) => prev.filter((_, i) => i !== globalIdx));
  };

  const handleSave = async () => {
    if (!structureName.trim()) {
      showApiError("Structure name is required");
      return;
    }
    const validRows = rows.filter((r) => r.salary_component.trim());
    const { earnings, deductions } = fromUnified(validRows);
    if (earnings.length === 0) {
      showApiError("At least one earning component is required");
      return;
    }
    try {
      setSaving(true);
      const payload: Omit<SalaryStructure, "name"> = {
        is_active: isActive,
        docstatus: 1 as const,
        description,
        earnings,
        deductions,
      };
      if (isEdit && initialData?.name) {
        await updateSalaryStructure(initialData.name, payload);
        showSuccess("Salary structure updated");
      } else {
        await createSalaryStructure({ name: structureName, ...payload });
        showSuccess("Salary structure created");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to save salary structure");
    } finally {
      setSaving(false);
    }
  };

  const earningCount = rows.filter((r) => r.type === "Earning").length;
  const deductionCount = rows.filter((r) => r.type === "Deduction").length;
  const flexibleCount = rows.filter((r) => r.type === "Flexible").length;

  const footer = (
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {saving ? "Saving…" : isEdit ? "Update Structure" : "Create Structure"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Salary Structure" : "New Salary Structure"}
      subtitle="Compose earnings & deductions into a reusable payroll structure"
      icon={LayoutList}
      customWidth="60vw"
      height="84vh"
      footer={footer}
    >
      <div className="space-y-5 pb-2">
        {/* ── Name + Status ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <ModalInput
              label="Structure Name"
              value={structureName}
              disabled={isEdit}
              onChange={(e) => setStructureName(e.target.value)}
              placeholder="e.g. Fixed CTC Structure"
              required
            />
          </div>
          <div>
            <ModalSelect
              label="Status"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value as "Yes" | "No")}
              options={[
                { label: "Active", value: "Yes" },
                { label: "Inactive", value: "No" },
              ]}
            />
          </div>
        </div>

        {/* ── Description ───────────────────────────────────────────────── */}
        <ModalInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes…"
        />

        {/* ── Components table ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {/* table label */}
          <div className="flex items-center border-b border-[var(--border)] bg-app px-4 py-2.5">
            <span className="text-xs font-semibold text-main">Components</span>
          </div>

          {/* column headings — Type first, then Component */}
          <div className="grid grid-cols-[2rem_10rem_1fr_2.5rem] border-b border-[var(--border)] bg-[var(--border)]/30 px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              No.
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              Type
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              Component
            </span>
            <span />
          </div>

          {/* paginated rows */}
          <div className="divide-y divide-[var(--border)]">
            {rows.length === 0 ? (
              <p className="py-8 text-center text-xs text-sub">
                No components yet —{" "}
                <span className="font-semibold text-primary">Add Row</span>{" "}
                below to start
              </p>
            ) : (
              paginatedRows.map((row, pageIdx) => {
                const globalIdx = safePage * ITEMS_PER_PAGE + pageIdx;
                return (
                  <div
                    key={globalIdx}
                    className="grid grid-cols-[2rem_10rem_1fr_2.5rem] items-center gap-3 px-4 py-2 hover:bg-app transition"
                  >
                    <span className="text-center text-xs font-mono text-sub">
                      {globalIdx + 1}
                    </span>

                    {/* Type — first */}
                    <ModalSelect
                      label=""
                      value={row.type}
                      onChange={(e) =>
                        updateRow(
                          globalIdx,
                          "type",
                          e.target.value as "Earning" | "Deduction" | "Flexible",
                        )
                      }
                      options={[
                        { label: "Earning", value: "Earning" },
                        { label: "Deduction", value: "Deduction" },
                        { label: "Flexible", value: "Flexible" },
                      ]}
                    />

                    {/* Component — second, filtered by selected type */}
                    <SearchSelect2
                      label=""
                      value={row.salary_component}
                      placeholder="Search component..."
                      fetchOptions={(q) =>
                        searchSalaryComponents(row.type, q).then((data) =>
                          data.map((c: { name: string }) => ({
                            label: c.name,
                            value: c.name,
                          })),
                        )
                      }
                      onChange={(value) =>
                        updateRow(globalIdx, "salary_component", value)
                      }
                    />

                    <button
                      type="button"
                      onClick={() => removeRow(globalIdx)}
                      className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* table footer */}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-app px-4 py-2.5">
            {/* left: Add Row + counts */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={addRow}
                className="btn btn-outline text-[11px] font-semibold px-4 py-1.5 rounded-lg"
              >
                + Add Row
              </button>
              <span className="text-[10px] text-sub">
                {totalRows} row{totalRows !== 1 ? "s" : ""}
              </span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span className="text-[11px] text-sub">
                <span className="font-semibold text-emerald-600">
                  {earningCount}
                </span>{" "}
                Earning{earningCount !== 1 ? "s" : ""}
              </span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span className="text-[11px] text-sub">
                <span className="font-semibold text-red-500">
                  {deductionCount}
                </span>{" "}
                Deduction{deductionCount !== 1 ? "s" : ""}
              </span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span className="text-[11px] text-sub">
                <span className="font-semibold text-blue-500">
                  {flexibleCount}
                </span>{" "}
                Flexible{flexibleCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* right: pagination — only when > 5 rows */}
            {totalRows > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-sub">
                  Showing {safePage * ITEMS_PER_PAGE + 1}–
                  {Math.min((safePage + 1) * ITEMS_PER_PAGE, totalRows)} of{" "}
                  {totalRows}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={safePage === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="px-2.5 py-1 rounded border text-[10px] font-medium transition-colors disabled:opacity-40"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--card)",
                      color: "var(--text)",
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages - 1}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    className="px-2.5 py-1 rounded border text-[10px] font-medium transition-colors disabled:opacity-40"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--card)",
                      color: "var(--text)",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};