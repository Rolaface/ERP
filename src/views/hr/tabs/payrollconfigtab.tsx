import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Layers, LayoutList } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Table from "../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { showApiError, showSuccess } from "../../../utils/alert";

import {
  getAllSalaryComponents,
  deleteSalaryComponent,
  getAllSalaryStructures,
  deleteSalaryStructure,
  getSalaryStructure,
  type SalaryComponent,
  type SalaryStructure,
} from "../../../api/payrollConfigApi";

import { SalaryComponentModal } from "../../../components/Hr/hrsetupmodals/Salarycomponentmodal";
import { SalaryStructureModal } from "../../../components/Hr/hrsetupmodals/Salarystructuremodal";

// Import the reusable layout from the app shell
import { AppSetupLayout } from "../../../components/ui/app-shell";

// ─────────────────────────────────────────────────────────────────────────────
// Section registry — add future setups here, zero other changes needed
// ─────────────────────────────────────────────────────────────────────────────
interface SetupSection {
  key: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

const SETUP_SECTIONS: SetupSection[] = [
  {
    key: "component",
    label: "Salary Components",
    icon: Layers,
    description: "Earnings & deductions",
  },
  {
    key: "structure",
    label: "Salary Structures",
    icon: LayoutList,
    description: "Component groupings",
  },
  // ── add future sections here ──────────────────────────────────────────────
];

// ─────────────────────────────────────────────────────────────────────────────
// Root tab
// ─────────────────────────────────────────────────────────────────────────────
export default function PayrollConfigTab() {
  const [activeSection, setActiveSection] = useState<string>(
    SETUP_SECTIONS[0].key,
  );

  return (
    <AppSetupLayout
      sections={SETUP_SECTIONS}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === "component" && <SalaryComponentSetup />}
      {activeSection === "structure" && <SalaryStructureSetup />}
    </AppSetupLayout>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// SALARY COMPONENT SETUP
// ─────────────────────────────────────────────────────────────────────────────
function SalaryComponentSetup() {
  const [rows, setRows] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SalaryComponent | null>(null);
  const MODAL_ID = "salary-component-modal";

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSalaryComponents();
      const filtered = search
        ? data.filter(
            (r) =>
              r.salary_component
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
              r.salary_component_abbr
                ?.toLowerCase()
                .includes(search.toLowerCase()),
          )
        : data;
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load salary components");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = useCallback(
    async (row: SalaryComponent) => {
      if (!row.name) return;
      if (!confirm(`Delete "${row.salary_component}"?`)) return;
      try {
        setActionLoadingId(row.name);
        await deleteSalaryComponent(row.name);
        showSuccess("Component deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<SalaryComponent>[] = useMemo(
    () => [
      {
        key: "salary_component_abbr",
        header: "Code",
        render: (row) => (
          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
            {row.salary_component_abbr || "—"}
          </span>
        ),
      },
      {
        key: "salary_component",
        header: "Component Name",
        render: (row) => (
          <span className="font-medium text-main">
            {row.salary_component || "—"}
          </span>
        ),
        tooltip: (row) => row.salary_component,
      },
      {
        key: "type",
        header: "Type",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.type === "Earning"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {row.type || "—"}
          </span>
        ),
      },
      {
        key: "amount_based_on_formula",
        header: "Basis",
        render: (row) => (
          <span className="text-sm text-main">
            {row.amount_based_on_formula ? "Formula" : "Fixed"}
          </span>
        ),
      },
      {
        key: "formula",
        header: "Formula / Amount",
        render: (row) =>
          row.amount_based_on_formula ? (
            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
              {row.formula || "—"}
            </code>
          ) : (
            <span className="text-sm text-main">
              {row.amount != null ? row.amount : "—"}
            </span>
          ),
        tooltip: (row) => row.formula ?? String(row.amount ?? ""),
      },
      {
        key: "depends_on_payment_days",
        header: "Pay Days",
        render: (row) => (
          <span
            className={`text-xs font-semibold ${
              row.depends_on_payment_days ? "text-blue-600" : "text-gray-400"
            }`}
          >
            {row.depends_on_payment_days ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row) => (
          <ActionGroup>
            <ActionButton
              type="edit"
              iconOnly
              onClick={() => {
                setEditTarget(row);
                setModalOpen(true);
              }}
              disabled={actionLoadingId === row.name}
            />
            <ActionMenu
              customActions={[
                {
                  label: "Delete",
                  onClick: () => handleDelete(row),
                  disabled: actionLoadingId === row.name,
                },
              ]}
            />
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleDelete],
  );

  return (
    <>
      <Table
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(row) => row.name ?? row.salary_component}
        showToolbar
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Component"
        onAdd={() => {
          setEditTarget(null);
          setModalOpen(true);
        }}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50]}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        enableColumnSelector
        tableId="salary-components"
      />

      <SalaryComponentModal
        modalId={MODAL_ID}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editTarget}
        onSuccess={fetchAll}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY STRUCTURE SETUP
// ─────────────────────────────────────────────────────────────────────────────
function SalaryStructureSetup() {
  const [rows, setRows] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [allComponents, setAllComponents] = useState<SalaryComponent[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SalaryStructure | null>(null);
  const MODAL_ID = "salary-structure-modal";

  const earningComponents = useMemo(
    () =>
      allComponents
        .filter((c) => c.type === "Earning")
        .map((c) => c.salary_component),
    [allComponents],
  );
  const deductionComponents = useMemo(
    () =>
      allComponents
        .filter((c) => c.type === "Deduction")
        .map((c) => c.salary_component),
    [allComponents],
  );

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [structures, components] = await Promise.all([
        getAllSalaryStructures(),
        getAllSalaryComponents(),
      ]);
      setAllComponents(components);

      const filtered = search
        ? structures.filter((r) =>
            r.name?.toLowerCase().includes(search.toLowerCase()),
          )
        : structures;
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load salary structures");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleEdit = useCallback(async (row: SalaryStructure) => {
    try {
      const detail = await getSalaryStructure(row.name!);
      setEditTarget(detail);
      setModalOpen(true);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load structure details");
    }
  }, []);

  const handleDelete = useCallback(
    async (row: SalaryStructure) => {
      if (!row.name) return;
      if (!confirm(`Delete "${row.name}"?`)) return;
      try {
        setActionLoadingId(row.name);
        await deleteSalaryStructure(row.name);
        showSuccess("Structure deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<SalaryStructure>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Structure Name",
        render: (row) => (
          <span className="font-medium text-main">{row.name || "—"}</span>
        ),
        tooltip: (row) => row.name ?? "",
      },
      {
        key: "is_active",
        header: "Status",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.is_active === "Yes"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {row.is_active === "Yes" ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "docstatus",
        header: "Doc Status",
        render: (row) => {
          const labels: Record<number, string> = {
            0: "Draft",
            1: "Submitted",
            2: "Cancelled",
          };
          const colors: Record<number, string> = {
            0: "text-amber-600",
            1: "text-blue-600",
            2: "text-red-500",
          };
          const status = row.docstatus ?? 0;
          return (
            <span className={`text-xs font-semibold ${colors[status]}`}>
              {labels[status] ?? "—"}
            </span>
          );
        },
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className="text-sm text-sub line-clamp-1">
            {row.description || "—"}
          </span>
        ),
        tooltip: (row) => row.description ?? "",
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row) => (
          <ActionGroup>
            <ActionButton
              type="edit"
              iconOnly
              onClick={() => handleEdit(row)}
              disabled={actionLoadingId === row.name}
            />
            <ActionMenu
              customActions={[
                {
                  label: "Delete",
                  onClick: () => handleDelete(row),
                  disabled: actionLoadingId === row.name,
                },
              ]}
            />
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleEdit, handleDelete],
  );

  return (
    <>
      <Table
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(row) => row.name ?? ""}
        showToolbar
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Structure"
        onAdd={() => {
          setEditTarget(null);
          setModalOpen(true);
        }}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50]}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        enableColumnSelector
        tableId="salary-structures"
      />

      <SalaryStructureModal
        modalId={MODAL_ID}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editTarget}
        earningComponents={earningComponents}
        deductionComponents={deductionComponents}
        onSuccess={fetchAll}
      />
    </>
  );
}