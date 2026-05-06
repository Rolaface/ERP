import React, { useState, useMemo } from "react";
import type { PayrollRecord } from "../../../types/payrolltypes";
import { KPICards } from "./KPICards";
import { FilterBar } from "./FilterBar";
import Table from "../../../components/ui/Table/Table";
import type { Column } from "../../../components/ui/Table/type";
import StatusBadge from "../../../components/ui/Table/StatusBadge";

interface Props {
  records: PayrollRecord[];
  onRunPayroll: () => void;
  onViewPayslip: (r: PayrollRecord) => void;
  onEditRecord: (r: PayrollRecord) => void;
  onViewDetails: (r: PayrollRecord) => void;
}

export const PayrollDashboard: React.FC<Props> = ({
  records,
  onRunPayroll,
  onViewPayslip,
  onEditRecord,
  onViewDetails,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const departments = useMemo(() => {
    const depts = new Set(records.map((r) => r.department));
    return ["All", ...Array.from(depts)];
  }, [records]);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const deptOk = selectedDept === "All" || r.department === selectedDept;
        const statusOk = filterStatus === "All" || r.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const searchOk =
          !q ||
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q);
        return deptOk && statusOk && searchOk;
      }),
    [records, selectedDept, filterStatus, searchQuery],
  );

  const paidCount = records.filter((r) => r.status === "Paid").length;
  const pendingCount = records.filter((r) => r.status === "Pending").length;
  const totalNet = records.reduce((s, r) => s + r.netPay, 0);

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
const payrollColumns: Column<any>[] = [
  {
    key: "name",
    header: "Payroll Entry",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-primary">
        {row.name}
      </span>
    ),
  },

  {
    key: "currency",
    header: "Currency",
    sortable: true,
    render: (row) => (
      <span className="text-xs font-semibold">
        {row.currency}
      </span>
    ),
  },

  {
    key: "branch",
    header: "Branch",
    sortable: true,
    render: (row) => (
      <span className="text-xs text-muted">
        {row.branch || "-"}
      </span>
    ),
  },

  {
    key: "payroll_frequency",
    header: "Frequency",
    render: (row) => (
      <span className="px-2 py-1 rounded-md bg-app text-xs">
        {row.payroll_frequency}
      </span>
    ),
  },

  {
  key: "status",
  header: "Status",
  render: (row) => (
    <StatusBadge status={row.status} />
  ),
},
];

  return (
    <>
      {/* KPIs */}
      <div className="shrink-0 px-5 pt-4 pb-3">
        <KPICards
          totalRecords={records.length}
          paidCount={paidCount}
          pendingCount={pendingCount}
          totalPayout={totalNet}
        />
      </div>

      {/* Filters */}
      <div className="shrink-0 px-5 pb-3">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDept={selectedDept}
          onDeptChange={setSelectedDept}
          departments={departments}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          pendingCount={pendingCount}
          onRunPayroll={onRunPayroll}
          totalShown={filtered.length}
        />
      </div>

      {/* Table card */}
      <div className="flex-1 min-h-0 px-5 pb-4 flex flex-col">
        
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Table
              tableId="payroll-dashboard"
              columns={payrollColumns}
              data={filtered}
              loading={false}
              totalItems={filtered.length}
              currentPage={1}
              totalPages={1}
              pageSize={10}
            />
          </div>
        </div>
   
    </>
  );
};
