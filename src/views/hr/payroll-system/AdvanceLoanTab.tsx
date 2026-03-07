import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, RefreshCw, Search, AlertCircle, X } from "lucide-react";
import {
  createEmployeeAdvance,
  getEmployeeAdvanceById,
  getEmployeeAdvancesPaged,
  type CreateEmployeeAdvancePayload,
  type EmployeeAdvanceDetail,
  type EmployeeAdvanceRecord,
  type EmployeeAdvancesPage,
} from "../../../api/advanceLoanApi";
import { getAllEmployees } from "../../../api/employeeapi";
import {
  closeSwal,
  showApiError,
  showLoading,
  showSuccess,
} from "../../../utils/alert";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED BUTTON
// ─────────────────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
  type?: "button" | "submit";
  form?: string;
}> = ({
  onClick,
  disabled,
  children,
  icon,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  form,
}) => {
  const v: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-primary/90",
    outline: "bg-card text-main border border-theme hover:bg-muted/5",
    danger: "bg-danger text-white hover:bg-danger/90",
    ghost: "text-muted hover:text-main hover:bg-muted/5",
  };
  const s = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${v[variant]} ${s} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

export default function AdvanceLoanTab() {
  const [searchEmpId, setSearchEmpId] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<EmployeeAdvanceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [advances, setAdvances] = useState<EmployeeAdvanceRecord[]>([]);
  const [advancesPage, setAdvancesPage] = useState<EmployeeAdvancesPage | null>(
    null,
  );
  const [searchRecords, setSearchRecords] = useState<EmployeeAdvanceRecord[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [employeeListLoading, setEmployeeListLoading] = useState(false);
  const [departmentLocked, setDepartmentLocked] = useState(false);

  const [createData, setCreateData] = useState<CreateEmployeeAdvancePayload>({
    employee: "",
    department: "",
    advance_amount: 0,
    purpose: "",
    repay_unclaimed_amount_from_salary: 1,
  });

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e: any) => {
      const dept = String(
        e?.department ??
          e?.employmentInfo?.Department ??
          e?.employmentInfo?.department ??
          "",
      ).trim();
      if (dept) set.add(dept);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const q = String(employeeQuery ?? "")
      .trim()
      .toLowerCase();
    if (!q) return employees.slice(0, 50);

    const rows = employees.filter((e: any) => {
      const id = String(
        e?.employeeId ?? e?.employee_id ?? e?.id ?? e?.name ?? "",
      ).toLowerCase();
      const name = String(
        e?.employeeName ??
          e?.employee_name ??
          e?.name ??
          e?.personalInfo?.FirstName ??
          "",
      ).toLowerCase();
      const full = String(
        e?.full_name ?? e?.employee_full_name ?? e?.employeeName ?? "",
      ).toLowerCase();
      return id.includes(q) || name.includes(q) || full.includes(q);
    });

    return rows.slice(0, 50);
  }, [employeeQuery, employees]);

  const resolveEmployeeLabel = (e: any) => {
    const code = String(
      e?.employeeId ?? e?.employee_id ?? e?.id ?? e?.name ?? "",
    ).trim();
    const nm = String(
      e?.employeeName ?? e?.employee_name ?? e?.full_name ?? "",
    ).trim();
    if (code && nm) return `${code} (${nm})`;
    return code || nm || "—";
  };

  const searchQuery = useMemo(
    () =>
      String(searchEmpId ?? "")
        .trim()
        .toLowerCase(),
    [searchEmpId],
  );

  const filteredSearchRecords = useMemo(() => {
    if (!searchQuery) return [] as EmployeeAdvanceRecord[];
    return (Array.isArray(searchRecords) ? searchRecords : []).filter((adv) => {
      return (
        String(adv.employee ?? "")
          .toLowerCase()
          .includes(searchQuery) ||
        String(adv.employee_name ?? "")
          .toLowerCase()
          .includes(searchQuery)
      );
    });
  }, [searchQuery, searchRecords]);

  const searchTotalPages = useMemo(() => {
    const total = filteredSearchRecords.length;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [filteredSearchRecords.length, pageSize]);

  const searchPageRows = useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize;
    return filteredSearchRecords.slice(start, start + pageSize);
  }, [filteredSearchRecords, page, pageSize]);

  const displayRows = useMemo(() => {
    if (searchQuery) return searchPageRows;
    return advances;
  }, [advances, searchPageRows, searchQuery]);

  const fetchAllAdvances = async (nextPage?: number) => {
    setListLoading(true);
    try {
      const p = Number(nextPage ?? page) || 1;
      const data = await getEmployeeAdvancesPaged({
        page: p,
        page_size: pageSize,
      });
      setAdvancesPage(data);
      setAdvances(data?.records || []);
      setPage(Number(data?.pagination?.page ?? p) || p);
    } catch (err) {
      console.error("Failed to fetch all advances", err);
      showApiError(err);
    } finally {
      setListLoading(false);
    }
  };

  const fetchAllAdvancesForSearch = async () => {
    setListLoading(true);
    try {
      const data = await getEmployeeAdvancesPaged({ page: 1, page_size: 1000 });
      setSearchRecords(data?.records || []);
    } catch (err) {
      setSearchRecords([]);
      showApiError(err);
    } finally {
      setListLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setEmployeeListLoading(true);
    try {
      const resp = await getAllEmployees({ page: 1, page_size: 500 });
      const rows =
        (Array.isArray(resp?.employees) ? resp.employees : null) ||
        (resp && Array.isArray(resp) ? resp : null) ||
        (Array.isArray(resp?.records) ? resp.records : null) ||
        (Array.isArray(resp?.data) ? resp.data : null) ||
        (Array.isArray(resp?.data?.records) ? resp.data.records : null) ||
        [];
      setEmployees(rows);
    } catch (e) {
      setEmployees([]);
      showApiError(e);
    } finally {
      setEmployeeListLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdvances(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllAdvances(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchRecords([]);
      return;
    }

    setPage(1);
    fetchAllAdvancesForSearch();
  }, [searchQuery]);

  useEffect(() => {
    if (!isCreating) return;
    if (employees.length > 0) return;
    fetchEmployees();
  }, [employees.length, isCreating]);

  useEffect(() => {
    const run = async () => {
      if (!selectedName) {
        setSelectedDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const detail = await getEmployeeAdvanceById(selectedName);
        setSelectedDetail(detail);
      } catch (e: any) {
        setSelectedDetail(null);
        setError(e?.message || "Failed to load advance details.");
        showApiError(e);
      } finally {
        setDetailLoading(false);
      }
    };

    run();
  }, [selectedName]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      showLoading("Creating advance request...");
      const res = await createEmployeeAdvance(createData);
      if (res) {
        setIsCreating(false);
        fetchAllAdvances(page);
        setCreateData({
          employee: "",
          department: "",
          advance_amount: 0,
          purpose: "",
          repay_unclaimed_amount_from_salary: 1,
        });
        setEmployeeQuery("");
        setDepartmentLocked(false);
        closeSwal();
        showSuccess("Advance request created successfully");
        return;
      }

      closeSwal();
      showApiError("Failed to create advance.");
    } catch (err: any) {
      setError(err.message || "Failed to create advance.");
      closeSwal();
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full min-h-0 w-full min-w-0 flex flex-col gap-4">
      <div className="bg-card border border-theme rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold text-main uppercase tracking-wider">
              Advance & Loan
            </div>
            <div className="text-[11px] text-muted mt-1">
              Search, view and create advances
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Btn
              variant="primary"
              onClick={() => {
                setIsCreating(true);
                setEmployeeQuery("");
                setEmployeeDropdownOpen(false);
                setDepartmentLocked(false);
              }}
            >
              + New Request
            </Btn>
            <Btn
              variant="outline"
              onClick={() => fetchAllAdvances(page)}
              disabled={listLoading}
              icon={
                <RefreshCw
                  className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`}
                />
              }
            >
              Refresh
            </Btn>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg flex items-center gap-2 border border-danger/20">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="p-6">
          <div className="border border-theme rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-app border-b border-theme flex items-center justify-between gap-4">
              <div className="text-xs font-extrabold text-main uppercase tracking-wide">
                Advances
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-72 max-w-full">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ID / Employee / Name..."
                    value={searchEmpId}
                    onChange={(e) => setSearchEmpId(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-card border border-theme rounded-lg text-xs text-main transition-all outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)]"
                  />
                </div>
                <div className="text-xs text-muted whitespace-nowrap">
                  {listLoading
                    ? "Loading..."
                    : `Showing ${searchQuery ? filteredSearchRecords.length : advances.length}`}
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              {listLoading ? (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  Loading advances...
                </div>
              ) : displayRows.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  No advances found
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-card border-b border-theme">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-left whitespace-nowrap">
                        Employee ID
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-left whitespace-nowrap">
                        Employee Name
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-left whitespace-nowrap">
                        Company
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-left whitespace-nowrap">
                        Department
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-left whitespace-nowrap">
                        Posting Date
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-right whitespace-nowrap">
                        Advance
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-right whitespace-nowrap">
                        Paid
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-right whitespace-nowrap">
                        Pending
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-center whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-right whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((adv, idx) => (
                      <tr
                        key={adv.name || idx}
                        className={`border-b border-theme last:border-0 ${idx % 2 === 1 ? "bg-app" : "bg-card"}`}
                      >
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                          {adv.employee}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted break-words">
                          {adv.employee_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted break-words">
                          {adv.company || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted break-words">
                          {adv.department || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                          {adv.posting_date || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-main tabular-nums text-right whitespace-nowrap">
                          {Number(adv.advance_amount || 0).toLocaleString(
                            "en-ZM",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-main tabular-nums text-right whitespace-nowrap">
                          {Number(adv.paid_amount || 0).toLocaleString(
                            "en-ZM",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-main tabular-nums text-right whitespace-nowrap">
                          {Number(adv.pending_amount || 0).toLocaleString(
                            "en-ZM",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${adv.status?.toLowerCase() === "unpaid" ? "bg-danger/10 text-danger border-danger/20" : adv.status?.toLowerCase() === "draft" ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"}`}
                          >
                            {adv.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Btn
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedName(
                                String(adv.name || "").trim() || null,
                              )
                            }
                            icon={<Eye className="w-4 h-4" />}
                            disabled={!adv.name}
                          >
                            View
                          </Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-4 py-3 bg-app border-t border-theme flex items-center justify-between">
              <div className="text-xs text-muted">
                Page {page} of{" "}
                {searchQuery
                  ? searchTotalPages
                  : (advancesPage?.pagination?.total_pages ?? 1)}
              </div>
              <div className="flex items-center gap-2">
                <Btn
                  size="sm"
                  variant="outline"
                  disabled={listLoading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Btn>
                <Btn
                  size="sm"
                  variant="outline"
                  disabled={
                    listLoading ||
                    (searchQuery
                      ? page >= searchTotalPages
                      : !(advancesPage?.pagination?.has_next ?? false))
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {selectedName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-theme w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="bg-app px-6 py-4 flex items-center justify-between border-b border-theme">
              <div>
                <h3 className="text-lg font-bold text-main">{selectedName}</h3>
                <p className="text-xs text-muted flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" /> Advance Request
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-extrabold">
                  {selectedDetail?.status || "—"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedName(null)}
                  className="p-2 rounded-lg hover:bg-card text-muted hover:text-main transition"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {detailLoading ? (
                <div className="flex justify-center p-10">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted" />
                </div>
              ) : selectedDetail ? (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Field
                      label="Employee ID"
                      value={selectedDetail.employee}
                    />
                    <Field
                      label="Employee Name"
                      value={selectedDetail.employee_name}
                    />
                    <Field label="Company" value={selectedDetail.company} />
                    <Field
                      label="Department"
                      value={selectedDetail.department}
                    />
                    <Field
                      label="Posting Date"
                      value={selectedDetail.posting_date}
                    />
                    <Field
                      label="Advance Amount"
                      value={Number(
                        selectedDetail.advance_amount || 0,
                      ).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
                    />
                    <Field
                      label="Paid Amount"
                      value={Number(
                        selectedDetail.paid_amount || 0,
                      ).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
                    />
                    <Field
                      label="Pending Amount"
                      value={Number(
                        selectedDetail.pending_amount || 0,
                      ).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
                    />
                    <Field
                      label="Claimed Amount"
                      value={Number(
                        selectedDetail.claimed_amount || 0,
                      ).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
                    />
                    <Field
                      label="Return Amount"
                      value={Number(
                        selectedDetail.return_amount || 0,
                      ).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
                    />
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                      Purpose
                    </p>
                    <div className="bg-muted/5 p-4 rounded-lg border border-theme min-h-24">
                      <p className="text-sm font-medium text-main leading-relaxed whitespace-pre-wrap break-words">
                        {String(selectedDetail.purpose ?? "").trim() || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted">No details found.</div>
              )}
            </div>
            <div className="px-6 py-4 bg-app border-t border-theme flex items-center justify-end">
              <Btn
                type="button"
                onClick={() => setSelectedName(null)}
                variant="outline"
              >
                Close
              </Btn>
            </div>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-theme w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-app px-6 py-4 flex items-center justify-between border-b border-theme">
              <div>
                <h3 className="text-base font-bold text-main">
                  New Advance Request
                </h3>
                <p className="text-xs text-muted">
                  Submit a new salary advance request
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 rounded-lg hover:bg-card text-muted hover:text-main transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="advance-create-form"
              onSubmit={handleCreate}
              className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-main mb-1.5 uppercase tracking-wider">
                  Employee
                </label>
                <div className="relative">
                  <input
                    required
                    value={employeeQuery}
                    onChange={(e) => {
                      setEmployeeQuery(e.target.value);
                      setEmployeeDropdownOpen(true);
                    }}
                    onFocus={() => setEmployeeDropdownOpen(true)}
                    placeholder={
                      employeeListLoading
                        ? "Loading employees..."
                        : "Search employee by ID or name"
                    }
                    className="w-full px-3 py-2 bg-card border border-theme rounded-md text-sm text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition-colors"
                  />

                  {employeeDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-card border border-theme rounded-lg shadow-lg max-h-60 overflow-auto">
                      {employeeListLoading ? (
                        <div className="p-3 text-sm text-muted flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Loading...
                        </div>
                      ) : filteredEmployees.length > 0 ? (
                        filteredEmployees.map((e: any, idx: number) => {
                          const code = String(
                            e?.employeeId ??
                              e?.employee_id ??
                              e?.id ??
                              e?.name ??
                              "",
                          ).trim();
                          const dept = String(
                            e?.department ??
                              e?.employmentInfo?.Department ??
                              e?.employmentInfo?.department ??
                              "",
                          ).trim();
                          return (
                            <button
                              key={code || idx}
                              type="button"
                              onClick={() => {
                                if (code) {
                                  setCreateData({
                                    ...createData,
                                    employee: code,
                                    department: dept || createData.department,
                                  });
                                }
                                setDepartmentLocked(Boolean(dept));
                                setEmployeeQuery(resolveEmployeeLabel(e));
                                setEmployeeDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/5 transition-colors"
                            >
                              <div className="text-main font-medium truncate">
                                {resolveEmployeeLabel(e)}
                              </div>
                              {dept ? (
                                <div className="text-xs text-muted truncate">
                                  {dept}
                                </div>
                              ) : null}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-sm text-muted">
                          No employees found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted">
                  Selected: {createData.employee || "—"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1.5 uppercase tracking-wider">
                  Department
                </label>
                <select
                  required
                  value={createData.department}
                  onChange={(e) =>
                    setCreateData({ ...createData, department: e.target.value })
                  }
                  disabled={departmentLocked}
                  className={`w-full px-3 py-2 bg-card border border-theme rounded-md text-sm text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition-colors ${departmentLocked ? "opacity-80 cursor-not-allowed" : ""}`}
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {departmentLocked ? (
                  <div className="mt-1 text-[11px] text-muted">
                    Auto-filled from employee
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1.5 uppercase tracking-wider">
                  Advance Amount
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={createData.advance_amount || ""}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      advance_amount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-card border border-theme rounded-md text-sm text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-main mb-1.5 uppercase tracking-wider">
                  Purpose
                </label>
                <input
                  required
                  value={createData.purpose}
                  onChange={(e) =>
                    setCreateData({ ...createData, purpose: e.target.value })
                  }
                  placeholder="e.g. Medical emergency"
                  className="w-full px-3 py-2 bg-card border border-theme rounded-md text-sm text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition-colors"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-3 mt-1">
                <label className="flex items-center gap-2 text-sm font-medium text-main select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-theme text-primary focus:ring-2 focus:ring-[rgba(204,0,0,0.12)]"
                    checked={
                      createData.repay_unclaimed_amount_from_salary === 1
                    }
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        repay_unclaimed_amount_from_salary: e.target.checked
                          ? 1
                          : 0,
                      })
                    }
                  />
                  Repay unclaimed amount from salary
                </label>
              </div>
            </form>

            <div className="px-6 py-4 bg-app border-t border-theme flex items-center justify-end gap-2">
              <Btn
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Btn>
              <Btn
                form="advance-create-form"
                type="submit"
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "Submit Request"
                )}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
      {label}
    </p>
    <div className="bg-muted/5 p-3 rounded-lg border border-theme">
      <p className="text-sm font-semibold text-main break-words">
        {value || "—"}
      </p>
    </div>
  </div>
);
