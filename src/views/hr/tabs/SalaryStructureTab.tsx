import { useEffect, useMemo, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  createSalaryComponent,
  getSalaryComponents,
  getSalaryStructures,
  updateSalaryComponent,
  type SalaryStructureListItem,
  type SalaryComponentListItem,
} from "../../../api/salaryStructureApi";

export default function SalaryStructureTab() {
  const [structures, setStructures] = useState<SalaryStructureListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const filteredStructures = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = Array.isArray(structures) ? structures : [];
    if (!q) return items;
    return items.filter((s) => {
      return (
        String(s.name || "")
          .toLowerCase()
          .includes(q) ||
        String(s.company || "")
          .toLowerCase()
          .includes(q)
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
  }, []);

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
              setShowComponentsModal(true);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Components
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
                  {["Structure", "Company", "Status"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                        h === "" ? "text-right" : "text-left"
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
                    <tr
                      key={`sk-${skIdx}`}
                      className={skIdx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}
                    >
                      <td className="px-4 py-3">
                        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : pagedStructures.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-sm text-gray-600"
                    >
                      No salary structures found
                    </td>
                  </tr>
                ) : (
                  pagedStructures.map((structure, idx) => {
                    const key = String(structure.name || structure.id);

                    return (
                      <tr
                        key={key}
                        className={`border-b border-gray-200 last:border-0 ${
                          idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"
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
                            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                              structure.is_active
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-muted/20 text-muted border-theme"
                            }`}
                          >
                            {structure.is_active ? "Active" : "Inactive"}
                          </span>
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

      {showComponentsModal && (
        <SalaryComponentsModal
          onClose={() => setShowComponentsModal(false)}
          onChanged={() => {}}
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
        String(c.component || "")
          .toLowerCase()
          .includes(q) ||
        String(c.abbr || "")
          .toLowerCase()
          .includes(q) ||
        String(c.type || "")
          .toLowerCase()
          .includes(q)
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
        const payload: any = {
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
        const payload: any = {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl w-full max-w-5xl overflow-hidden shadow-xl">
        <div className="p-6 flex items-start justify-between border-b">
          <div>
            <h3 className="text-lg font-bold text-main">Salary Components</h3>
            <p className="text-sm text-muted">Manage salary components</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/10 transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-muted">{filtered.length} components</div>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components"
              className="w-full md:w-80 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button
              onClick={startCreate}
              className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Component
            </button>
          </div>
        </div>

        {error && <div className="px-4 pb-2 text-sm text-red-600">{error}</div>}

        <div className="px-4 pb-4">
          <div className="overflow-auto border border-gray-200 rounded-xl">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Component", "Abbr", "Type", "Taxable", "Enabled"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap text-left"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, skIdx) => (
                    <tr
                      key={`sk-${skIdx}`}
                      className={skIdx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}
                    >
                      <td className="px-4 py-3">
                        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-600"
                    >
                      No salary components found
                    </td>
                  </tr>
                ) : (
                  paged.map((c, idx) => (
                    <tr
                      key={String(c.id || c.component || idx)}
                      className={`border-b border-gray-200 last:border-0 ${
                        idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-xs font-extrabold text-gray-900">
                          {c.component || "—"}
                        </div>
                        {c.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {c.abbr || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {String(c.type || "—")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            c.tax_applicable ? "text-primary" : "text-muted"
                          }`}
                        >
                          {c.tax_applicable ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            c.enabled ? "text-green-600" : "text-muted"
                          }`}
                        >
                          {c.enabled ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t border-theme flex items-center justify-end gap-2 bg-app">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-bold border border-theme bg-card text-main rounded-lg hover:bg-muted/5 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            className="px-3 py-1.5 text-xs font-bold border border-theme bg-card text-main rounded-lg hover:bg-muted/5 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {editing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
              <div className="px-6 py-4 flex items-center justify-between text-main">
                <div className="min-w-0">
                  <h3 className="text-base font-bold">
                    {editing?.id ? "Edit" : "Create"} Component
                  </h3>
                  <div className="text-xs text-muted mt-0.5">
                    Fill in the component details
                  </div>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="p-1 rounded hover:bg-muted/5 transition-colors text-muted hover:text-main"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Name *
                    </label>
                    <input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">
                        Type *
                      </label>
                      <select
                        value={editing.type}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            type: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="Earning">Earning</option>
                        <option value="Deduction">Deduction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">
                        Abbr *
                      </label>
                      <input
                        value={editing.abbr}
                        onChange={(e) =>
                          setEditing({ ...editing, abbr: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Description
                    </label>
                    <input
                      value={editing.description}
                      onChange={(e) =>
                        setEditing({ ...editing, description: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-main">
                      <input
                        type="checkbox"
                        checked={editing.enabled}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            enabled: e.target.checked,
                          })
                        }
                      />
                      Enabled
                    </label>

                    <label className="flex items-center gap-2 text-sm text-main">
                      <input
                        type="checkbox"
                        checked={editing.tax_applicable}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            tax_applicable: e.target.checked,
                          })
                        }
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
      </div>
    </div>
  );
}
