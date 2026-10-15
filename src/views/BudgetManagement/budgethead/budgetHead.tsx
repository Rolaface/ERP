import React, { useMemo, useState } from "react";
import { Power, PowerOff } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import PermissionGate from "../../PermissionGate";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showApiError, showSuccess } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";

import BudgetHeadModal, {
  type BudgetHeadDetail,
  type BudgetHeadStatus,
  type ControlLevel,
} from "../budgethead/budgetHeadModal";

// ─── Types / constants ────────────────────────────────────────────────────────

interface BudgetHeadSummary extends BudgetHeadDetail {
  usageCount: number; // number of budget plans using this head
  updatedAt: string;
}

const BUDGET_MODULE = "Budget Head";

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const STATUS_STYLE: Record<BudgetHeadStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
};

const CONTROL_STYLE: Record<ControlLevel, string> = {
  Free: "bg-gray-100 text-gray-700",
  Capped: "bg-amber-50 text-amber-700",
  Fixed: "bg-blue-50 text-blue-700",
};

// Dummy data. Everything on this screen works on local state only.
const SEED_HEADS: BudgetHeadSummary[] = [
  { id: "BH-1001", headName: "Office Rent", parentHead: "Operating Expenses", headType: "Operating", glCode: "5101001", controlLevel: "Fixed", defaultCap: "", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", projectCode: "", attachmentRequired: false, instructions: "Amount comes from the lease register.", status: "Active", usageCount: 3, updatedAt: "2026-10-12" },
];

const formatDate = (date: string) => {
  if (!date) return "—";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [y, m, d] = date.split(/[T ]/)[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${months[m - 1]}-${y}`;
};

const today = () => new Date().toISOString().slice(0, 10);

// ─── Component ────────────────────────────────────────────────────────────────

const BudgetHeadTable: React.FC = () => {
  const { can } = usePermission();

  const [heads, setHeads] = useState<BudgetHeadSummary[]>(SEED_HEADS);

  const [filters, setFilters] = useState<{ status?: string[] }>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal: open + the head being edited (null = create)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHead, setModalHead] = useState<BudgetHeadDetail | null>(null);

  // ── Search, filter and sort (all in the browser) ──
  const processed = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const statuses = filters.status ?? [];
    const rows = heads.filter(
      (h) =>
        (statuses.length === 0 || statuses.includes(h.status)) &&
        (!q ||
          [h.headName, h.parentHead, h.glCode, h.headType, h.controlLevel, h.costCentre, h.programme, h.projectCode].some((v) =>
            (v ?? "").toLowerCase().includes(q),
          )),
    );
    const dir = sortOrder === "asc" ? 1 : -1;
    return [...rows].sort((a: any, b: any) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [heads, searchTerm, filters, sortBy, sortOrder]);

  const totalItems = processed.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSortChange = ({ sortBy: key, sortOrder: order }: { sortBy: string; sortOrder: "asc" | "desc" }) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  // ── Modal ──
  const handleAdd = () => {
    setModalHead(null);
    setModalOpen(true);
  };

  const handleEdit = (h: BudgetHeadSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setModalHead(h);
    setModalOpen(true);
  };

  /** Returns an error message to show in the form, or nothing when saved. */
  const handleSubmit = (data: BudgetHeadDetail): string | void => {
    const duplicate = heads.some(
      (h) =>
        h.id !== data.id &&
        h.headName.trim().toLowerCase() === data.headName.trim().toLowerCase() &&
        h.glCode.trim() === data.glCode.trim(),
    );
    if (duplicate) return "A budget head with this name and GL code already exists.";

    if (data.id) {
      setHeads((prev) => prev.map((h) => (h.id === data.id ? { ...h, ...data, updatedAt: today() } : h)));
      showSuccess("Budget head updated");
    } else {
      const created: BudgetHeadSummary = { ...data, id: `BH-${Date.now()}`, usageCount: 0, updatedAt: today() };
      setHeads((prev) => [created, ...prev]);
      showSuccess("Budget head created");
    }
    setPage(1);
  };

  // ── Status / delete ──
  const handleToggleStatus = async (h: BudgetHeadSummary) => {
    const next: BudgetHeadStatus = h.status === "Active" ? "Inactive" : "Active";
    if (next === "Inactive") {
      const result = await fireManagedSwal({
        icon: "warning",
        title: "Deactivate budget head?",
        text: `${h.headName} won't be available for new budget plans. Existing plans keep it.`,
        showCancelButton: true,
        confirmButtonColor: "#ef0000",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, deactivate",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;
    }
    setHeads((prev) => prev.map((x) => (x.id === h.id ? { ...x, status: next, updatedAt: today() } : x)));
    showSuccess(`Budget head ${next === "Active" ? "activated" : "deactivated"}`);
  };

  const handleDelete = async (h: BudgetHeadSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete budget head ${h.headName}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setHeads((prev) => prev.filter((x) => x.id !== h.id));
    showSuccess("Budget head deleted");
  };

  // ── Export (everything matching the current search and filters) ──
  const handleExportExcel = () => {
    if (!processed.length) {
      showApiError("No budget heads to export");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(
      processed.map((h) => ({
        "Budget Head": h.headName,
        "Parent Head": h.parentHead,
        Type: h.headType,
        "GL Code": h.glCode,
        Control: h.controlLevel,
        "Default Cap": h.controlLevel === "Capped" ? h.defaultCap : "",
        "Default Cost Centre": h.costCentre,
        Programme: h.programme,
        "Project Code": h.projectCode,
        "Documents Required": h.attachmentRequired ? "Yes" : "No",
        Status: h.status,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Budget Heads");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Budget_Heads.xlsx",
    );
    showSuccess("Budget heads exported successfully");
  };

  // ── Columns ──
  const columns: Column<BudgetHeadSummary>[] = useMemo(
    () => [
      {
        key: "headName",
        header: "Budget Head",
        align: "left",
        sortable: true,
        render: (h) => (
          <div className="py-1.5">
            <span className="block font-medium">{h.headName}</span>
            {h.parentHead && <span className="block text-xs text-muted">Under {h.parentHead}</span>}
          </div>
        ),
        tooltip: (h) => `Budget Head: ${h.headName}`,
      },
      {
        key: "headType",
        header: "Type",
        align: "left",
        sortable: true,
        render: (h) => <div className="py-1.5">{h.headType}</div>,
      },
      {
        key: "glCode",
        header: "GL Code",
        align: "left",
        sortable: true,
        render: (h) => <div className="py-1.5 whitespace-nowrap">{h.glCode}</div>,
      },
      {
        key: "controlLevel",
        header: "Control",
        align: "left",
        sortable: true,
        render: (h) => (
          <div className="py-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs ${CONTROL_STYLE[h.controlLevel]}`}>{h.controlLevel}</span>
            {h.controlLevel === "Capped" && h.defaultCap && (
              <span className="ml-1.5 text-xs text-muted">up to {Number(h.defaultCap).toLocaleString()}</span>
            )}
          </div>
        ),
      },
      {
        key: "costCentre",
        header: "Default Cost Centre",
        align: "left",
        sortable: true,
        render: (h) => <div className="py-1.5">{h.costCentre || "—"}</div>,
      },
      {
        key: "programme",
        header: "Programme / Project",
        align: "left",
        sortable: true,
        render: (h) =>
          h.programme || h.projectCode ? (
            <div className="py-1.5">
              <span className="block">{h.programme || "—"}</span>
              {h.projectCode && <span className="block text-xs text-muted">{h.projectCode}</span>}
            </div>
          ) : (
            <div className="py-1.5">—</div>
          ),
      },
      {
        key: "usageCount",
        header: "Used in plans",
        align: "center",
        sortable: true,
        render: (h) => <div className="py-1.5">{h.usageCount}</div>,
      },
      {
        key: "updatedAt",
        header: "Last updated",
        align: "center",
        sortable: true,
        render: (h) => <div className="py-1.5">{formatDate(h.updatedAt)}</div>,
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (h) => (
          <div className="flex items-center justify-center py-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[h.status]}`}>{h.status}</span>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (h) => {
          const canDelete = can(BUDGET_MODULE, "delete") && h.usageCount === 0;
          const customActions = can(BUDGET_MODULE, "write")
            ? [
                {
                  label: h.status === "Active" ? "Deactivate" : "Activate",
                  icon: h.status === "Active" ? <PowerOff size={14} /> : <Power size={14} />,
                  danger: h.status === "Active",
                  onClick: () => handleToggleStatus(h),
                },
              ]
            : [];
          const isMenuEmpty = customActions.length === 0 && !canDelete;
          return (
            <div className="flex items-center justify-center gap-2">
              <PermissionGate module={BUDGET_MODULE} action="write">
                <ActionButton type="edit" onClick={(e) => handleEdit(h, e)} iconOnly title="Edit budget head" />
              </PermissionGate>
              <div className={isMenuEmpty ? "pointer-events-none opacity-40" : ""}>
                <ActionMenu
                  {...(canDelete ? { onDelete: (e: React.MouseEvent) => handleDelete(h, e) } : {})}
                  customActions={customActions}
                />
              </div>
            </div>
          );
        },
      },
    ],
    [can],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={pageRows}
        rowKey={(row) => row.id}
        tableId="budget-heads"
        loading={false}
        isFetching={false}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(BUDGET_MODULE, "create")}
        addLabel="Add Budget Head"
        onAdd={handleAdd}
        enableColumnSelector
        enableExport={can(BUDGET_MODULE, "export")}
        onExport={handleExportExcel}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 35, 45, 55, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowDoubleClick={(h) => can(BUDGET_MODULE, "write") && handleEdit(h)}
        multiSelectFilters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            values: filters.status ?? [],
            onChange: (vals) => {
              setFilters((prev) => ({ ...prev, status: vals.length > 0 ? vals : undefined }));
              setPage(1);
            },
          },
        ]}
      />

      <BudgetHeadModal
        open={modalOpen}
        initial={modalHead}
        onClose={() => {
          setModalOpen(false);
          setModalHead(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default BudgetHeadTable;