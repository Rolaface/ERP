import React, { useState, useEffect } from "react";
import { getAllEmployee } from "../../../api/employeeAttendanceApi";
import { showApiError } from "../../../utils/alert";
import { parseFrappeError } from "../tabs/leave-config/hooks/parseFrappeError";

// UI Components
import Table from "../../../components/ui/Table/Table";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import type { Column } from "../../../components/ui/Table/type";
import DateRangeFilter from "../../../components/ui/modal/DateRangeFilter";
import ActionButton, { ActionGroup } from "../../../components/ui/Table/ActionButton";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AttendanceRowData {
  id: string;
  employee: string;
  employee_name: string;
  date: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

const formatTableData = (apiData: any[]): AttendanceRowData[] => {
  if (!apiData || !apiData.length) return [];

  // 1. Sort logs chronologically
  const sortedLogs = [...apiData].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  // 2. Group by Employee AND Date
  const grouped: Record<string, any> = {};
  sortedLogs.forEach((log) => {
    const [date, time] = log.time.split(" ");
    const key = `${log.employee}_${date}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        employee: log.employee,
        employee_name: log.employee_name,
        date: date,
        logs: [],
      };
    }
    
    // Only capture explicit IN/OUT logs
    if (log.log_type === "IN" || log.log_type === "OUT") {
      grouped[key].logs.push({ ...log, timeOnly: time.substring(0, 5) });
    }
  });

  // 3. Process each group into a table row
  const tableRows: AttendanceRowData[] = Object.values(grouped).map((group) => {
    const ins = group.logs.filter((l: any) => l.log_type === "IN");
    const outs = group.logs.filter((l: any) => l.log_type === "OUT");

    const firstIn = ins.length > 0 ? ins[0] : null;
    const lastOut = outs.length > 0 ? outs[outs.length - 1] : null;

    const clockIn = firstIn ? firstIn.timeOnly : "--:--";
    const clockOut = lastOut ? lastOut.timeOnly : "--:--";

    let currentIn: any = null;
    let totalDurationMs = 0;

    group.logs.forEach((log: any) => {
      if (log.log_type === "IN") {
        if (!currentIn) currentIn = log;
      } else if (log.log_type === "OUT" && currentIn) {
        totalDurationMs += new Date(log.time).getTime() - new Date(currentIn.time).getTime();
        currentIn = null;
      }
    });

    // If currently checked in, add elapsed time (only if it's today)
    if (currentIn) {
      const now = new Date();
      const logDate = new Date(group.date).toDateString();
      const today = new Date().toDateString();
      
      if (logDate === today) {
        totalDurationMs += now.getTime() - new Date(currentIn.time).getTime();
      }
    }

    // Format Duration
    let duration = "--h --m";
    if (totalDurationMs > 0) {
      const hours = Math.floor(totalDurationMs / 3600000);
      const mins = Math.floor((totalDurationMs % 3600000) / 60000);
      duration = `${hours}h ${mins}m`;
    }

    // Determine Status
    let status = "Completed";
    if (currentIn) {
      const logDate = new Date(group.date).toDateString();
      const today = new Date().toDateString();
      status = logDate === today ? "Active" : "Missing Out";
    } else if (firstIn && !lastOut && !currentIn) {
      status = "Missing Out";
    }

    return {
      id: group.id,
      employee: group.employee,
      employee_name: group.employee_name,
      date: group.date,
      clockIn,
      clockOut: currentIn ? "--:--" : clockOut,
      duration,
      status,
    };
  });

  // Sort latest dates first
  return tableRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ─── Component ────────────────────────────────────────────────────────────────

const HrAttendanceView: React.FC = () => {
  const [data, setData] = useState<AttendanceRowData[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // const [filters, setFilters] = useState({ from_date: "", to_date: "" });
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 3);
    const to = new Date(today);
    to.setDate(today.getDate() + 3);
    
    const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    
    return { from_date: toYMD(from), to_date: toYMD(to) };
  });

 useEffect(() => {
    fetchAttendanceData();
  }, [filters.from_date, filters.to_date]);

  useEffect(() => {
    let result = [...data];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (row) =>
          row.employee_name.toLowerCase().includes(lowerSearch) ||
          row.employee.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredData(result);
    setPage(1); 
  }, [data, searchTerm]);

 const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      
      const apiFilters: any[] = [];

      if (filters.from_date && filters.to_date) {
        apiFilters.push([
          "time", 
          "between", 
          [`${filters.from_date} 00:00:00`, `${filters.to_date} 23:59:59`]
        ]);
      } else if (filters.from_date) {
        apiFilters.push(["time", ">=", `${filters.from_date} 00:00:00`]);
      } else if (filters.to_date) {
        apiFilters.push(["time", "<=", `${filters.to_date} 23:59:59`]);
      }

      const response = await getAllEmployee(apiFilters);
      const rawLogs = response?.data?.data || response?.data;

      if (Array.isArray(rawLogs) && rawLogs.length > 0) {
        const formattedData = formatTableData(rawLogs);
        setData(formattedData);
      } else {
        setData([]);
      }
    } catch (error) {
      showApiError(parseFrappeError(error) || "Failed to fetch attendance records.");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<AttendanceRowData>[] = [
    {
      key: "employee",
      header: "Employee",
      align: "left",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.employee_name || "—"}</div>
          <div className="text-xs text-gray-500">{row.employee}</div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      align: "left",
      render: (row) => (
        <span className="font-medium text-gray-700">
          {new Date(row.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    { 
      key: "clockIn", 
      header: "Clock In", 
      align: "left",
      render: (row) => <span className="text-gray-600">{row.clockIn}</span>
    },
    { 
      key: "clockOut", 
      header: "Clock Out", 
      align: "left",
      render: (row) => <span className="text-gray-600">{row.clockOut}</span>
    },
    { 
      key: "duration", 
      header: "Duration", 
      align: "left",
      render: (row) => <span className="font-medium text-gray-800">{row.duration}</span>
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (row) => {
        // Map status text to valid StatusBadge variations
        let badgeStatus = row.status;
        if (badgeStatus === "Missing Out") badgeStatus = "Cancelled"; // Maps to Red/Warning colors usually
        if (badgeStatus === "Active") badgeStatus = "Open";           // Maps to Blue/Pending
        if (badgeStatus === "Completed") badgeStatus = "Approved";    // Maps to Green
        
        return <StatusBadge status={badgeStatus} label={row.status} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            onClick={() => {
              // Placeholder for viewing detailed timeline/logs for the specific day
              console.log("View details for", row.id);
            }}
          />
        </ActionGroup>
      ),
    },
  ];

  // Pagination calculation
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Table
      extraFilters={
        <>
          <DateRangeFilter
            from={filters.from_date}
            to={filters.to_date}
            onChange={(range) => {
              setFilters((prev) => ({ ...prev, ...range }));
            }}
          />
        </>
      }
      loading={isLoading}
      columns={columns}
      data={paginatedData}
      showToolbar
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      enableColumnSelector
      currentPage={page}
      pageSize={pageSize}
      totalItems={filteredData.length}
      totalPages={Math.ceil(filteredData.length / pageSize) || 1}
      pageSizeOptions={[10, 25, 50, 100]}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      onPageChange={setPage}
    />
  );
};

export default HrAttendanceView;