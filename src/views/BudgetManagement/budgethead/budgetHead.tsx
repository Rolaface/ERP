import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Power, PowerOff } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import PermissionGate from "../../PermissionGate";
import { usePermission } from "../../../hooks/permission/usePermission";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";

import BudgetHeadModal, { type BudgetHeadDetail, type BudgetHeadStatus } from "../budgethead/budgetHeadModal";

// ─── Types / constants ────────────────────────────────────────────────────────

interface BudgetHeadSummary extends BudgetHeadDetail {
  usageCount: number; // number of budget plans using this head
  updatedAt: string;
}

const BUDGET_MODULE = "Budget Head";

const SORT_FIELD_MAP: Record<string, string> = {
  headName: "head_name",
  glCode: "gl_code",
  costCentre: "cost_centre",
  programme: "programme",
  updatedAt: "modified",
};
const mapSortField = (f: string) => SORT_FIELD_MAP[f] ?? f;

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const STATUS_STYLE: Record<BudgetHeadStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
};

const mapRow = (h: any): BudgetHeadSummary => ({
  id: h.id,
  headName: h.head_name ?? h.headName ?? "",
  subHead: h.sub_head ?? h.subHead ?? "",
  glCode: h.gl_code ?? h.glCode ?? "",
  costCentre: h.cost_centre ?? h.costCentre ?? "",
  programme: h.programme ?? "",
  projectCode: h.project_code ?? h.projectCode ?? "",
  instructions: h.instructions ?? "",
  status: h.status === "Inactive" ? "Inactive" : "Active",
  usageCount: Number(h.usage_count ?? h.usageCount ?? 0),
  updatedAt: h.modified ?? h.updatedAt ?? "",
});

const formatDate = (date: string) => {
  if (!date) return "—";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [y, m, d] = date.split(/[T ]/)[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${months[m - 1]}-${y}`;
};

const isOk = (res: any) => (res?.message?.status_code ?? res?.status_code) === 200;

// ─── Component ────────────────────────────────────────────────────────────────

const BudgetHeadTable: React.FC = () => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  const [heads, setHeads] = useState<BudgetHeadSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [filters, setFilters] = useState<{ status?: string[] }>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("modified");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal: open + the head being edited (null = create)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHead, setModalHead] = useState<BudgetHeadDetail | null>(null);

  useEffect(() => setPage(1), [searchTerm]);
  useEffect(() => setPage(1), [filters]);

  const statusParam = filters.status && filters.status.length > 0 ? filters.status.join(",") : undefined;

  const fetchHeads = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);
    try {
      const res = await getAllBudgetHeads(page, pageSize, mapSortField(sortBy), sortOrder, searchTerm, statusParam);
      if (!res || res.status_code !== 200) {
        showApiError(res || "Failed to fetch budget heads");
        setHeads([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }
      if (!mountedRef.current) return;
      const mapped = res.data.map(mapRow);
      setHeads(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || mapped.length);
    } catch (err) {
      showApiError(err);
      setHeads([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, sortBy, sortOrder, searchTerm, statusParam]);

  useEffect(() => {
    mountedRef.current = true;
    fetchHeads();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchHeads();
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);

  const handleSortChange = ({ sortBy: key, sortOrder: order }: { sortBy: string; sortOrder: "asc" | "desc" }) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  // ── Modal open helpers ──
  const handleAdd = () => {
    setModalHead(null);
    setModalOpen(true);
  };

  const handleEdit = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Loading budget head...");
      const res = await getBudgetHeadById(id);
      closeSwal();
      if (!isOk(res)) {
        showApiError("Failed to load budget head");
        return;
      }
      setModalHead(mapRow(res.message?.data ?? res.data));
      setModalOpen(true);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
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
    try {
      showLoading("Updating status...");
      const res = await updateBudgetHeadStatus(h.id, next);
      closeSwal();
      if (!isOk(res)) {
        showApiError(res?.message?.message || "Failed to update status");
        return;
      }
      setHeads((prev) => prev.map((x) => (x.id === h.id ? { ...x, status: next } : x)));
      showSuccess(`Budget head ${next === "Active" ? "activated" : "deactivated"}`);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
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
    try {
      showLoading("Deleting budget head...");
      const res = await deleteBudgetHeadById(h.id);
      closeSwal();
      if (!isOk(res)) {
        showApiError(res?.message?.message || "Failed to delete budget head");
        return;
      }
      setHeads((prev) => prev.filter((x) => x.id !== h.id));
      showSuccess("Budget head deleted");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  // ── Export (all pages for current filters) ──
  const handleExportExcel = async () => {
    try {
      showLoading("Exporting budget heads...");
      let all: BudgetHeadSummary[] = [];
      let current = 1;
      let total = 1;
      do {
        const res = await getAllBudgetHeads(current, 100, mapSortField(sortBy), sortOrder, searchTerm, statusParam);
        if (res?.status_code === 200) {
          all = [...all, ...res.data.map(mapRow)];
          total = res.pagination?.total_pages || 1;
        }
        current++;
      } while (current <= total);

      if (!all.length) {
        closeSwal();
        showApiError("No budget heads to export");
        return;
      }
      const sheet = XLSX.utils.json_to_sheet(
        all.map((h) => ({
          "Budget Head": h.headName,
          "Sub-head": h.subHead,
          "GL Code": h.glCode,
          "Cost Centre": h.costCentre,
          Programme: h.programme,
          "Project Code": h.projectCode,
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
      closeSwal();
      showSuccess("Budget heads exported successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
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
            {h.subHead && <span className="block text-xs text-muted">{h.subHead}</span>}
          </div>
        ),
        tooltip: (h) => `Budget Head: ${h.headName}`,
      },
      {
        key: "glCode",
        header: "GL Code",
        align: "left",
        sortable: true,
        render: (h) => <div className="py-1.5 whitespace-nowrap">{h.glCode}</div>,
      },
      {
        key: "costCentre",
        header: "Cost Centre",
        align: "left",
        sortable: true,
        render: (h) => <div className="py-1.5">{h.costCentre}</div>,
      },
      {
        key: "programme",
        header: "Programme / Project",
        align: "left",
        sortable: true,
        render: (h) => (
          <div className="py-1.5">
            <span className="block">{h.programme}</span>
            {h.projectCode && <span className="block text-xs text-muted">{h.projectCode}</span>}
          </div>
        ),
      },
      {
        key: "usageCount",
        header: "Used in plans",
        align: "center",
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
                <ActionButton type="edit" onClick={(e) => handleEdit(h.id, e)} iconOnly title="Edit budget head" />
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
    [can, handleEdit, handleDelete, handleToggleStatus],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={heads}
        rowKey={(row) => row.id}
        tableId="budget-heads"
        loading={isInitialLoad}
        isFetching={isFetching}
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
        currentPage={page}
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
        onRowDoubleClick={(h) => can(BUDGET_MODULE, "write") && handleEdit(h.id)}
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
        onSaved={fetchHeads}
      />
    </div>
  );
};

export default BudgetHeadTable;