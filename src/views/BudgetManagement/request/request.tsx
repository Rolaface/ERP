import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import PermissionGate from "../../PermissionGate";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showApiError, showSuccess } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";

import BudgetRequestModal, {
  formatINR,
  sumPrevious,
  sumRequested,
  type BudgetRequestDetail,
  type SubmitAction,
} from "../request/addrequest";

// ─── Types / constants ────────────────────────────────────────────────────────

interface BudgetRequestSummary extends BudgetRequestDetail {
  id: string;
  updatedAt: string;
}

const REQUEST_MODULE = "Budget Request";
const EDITABLE_STATUSES = ["Inputs Pending", "Draft"];

const statusOptions = [
  { label: "Inputs Pending", value: "Inputs Pending" },
  { label: "Draft", value: "Draft" },
  { label: "Submitted", value: "Submitted" },
];


const SEED_REQUESTS: BudgetRequestSummary[] = [
  {
    id: "REQ-1001",
    budgetId: "BUD-2027-001",
    planName: "Annual Budget FY 2027-28",
    branch: "Meerut Branch",
    financialYear: "2027-2028",
    lines: [
      { id: "BH-1001", headName: "Office Rent", previousActual: 450000, requested: "500000" },
      { id: "BH-1002", headName: "Electricity", previousActual: 90000, requested: "100000" },
      { id: "BH-1003", headName: "IT Equipment", previousActual: 100000, requested: "200000" },
      { id: "BH-1004", headName: "Staff Training", previousActual: 40000, requested: "60000" },
      { id: "BH-1005", headName: "Travel Expenses", previousActual: 70000, requested: "80000" },
    ],
    justification: "Rent revision and new IT equipment for the branch.",
    attachments: [],
    status: "Draft",
    updatedAt: "2026-10-12",
  },
];

const formatDate = (date: string) => {
  if (!date) return "—";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [y, m, d] = date.split(/[T ]/)[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${months[m - 1]}-${y}`;
};

const today = () => new Date().toISOString().slice(0, 10);

// ─── Component ────────────────────────────────────────────────────────────────

const BudgetRequestTable: React.FC = () => {
  const { can } = usePermission();

  const [requests, setRequests] = useState<BudgetRequestSummary[]>(SEED_REQUESTS);

  const [filters, setFilters] = useState<{ status?: string[] }>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal: open + the request being edited (null = create)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRequest, setModalRequest] = useState<BudgetRequestDetail | null>(null);

  // ── Search, filter and sort (all in the browser) ──
  const processed = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const statuses = filters.status ?? [];
    const rows = requests
      .map((r) => ({ ...r, totalPrevious: sumPrevious(r.lines), totalRequested: sumRequested(r.lines) }))
      .filter(
        (r) =>
          (statuses.length === 0 || statuses.includes(r.status)) &&
          (!q || [r.id, r.budgetId, r.planName, r.branch, r.financialYear].some((v) => (v ?? "").toLowerCase().includes(q))),
      );
    const dir = sortOrder === "asc" ? 1 : -1;
    return [...rows].sort((a: any, b: any) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [requests, searchTerm, filters, sortBy, sortOrder]);

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
    setModalRequest(null);
    setModalOpen(true);
  };

  const handleOpen = (r: BudgetRequestSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setModalRequest(r);
    setModalOpen(true);
  };

  /** Returns an error message to show in the form, or nothing when saved. */
  const handleSubmit = (data: BudgetRequestDetail, action: SubmitAction): string | void => {
    const duplicate = requests.some((r) => r.id !== data.id && r.budgetId === data.budgetId && r.branch === data.branch);
    if (duplicate) return "A request for this budget plan and branch already exists.";

    if (data.id) {
      setRequests((prev) => prev.map((r) => (r.id === data.id ? { ...r, ...data, id: r.id, updatedAt: today() } : r)));
    } else {
      const created: BudgetRequestSummary = { ...data, id: `REQ-${Date.now()}`, updatedAt: today() };
      setRequests((prev) => [created, ...prev]);
    }
    showSuccess(action === "submit" ? "Budget requirements submitted to Zonal Manager" : "Draft saved");
    setPage(1);
  };

  // ── Delete ──
  const handleDelete = async (r: BudgetRequestSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete budget request ${r.id}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
    showSuccess("Budget request deleted");
  };

  // ── Export (everything matching the current search and filters) ──
  const handleExportExcel = () => {
    if (!processed.length) {
      showApiError("No budget requests to export");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(
      processed.map((r) => ({
        "Request ID": r.id,
        "Budget ID": r.budgetId,
        "Budget Plan": r.planName,
        Branch: r.branch,
        "Financial Year": r.financialYear,
        "Previous Actual": r.totalPrevious,
        "Requested Amount": r.totalRequested,
        Variance: r.totalRequested - r.totalPrevious,
        Status: r.status,
        "Last Updated": formatDate(r.updatedAt),
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Budget Requests");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Budget_Requests.xlsx",
    );
    showSuccess("Budget requests exported successfully");
  };

  // ── Columns ──
  const columns: Column<(typeof processed)[number]>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Request ID",
        align: "left",
        sortable: true,
        render: (r) => <div className="py-1.5">{r.id}</div>,
        tooltip: (r) => `Request: ${r.id}`,
      },
      {
        key: "planName",
        header: "Budget Plan",
        align: "left",
        sortable: true,
        render: (r) => (
          <div className="py-1.5">
            <span className="block font-medium">{r.planName}</span>
            <span className="block text-xs text-muted">{r.budgetId}</span>
          </div>
        ),
      },
      {
        key: "branch",
        header: "Branch",
        align: "left",
        sortable: true,
        render: (r) => <div className="py-1.5">{r.branch || "—"}</div>,
      },
      {
        key: "financialYear",
        header: "Financial Year",
        align: "center",
        sortable: true,
        render: (r) => <div className="py-1.5">{r.financialYear}</div>,
      },
      {
        key: "totalPrevious",
        header: "Previous Actual",
        align: "center",
        sortable: true,
        render: (r) => <div className="py-1.5 whitespace-nowrap">{formatINR(r.totalPrevious)}</div>,
      },
      {
        key: "totalRequested",
        header: "Requested",
        align: "center",
        sortable: true,
        render: (r) => <div className="py-1.5 whitespace-nowrap font-medium">{formatINR(r.totalRequested)}</div>,
      },
      {
        key: "variance",
        header: "Variance",
        align: "center",
        render: (r) => {
          const v = r.totalRequested - r.totalPrevious;
          return (
            <div className={`py-1.5 whitespace-nowrap ${v > 0 ? "text-danger" : ""}`}>
              {v > 0 ? "+" : ""}
              {formatINR(v)}
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (r) => (
          <div className="flex items-center justify-center py-1.5">
            <StatusBadge status={r.status as any} />
          </div>
        ),
      },
      {
        key: "updatedAt",
        header: "Last updated",
        align: "center",
        sortable: true,
        render: (r) => <div className="py-1.5">{formatDate(r.updatedAt)}</div>,
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (r) => {
          const isEditable = EDITABLE_STATUSES.includes(r.status);
          const canDelete = can(REQUEST_MODULE, "delete") && r.status === "Draft";
          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton type="view" onClick={(e) => handleOpen(r, e)} iconOnly />
              <PermissionGate module={REQUEST_MODULE} action="write">
                <ActionButton
                  type="edit"
                  onClick={(e) => handleOpen(r, e)}
                  iconOnly
                  disabled={!isEditable}
                  title={isEditable ? "Edit request" : "Only Inputs Pending / Draft requests can be edited"}
                />
              </PermissionGate>
              <div className={!canDelete ? "pointer-events-none opacity-40" : ""}>
                <ActionMenu
                  showDownload={false}
                  {...(canDelete ? { onDelete: (e: React.MouseEvent) => handleDelete(r, e) } : {})}
                  customActions={[]}
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
        tableId="budget-requests"
        loading={false}
        isFetching={false}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(REQUEST_MODULE, "create")}
        addLabel="Add Request"
        onAdd={handleAdd}
        enableColumnSelector
        enableExport={can(REQUEST_MODULE, "export")}
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
        onRowDoubleClick={(r) => handleOpen(r)}
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

      <BudgetRequestModal
        open={modalOpen}
        initial={modalRequest}
        onClose={() => {
          setModalOpen(false);
          setModalRequest(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default BudgetRequestTable;