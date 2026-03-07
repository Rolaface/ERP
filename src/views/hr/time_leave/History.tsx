import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import { XCircle } from "lucide-react";
import Table from "../../../components/ui/Table/Table";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import ActionButton from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import { useTableLogic } from "../../../components/ui/Table/useTableLogic";
import { getAllEmployeeLeaveHistory, getLeaveHistoryByEmployee } from "../../../api/leaveApi";
import LeaveDetailModal from "../../../components/Hr/leave/LeaveDetailModal";
import { cancelLeave } from "../../../api/leaveApi";
import type { LeaveUI } from "../../../types/leave/uiLeave";
import { mapLeaveFromApi } from "../../../types/leave/leaveMapper";
import { getAllEmployees } from "../../../api/employeeapi";
import {
  closeSwal,
  showApiError,
  showLoading,
  showSuccess,
} from "../../../utils/alert";

interface HistoryProps {
  onNewRequest: () => void;
  onEditLeave: (leaveId: string) => void;
}

const History: React.FC<HistoryProps> = ({ onNewRequest, onEditLeave }) => {
  const [leaves, setLeaves] = useState<LeaveUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getAllEmployees(1, 200);
        setEmployees(res.employees || []);
      } catch {
        setEmployees([]);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = employeeId
          ? await getLeaveHistoryByEmployee(employeeId, page, pageSize)
          : await getAllEmployeeLeaveHistory(page, pageSize);

        const list = res?.data?.leaves ?? res?.data?.leaveHistory ?? res?.data ?? [];
        setLeaves((Array.isArray(list) ? list : []).map(mapLeaveFromApi));

        const pg = res?.data?.pagination ?? res?.pagination;
        if (pg) {
          setTotalItems(Number(pg.total ?? 0));
          setTotalPages(Number(pg.total_pages ?? pg.totalPages ?? 1));
        } else {
          setTotalItems(Array.isArray(list) ? list.length : 0);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, pageSize, employeeId]);

  const handleCancelLeave = async (leaveId: string) => {
    try {
      setLoading(true);

      showLoading("Cancelling Leave...");

      await cancelLeave(leaveId);

      closeSwal();
      showSuccess("Leave cancelled successfully");

      setLeaves((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status: "Cancelled" } : l)),
      );
    } catch (err) {
      closeSwal();
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  /*  Columns */
  const columns: Column<LeaveUI>[] = [
    {
      key: "type",
      header: "Type",
      align: "left",
      render: (l) => (
        <div>
          <div className="font-semibold">{l.leaveType}</div>
          <div className="text-xs text-muted italic">{l.reason}</div>
        </div>
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (l) => (
        <span className="text-xs">
          <FaCalendarAlt className="inline mr-1 text-muted" />
          {l.startDate} → {l.endDate}
        </span>
      ),
    },
    {
      key: "days",
      header: "Days",
      align: "center",
      render: (l) => (
        <span className="inline-flex items-center gap-1">
          <FaClock className="text-muted" />
          {l.totalDays}
        </span>
      ),
    },

    {
      key: "appliedOn",
      header: "Applied",
      render: (l) => l.appliedOn,
    },

    {
      key: "status",
      header: "Status",
      align: "left",
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (l) => (
        <div className="flex items-center justify-center gap-3 min-w-[72px]">
          {/* View */}
          <ActionButton
            type="view"
            iconOnly
            onClick={() => setSelectedLeaveId(l.id)}
          />

          {/* Cancel (only for Pending, but space stays consistent) */}
          {l.status === "Pending" ? (
            <ActionButton
              type="custom"
              variant="danger"
              iconOnly
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => handleCancelLeave(l.id)}
            />
          ) : (
            <span className="w-8 h-8" />
          )}

          {l.status === "Pending" && (
            <ActionButton
              type="edit"
              iconOnly
              onClick={() => onEditLeave(l.id)}
            />
          )}
        </div>
      ),
    },
  ];

  const table = useTableLogic<LeaveUI>({
    columns,
    data: leaves,
  });

  const historyFilters = (
    <>
      {/* YEAR FILTER */}
      <div className="relative">
        <select
          value={table.yearFilter}
          onChange={(e) => table.setYearFilter(e.target.value)}
          className="
          appearance-none
          px-4 py-2
          pr-9
          rounded-xl
          border border-[var(--border)]
          bg-app
          text-[10px] font-black uppercase tracking-widest
          text-muted
          hover:text-primary hover:border-primary
          focus:outline-none focus:ring-2 focus:ring-primary/10
          cursor-pointer
        "
        >
          <option value="">Year: All</option>
          <option value="2026">Year: 2026</option>
          <option value="2025">Year: 2025</option>
        </select>

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          ▾
        </span>
      </div>

      {/* LEAVE TYPE FILTER */}
      <div className="relative">
        <select
          value={table.leaveTypeFilter}
          onChange={(e) => table.setLeaveTypeFilter(e.target.value)}
          className="
          appearance-none
          px-4 py-2
          pr-9
          rounded-xl
          border border-[var(--border)]
          bg-app
          text-[10px] font-black uppercase tracking-widest
          text-muted
          hover:text-primary hover:border-primary
          focus:outline-none focus:ring-2 focus:ring-primary/10
          cursor-pointer
        "
        >
          <option value="">Type: All</option>
          <option value="Casual Leave">Type: Casual</option>
          <option value="Sick Leave">Type: Sick</option>
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
        data={table.processedData}
        loading={loading}
        showToolbar
        searchValue={table.effectiveSearch}
        onSearch={table.setSearch}
        enableAdd
        extraFilters={
          <>
            <div className="relative">
              <select
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setPage(1);
                }}
                className="
                  appearance-none
                  px-4 py-2
                  pr-9
                  rounded-xl
                  border border-[var(--border)]
                  bg-app
                  text-[10px] font-black uppercase tracking-widest
                  text-muted
                  hover:text-primary hover:border-primary
                  focus:outline-none focus:ring-2 focus:ring-primary/10
                  cursor-pointer
                "
              >
                <option value="">Employee: All</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    Employee: {e.name} ({e.employeeId})
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                ▾
              </span>
            </div>
            {historyFilters}
          </>
        }
        addLabel="New Request"
        onAdd={onNewRequest}
        toolbarPlaceholder="Search reason / type..."
        emptyMessage="No leave requests found."
        currentPage={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <LeaveDetailModal
        leaveId={selectedLeaveId}
        onClose={() => setSelectedLeaveId(null)}
      />
    </div>
  );
};

export default History;
