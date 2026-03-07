import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, FileText, Users, X } from "lucide-react";
import ActionButton from "../../../components/ui/Table/ActionButton";
import Modal from "../../../components/ui/modal/modal";
import { Button } from "../../../components/ui/modal/formComponent";
import {
  checkinAndMarkAttendance,
  getAllAttendance,
  type AttendanceRecord,
} from "../../../api/attendanceApi";
import { getAllEmployees } from "../../../api/employeeapi";
import {
  closeSwal,
  showApiError,
  showLoading,
  showSuccess,
} from "../../../utils/alert";

const KPI_CARD_BASE =
  "bg-card rounded-2xl p-6 w-full min-w-0 flex flex-col items-stretch shadow-sm";

const fmt = (n: number) =>
  Number(n || 0).toLocaleString("en-ZM", { maximumFractionDigits: 2 });

export default function TimeAttendanceSimple() {
  const [employees, setEmployees] = useState<
    { employeeId: string; name: string }[]
  >([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [employee, setEmployee] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [clockEmployee, setClockEmployee] = useState("");
  const [clockLoading, setClockLoading] = useState<"IN" | "OUT" | null>(null);
  const [showClockModal, setShowClockModal] = useState(false);

  const [viewRecord, setViewRecord] = useState<AttendanceRecord | null>(null);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllAttendance({
        page,
        page_size: pageSize,
        employee: employee.trim(),
        from_date: "",
        to_date: "",
      });

      setRecords(Array.isArray(res.records) ? res.records : []);
      setTotalPages(Number(res.pagination?.total_pages ?? 1) || 1);
      setTotalItems(Number(res.pagination?.total ?? 0) || 0);
    } catch (e: any) {
      setRecords([]);
      setTotalPages(1);
      setTotalItems(0);
      setError(e?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, employee]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setEmployeesLoading(true);
      try {
        const res = await getAllEmployees(1, 500, "Active");
        const rows = Array.isArray(res?.employees) ? res.employees : [];
        const mapped = rows
          .map((e: any) => ({
            employeeId: String(
              e?.employeeId ?? e?.employee_id ?? e?.name ?? "",
            ).trim(),
            name: String(e?.name ?? e?.employee_name ?? "").trim(),
          }))
          .filter((e: any) => e.employeeId);

        if (!mounted) return;
        setEmployees(mapped);
      } catch {
        if (!mounted) return;
        setEmployees([]);
      } finally {
        if (!mounted) return;
        setEmployeesLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClock = async (log_type: "IN" | "OUT", empOverride?: string) => {
    const emp = String(empOverride ?? clockEmployee ?? employee).trim();
    if (!emp) {
      showApiError("Employee is required");
      return;
    }

    try {
      setClockLoading(log_type);
      showLoading(log_type === "IN" ? "Clocking in..." : "Clocking out...");
      await checkinAndMarkAttendance({ employee: emp, log_type });
      closeSwal();
      showSuccess(log_type === "IN" ? "Clocked in" : "Clocked out");
      await fetchAttendance();
      setShowClockModal(false);
    } catch (e) {
      closeSwal();
      showApiError(e);
    } finally {
      setClockLoading(null);
    }
  };

  const stats = useMemo(() => {
    const rows = Array.isArray(records) ? records : [];
    const presentCount = rows.filter(
      (r) => String(r.status || "").toLowerCase() === "present",
    ).length;
    const absentCount = rows.filter(
      (r) => String(r.status || "").toLowerCase() === "absent",
    ).length;
    const totalHours = rows.reduce(
      (s, r) => s + Number(r.working_hours ?? 0),
      0,
    );
    const avgHours = rows.length > 0 ? totalHours / rows.length : 0;

    return {
      presentCount,
      absentCount,
      totalHours,
      avgHours,
    };
  }, [records]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Present",
        value: loading
          ? "—"
          : String(stats.presentCount.toLocaleString("en-ZM")),
        icon: CheckCircle,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
      {
        label: "Absent",
        value: loading
          ? "—"
          : String(stats.absentCount.toLocaleString("en-ZM")),
        icon: Users,
        gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      },
      {
        label: "Avg Hours/Day",
        value: loading ? "—" : fmt(stats.avgHours),
        icon: Clock,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Total Working Hours",
        value: loading ? "—" : fmt(stats.totalHours),
        icon: FileText,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
    ],
    [
      loading,
      stats.absentCount,
      stats.avgHours,
      stats.presentCount,
      stats.totalHours,
    ],
  );

  return (
    <div className="min-h-screen bg-app w-full min-w-0">
      <div className="p-6 w-full min-w-0 space-y-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={KPI_CARD_BASE}>
                <div className="flex items-start justify-between w-full">
                  <div>
                    <div className="text-xs font-semibold text-muted tracking-wide uppercase">
                      {c.label}
                    </div>
                    <div className="text-2xl font-bold text-main mt-1.5 tabular-nums">
                      {c.value}
                    </div>
                  </div>
                  <div
                    className={`p-3 bg-gradient-to-br ${c.gradient} rounded-xl shadow-sm`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-sm font-bold text-main">
                  Attendance Records
                </div>
                <div className="text-xs text-muted mt-1">
                  {loading
                    ? "Loading..."
                    : `${totalItems.toLocaleString("en-ZM")} total`}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-muted uppercase mb-1">
                  Employee
                </div>
                <input
                  value={employee}
                  onChange={(e) => {
                    setEmployee(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by Employee ID..."
                  className="h-10 w-full sm:w-72 px-3 bg-card border border-border/30 rounded-xl text-sm text-main shadow-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowClockModal(true)}
                className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-medium"
              >
                Clock In
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/5">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-muted whitespace-nowrap">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted whitespace-nowrap">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted text-right whitespace-nowrap">
                    Working Hours
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr
                    key={r.name || String(idx)}
                    className={idx % 2 === 1 ? "bg-muted/5" : ""}
                  >
                    <td className="px-6 py-3 text-sm text-main whitespace-nowrap">
                      {r.employee}
                    </td>
                    <td className="px-6 py-3 text-sm text-main break-words">
                      {r.employee_name || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted whitespace-nowrap">
                      {r.attendance_date}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted whitespace-nowrap">
                      {r.status}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-main tabular-nums text-right whitespace-nowrap">
                      {fmt(Number(r.working_hours ?? 0))}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <ActionButton
                          type="view"
                          iconOnly
                          label={null}
                          onClick={() => setViewRecord(r)}
                        />

                        {r.isWorking ? (
                          <button
                            type="button"
                            onClick={() => handleClock("OUT", r.employee)}
                            disabled={clockLoading !== null}
                            className="h-9 px-3 text-sm font-medium bg-primary text-white rounded-xl disabled:opacity-50"
                          >
                            {clockLoading === "OUT"
                              ? "Clocking Out..."
                              : "Clock Out"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-muted"
                    >
                      No attendance records found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-muted/5 flex items-center justify-between">
            <div className="text-xs text-muted">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 text-sm font-medium border border-border/30 rounded-xl disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {showClockModal ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 bg-app flex items-center justify-between">
                <div className="text-sm font-bold text-main">Clock In</div>
                <button
                  type="button"
                  onClick={() => setShowClockModal(false)}
                  className="p-1 rounded hover:bg-card"
                >
                  <X className="w-4 h-4 text-muted" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold text-muted uppercase mb-1">
                    Employee
                  </div>
                  <select
                    value={clockEmployee}
                    onChange={(e) => setClockEmployee(e.target.value)}
                    className="h-10 w-full px-3 bg-card border border-border/30 rounded-xl text-sm text-main shadow-sm focus:outline-none"
                  >
                    <option value="">
                      {employeesLoading ? "Loading..." : "Select employee"}
                    </option>
                    {employees.map((e) => (
                      <option key={e.employeeId} value={e.employeeId}>
                        {e.employeeId}
                        {e.name ? ` — ${e.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClockModal(false)}
                  className="h-10 px-4 border border-border/30 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleClock("IN")}
                  disabled={clockLoading !== null}
                  className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {clockLoading === "IN" ? "Clocking In..." : "Clock In"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <Modal
          isOpen={!!viewRecord}
          onClose={() => setViewRecord(null)}
          title={
            viewRecord?.name
              ? `Attendance ${String(viewRecord.name)}`
              : "Attendance Details"
          }
          subtitle={viewRecord?.employee ? String(viewRecord.employee) : undefined}
          maxWidth="4xl"
          height="520px"
          footer={
            <div className="w-full flex items-center justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </div>
          }
        >
          {viewRecord ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  ID
                </div>
                <div className="w-full px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main">
                  {viewRecord.name}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Employee
                </div>
                <div className="w-full px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main">
                  {viewRecord.employee}
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Employee Name
                </div>
                <div className="w-full px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main">
                  {viewRecord.employee_name || "—"}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Date
                </div>
                <div className="w-full px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main">
                  {viewRecord.attendance_date}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Status
                </div>
                <div className="w-full px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main">
                  {viewRecord.status}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Working Hours
                </div>
                <div className="w-full px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main">
                  {fmt(Number(viewRecord.working_hours ?? 0))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Is Working
                </div>
                <div className="w-full px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main">
                  {viewRecord.isWorking ? "Yes" : "No"}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
