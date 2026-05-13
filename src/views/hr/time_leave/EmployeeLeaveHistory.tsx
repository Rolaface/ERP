import React, { useState, useMemo, useEffect } from "react";
import Table from "../../../components/ui/Table/Table";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import ActionButton from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { useTableLogic } from "../../../components/ui/Table/useTableLogic";
import { getAllEmployeeLeaveHistory } from "../../../api/leaveApi";
import type { LeaveUI } from "../../../types/leave/uiLeave";
import { mapLeaveFromApi } from "../../../types/leave/leaveMapper";
import EmployeeLeaveDetailModal from "../../../components/Hr/leave/EmployeeLeaveDetailModal";
import { useAuth } from "../../../context/AuthContext";
import { useHRView } from "../../../hooks/permission/useHRView";

const EmployeeHistory: React.FC = () => {
  const { user }      = useAuth();
  const { viewMode }  = useHRView();

  const isEmployeeView = viewMode === "employee";

  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [leaves, setLeaves]     = useState<LeaveUI[]>([]);

  const filteredData = useMemo(() => {
    return selectedEmployee
      ? leaves.filter((l) => l.employeeId === selectedEmployee)
      : leaves;
  }, [leaves, selectedEmployee]);

  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        // Employee view: search=employeeId → only own leave history
        // Professional view: no filter → all employees
        const searchParam = isEmployeeView
          ? user?.employeeId
          : undefined;

        const res = await getAllEmployeeLeaveHistory(
          page,
          pageSize,
          searchParam,
        );

        const mapped = (res.data?.leaves || []).map(mapLeaveFromApi);
        setLeaves(mapped);

        const pg = res.data?.pagination;
        if (pg) {
          setTotalPages(pg.total_pages);
          setTotalItems(pg.total);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [page, pageSize, isEmployeeView, user?.employeeId]);

  const columns = useMemo<Column<LeaveUI>[]>(
    () => [
      {
        key:    "employee",
        header: "Employee",
        render: (l) => (
          <div>
            <div className="font-semibold">{l.employeeName}</div>
            <div className="text-xs text-muted">
              {l.employeeId} • {l.department}
            </div>
          </div>
        ),
      },
      { key: "type",   header: "Type",   render: (l) => l.leaveType },
      { key: "period", header: "Period", render: (l) => `${l.startDate} → ${l.endDate}` },
      { key: "days",   header: "Days",   align: "center", render: (l) => l.totalDays },
      { key: "appliedOn", header: "Applied", render: (l) => l.appliedOn },
      {
        key:    "status",
        header: "Status",
        render: (l) => <StatusBadge status={l.status} />,
      },
      {
        key:    "actions",
        header: "Actions",
        align:  "center",
        render: (l) => (
          <ActionButton
            type="view"
            iconOnly
            onClick={() => setSelectedLeaveId(l.id)}
          />
        ),
      },
    ],
    [],
  );

  const table = useTableLogic<LeaveUI>({ columns, data: filteredData });

  const historyFilters = (
    <>
      <div className="relative">
        <select
          value={table.yearFilter}
          onChange={(e) => table.setYearFilter(e.target.value)}
          className="appearance-none px-4 py-2 pr-9 rounded-xl border border-[var(--border)]
            bg-app text-[10px] font-black uppercase tracking-widest text-muted
            hover:text-primary hover:border-primary focus:outline-none
            focus:ring-2 focus:ring-primary/10 cursor-pointer"
        >
          <option value="">Year: All</option>
          <option value="2026">Year: 2026</option>
          <option value="2025">Year: 2025</option>
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          ▾
        </span>
      </div>

      <div className="relative">
        <select
          value={table.leaveTypeFilter}
          onChange={(e) => table.setLeaveTypeFilter(e.target.value)}
          className="appearance-none px-4 py-2 pr-9 rounded-xl border border-[var(--border)]
            bg-app text-[10px] font-black uppercase tracking-widest text-muted
            hover:text-primary hover:border-primary focus:outline-none
            focus:ring-2 focus:ring-primary/10 cursor-pointer"
        >
          <option value="">Type: All</option>
          <option value="Casual Leave">Type: Casual</option>
          <option value="Sick Leave">Type: Sick</option>
          <option value="Emergency Leave">Type: Emergency</option>
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          ▾
        </span>
      </div>
    </>
  );

  return (
    <div className="p-8">
      <Table
        columns={columns}
        data={filteredData}
        loading={loading}
        showToolbar
        extraFilters={historyFilters}
        toolbarPlaceholder="Search employee name, reason..."
        emptyMessage="No leave history found."
        currentPage={page}
        enableColumnSelector
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
      />
      <EmployeeLeaveDetailModal
        leaveId={selectedLeaveId}
        onClose={() => setSelectedLeaveId(null)}
      />
    </div>
  );
};

export default EmployeeHistory;