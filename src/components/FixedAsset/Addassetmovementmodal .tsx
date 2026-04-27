import React, { useEffect, useRef, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import { showApiError, showSuccess } from "../../utils/alert";
import type {
  AddAssetMovementModalProps,
  AssetMovementForm,
  AssetMovementRow,
} from "../../types/Assetmovement.types";
import {
  DEFAULT_ASSET_MOVEMENT_FORM,
  DEFAULT_ASSET_MOVEMENT_ROW,
  PURPOSE_OPTIONS,
} from "../../types/Assetmovement.types";

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
    className="w-full bg-transparent border-none outline-none text-[12px] py-0.5 px-1 rounded transition-colors"
    style={{
      color: "var(--text)",
      minWidth: 0,
    }}
    onFocus={(e) =>
      (e.currentTarget.style.background = "var(--row-hover)")
    }
    onBlur={(e) => (e.currentTarget.style.background = "transparent")}
  />
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
  /* ── stable modal id ── */
  const resolvedModalId = useRef(
    modalId ??
      (mode === "edit"
        ? `asset-movement-edit-${Date.now()}`
        : `asset-movement-create-${Date.now()}`),
  ).current;

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [form, setForm] = useState<AssetMovementForm>({
    ...DEFAULT_ASSET_MOVEMENT_FORM,
    ...initialData,
    assets:
      initialData?.assets?.length
        ? initialData.assets
        : [{ ...DEFAULT_ASSET_MOVEMENT_ROW, id: Date.now().toString() }],
    transactionDate: initialData?.transactionDate ?? nowString(),
  });

  const [activeTab, setActiveTab] = useState<MovementTab>("details");
  const [submitting, setSubmitting] = useState(false);

  /* ── reset on open ── */
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      setForm({
        ...DEFAULT_ASSET_MOVEMENT_FORM,
        ...initialData,
        assets:
          initialData?.assets?.length
            ? initialData.assets
            : [{ ...DEFAULT_ASSET_MOVEMENT_ROW, id: Date.now().toString() }],
        transactionDate: initialData?.transactionDate ?? nowString(),
      });
    }
  }, [isOpen]);

  /* ── field change ── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    markDirty();
  };

  /* ── asset row helpers ── */
  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      assets: [
        ...prev.assets,
        { ...DEFAULT_ASSET_MOVEMENT_ROW, id: Date.now().toString() },
      ],
    }));
    markDirty();
  };

  const updateRow = (
    id: string,
    key: keyof AssetMovementRow,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.map((r) =>
        r.id === id ? { ...r, [key]: value } : r,
      ),
    }));
    markDirty();
  };

  const removeRow = (id: string) => {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.filter((r) => r.id !== id),
    }));
    markDirty();
  };

  /* ── submit ── */
  const handleSubmitForm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (onSubmit) await onSubmit(form);
      showSuccess(
        mode === "edit"
          ? "Asset movement updated successfully"
          : "Asset movement created successfully",
      );
      resetDirty();
      onClose();
      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.FIXED_ASSET_LIST);
    } catch (err) {
      showApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const idx = MOVEMENT_TABS.indexOf(activeTab);
    if (idx < MOVEMENT_TABS.length - 1) setActiveTab(MOVEMENT_TABS[idx + 1]);
  };

  const handleReset = () => {
    resetDirty();
    setForm({
      ...DEFAULT_ASSET_MOVEMENT_FORM,
      ...initialData,
      assets: [{ ...DEFAULT_ASSET_MOVEMENT_ROW, id: Date.now().toString() }],
      transactionDate: nowString(),
    });
  };

  /* ── footer ── */
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
      title={mode === "edit" ? "Edit Asset Movement" : "New Asset Movement"}
      subtitle="Transfer or issue assets across locations"
      icon={ArrowRightLeft}
      footer={footerContent}
      maxWidth="5xl"
      height="80vh"
    >
      <form
        id="assetMovementForm"
        className="h-full flex flex-col"
        autoComplete="off"
        onChange={markDirty}
      >
        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="bg-app border-b border-theme px-6 shrink-0">
          <div className="flex gap-8">
            {MOVEMENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all ${
                  activeTab === tab
                    ? "text-primary border-b-[3px] border-primary"
                    : "text-muted border-b-[3px] border-transparent hover:text-main"
                }`}
              >
                {MOVEMENT_TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────── */}
        <div className="overflow-y-auto px-5 py-5 flex flex-col gap-6">

          {/* ════════════════ TAB: details ════════════════ */}
          {activeTab === "details" && (
            <>
              {/* Row 1: Company + Transaction Date */}
              <div className="grid grid-cols-[1fr_1fr] gap-4">
                <ModalInput
                  label="Company *"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Select company"
                  className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                />
                <div className="flex flex-col gap-1">
                  <ModalInput
                    label="Transaction Date *"
                    name="transactionDate"
                    value={form.transactionDate}
                    onChange={handleChange}
                    readOnly
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card cursor-default"
                  />
                  <span className="text-[10px]" style={{ color: "var(--muted)", marginLeft: 4 }}>
                    Asia/Kolkata
                  </span>
                </div>
              </div>

              {/* Row 2: Purpose */}
              <div className="grid grid-cols-[1fr_1fr] gap-4">
                <ModalSelect
                  label="Purpose *"
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  options={PURPOSE_OPTIONS}
                  className="w-full border border-theme rounded text-[11px] text-main bg-card"
                />
              </div>

              {/* Assets inline table */}
              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">
                  Assets
                </p>

                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] border-collapse min-w-[700px]">
                      {/* head */}
                      <thead>
                        <tr className="table-head">
                          <th className="w-10 px-3 py-2.5 text-center font-semibold text-xs">
                            No.
                          </th>
                          <th className="px-3 py-2.5 text-left font-semibold text-xs">
                            Asset *
                          </th>
                          <th className="px-3 py-2.5 text-left font-semibold text-xs">
                            Source Location
                          </th>
                          <th className="px-3 py-2.5 text-left font-semibold text-xs">
                            From Employee
                          </th>
                          <th className="px-3 py-2.5 text-left font-semibold text-xs">
                            Target Location
                          </th>
                          <th className="px-3 py-2.5 text-left font-semibold text-xs">
                            To Employee
                          </th>
                          <th className="w-10 px-3 py-2.5" />
                        </tr>
                      </thead>

                      {/* body */}
                      <tbody>
                        {form.assets.map((row, idx) => (
                          <tr
                            key={row.id}
                            className="row-hover border-t transition-colors"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {/* No. */}
                            <td
                              className="px-3 py-2 text-center font-medium"
                              style={{ color: "var(--muted)" }}
                            >
                              {idx + 1}
                            </td>

                            {/* Asset */}
                            <td className="px-2 py-1.5">
                              <EditableCell
                                value={row.asset}
                                onChange={(v) => updateRow(row.id, "asset", v)}
                                placeholder="Search asset…"
                              />
                            </td>

                            {/* Source Location */}
                            <td className="px-2 py-1.5">
                              <EditableCell
                                value={row.sourceLocation}
                                onChange={(v) =>
                                  updateRow(row.id, "sourceLocation", v)
                                }
                                placeholder="Source location"
                              />
                            </td>

                            {/* From Employee */}
                            <td className="px-2 py-1.5">
                              <EditableCell
                                value={row.fromEmployee}
                                onChange={(v) =>
                                  updateRow(row.id, "fromEmployee", v)
                                }
                                placeholder="From employee"
                              />
                            </td>

                            {/* Target Location */}
                            <td className="px-2 py-1.5">
                              <EditableCell
                                value={row.targetLocation}
                                onChange={(v) =>
                                  updateRow(row.id, "targetLocation", v)
                                }
                                placeholder="Target location"
                              />
                            </td>

                            {/* To Employee */}
                            <td className="px-2 py-1.5">
                              <EditableCell
                                value={row.toEmployee}
                                onChange={(v) =>
                                  updateRow(row.id, "toEmployee", v)
                                }
                                placeholder="To employee"
                              />
                            </td>

                            {/* Delete row */}
                            <td className="px-3 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(row.id)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-danger transition-colors mx-auto text-base font-bold leading-none"
                                title="Remove row"
                                style={{ color: "var(--danger)" }}
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add row footer */}
                  <div
                    className="px-4 py-2.5 border-t"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={addRow}
                      className="btn btn-outline text-xs font-semibold px-4 py-1.5 rounded-lg"
                    >
                      + Add row
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════════════════ TAB: reference ════════════════ */}
          {activeTab === "reference" && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 border-b border-theme pb-1">
                  Reference Details
                </p>
                <div className="grid grid-cols-[1fr_1fr] gap-4">
                  <ModalInput
                    label="Reference Number"
                    name="referenceNumber"
                    value={form.referenceNumber}
                    onChange={handleChange}
                    placeholder="e.g. REF-0001"
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <ModalInput
                    label="Reference Date"
                    name="referenceDate"
                    value={form.referenceDate}
                    onChange={handleChange}
                    type="date"
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default AddAssetMovementModal;

/* ── util ── */
function nowString() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}