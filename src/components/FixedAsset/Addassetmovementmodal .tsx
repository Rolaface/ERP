import React, { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import DatePickerInput from "../calendar/DatePickerInput";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { getAssetOptions, getAssetById } from "../../api/assetapi";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getLocationOptions } from "../../api/location";
import { getEmployeeOptions } from "../../api/assetMovementapi";
import { resolveEmployeeName } from "../../api/resolversapifun";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import { showSuccess } from "../../utils/alert";
import { useAssetMovement } from "../../hooks/Useassetmovement";
import type {
  AddAssetMovementModalProps,
  AssetMovementRow,
} from "../../types/Assetmovement.types";
import { PURPOSE_OPTIONS } from "../../types/Assetmovement.types";

/* ─────────────────────────────────────────────
   TABS
───────────────────────────────────────────── */
type MovementTab = "details" | "reference";
const MOVEMENT_TABS: MovementTab[] = ["details", "reference"];
const MOVEMENT_TAB_LABELS: Record<MovementTab, string> = {
  details: "Movement Details",
  reference: "Reference",
};

/* ─────────────────────────────────────────────
   INLINE EDITABLE CELL
───────────────────────────────────────────── */
const EditableCell: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}> = ({ value, onChange, placeholder, readOnly }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    readOnly={readOnly}
    className="w-full bg-transparent border-none outline-none text-[11px] py-0.5 px-1 rounded transition-colors placeholder:text-muted"
    style={{ color: "var(--text)", minWidth: 0 }}
    onFocus={(e) => (e.currentTarget.style.background = "var(--row-hover)")}
    onBlur={(e) => (e.currentTarget.style.background = "transparent")}
  />
);



/* ─────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <p
    className="text-[10px] font-bold uppercase tracking-widest pb-2 mb-3 border-b"
    style={{ color: "var(--muted)", borderColor: "var(--border)" }}
  >
    {children}
  </p>
);

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
const AddAssetMovementModal: React.FC<AddAssetMovementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  modalId,
}) => {
  const resolvedModalId = useRef(
    modalId ??
    (mode === "edit"
      ? `asset-movement-edit-${Date.now()}`
      : `asset-movement-create-${Date.now()}`),
  ).current;

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState<MovementTab>("details");
  const [employeeName, setEmployeeName] = useState<string>("");

  const {
    form,
    submitting,
    resetForm,
    handleChange,
    handleFieldChange,
    addRow,
    updateRow,
    removeRow,
    submitForm,
  } = useAssetMovement({
    initialData,
    onSuccess: async (record) => {
      await onSubmit?.(record as any);
      showSuccess(
        mode === "edit"
          ? "Asset movement updated successfully"
          : "Asset movement created successfully",
      );
      resetDirty();
      onClose();
      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.ASSET_MOVEMENT_LIST);
    },
  });

  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(0);

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      resetForm();
      setPage(0);
    }
  }, [isOpen]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    handleChange(e);
    markDirty();
  };

  const handleDateChange = (name: string, value: string) => {
    handleFieldChange(name, value);
    markDirty();
  };

  const handleRowUpdate = (
    id: string,
    key: keyof AssetMovementRow,
    value: string,
  ) => {
    updateRow(id, key, value);
    markDirty();
  };

  const handleSubmitForm = async () => {
    return submitForm();
  };

  const handleNext = () => {
    const idx = MOVEMENT_TABS.indexOf(activeTab);
    if (idx < MOVEMENT_TABS.length - 1) setActiveTab(MOVEMENT_TABS[idx + 1]);
  };

  const handleReset = () => {
    resetDirty();
    resetForm();
    setPage(0);
  };

  /* ── Pagination ── */
  const totalRows = form.assets.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedAssets = form.assets.slice(
    safePage * ITEMS_PER_PAGE,
    (safePage + 1) * ITEMS_PER_PAGE,
  );

  const footerContent = (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={handleReset}
      onSubmit={handleSubmitForm}
      onNext={handleNext}
      currentTab={MOVEMENT_TABS.indexOf(activeTab)}
      totalTabs={MOVEMENT_TABS.length}
      saving={submitting}
    />
  );

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={mode === "edit" ? "Edit Asset Movement" : "Create Asset Movement"}
      subtitle="Transfer or issue assets across locations"
      icon={ArrowRightLeft}
      footer={footerContent}
      maxWidth="5xl"
      height="87vh"
    >
      <div className="h-full flex flex-col" onChange={markDirty}>
        {/* ── Tabs ── */}
        <div
          className="shrink-0 px-6 border-b"
          style={{ background: "var(--bg-app)", borderColor: "var(--border)" }}
        >
          <div className="flex gap-0">
            {MOVEMENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="relative py-3 px-1 mr-6 bg-transparent border-none text-xs font-medium cursor-pointer transition-all"
                style={{
                  color: activeTab === tab ? "var(--primary)" : "var(--muted)",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid var(--primary)"
                      : "2px solid transparent",
                }}
              >
                {MOVEMENT_TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {/* ════ TAB: details ════ */}
          {activeTab === "details" && (
            <div className="flex flex-col gap-5">
              {/* Row 1: Transaction Date + Purpose + Reference Number + Reference Date */}
              <div className="grid grid-cols-4 gap-4">
                {/* Transaction Date */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Transaction Date{" "}
                    <span style={{ color: "var(--danger)" }}>*</span>
                  </span>

                  <div className="px-1.5 py-1.5">
                    <DatePickerInput
                      name="transactionDate"
                      value={form.transactionDate}
                      onChange={handleDateChange}
                      required
                    />
                  </div>

                </div>

                {/* Purpose */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Purpose <span style={{ color: "var(--danger)" }}>*</span>
                  </span>

                  <div className="px-1.5 py-1.5">
                    <ModalSelect
                      label=""
                      name="purpose"
                      value={form.purpose}
                      onChange={handleFormChange}
                      options={PURPOSE_OPTIONS}
                      className="w-full  text-[11px] "
                      style={{ color: "var(--text)" }}
                    />
                  </div>

                </div>

                {/* Reference Number */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Reference Number
                  </span>

                  <div className="px-1.5 py-1.5">
                    <ModalInput
                      label=""
                      name="referenceNumber"
                      value={form.referenceNumber}
                      onChange={handleFormChange}
                      placeholder="Optional"
                    />
                  </div>

                </div>

                {/* Reference Date */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Reference Date
                  </span>

                  <div className="px-1.5 py-1.5">
                    <DatePickerInput
                      name="referenceDate"
                      value={form.referenceDate}
                      onChange={handleDateChange}
                    />
                  </div>

                </div>
              </div>

              {/* Assets table */}
              <div>
                <SectionLabel>Assets</SectionLabel>

                <div
                  className="rounded-xl border overflow-hidden"
                  style={{
                    borderColor: "var(--border)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  }}
                >
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-[11px] border-collapse"
                      style={{ minWidth: 720 }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "var(--table-head-bg, var(--primary))",
                            color: "var(--table-head-text, #fff)",
                          }}
                        >
                          {[
                            { label: "No.", w: "w-10 text-center" },
                            { label: "Asset *", w: "" },
                            { label: "Source Location", w: "" },
                            { label: "From Employee", w: "" },
                            { label: "Target Location", w: "" },
                            { label: "To Employee", w: "" },
                            { label: "", w: "w-10" },
                          ].map(({ label, w }, i) => (
                            <th
                              key={i}
                              className={`px-3 py-2.5 text-left text-[10px] font-semibold tracking-wide ${w}`}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedAssets.map((row, idx) => (
                          <tr
                            key={row.id}
                            className="border-t transition-colors row-hover"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {/* Row number — accounts for current page offset */}
                            <td
                              className="px-3 py-2 text-center text-[11px] font-medium w-10"
                              style={{ color: "var(--muted)" }}
                            >
                              {safePage * ITEMS_PER_PAGE + idx + 1}
                            </td>

                            {/* Asset */}
                            <td className="px-2 py-1.5">
                              <SearchSelect2
                                label=""
                                value={row.asset}
                                onChange={async (value) => {
                                  handleRowUpdate(row.id, "asset", value);
                                  try {
                                    const asset = await getAssetById(value);
                                    handleRowUpdate(
                                      row.id,
                                      "sourceLocation",
                                      asset.location || "",
                                    );
                                    handleRowUpdate(
                                      row.id,
                                      "fromEmployee",
                                      asset.custodian || "",
                                    );
                                    if (asset.custodian) {
                                      const name = await resolveEmployeeName(
                                        asset.custodian,
                                      );
                                      handleRowUpdate(
                                        row.id,
                                        "fromEmployeeLabel",
                                        name,
                                      );
                                    }
                                  } catch (err) {
                                    console.error("GET ASSET ERROR", err);
                                  }
                                }}
                                fetchOptions={getAssetOptions}
                                placeholder="Search asset..."
                              />
                            </td>

                            {/* Source Location */}
                            <td className="px-2 py-1.5">
                              <SearchSelect2
                                label=""
                                value={row.sourceLocation}
                                onChange={(value) =>
                                  handleRowUpdate(
                                    row.id,
                                    "sourceLocation",
                                    value,
                                  )
                                }
                                onInputChange={(input) =>
                                  handleRowUpdate(
                                    row.id,
                                    "sourceLocation",
                                    input || "",
                                  )
                                }
                                fetchOptions={getLocationOptions}
                                placeholder="Search source location..."
                                allowCustomInput={true}
                              />
                            </td>

                            {/* From Employee */}
                            <td className="px-2 py-1.5">
                              <SearchSelect2
                                label=""
                                value={row.fromEmployeeLabel || ""}
                                onChange={(value, option) => {
                                  handleRowUpdate(
                                    row.id,
                                    "fromEmployee",
                                    value,
                                  );
                                  handleRowUpdate(
                                    row.id,
                                    "fromEmployeeLabel",
                                    option.label,
                                  );
                                }}
                                fetchOptions={getEmployeeOptions}
                                placeholder="Search employee..."
                              />
                            </td>

                            {/* Target Location */}
                            <td className="px-2 py-1.5">
                              <SearchSelect2
                                label=""
                                value={row.targetLocation}
                                onChange={(value) =>
                                  handleRowUpdate(
                                    row.id,
                                    "targetLocation",
                                    value,
                                  )
                                }
                                fetchOptions={getLocationOptions}
                                placeholder="Search target location..."
                                allowCustomInput={true}
                              />
                            </td>

                            {/* To Employee */}
                            <td className="px-2 py-1.5">
                              <SearchSelect2
                                label=""
                                value={row.toEmployeeLabel || ""}
                                onChange={(value, option) => {
                                  handleRowUpdate(row.id, "toEmployee", value);
                                  handleRowUpdate(
                                    row.id,
                                    "toEmployeeLabel",
                                    option.label,
                                  );
                                }}
                                fetchOptions={getEmployeeOptions}
                                placeholder="Search employee..."
                              />
                            </td>

                            {/* Remove */}
                            <td className="px-3 py-1.5 text-center w-10">
                              <button
                                type="button"
                                onClick={() => {
                                  removeRow(row.id);
                                  // If removing the last item on this page, go back one page
                                  const newTotal = form.assets.length - 1;
                                  const newTotalPages = Math.max(
                                    1,
                                    Math.ceil(newTotal / ITEMS_PER_PAGE),
                                  );
                                  if (safePage >= newTotalPages) {
                                    setPage(newTotalPages - 1);
                                  }
                                }}
                                title="Remove row"
                                className="w-6 h-6 flex items-center justify-center rounded-md mx-auto transition-colors hover:bg-red-50"
                                style={{ color: "var(--danger)" }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table footer: Add row + row count + pagination */}
                  <div
                    className="px-4 py-2.5 border-t flex items-center justify-between gap-3"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg)",
                    }}
                  >
                    {/* Left: Add row + count */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          addRow();
                          markDirty();
                          // Jump to the last page where the new row will appear
                          const newTotal = form.assets.length + 1;
                          const newLastPage = Math.max(
                            0,
                            Math.ceil(newTotal / ITEMS_PER_PAGE) - 1,
                          );
                          setPage(newLastPage);
                        }}
                        className="btn btn-outline text-[11px] font-semibold px-4 py-1.5 rounded-lg"
                      >
                        + Add row
                      </button>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--muted)" }}
                      >
                        {form.assets.length} row
                        {form.assets.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Right: Pagination (only when needed) */}
                    {totalRows > ITEMS_PER_PAGE && (
                      <div className="flex items-center gap-3">
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--muted)" }}
                        >
                          Showing{" "}
                          {safePage * ITEMS_PER_PAGE + 1}–
                          {Math.min(
                            (safePage + 1) * ITEMS_PER_PAGE,
                            totalRows,
                          )}{" "}
                          of {totalRows}
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
            </div>
          )}

          {/* ════ TAB: reference ════ */}
          {activeTab === "reference" && (
            <div className="flex flex-col gap-5">
              {/* Reference tab content goes here */}
            </div>
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default AddAssetMovementModal;