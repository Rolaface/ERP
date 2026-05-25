import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Table from "../../../components/ui/Table/Table";
import ActionButton, { ActionMenu } from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import { useDataRefreshStore ,REFRESH_KEYS } from "../../../store/dataRefreshStore";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";
import { usePermission } from "../../../hooks/permission/usePermission";
import PermissionGate from "../../PermissionGate";
import type { CycleItem } from "../../../api/Appraisalapi/performanceCycleApi";
import { openAppraisalModal } from "../../../store/modalStore";

const APPRAISAL_MODULE = "Appraisal";

interface AppraisalTableProps {
  onAddAppraisal?: () => void;
}

const AppraisalTable: React.FC<AppraisalTableProps> = ({ onAddAppraisal }) => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [cycles, setCycles]           = useState<CycleItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching]   = useState(false);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search / sort ─────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy]         = useState("cycle_name");
  const [sortOrder, setSortOrder]   = useState<"asc" | "desc">("desc");

  useEffect(() => { setPage(1); }, [searchTerm]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  // const fetchCycles = useCallback(async () => {
  //   if (!mountedRef.current) return;
  //   setIsFetching(true);
  //   try {
  //     const res = await getCycleList({ page, pageSize, search: searchTerm });
  //     if (!mountedRef.current) return;
  //     setCycles(res.data);
  //     setTotalPages(res.pagination?.page_count ?? 1);
  //     setTotalItems(res.pagination?.total ?? res.data.length);
  //   } catch (err) {
  //     showApiError(err);
  //     setCycles([]);
  //     setTotalPages(1);
  //     setTotalItems(0);
  //   } finally {
  //     if (mountedRef.current) {
  //       setIsFetching(false);
  //       setIsInitialLoad(false);
  //     }
  //   }
  // }, [page, pageSize, searchTerm]);

  const handleSortChange = ({
    sortBy: col,
    sortOrder: order,
  }: { sortBy: string; sortOrder: "asc" | "desc" }) => {
    setSortBy(col);
    setSortOrder(order);
    setPage(1);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  // const handleDelete = async (name: string, e?: React.MouseEvent) => {
  //   e?.stopPropagation();

  //   const result = await fireManagedSwal({
  //     icon: "warning",
  //     title: "Are you sure?",
  //     text: `Delete appraisal cycle "${name}"?`,
  //     showCancelButton: true,
  //     confirmButtonColor: "#ef4444",
  //     cancelButtonColor: "#6b7280",
  //     confirmButtonText: "Yes, delete",
  //     reverseButtons: true,
  //   });

  //   if (!result.isConfirmed) return;

  //   try {
  //     showLoading("Deleting cycle...");
  //     await deleteCycle(name);
  //     closeSwal();
  //     setCycles((prev) => prev.filter((c) => c.name !== name));
  //     showSuccess("Appraisal cycle deleted successfully");
  //   } catch (err) {
  //     closeSwal();
  //     showApiError(err);
  //   }
  // };

  // ── Edit: open modal with existing data ───────────────────────────────────
  // NOTE: GET by ID is not wired yet — we pass the row data we already have
  const handleEdit = async (cycle: CycleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Open the Appraisal modal in edit mode with available data
    // Full GET will be wired later
    openAppraisalModal(cycle, true);
  };

  // ── Format date ───────────────────────────────────────────────────────────
  const formatDate = (d?: string) => {
    if (!d) return "—";
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const [year, month, day] = d.split("-").map(Number);
    return `${String(day).padStart(2,"0")}-${months[month - 1]}-${year}`;
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<CycleItem>[] = useMemo(
    () => [
      {
        key: "cycle_name",
        header: "Cycle Name",
        align: "left",
        sortable: true,
        render: (row) => (
          <div className="py-1.5">
            <span className="block font-medium">{row.cycle_name}</span>
          </div>
        ),
        tooltip: (row) => `Cycle: ${row.cycle_name}`,
      },
      {
        key: "name",
        header: "ID",
        align: "left",
        render: (row) => (
          <div className="py-1.5">
            <span className="block text-muted text-xs">{row.name}</span>
          </div>
        ),
      },
      {
        key: "start_date",
        header: "Start Date",
        align: "center",
        sortable: true,
        render: (row) => (
          <div className="py-1.5">
            <span className="block">{formatDate(row.start_date)}</span>
          </div>
        ),
      },
      {
        key: "end_date",
        header: "End Date",
        align: "center",
        sortable: true,
        render: (row) => (
          <div className="py-1.5">
            <span className="block">{formatDate(row.end_date)}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (row) => (
          <div className="py-1.5">
            <StatusBadge status={row.status ?? "Draft"} />
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row) => (
          <div className="flex items-center justify-center gap-2">
            <PermissionGate module={APPRAISAL_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(e) => handleEdit(row, e)}
                iconOnly
              />
            </PermissionGate>
          </div>
        ),
      },
    ],
    [handleEdit],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={cycles}
        rowKey={(row) => row.name}
        tableId="appraisal-cycles"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableAdd={can(APPRAISAL_MODULE, "create")}
        addLabel="Add Appraisal"
        onAdd={onAddAppraisal}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
    </div>
  );
};

export default AppraisalTable;