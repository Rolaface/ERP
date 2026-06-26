import React, { useEffect, useState, useMemo, useCallback } from "react";
import Table from "../../../components/ui/Table/Table";
import type { Column } from "../../../components/ui/Table/type";
import { usePermission } from "../../../hooks/permission/usePermission";
import PermissionGate from "../../PermissionGate";
import { getAppraisals } from "../../../api/Appraisalapi/performanceCycleApi";
import { openAppraisalModal } from "../../../store/modalStore";
import EmployeeNameCell from "../../../components/ui/Table/Employeenamecell";
import type { AppraisalItem } from "../../../api/Appraisalapi/performanceCycleApi"
import { showApiError } from "../../../utils/alert";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../store/dataRefreshStore";

const APPRAISAL_MODULE = "Appraisal";

interface AppraisalTableProps {
  onAddAppraisal?: () => void;
}

const AppraisalTable: React.FC<AppraisalTableProps> = ({ onAddAppraisal }) => {
  const { can } = usePermission();

  const [appraisals, setAppraisals] = useState<AppraisalItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search / sort ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("cycle_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");



  const fetchAppraisals = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getAppraisals({ page, pageSize, search });
      setAppraisals(resp.data);
      setTotalPages(resp.pagination?.page_count ?? 1);
      setTotalItems(resp.pagination?.total ?? resp.data.length);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { fetchAppraisals(); },
    [fetchAppraisals]);

     useEffect(() => {
        const unsub = useDataRefreshStore
          .getState()
          .subscribeToRefresh(REFRESH_KEYS.APPRAISAL_LIST, fetchAppraisals);
        return unsub;
      }, [fetchAppraisals]);

  useEffect(() => { setPage(1); }, [search]);

  const handleSortChange = ({
    sortBy: col,
    sortOrder: order,
  }: { sortBy: string; sortOrder: "asc" | "desc" }) => {
    setSortBy(col);
    setSortOrder(order);
    setPage(1);
  };



  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<AppraisalItem>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Appraisal Id",
        align: "left",
        render: (row) => (
          <div className="py-1.5">
            <span className="block font-medium">{row.name}</span>
          </div>
        ),
      },
      {
        key: "appraisal_cycle",
        header: "Appraisal Cycle",
        align: "left",
        render: (row) => (
          <div className="py-1.5">
            <span className="block text-muted text-xs">{row.appraisal_cycle}</span>
          </div>
        ),
      },
      {
        key: "employee_name",
        header: "Employee",
        align: "left",
        render: (row) => (
           <EmployeeNameCell name={row.employee_name}  image={row.employee_image} />
        ),
      },
    ],
    [],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={appraisals}
        rowKey={(row) => row.name}
        tableId="appraisal"
        loading={loading}
        showToolbar
        searchValue={search}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        enableAdd={can(APPRAISAL_MODULE, "create")}
        addLabel="Add Appraisal"
        onAdd={onAddAppraisal}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 50, 100,200]}

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