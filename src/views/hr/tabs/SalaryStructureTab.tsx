import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { calculateZmPayrollFromGross } from "../payroll-system/util";
import {
  createSalaryStructure,
  createSalaryComponent,
  deleteSalaryComponent,
  deleteSalaryStructure,
  getSalaryComponents,
  getSalaryStructures,
  getSalaryStructureById,
  updateSalaryComponent,
  updateSalaryStructure,
  type SalaryStructureComponentCreate,
  type SalaryStructureCreatePayload,
  type SalaryStructureUpdatePayload,
  type SalaryStructureListItem,
  type SalaryComponentCreatePayload,
  type SalaryComponentListItem,
  type SalaryComponentUpdatePayload,
} from "../../../api/salaryStructureApi";

const toTitleCase = (value: string) => {
  return value
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
};

export default function SalaryStructureTab() {
  const [structures, setStructures] = useState<SalaryStructureListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [modalMode, setModalMode] = useState<"edit" | "view">("edit");
  const [editingStructure, setEditingStructure] = useState<{
    id?: string;
    name: string;
    company: string;
    components: SalaryStructureComponentCreate[];
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponentListItem[]>([]);
  const [structurePreviewMap, setStructurePreviewMap] = useState<
    Record<string, { earnings: any[]; deductions: any[] }>
  >({});
  const [structurePreviewLoading, setStructurePreviewLoading] = useState<Record<string, boolean>>({});

  const extractFrappeMessageHtml = (e: any): string | null => {
    const data = e?.response?.data;
    if (!data) return null;
    if (typeof data?.message === "string" && data.message.trim()) return data.message;

    const raw = data?._server_messages;
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
      const arr = JSON.parse(raw);
      const first = Array.isArray(arr) ? arr[0] : null;
      if (!first) return null;
      const obj = typeof first === "string" ? JSON.parse(first) : first;
      const msg = obj?.message;
      return typeof msg === "string" && msg.trim() ? msg : null;
    } catch {
      return null;
    }
  };

  const refreshStructures = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalaryStructures();
      setStructures(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load salary structures");
    } finally {
      setLoading(false);
    }

  };

  const fetchStructurePreview = async (structureNameOrId: string) => {
    if (!structureNameOrId) return;
    if (structurePreviewMap[structureNameOrId]) return;
    if (structurePreviewLoading[structureNameOrId]) return;

    setStructurePreviewLoading((p) => ({ ...p, [structureNameOrId]: true }));
    try {
      const detail = await getSalaryStructureById(structureNameOrId);
      const earnings = Array.isArray((detail as any)?.earnings) ? (detail as any).earnings : [];
      const deductions = Array.isArray((detail as any)?.deductions) ? (detail as any).deductions : [];
      setStructurePreviewMap((p) => ({
        ...p,
        [structureNameOrId]: { earnings, deductions },
      }));
    } catch {
      setStructurePreviewMap((p) => ({
        ...p,
        [structureNameOrId]: { earnings: [], deductions: [] },
      }));
    } finally {
      setStructurePreviewLoading((p) => ({ ...p, [structureNameOrId]: false }));
    }
  };

  const openStructureModalFromDetail = async (
    structure: SalaryStructureListItem,
    mode: "edit" | "view",
  ) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await getSalaryStructureById(structure.name || structure.id);
      const earnings = Array.isArray((detail as any)?.earnings)
        ? ((detail as any).earnings as any[])
        : [];
      const deductions = Array.isArray((detail as any)?.deductions)
        ? ((detail as any).deductions as any[])
        : [];

      const components: SalaryStructureComponentCreate[] = [...earnings, ...deductions]
        .map((row: any) => {
          const isDeductionSource = deductions.includes(row);
          return {
            component: String(row?.component ?? ""),
            type: (isDeductionSource ? "deduction" : "earning") as
              | "deduction"
              | "earning",
            amount: Number(row?.amount ?? 0) || 0,
            enabled: 1 as 1,
          };
        })
        .filter((c) => Boolean(c.component));

      setModalMode(mode);
      setEditingStructure({
        id: structure.id,
        name: (detail as any)?.name ?? structure.name,
        company: (detail as any)?.company ?? structure.company,
        components: components.length
          ? components
          : [{ component: "Basic", type: "earning", amount: 0, enabled: 1 }],
      });
      await refreshComponents();
      setShowModal(true);
    } catch (e: any) {
      setError(e?.message || "Failed to load salary structure");
    } finally {
      setLoading(false);
    }
  };

  const filteredStructures = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = Array.isArray(structures) ? structures : [];
    if (!q) return items;
    return items.filter((s) => {
      return (
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.company || "").toLowerCase().includes(q)
      );
    });
  }, [structures, query]);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStructures.length / pageSize));
  }, [filteredStructures.length]);

  const pagedStructures = useMemo(() => {
    const p = Math.min(Math.max(1, page), pageCount);
    const start = (p - 1) * pageSize;
    return filteredStructures.slice(start, start + pageSize);
  }, [filteredStructures, page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    refreshStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshComponents = async () => {
    try {
      const data = await getSalaryComponents();
      setSalaryComponents(Array.isArray(data) ? data : []);
    } catch {
      setSalaryComponents([]);
    }
  };

  const handleCreateNew = async () => {
    setModalMode("edit");

    let allComponents: SalaryComponentListItem[] = [];
    try {
      const data = await getSalaryComponents();
      allComponents = Array.isArray(data) ? data : [];
      setSalaryComponents(allComponents);
    } catch {
      allComponents = [];
      setSalaryComponents([]);
    }

    const requiredComponents: SalaryStructureComponentCreate[] = allComponents
      .filter((c) => Boolean(c?.component || c?.id))
      .map((c) => {
        const rawType = String(c?.type ?? "earning").toLowerCase();
        const type = rawType.includes("deduct") ? "deduction" : "earning";
        return {
          component: String(c.component || c.id),
          type,
          amount: 0,
          enabled: 1,
        };
      });

    setEditingStructure({
      name: "",
      company: "",
      components: requiredComponents.length
        ? requiredComponents
        : [
          {
            component: "Basic",
            type: "earning",
            amount: 0,
            enabled: 1,
          },
        ],
    });

    setShowModal(true);
  };

  const handleEdit = async (structure: SalaryStructureListItem) => {
    await openStructureModalFromDetail(structure, "edit");
  };

  const handleView = async (structure: SalaryStructureListItem) => {
    await openStructureModalFromDetail(structure, "view");
  };

  const handleDelete = async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteSalaryStructure(name);
      await refreshStructures();
      setShowDeleteConfirm(null);
      toast.success("Salary structure deleted");
    } catch (e: any) {
      const html = extractFrappeMessageHtml(e);
      const msg = html ? html.replace(/<[^>]*>/g, "").trim() : e?.message;
      setError(msg || "Failed to delete salary structure");

      if (html) {
        toast.dismiss();
        toast(
          (t) => (
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[420px]">
              <div className="text-sm font-semibold text-gray-900">Unable to delete</div>
              <div
                className="text-xs text-gray-600 mt-1 [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              <div className="flex items-center justify-end mt-4">
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          ),
          { duration: 8000 },
        );
      } else {
        toast.error(msg || "Failed to delete salary structure");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (
    draft?: {
      id?: string;
      name: string;
      company: string;
      components: SalaryStructureComponentCreate[];
    } | null,
  ) => {
    const source = draft ?? editingStructure;
    if (!source) return;
    if (!source?.name?.trim() || !source?.company?.trim() || (source?.components?.length || 0) <= 0) {
      toast.error("Please provide structure name, company, and at least one component");
      return;
    }

    let mergedComponents = (source.components || []).filter((c) => Boolean(c?.component));

    try {
      const all = await getSalaryComponents();
      const allArr: SalaryComponentListItem[] = Array.isArray(all) ? all : [];

      const byComponent = new Map<string, SalaryStructureComponentCreate>();
      mergedComponents.forEach((c) => byComponent.set(String(c.component), c));

      allArr
        .filter((c) => Boolean(c?.component || c?.id))
        .forEach((c) => {
          const name = String(c.component || c.id);
          if (byComponent.has(name)) return;
          const rawType = String(c?.type ?? "earning").toLowerCase();
          const type = rawType.includes("deduct") ? "deduction" : "earning";
          byComponent.set(name, {
            component: name,
            type,
            amount: 0,
            enabled: 1,
          });
        });

      mergedComponents = Array.from(byComponent.values());
    } catch {
      // keep mergedComponents as-is
    }

    setLoading(true);
    setError(null);
    try {
      if (source.id) {
        const payload: SalaryStructureUpdatePayload = {
          id: source.id,
          name: source.name,
          company: source.company,
          components: mergedComponents,
        };
        await updateSalaryStructure(payload);
      } else {
        const payload: SalaryStructureCreatePayload = {
          name: source.name,
          company: source.company,
          components: mergedComponents,
        };
        await createSalaryStructure(payload);
      }
      await refreshStructures();
      setShowModal(false);
      setEditingStructure(null);
    } catch (e: any) {
      setError(e?.message || "Failed to save salary structure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Salary Structures
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage reusable salary templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refreshComponents();
              setShowComponentsModal(true);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Components
          </button>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Structure
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {filteredStructures.length} structures
          </div>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or company"
              className="w-full md:w-80 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="p-4">
          <div className="overflow-auto border border-gray-200 rounded-xl">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    "Structure",
                    "Company",
                    "Status",
                    "Earnings",
                    "Deductions",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap ${h === "" ? "text-right" : "text-left"
                        }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, skIdx) => (
                    <tr key={`sk-${skIdx}`} className={skIdx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}>
                      <td className="px-4 py-3"><div className="h-3 w-40 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-10 w-full bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-10 w-full bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-7 w-40 bg-gray-200 rounded-lg animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : pagedStructures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">
                      No salary structures found
                    </td>
                  </tr>
                ) : (
                  pagedStructures.map((structure, idx) => {
                    const key = String(structure.name || structure.id);
                    const preview = structurePreviewMap[key];
                    const isPreviewLoading = Boolean(structurePreviewLoading[key]);

                    const earnings = Array.isArray(preview?.earnings) ? preview?.earnings : [];
                    const deductions = Array.isArray(preview?.deductions) ? preview?.deductions : [];

                    return (
                      <tr
                        key={key}
                        onMouseEnter={() => fetchStructurePreview(key)}
                        className={`border-b border-gray-200 last:border-0 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"
                          }`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-xs font-extrabold text-gray-900 break-words">
                            {structure.name}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {structure.company || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full border ${structure.is_active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                          >
                            {structure.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-top">
                          {isPreviewLoading && !preview ? (
                            <div className="text-xs text-gray-500">Loading…</div>
                          ) : earnings.length === 0 ? (
                            <div className="text-xs text-gray-500">—</div>
                          ) : (
                            <div className="space-y-1">
                              {earnings.slice(0, 2).map((r: any, i: number) => (
                                <div key={`${r?.component}-${i}`} className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-700 truncate max-w-[220px]">
                                    {String(r?.component ?? "")}
                                  </div>
                                  <div className="text-xs font-extrabold text-gray-900 tabular-nums whitespace-nowrap">
                                    {Number(r?.amount ?? 0).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                              {earnings.length > 2 && (
                                <div className="text-[11px] text-gray-500">+ {(earnings.length - 2).toString()} more…</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top">
                          {isPreviewLoading && !preview ? (
                            <div className="text-xs text-gray-500">Loading…</div>
                          ) : deductions.length === 0 ? (
                            <div className="text-xs text-gray-500">—</div>
                          ) : (
                            <div className="space-y-1">
                              {deductions.slice(0, 2).map((r: any, i: number) => (
                                <div key={`${r?.component}-${i}`} className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-700 truncate max-w-[220px]">
                                    {String(r?.component ?? "")}
                                  </div>
                                  <div className="text-xs font-extrabold text-gray-900 tabular-nums whitespace-nowrap">
                                    {Number(r?.amount ?? 0).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                              {deductions.length > 2 && (
                                <div className="text-[11px] text-gray-500">+ {(deductions.length - 2).toString()} more…</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(structure)}
                              className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEdit(structure)}
                              className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(structure.name || structure.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagedStructures.length > 0 && (
          <div className="p-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Page {page} of {pageCount}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingStructure && (
        <StructureModal
          structure={editingStructure}
          onSave={(v) => handleSave(v)}
          onClose={() => {
            setShowModal(false);
            setEditingStructure(null);
          }}
          onChange={setEditingStructure}
          busy={loading}
          salaryComponents={salaryComponents}
          readOnly={modalMode === "view"}
        />
      )}

      {showComponentsModal && (
        <SalaryComponentsModal
          onClose={() => setShowComponentsModal(false)}
          onChanged={refreshComponents}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          structure={structures.find((s) => (s.name || s.id) === showDeleteConfirm)!}
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function SalaryComponentsModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SalaryComponentListItem[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editing, setEditing] = useState<{
    id?: string;
    name: string;
    type: "Earning" | "Deduction";
    abbr: string;
    description: string;
    enabled: boolean;
    amount_based_on_formula: boolean;
    condition: string;
    formula: string;
    tax_applicable: boolean;
  } | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalaryComponents();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load salary components");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = Array.isArray(items) ? items : [];
    if (!q) return arr;
    return arr.filter((c) => {
      return (
        String(c.component || "").toLowerCase().includes(q) ||
        String(c.abbr || "").toLowerCase().includes(q) ||
        String(c.type || "").toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered.length]);

  const paged = useMemo(() => {
    const p = Math.min(Math.max(1, page), pageCount);
    const start = (p - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const startCreate = () => {
    setEditing({
      name: "",
      type: "Earning",
      abbr: "",
      description: "",
      enabled: true,
      amount_based_on_formula: false,
      condition: "",
      formula: "",
      tax_applicable: false,
    });
  };

  const startEdit = (c: SalaryComponentListItem) => {
    setEditing({
      id: c.id,
      name: c.component || c.id,
      type: String(c.type || "Earning") as any,
      abbr: c.abbr || "",
      description: c.description || "",
      enabled: Boolean(c.enabled),
      amount_based_on_formula: false,
      condition: "",
      formula: "",
      tax_applicable: Boolean(c.tax_applicable),
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.abbr.trim()) {
      toast.error("Please provide component name and abbreviation");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editing.id) {
        const payload: SalaryComponentUpdatePayload = {
          id: editing.id,
          name: editing.name,
          type: editing.type,
          abbr: editing.abbr,
          description: editing.description,
          enabled: editing.enabled ? 1 : 0,
          amount_based_on_formula: editing.amount_based_on_formula ? 1 : 0,
          condition: editing.condition,
          formula: editing.formula,
          tax_applicable: editing.tax_applicable ? 1 : 0,
        };
        await updateSalaryComponent(payload);
      } else {
        const payload: SalaryComponentCreatePayload = {
          name: editing.name,
          type: editing.type,
          abbr: editing.abbr,
          description: editing.description,
          enabled: editing.enabled ? 1 : 0,
          amount_based_on_formula: editing.amount_based_on_formula ? 1 : 0,
          condition: editing.condition,
          formula: editing.formula,
          tax_applicable: editing.tax_applicable ? 1 : 0,
        };
        await createSalaryComponent(payload);
      }
      await refresh();
      onChanged();
      setEditing(null);
      toast.success("Salary component saved");
    } catch (e: any) {
      setError(e?.message || "Failed to save salary component");
      toast.error(e?.message || "Failed to save salary component");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (name: string) => {
    toast.dismiss();
    toast(
      (t) => (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[340px]">
          <div className="text-sm font-semibold text-gray-900">Delete Salary Component</div>
          <div className="text-xs text-gray-500 mt-1">Are you sure you want to delete "{name}"?</div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                (async () => {
                  try {
                    toast.dismiss(t.id);
                    setLoading(true);
                    setError(null);
                    await deleteSalaryComponent(name);
                    await refresh();
                    onChanged();
                    if (editing?.name === name || editing?.id === name) setEditing(null);
                    toast.success("Salary component deleted");
                  } catch (e: any) {
                    const msg = e?.message || "Failed to delete salary component";
                    setError(msg);
                    toast.error(msg);
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="px-6 py-4 flex items-center justify-between bg-card text-main">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-main">Salary Components</h3>
            <div className="text-xs text-muted mt-0.5">Manage earnings and deductions</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/5 transition-colors text-muted hover:text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="text-sm text-gray-600">{filtered.length} components</div>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search components"
                className="w-full md:w-96 px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                onClick={startCreate}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Component
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <div className="bg-card rounded-lg overflow-hidden flex-1 flex flex-col shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/5">
                  <tr>
                    <th className="text-left font-semibold text-muted text-xs px-4 py-3 whitespace-nowrap">Component</th>
                    <th className="text-left font-semibold text-muted text-xs px-4 py-3 whitespace-nowrap">Abbr</th>
                    <th className="text-left font-semibold text-muted text-xs px-4 py-3 whitespace-nowrap">Type</th>
                    <th className="text-left font-semibold text-muted text-xs px-4 py-3 whitespace-nowrap">Tax</th>
                    <th className="text-left font-semibold text-muted text-xs px-4 py-3 whitespace-nowrap">Enabled</th>
                    <th className="text-right font-semibold text-muted text-xs px-4 py-3 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-main">{c.component || c.id}</div>
                        {c.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">{c.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-main">{c.abbr}</td>
                      <td className="px-4 py-3 text-main">{String(c.type || "")}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${c.tax_applicable ? "text-primary" : "text-muted"}`}>
                          {c.tax_applicable ? "Taxable" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${c.enabled ? "text-green-600" : "text-muted"}`}>
                          {c.enabled ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(c)}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(c.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && paged.length === 0 && (
                    <tr>
                      <td className="px-4 py-10 text-center text-gray-600" colSpan={6}>
                        No salary components found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
              <div className="px-6 py-4 flex items-center justify-between text-main">
                <div className="min-w-0">
                  <h3 className="text-base font-bold">{editing?.id ? "Edit" : "Create"} Component</h3>
                  <div className="text-xs text-muted mt-0.5">Fill in the component details</div>
                </div>
                <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-muted/5 transition-colors text-muted hover:text-main">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Name *</label>
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Type *</label>
                      <select
                        value={editing.type}
                        onChange={(e) => setEditing({ ...editing, type: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="Earning">Earning</option>
                        <option value="Deduction">Deduction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Abbr *</label>
                      <input
                        value={editing.abbr}
                        onChange={(e) => setEditing({ ...editing, abbr: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Description</label>
                    <input
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-main">
                      <input
                        type="checkbox"
                        checked={editing.enabled}
                        onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                      />
                      Enabled
                    </label>

                    <label className="flex items-center gap-2 text-sm text-main">
                      <input
                        type="checkbox"
                        checked={editing.tax_applicable}
                        onChange={(e) => setEditing({ ...editing, tax_applicable: e.target.checked })}
                      />
                      Tax applicable
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/5 flex justify-end gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm font-medium hover:bg-black/5 transition-colors rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-muted/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium hover:bg-black/5 transition-colors rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Structure Modal Component
function StructureModal({
  structure,
  onSave,
  onClose,
  onChange,
  busy,
  salaryComponents,
  readOnly,
}: {
  structure: {
    id?: string;
    name: string;
    company: string;
    components: SalaryStructureComponentCreate[];
  };
  onSave: (v: {
    id?: string;
    name: string;
    company: string;
    components: SalaryStructureComponentCreate[];
  }) => void;
  onClose: () => void;
  onChange: (v: any) => void;
  busy: boolean;
  salaryComponents: SalaryComponentListItem[];
  readOnly?: boolean;
}) {
  const [formData, setFormData] = useState(structure);

  useEffect(() => {
    setFormData(structure);
  }, [structure]);

  const enabledComponents = useMemo(() => {
    return (formData.components || []).filter((c) => Boolean(c?.enabled));
  }, [formData.components]);

  const earnings = useMemo(() => {
    return enabledComponents.filter(
      (c) => String(c?.type || "").toLowerCase() === "earning",
    );
  }, [enabledComponents]);

  const deductions = useMemo(() => {
    return enabledComponents.filter(
      (c) => String(c?.type || "").toLowerCase() === "deduction",
    );
  }, [enabledComponents]);

  const totalEarnings = useMemo(() => {
    return earnings.reduce((sum, c) => sum + (Number(c.amount || 0) || 0), 0);
  }, [earnings]);

  const earningsForSummary = useMemo(() => {
    const arr = [...earnings];
    arr.sort((a: any, b: any) => {
      const an = String(a?.component || "").toLowerCase();
      const bn = String(b?.component || "").toLowerCase();
      const aIsBasic = an === "basic" || an === "basic salary";
      const bIsBasic = bn === "basic" || bn === "basic salary";
      if (aIsBasic && !bIsBasic) return -1;
      if (!aIsBasic && bIsBasic) return 1;
      return 0;
    });
    return arr;
  }, [earnings]);

  const statutoryCalc = useMemo(() => {
    return calculateZmPayrollFromGross(totalEarnings);
  }, [totalEarnings]);

  const deductionsWithEffectiveAmounts = useMemo(() => {
    return deductions.map((c) => {
      const rawAmt = Number(c.amount || 0) || 0;
      const key = String(c.component || "").toLowerCase();

      if (rawAmt !== 0) {
        return { ...c, effectiveAmount: rawAmt, label: String(c.component || "") };
      }

      if (key.includes("napsa")) {
        return {
          ...c,
          effectiveAmount: statutoryCalc.statutory.napsaEmployee,
          label: `NAPSA (${statutoryCalc.rates.napsaEmployeeRate}%)`,
        };
      }

      if (key.includes("nhima")) {
        return {
          ...c,
          effectiveAmount: statutoryCalc.statutory.nhima,
          label: `NHIMA (${statutoryCalc.rates.nhimaRate}%)`,
        };
      }

      if (key.includes("income tax") || key.includes("paye") || key.includes("payee")) {
        return {
          ...c,
          effectiveAmount: statutoryCalc.statutory.paye,
          label: "PAYE",
        };
      }

      return { ...c, effectiveAmount: 0, label: String(c.component || "") };
    });
  }, [deductions, statutoryCalc]);

  const totalDeductions = useMemo(() => {
    return deductionsWithEffectiveAmounts.reduce(
      (sum, c: any) => sum + (Number(c.effectiveAmount || 0) || 0),
      0,
    );
  }, [deductionsWithEffectiveAmounts]);

  const netPay = useMemo(() => {
    return totalEarnings - totalDeductions;
  }, [totalEarnings, totalDeductions]);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-main">
              {readOnly ? "View" : formData.id ? "Edit" : "Create"} Salary Structure
            </h3>
            <div className="text-xs text-muted mt-0.5">Define components and calculations</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/10 transition-colors text-muted hover:text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left - Form */}
            <div className="col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Structure Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: toTitleCase(e.target.value) })
                      }
                      placeholder="e.g., Executive Level, Mid-Level Staff"
                      disabled={Boolean(readOnly)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: toTitleCase(e.target.value) })
                      }
                      placeholder="e.g., Izyane"
                      disabled={Boolean(readOnly)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Components */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Salary Components
                  </h4>
                </div>

                <div className="space-y-2">
                  {(formData.components || []).map((component, idx) => (
                    <div
                      key={`${component.component}-${idx}`}
                      className="grid grid-cols-12 gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="col-span-5">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">
                          Component
                        </label>
                        {salaryComponents.length > 0 ? (
                          <select
                            value={component.component}
                            onChange={(e) => {
                              const next = [...(formData.components || [])];
                              next[idx] = { ...next[idx], component: e.target.value };
                              setFormData({ ...formData, components: next });
                            }}
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-700"
                          >
                            <option value="">Select component</option>
                            {salaryComponents.map((c) => (
                              <option key={c.id} value={c.component || c.id}>
                                {c.component || c.id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={component.component}
                            onChange={(e) => {
                              const next = [...(formData.components || [])];
                              next[idx] = { ...next[idx], component: e.target.value };
                              setFormData({ ...formData, components: next });
                            }}
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-700"
                            placeholder="e.g., Basic"
                          />
                        )}
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">
                          Type
                        </label>
                        <select
                          value={String(component.type || "earning").toLowerCase()}
                          onChange={(e) => {
                            const next = [...(formData.components || [])];
                            next[idx] = {
                              ...next[idx],
                              type: e.target.value as any,
                            };
                            setFormData({ ...formData, components: next });
                          }}
                          disabled={Boolean(readOnly)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-700"
                        >
                          <option value="earning">earning</option>
                          <option value="deduction">deduction</option>
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">
                          Amount
                        </label>
                        {(() => {
                          const key = String(component.component || "").toLowerCase();
                          const isDeduction =
                            String(component.type || "").toLowerCase() === "deduction";
                          const isNapsa = isDeduction && key.includes("napsa");
                          const isNhima = isDeduction && key.includes("nhima");
                          const isPaye =
                            isDeduction &&
                            (key.includes("income tax") || key.includes("paye") || key.includes("payee"));
                          const isStatutory = isNapsa || isNhima || isPaye;

                          const computedAmount = isNapsa
                            ? statutoryCalc.statutory.napsaEmployee
                            : isNhima
                              ? statutoryCalc.statutory.nhima
                              : isPaye
                                ? statutoryCalc.statutory.paye
                                : Number(component.amount || 0) || 0;

                          const displayAmount = computedAmount === 0 ? "" : computedAmount;

                          const disabled = Boolean(readOnly) || isStatutory;

                          return (
                            <input
                              type="number"
                              value={displayAmount}
                              onChange={(e) => {
                                if (disabled) return;
                                const next = [...(formData.components || [])];
                                next[idx] = {
                                  ...next[idx],
                                  amount: e.target.value === "" ? 0 : Number(e.target.value || 0),
                                };
                                setFormData({ ...formData, components: next });
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-50"
                              disabled={disabled}
                            />
                          );
                        })()}
                      </div>

                      <div className="col-span-1 flex items-end justify-end">
                      </div>

                      <div className="col-span-12 flex items-center gap-2">
                        <input
                          id={`enabled_${idx}`}
                          type="checkbox"
                          checked={Boolean(component.enabled)}
                          onChange={(e) => {
                            const next = [...(formData.components || [])];
                            next[idx] = {
                              ...next[idx],
                              enabled: e.target.checked ? 1 : 0,
                            };
                            setFormData({ ...formData, components: next });
                          }}
                          disabled={Boolean(readOnly)}
                        />
                        <label
                          htmlFor={`enabled_${idx}`}
                          className="text-xs text-gray-700"
                        >
                          Enabled
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Preview */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  Summary
                </h4>

                <div className="bg-white rounded-lg p-4 text-sm">
                  <div className="text-center pb-3 border-b">
                    <p className="text-xs text-gray-600">Gross Pay</p>
                    <p className="text-xl font-bold text-gray-900">ZMW {totalEarnings.toLocaleString()}</p>
                  </div>

                  <div className="pt-3 border-b pb-3">
                    <div className="text-[11px] font-bold text-gray-700">EARNINGS:</div>
                    <div className="mt-2 space-y-1">
                      {earningsForSummary.map((c, idx) => (
                        <div key={`${c.component}-${idx}`} className="flex items-center justify-between gap-3">
                          <div className="text-xs text-gray-700 truncate">{c.component}</div>
                          <div className="text-xs font-semibold text-gray-900 tabular-nums">
                            {(Number(c.amount || 0) || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      {earningsForSummary.length === 0 && (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3">
                    <div className="text-[11px] font-bold text-gray-700">DEDUCTIONS:</div>
                    <div className="mt-2 space-y-1">
                      {deductionsWithEffectiveAmounts.map((c: any, idx) => {
                        const amt = Number(c.effectiveAmount || 0) || 0;
                        return (
                          <div key={`${c.component}-${idx}`} className="flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-700 truncate">{c.label}</div>
                            <div className="text-xs font-semibold text-gray-900 tabular-nums">
                              {amt.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                      {deductions.length === 0 && (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600">Total earnings</div>
                      <div className="font-semibold text-gray-900 tabular-nums">
                        {totalEarnings.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600">Total deductions</div>
                      <div className="font-semibold text-gray-900 tabular-nums">
                        {totalDeductions.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-gray-700 font-semibold">Net</div>
                      <div className="font-bold text-gray-900 tabular-nums">
                        {netPay.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <button
              onClick={() => {
                const finalComponents = (formData.components || []).map((c) => {
                  const type = String(c?.type ?? "").toLowerCase();
                  const key = String(c?.component ?? "").toLowerCase();
                  const isDeduction = type === "deduction";
                  const isNapsa = isDeduction && key.includes("napsa");
                  const isNhima = isDeduction && key.includes("nhima");
                  const isPaye =
                    isDeduction &&
                    (key.includes("income tax") || key.includes("paye") || key.includes("payee"));

                  if (isNapsa) {
                    return { ...c, amount: statutoryCalc.statutory.napsaEmployee };
                  }
                  if (isNhima) {
                    return { ...c, amount: statutoryCalc.statutory.nhima };
                  }
                  if (isPaye) {
                    return { ...c, amount: statutoryCalc.statutory.paye };
                  }

                  return c;
                });

                onSave({ ...formData, components: finalComponents });
              }}
              disabled={busy}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Structure
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  structure,
  onConfirm,
  onCancel,
}: {
  structure: SalaryStructureListItem;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="text-base font-semibold">Delete Salary Structure</div>
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <strong>"{structure.name}"</strong>?
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              This action cannot be undone. The structure will be permanently
              deleted.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Structure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
