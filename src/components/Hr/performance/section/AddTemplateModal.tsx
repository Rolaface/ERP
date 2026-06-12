import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Settings2,
  Trash2,
} from "lucide-react";
import { MinimizableModal } from "../../../../components/common/MinimizableModal";
import {
  ModalInput,
  ModalTextarea,
  NumericInput,
} from "../../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../ui/modal/SearchSelect2";
import type { SetupRow } from "../../../../views/hr/performace/types";
import { getFeedbackList } from "../../../../api/Appraisalapi/feedbackApi";
import {
  createTemplate,
  updateTemplate,
  getTemplateById,
} from "../../../../api/Appraisalapi/templeteApi";
import { getKRAList } from "../../../../api/Appraisalapi/kraApi";
import { showApiError, showSuccess } from "../../../../utils/alert";
import { useUnsavedChanges } from "../../../../hooks/useUnsavedChanges";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../../../store/dataRefreshStore";
import ModalFooter from "../../../common/ModalFooter";

// ─── Types ──────────────────────────────────────────────────────────────────

interface KRARow {
  id: string;
  kra: string;
  kraLabel: string;
  weightage: number | null;
  rowName?: string;
}

interface CriteriaRow {
  id: string;
  criteria: string;
  criteriaLabel: string;
  weightage: number | null;
  rowName?: string;
}

interface Props {
  selectedTemplate?: SetupRow | null;
  isViewMode?: boolean;
  onClose: () => void;
  onAdd: (row: SetupRow) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

// ─── Hook: paginated row list ────────────────────────────────────────────────

function usePaginatedRows<T extends { id: string }>(initial: T[]) {
  const [rows, setRows] = useState<T[]>(initial);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setRows_ = (next: T[]) => {
    setRows(next);
    setPage((p) =>
      Math.min(p, Math.max(1, Math.ceil(next.length / PAGE_SIZE))),
    );
  };

  const addRow = (row: T) =>
    setRows((prev) => {
      const next = [...prev, row];
      setPage(Math.ceil(next.length / PAGE_SIZE));
      return next;
    });

  const updateRow = (id: string, patch: Partial<T>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const deleteRow = (id: string) =>
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      setPage((p) =>
        Math.min(p, Math.max(1, Math.ceil(next.length / PAGE_SIZE))),
      );
      return next;
    });

  const deleteSelected = (ids: Set<string>) =>
    setRows((prev) => {
      const next = prev.filter((r) => !ids.has(r.id));
      setPage((p) =>
        Math.min(p, Math.max(1, Math.ceil(next.length / PAGE_SIZE))),
      );
      return next;
    });

  return {
    rows,
    paged,
    page,
    setPage,
    totalPages,
    addRow,
    updateRow,
    deleteRow,
    deleteSelected,
    setRows: setRows_,
  };
}

// ─── Style helpers ───────────────────────────────────────────────────────────

const TH = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <th
    style={{
      padding: "6px 10px",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--muted)",
      textAlign: "left",
      background: "rgba(0,0,0,0.025)",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </th>
);

const TD = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <td
    style={{
      padding: "4px 10px",
      fontSize: 12,
      color: "var(--text)",
      borderBottom: "1px solid var(--border)",
      verticalAlign: "middle",
      ...style,
    }}
  >
    {children}
  </td>
);

// ─── Pagination bar ──────────────────────────────────────────────────────────

function PaginationBar({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>
        {from}–{to} of {total} rows
      </span>
      <button onClick={onPrev} disabled={page === 1} style={pgBtn(page === 1)}>
        <ChevronLeft size={12} /> Previous
      </button>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        style={pgBtn(page === totalPages)}
      >
        Next <ChevronRight size={12} />
      </button>
    </div>
  );
}

function pgBtn(disabled: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 2,
    fontSize: 11,
    padding: "2px 8px",
    border: "1px solid var(--border)",
    borderRadius: 5,
    background: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    color: disabled ? "var(--muted)" : "var(--text)",
    opacity: disabled ? 0.5 : 1,
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AddTemplateModal({
  selectedTemplate,
  isViewMode = false,
  onClose,
  onAdd,
}: Props) {
  const [title, setTitle] = useState("");
  const [descOpen, setDescOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [kraSelected, setKraSelected] = useState<Set<string>>(new Set());
  const [criteriaSelected, setCriteriaSelected] = useState<Set<string>>(
    new Set(),
  );
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);

  const kra = usePaginatedRows<KRARow>([
    {
      id: crypto.randomUUID(),
      kra: "",
      kraLabel: "",
      weightage: null,
    },
  ]);
  const criteria = usePaginatedRows<CriteriaRow>([
    {
      id: crypto.randomUUID(),
      criteria: "",
      criteriaLabel: "",
      weightage: null,
    },
  ]);

  // ── Load template data by ID when editing / viewing ──────────────────────
  useEffect(() => {
    if (!selectedTemplate?.id) {
      setTitle("");
      setDescription("");
      kra.setRows([
        {
          id: crypto.randomUUID(),
          kra: "",
          kraLabel: "",
          weightage: null,
        },
      ]);
      criteria.setRows([
        {
          id: crypto.randomUUID(),
          criteria: "",
          criteriaLabel: "",
          weightage: null,
        },
      ]);
      return;
    }

    setLoading(true);
    getTemplateById(selectedTemplate.id)
      .then((data) => {
        setTitle(data.template_title ?? "");
        setDescription((data as any).description ?? "");

        // Map goals → KRA rows
        const kraRows: KRARow[] = ((data as any).goals ?? []).map((g: any) => ({
          id: crypto.randomUUID(),
          rowName: g.name,
          kra: g.key_result_area,
          kraLabel: g.key_result_area,
          weightage: g.per_weightage ?? 0,
        }));
        kra.setRows(
          kraRows.length
            ? kraRows
            : [
              {
                id: crypto.randomUUID(),
                kra: "",
                kraLabel: "",
                weightage: 0,
              },
            ],
        );

        // Map rating_criteria → Criteria rows
        const criteriaRows: CriteriaRow[] = (
          (data as any).rating_criteria ?? []
        ).map((c: any) => ({
          id: crypto.randomUUID(),
          rowName: c.name,
          criteria: c.criteria,
          criteriaLabel: c.criteria,
          weightage: c.per_weightage ?? 0,
        }));
        criteria.setRows(criteriaRows);
      })
      .catch(showApiError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id]);

  // ── KRA fetch ─────────────────────────────────────────────────────────────
  const fetchKRAOptions = async (q: string, currentRowId?: string) => {
    try {
      const res = await getKRAList({ search: q, pageSize: 20 });
      const usedValues = new Set(
        kra.rows
          .filter((r) => r.id !== currentRowId && r.kra)
          .map((r) => r.kra),
      );
      return (res.data ?? [])
        .filter((item) => !usedValues.has(item.name))
        .map((item) => ({
          label: item.title,
          value: item.name,
        }));
    } catch {
      return [];
    }
  };
  const resolveCriteriaOptions = async (
    q: string,
    currentRowId?: string,
  ): Promise<{ label: string; value: string }[]> => {
    try {
      const res = await getFeedbackList({
        search: q,
        pageSize: 20,
      });
      const usedValues = new Set(
        criteria.rows
          .filter((r) => r.id !== currentRowId && r.criteria)
          .map((r) => r.criteria),
      );
      return (res.data || [])
        .filter((item) => !usedValues.has(item.criteria))
        .map((item) => ({
          label: item.criteria,
          value: item.criteria,
        }));
    } catch {
      return [];
    }
  };
  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      if (!title.trim()) return;

      const payload = {
        template_title: title.trim(),
        description,
        // Send child rows so the backend can upsert them
        goals: kra.rows
          .filter((r) => r.kra)
          .map((r) => ({
            ...(r.rowName ? { name: r.rowName } : {}),
            key_result_area: r.kra,
            per_weightage: r.weightage,
          })),
        rating_criteria: criteria.rows
          .filter((r) => r.criteria)
          .map((r) => ({
            ...(r.rowName ? { name: r.rowName } : {}),
            criteria: r.criteria,
            per_weightage: r.weightage,
          })),
      };

      if (selectedTemplate) {
        await updateTemplate(selectedTemplate.id, payload as any);
        showSuccess("Template updated successfully");
      } else {
        await createTemplate(payload as any);
        showSuccess("Template created successfully");
      }
      resetDirty();
      triggerRefresh(REFRESH_KEYS.APPRAISAL_CYCLE_LIST);

      onAdd({ id: title.trim(), title: title.trim(), description });
      onClose();
    } catch (err) {
      showApiError(err);
    }
  };

  const totalKraWeight = kra.rows.reduce((s, r) => s + (r.weightage || 0), 0);
  const totalCriteriaWeight = criteria.rows.reduce(
    (s, r) => s + (r.weightage || 0),
    0,
  );
  const kraWeightOk = Math.abs(totalKraWeight - 100) < 0.01;
  const criteriaWeightOk =
    Math.abs(totalCriteriaWeight - 100) < 0.01 || criteria.rows.length === 0;

  return (
    <MinimizableModal
      modalId="add-template-modal"
      isOpen
      onClose={() => handleCloseWithConfirm(onClose, "add-template-modal")}
      title={
        isViewMode
          ? "View Appraisal Template"
          : selectedTemplate
            ? "Edit Appraisal Template"
            : "Create Appraisal Template"
      }
      subtitle="Add new Appraisal Template"
      icon={LayoutTemplate}
      maxWidth="4xl"
      height="82vh"
      footer={
        <ModalFooter
          onCancel={onClose}
          onReset={!isViewMode ? () => {
            setTitle("");
            setDescription("");
            kra.setRows([{ id: crypto.randomUUID(), kra: "", kraLabel: "", weightage: null }]);
            criteria.setRows([{ id: crypto.randomUUID(), criteria: "", criteriaLabel: "", weightage: null }]);
            resetDirty();
          } : undefined}
          onSubmit={!isViewMode ? handleSave : undefined}
          cancelLabel={isViewMode ? "Close" : "Cancel"}
          submitLabel={selectedTemplate ? "Update" : "Save"}
          isSubmitting={loading}
        />
      }
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            color: "var(--muted)",
            fontSize: 13,
          }}
        >
          Loading...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 12,
            }}
          >
            <ModalInput
              label="Appraisal Template Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Annual Review 2025"
              disabled={isViewMode || !!selectedTemplate}
              autoFocus={!isViewMode}
              required
            />

            <ModalTextarea
              label="Description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
              placeholder="Add description..."
              disabled={isViewMode}
              style={{ resize: "vertical" }}
            />
          </div>
          {/* ── KRAs ─────────────────────────────────────────── */}
          <div
            style={{
              padding: "12px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
              >
                KRAs
              </span>
              {kraSelected.size > 0 && !isViewMode && (
                <button
                  onClick={() => {
                    kra.deleteSelected(kraSelected);
                    setKraSelected(new Set());
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "var(--danger)",
                    background: "none",
                    border: "1px solid var(--danger)",
                    borderRadius: 5,
                    padding: "2px 8px",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={11} /> Delete ({kraSelected.size})
                </button>
              )}
            </div>

            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 7,
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: 32 }} />
                  <col style={{ width: 44 }} />
                  <col />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 36 }} />
                </colgroup>
                <thead>
                  <tr>
                    <TH>
                      <input
                        type="checkbox"
                        style={{
                          accentColor: "var(--primary)",
                          cursor: "pointer",
                        }}
                        checked={
                          kraSelected.size === kra.rows.length &&
                          kra.rows.length > 0
                        }
                        onChange={(e) =>
                          setKraSelected(
                            e.target.checked
                              ? new Set(kra.rows.map((r) => r.id))
                              : new Set(),
                          )
                        }
                        disabled={isViewMode}
                      />
                    </TH>
                    <TH>No.</TH>
                    <TH>
                      KRA <span style={{ color: "var(--danger)" }}>*</span>
                    </TH>
                    <TH style={{ textAlign: "right" }}>
                      Weightage (%){" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </TH>
                    <TH>
                      <Settings2 size={12} />
                    </TH>
                  </tr>
                </thead>
                <tbody>
                  {kra.paged.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: 14,
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        No rows
                      </td>
                    </tr>
                  ) : (
                    kra.paged.map((row, i) => {
                      const idx = (kra.page - 1) * PAGE_SIZE + i + 1;
                      return (
                        <tr
                          key={row.id}
                          style={{
                            background: kraSelected.has(row.id)
                              ? "rgba(var(--primary-rgb,192,132,61),0.05)"
                              : undefined,
                          }}
                        >
                          <TD>
                            <input
                              type="checkbox"
                              style={{
                                accentColor: "var(--primary)",
                                cursor: "pointer",
                              }}
                              checked={kraSelected.has(row.id)}
                              onChange={(e) => {
                                const n = new Set(kraSelected);
                                e.target.checked
                                  ? n.add(row.id)
                                  : n.delete(row.id);
                                markDirty();
                                setKraSelected(n);
                              }}
                              disabled={isViewMode}
                            />
                          </TD>
                          <TD style={{ color: "var(--muted)", fontSize: 11 }}>
                            {idx}
                          </TD>
                          <TD style={{ padding: "3px 6px" }}>
                            <SearchSelect2
                              label=""
                              value={row.kraLabel}
                              onChange={(val, opt) => {
                                kra.updateRow(row.id, {
                                  kra: val,
                                  kraLabel: opt.label,
                                });

                                markDirty();
                              }}
                              fetchOptions={(q) => fetchKRAOptions(q, row.id)}
                              placeholder="Select KRA..."
                              disabled={isViewMode}
                            />
                          </TD>
                          <TD
                            style={{ padding: "3px 6px", textAlign: "right" }}
                          >
                            <NumericInput
                              value={row.weightage}
                              onChange={(value) => {
                                const others = kra.rows
                                  .filter((r) => r.id !== row.id)
                                  .reduce((s, r) => s + (r.weightage || 0), 0);
                                const maxAllowed = Math.round(Math.max(0, 100 - others) * 1000) / 1000;
                                const clamped = value == null ? null : Math.min(value, maxAllowed);

                                kra.updateRow(row.id, {
                                  weightage: clamped,
                                });

                                markDirty();
                              }}
                              placeholder="0"
                              decimalScale={3}
                              allowNegative={false}
                              disabled={isViewMode}
                              className="w-full text-right"
                            />
                          </TD>
                          <TD>
                            {!isViewMode && (
                              <button
                                onClick={() => kra.deleteRow(row.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--muted)",
                                  padding: 2,
                                  display: "flex",
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </TD>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalKraWeight > 0 && !kraWeightOk && (
              <p style={{ fontSize: 11, color: "var(--danger)", margin: "6px 0 0" }}>
                KRA weightage must total 100% (currently {totalKraWeight.toFixed(1)}%)
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              {!isViewMode && (
                <button
                  onClick={() =>
                    kra.addRow({
                      id: crypto.randomUUID(),
                      kra: "",
                      kraLabel: "",
                      weightage: null,
                    })
                  }
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "3px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--card)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Add row
                </button>
              )}
              {kra.rows.length > PAGE_SIZE && (
                <PaginationBar
                  page={kra.page}
                  totalPages={kra.totalPages}
                  total={kra.rows.length}
                  onPrev={() => kra.setPage((p) => p - 1)}
                  onNext={() => kra.setPage((p) => p + 1)}
                />
              )}
            </div>
          </div>

          {/* ── Rating Criteria ───────────────────────────────── */}
          <div style={{ padding: "12px 0" }}>
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Rating Criteria
                </span>
                {criteriaSelected.size > 0 && !isViewMode && (
                  <button
                    onClick={() => {
                      criteria.deleteSelected(criteriaSelected);
                      setCriteriaSelected(new Set());
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "var(--danger)",
                      background: "none",
                      border: "1px solid var(--danger)",
                      borderRadius: 5,
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={11} /> Delete ({criteriaSelected.size})
                  </button>
                )}
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  margin: "2px 0 0",
                }}
              >
                Criteria based on which employee should be rated in Performance
                Feedback and Self Appraisal
              </p>
            </div>

            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 7,
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: 32 }} />
                  <col style={{ width: 44 }} />
                  <col />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 36 }} />
                </colgroup>
                <thead>
                  <tr>
                    <TH>
                      <input
                        type="checkbox"
                        style={{
                          accentColor: "var(--primary)",
                          cursor: "pointer",
                        }}
                        checked={
                          criteriaSelected.size === criteria.rows.length &&
                          criteria.rows.length > 0
                        }
                        onChange={(e) =>
                          setCriteriaSelected(
                            e.target.checked
                              ? new Set(criteria.rows.map((r) => r.id))
                              : new Set(),
                          )
                        }
                        disabled={isViewMode}
                      />
                    </TH>
                    <TH>No.</TH>
                    <TH>
                      Criteria <span style={{ color: "var(--danger)" }}>*</span>
                    </TH>
                    <TH style={{ textAlign: "right" }}>
                      Weightage (%){" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </TH>
                    <TH>
                      <Settings2 size={12} />
                    </TH>
                  </tr>
                </thead>
                <tbody>
                  {criteria.paged.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: 14,
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        No rows
                      </td>
                    </tr>
                  ) : (
                    criteria.paged.map((row, i) => {
                      const idx = (criteria.page - 1) * PAGE_SIZE + i + 1;
                      return (
                        <tr
                          key={row.id}
                          style={{
                            background: criteriaSelected.has(row.id)
                              ? "rgba(var(--primary-rgb,192,132,61),0.05)"
                              : undefined,
                          }}
                        >
                          <TD>
                            <input
                              type="checkbox"
                              style={{
                                accentColor: "var(--primary)",
                                cursor: "pointer",
                              }}
                              checked={criteriaSelected.has(row.id)}
                              onChange={(e) => {
                                const n = new Set(criteriaSelected);
                                e.target.checked
                                  ? n.add(row.id)
                                  : n.delete(row.id);
                                markDirty();
                                setCriteriaSelected(n);
                              }}
                              disabled={isViewMode}
                            />
                          </TD>
                          <TD style={{ color: "var(--muted)", fontSize: 11 }}>
                            {idx}
                          </TD>
                          <TD style={{ padding: "3px 6px" }}>
                            <SearchSelect2
                              label=""
                              value={row.criteriaLabel}
                              onChange={(val, opt) => {
                                criteria.updateRow(row.id, {
                                  criteria: val,
                                  criteriaLabel: opt.label,
                                });

                                markDirty();
                              }}
                              fetchOptions={(q) => resolveCriteriaOptions(q, row.id)}
                              placeholder="Select criteria..."
                              disabled={isViewMode}
                            />
                          </TD>
                          <TD
                            style={{ padding: "3px 6px", textAlign: "right" }}
                          >
                            <NumericInput
                              value={row.weightage}
                              onChange={(value) => {
                                const others = criteria.rows
                                  .filter((r) => r.id !== row.id)
                                  .reduce((s, r) => s + (r.weightage || 0), 0);
                                const maxAllowed = Math.round(Math.max(0, 100 - others) * 1000) / 1000;
                                const clamped = value == null ? null : Math.min(value, maxAllowed);

                                criteria.updateRow(row.id, {
                                  weightage: clamped,
                                });

                                markDirty();
                              }}
                              placeholder="0"
                              decimalScale={3}
                              allowNegative={false}
                              disabled={isViewMode}
                              className="w-full text-right"
                            />
                          </TD>
                          <TD>
                            {!isViewMode && (
                              <button
                                onClick={() => criteria.deleteRow(row.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--muted)",
                                  padding: 2,
                                  display: "flex",
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </TD>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalCriteriaWeight > 0 && !criteriaWeightOk && (
              <p style={{ fontSize: 11, color: "var(--danger)", margin: "6px 0 0" }}>
                Criteria weightage must total 100% (currently {totalCriteriaWeight.toFixed(1)}%)
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              {!isViewMode && (
                <button
                  onClick={() =>
                    criteria.addRow({
                      id: crypto.randomUUID(),
                      criteria: "",
                      criteriaLabel: "",
                      weightage: null,
                    })
                  }
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "3px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--card)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Add row
                </button>
              )}
              {criteria.rows.length > PAGE_SIZE && (
                <PaginationBar
                  page={criteria.page}
                  totalPages={criteria.totalPages}
                  total={criteria.rows.length}
                  onPrev={() => criteria.setPage((p) => p - 1)}
                  onNext={() => criteria.setPage((p) => p + 1)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </MinimizableModal>
  );
}
