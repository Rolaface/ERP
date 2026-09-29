import React, { useState, useEffect } from "react";
import { getEmployeeLeaveBalance } from "../../../api/employeeapi";
import Table from "../../../components/ui/Table/Table";
import type { Column } from "../../../components/ui/Table/type";

interface LeaveBalanceTableProps {
  onBack: () => void;
}

const LeaveBalanceTable: React.FC<LeaveBalanceTableProps> = ({ onBack }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchBalances();
  }, [page, pageSize]);
  const fetchBalances = async () => {
    try {
      setIsLoading(true);
      const res = await getEmployeeLeaveBalance(page, pageSize);
      const employees = res?.message?.data?.employees || [];
      const mapped = employees.map((emp: any) => {
        const leaveBalances = emp.leaveBalances || [];
        const totals = leaveBalances.reduce(
          (acc: any, lb: any) => ({
            allocated: acc.allocated + (lb.new_leaves_allocated || 0),
            taken: acc.taken + (lb.leaves_taken || 0),
            balance: acc.balance + (lb.balance || 0),
          }),
          { allocated: 0, taken: 0, balance: 0 },
        );
        return {
          employee_id: emp.employeeInfo?.name,
          employee_name: emp.employeeInfo?.employee_name,
          designation: emp.employeeInfo?.designation,
          allocated: totals.allocated,
          taken: totals.taken,
          balance: totals.balance,
        };
      });
      setData(mapped);
      setTotalItems(res?.message?.data?.pagination?.total || mapped.length);
    } catch (err) {
      console.error("Failed to fetch leave balances", err);
    } finally {
      setIsLoading(false);
    }
  };

   const columns: Column<any>[] = [
    { key: "employee_id", header: "Employee ID", align: "left" },
    { key: "employee_name", header: "Employee", align: "left" },
    { key: "designation", header: "Designation", align: "left" },
    { key: "allocated", header: "Allocated", align: "left" },
    { key: "taken", header: "Used", align: "left" },
    { key: "balance", header: "Balance", align: "left" },
  ];

  return (
    <div className="space-y-2">
           <Table
        primaryAction={
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-main transition-colors hover:bg-row-hover"
          >
            Back to Applications
          </button>
        }
               loading={isLoading}
        columns={columns}
        data={data}
        showToolbar
        defaultVisibleCount={8}
        currentPage={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={Math.max(Math.ceil(totalItems / pageSize), 1)}
        pageSizeOptions={[20, 50, 100, 200]}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
};

export default LeaveBalanceTable;