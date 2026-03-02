import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronLeft,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { getEmployeeById } from "../../../api/employeeapi";
import { calculateZmPayrollFromGross } from "./util";
import { useAssignedSalaryStructure } from "../../../hooks/useAssignedSalaryStructure";
import { toSalaryStructureMoneyRows } from "../../../utils/salaryStructureDisplay";

interface EmployeeDetailsPageProps {
  employeeId: string;
  onBack: () => void;
}

type AnyRecord = Record<string, any>;

const isNil = (v: any) => v === null || v === undefined || v === "";

const toTitle = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const formatValue = (value: any): React.ReactNode => {
  if (isNil(value)) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    const allPrimitive = value.every(
      (v) => v === null || v === undefined || ["string", "number", "boolean"].includes(typeof v),
    );
    if (allPrimitive) return value.map((v) => String(v)).join(", ");
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, v]) => !isNil(v))
      .filter(([, v]) => ["string", "number", "boolean"].includes(typeof v))
      .slice(0, 4)
      .map(([k, v]) => `${toTitle(k)}: ${String(v)}`);
    return entries.length ? entries.join(" · ") : "—";
  }
  return String(value);
};

const KeyValueGrid: React.FC<{ data: AnyRecord; columns?: 2 | 3 | 4 }> = ({ data, columns = 2 }) => {
  const entries = useMemo(
    () =>
      Object.entries(data)
        .filter(([, v]) => !isNil(v))
        .sort(([a], [b]) => a.localeCompare(b)),
    [data],
  );

  if (!entries.length) return <div className="text-sm text-muted">No information available</div>;

  return (
    <div
      className={`grid grid-cols-1 gap-y-6 gap-x-8 ${columns === 4
          ? "md:grid-cols-4"
          : columns === 3
            ? "md:grid-cols-3"
            : "md:grid-cols-2"
        }`}
    >
      {entries.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <div className="text-xs text-muted font-medium mb-1 capitalize border-none">
            {toTitle(k)}
          </div>
          <div className="text-sm font-medium text-main break-words">{formatValue(v)}</div>
        </div>
      ))}
    </div>
  );
};

const EmployeeDetailsPage: React.FC<EmployeeDetailsPageProps> = ({ employeeId, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "employment" | "compensation" | "documents">(
    "personal",
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await getEmployeeById(employeeId);
        if (!mounted) return;
        setData(resp);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load employee details");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const employeeName =
    [
      data?.name,
      data?.employeeName,
      data?.personalInfo?.FirstName,
      data?.personalInfo?.OtherNames,
      data?.personalInfo?.LastName,
    ]
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .join(" ")
      .trim() ||
    data?.employeeId ||
    "Employee";

  const profilePictureUrl = data?.ProfilePicture || null;

  const headerJobTitle = String(data?.employmentInfo?.JobTitle ?? data?.jobTitle ?? "");
  const headerDepartment = String(data?.employmentInfo?.Department ?? data?.department ?? "");
  const headerStatus = String(data?.status ?? data?.employmentInfo?.Status ?? "").trim() || "—";
  const headerEmail = String(data?.email ?? data?.contactInfo?.Email ?? "");
  const employeeCode = String(data?.employeeId ?? data?.identityInfo?.EmployeeId ?? "");

  const {
    assignedSalaryStructureName,
    assignedSalaryStructureFromDate,
    salaryStructureDetail,
  } = useAssignedSalaryStructure(employeeCode);

  const identityInfo = (data?.identityInfo || {}) as AnyRecord;
  const personalInfo = (data?.personalInfo || {}) as AnyRecord;
  const contactInfo = (data?.contactInfo || {}) as AnyRecord;
  const employmentInfo = (data?.employmentInfo || {}) as AnyRecord;
  const payrollInfo = (data?.payrollInfo || {}) as AnyRecord;
  const bankInfo = (payrollInfo?.bankAccount || {}) as AnyRecord;
  const statutory = (payrollInfo?.statutoryDeductions || {}) as AnyRecord;
  const documents = (data?.documents || []) as any[];

  const assignedStructureLabel = useMemo(() => {
    const name = String(assignedSalaryStructureName ?? "").trim();
    if (!name) return "—";
    const fd = String(assignedSalaryStructureFromDate ?? "").trim();
    return fd ? `${name} (from ${fd})` : name;
  }, [assignedSalaryStructureFromDate, assignedSalaryStructureName]);

  const grossSalaryForCalc = useMemo(() => {
    const v =
      data?.grossSalary ??
      payrollInfo?.grossSalary ??
      payrollInfo?.GrossSalary ??
      payrollInfo?.basicSalary ??
      payrollInfo?.BasicSalary ??
      data?.basicSalary ??
      0;
    const direct = Number(v ?? 0);
    if (Number.isFinite(direct) && direct > 0) return direct;

    const earnings = Array.isArray(salaryStructureDetail?.earnings) ? salaryStructureDetail.earnings : [];
    const fromStructure = earnings.reduce((sum: number, e: any) => sum + (Number(e?.amount ?? 0) || 0), 0);
    return Number(fromStructure ?? 0) || 0;
  }, [data, payrollInfo, salaryStructureDetail]);

  const statutoryCalc = useMemo(() => {
    const rates = {
      napsaEmployeeRate: statutory?.napsaEmployeeRate,
      napsaEmployerRate: statutory?.napsaEmployerRate,
      nhimaRate: statutory?.nhimaRate,
    };

    return calculateZmPayrollFromGross(grossSalaryForCalc, {
      rates,
    });
  }, [grossSalaryForCalc, statutory]);

  const profileInfo = useMemo(
    () => ({ ...identityInfo, ...personalInfo, ...contactInfo }),
    [identityInfo, personalInfo, contactInfo],
  );

  const payrollMain = useMemo(() => {
    const copy = { ...(payrollInfo || {}) } as AnyRecord;
    delete copy.bankAccount;
    delete copy.statutoryDeductions;
    return copy;
  }, [payrollInfo]);

  const employmentCompact = useMemo(() => {
    const omit = new Set(
      [
        "department",
        "jobtitle",
        "worklocation",
        "branch",
        "status",
        "email",
        "salarybreakdown",
        "weeklyschedule",
      ].map((s) => s.toLowerCase()),
    );
    const out: AnyRecord = {};
    Object.entries(employmentInfo || {}).forEach(([k, v]) => {
      if (omit.has(String(k).toLowerCase())) return;
      out[k] = v;
    });
    return out;
  }, [employmentInfo]);

  const weeklyScheduleRows = useMemo(() => {
    const raw =
      (employmentInfo as any)?.weeklySchedule ??
      (employmentInfo as any)?.WeeklySchedule ??
      (employmentInfo as any)?.weekly_schedule ??
      null;

    const normalize = (day: any) => {
      const d = String(day ?? "").trim();
      if (!d) return "";
      return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
    };

    if (!raw) return [] as { day: string; time: string }[];

    if (Array.isArray(raw)) {
      return raw
        .map((x: any) => ({
          day: normalize(x?.day ?? x?.Day ?? x?.name ?? x?.label),
          time: String(x?.time ?? x?.Time ?? x?.hours ?? x?.value ?? "").trim(),
        }))
        .filter((r: any) => r.day && r.time);
    }

    if (typeof raw === "object") {
      return Object.entries(raw)
        .map(([k, v]) => ({ day: normalize(k), time: String(v ?? "").trim() }))
        .filter((r) => r.day && r.time);
    }

    const s = String(raw).trim();
    if (!s) return [] as { day: string; time: string }[];

    return s
      .split(/\s*[·,]\s*/g)
      .map((part) => {
        const p = String(part ?? "").trim();
        if (!p) return null;
        const idx = p.indexOf(":");
        if (idx === -1) return null;
        const day = normalize(p.slice(0, idx));
        const time = p.slice(idx + 1).trim();
        if (!day || !time) return null;
        return { day, time };
      })
      .filter(Boolean) as { day: string; time: string }[];
  }, [employmentInfo]);

  const payrollCompact = useMemo(() => {
    const omit = new Set(
      [
        "grosssalary",
        "basicsalary",
        "salarybreakdown",
        "department",
        "jobtitle",
        "worklocation",
      ].map((s) => s.toLowerCase()),
    );
    const out: AnyRecord = {};
    Object.entries(payrollMain || {}).forEach(([k, v]) => {
      if (omit.has(String(k).toLowerCase())) return;
      out[k] = v;
    });
    return out;
  }, [payrollMain]);

  const salaryBreakdown = useMemo(() => {
    const basic = payrollInfo?.basicSalary ?? payrollInfo?.BasicSalary ?? data?.basicSalary;
    const totalAllowances = payrollInfo?.allowances ?? payrollInfo?.Allowances ?? data?.allowances;
    const breakdown = payrollInfo?.salaryBreakdown ?? payrollInfo?.SalaryBreakdown ?? null;

    const earnings = Array.isArray(salaryStructureDetail?.earnings) ? salaryStructureDetail.earnings : [];
    if (earnings.length > 0) {
      return earnings
        .map((e: any) => ({ label: String(e?.component ?? "").trim(), amount: e?.amount }))
        .filter((r: any) => r.label && r.amount !== undefined && r.amount !== null);
    }

    if (Array.isArray(breakdown)) {
      return breakdown
        .map((x: any) => ({ label: String(x?.label ?? x?.name ?? ""), amount: x?.amount }))
        .filter((x: any) => x.label && x.amount !== undefined && x.amount !== null);
    }

    if (breakdown && typeof breakdown === "object") {
      return Object.entries(breakdown)
        .map(([k, v]) => ({ label: toTitle(String(k)), amount: v }))
        .filter((x) => x.label && x.amount !== undefined && x.amount !== null);
    }

    const rows: { label: string; amount: any }[] = [];
    if (basic !== undefined && basic !== null && basic !== "") rows.push({ label: "Basic Salary", amount: basic });
    if (totalAllowances !== undefined && totalAllowances !== null && totalAllowances !== "") rows.push({ label: "Allowances", amount: totalAllowances });
    return rows;
  }, [data?.allowances, data?.basicSalary, payrollInfo, salaryStructureDetail]);

  const currency = String(payrollInfo?.currency ?? "ZMW").trim() || "ZMW";

  const hasStructureDeductions = useMemo(() => {
    const d = Array.isArray((salaryStructureDetail as any)?.deductions)
      ? (salaryStructureDetail as any).deductions
      : [];
    return d.length > 0;
  }, [salaryStructureDetail]);

  const totalEarnings = useMemo(() => {
    return (salaryBreakdown || []).reduce((s: number, r: any) => s + (Number(r?.amount ?? 0) || 0), 0);
  }, [salaryBreakdown]);

  const structureDeductionRows = useMemo(() => {
    const d = Array.isArray((salaryStructureDetail as any)?.deductions)
      ? (salaryStructureDetail as any).deductions
      : [];
    return toSalaryStructureMoneyRows(d);
  }, [salaryStructureDetail]);

  const totalDeductions = useMemo(() => {
    if (hasStructureDeductions) {
      return structureDeductionRows.reduce((s: number, r: any) => s + (Number(r?.amount ?? 0) || 0), 0);
    }

    return (
      (Number(statutoryCalc?.statutory?.napsaEmployee ?? 0) || 0) +
      (Number(statutoryCalc?.statutory?.nhima ?? 0) || 0) +
      (Number(statutoryCalc?.statutory?.paye ?? 0) || 0)
    );
  }, [hasStructureDeductions, statutoryCalc, structureDeductionRows]);

  const netSalary = useMemo(() => {
    return (Number(totalEarnings ?? 0) || 0) - (Number(totalDeductions ?? 0) || 0);
  }, [totalDeductions, totalEarnings]);

  const getStatusBadge = () => {
    const statusLower = String(headerStatus ?? "").toLowerCase();
    if (statusLower === "active") return "bg-green-50 text-green-700 border-green-200";
    if (statusLower === "inactive" || statusLower === "terminated")
      return "bg-red-50 text-red-700 border-red-200";
    if (statusLower === "on leave") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: <User className="w-4 h-4" /> },
    { id: "employment", label: "Employment", icon: <Briefcase className="w-4 h-4" /> },
    { id: "compensation", label: "Compensation", icon: <DollarSign className="w-4 h-4" /> },
    { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 text-muted hover:text-main text-sm font-medium transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-muted/10 border border-border rounded-full flex items-center justify-center text-primary text-xl font-bold shrink-0">
              {String(employeeName || "E").trim().charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-main truncate">{employeeName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {headerJobTitle || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {headerDepartment || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded text-xs font-medium border ${getStatusBadge()}`}>
              {headerStatus}
            </div>
            <div className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-muted/10 border border-border text-main">
              ID: {employeeCode || employeeId || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        {loading ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted">Loading employee details…</div>
        ) : error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm font-semibold text-danger">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-bold text-main mb-4 border-b border-border pb-2">Contact Info</h3>
                <div className="space-y-4">
                  <QuickDetail icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={headerEmail} />
                  <QuickDetail icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={contactInfo?.phoneNumber} />
                  <QuickDetail icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={employmentInfo?.workLocation} />
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-bold text-main mb-4 border-b border-border pb-2">Compensation Summary</h3>

                <div className="mb-4">
                  <p className="text-xs text-muted mb-1">Net</p>
                  <p className="text-xl font-bold text-main tabular-nums">
                    {currency} {Number(netSalary || 0).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted mb-1">Gross</p>
                    <p className="text-sm font-semibold text-main tabular-nums">
                      {currency} {Number(totalEarnings || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Deductions</p>
                    <p className="text-sm font-semibold text-main tabular-nums">
                      {currency} {Number(totalDeductions || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9">
              <div className="flex overflow-x-auto border-b border-border mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-main hover:border-border"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-card rounded-lg border border-border p-6 md:p-8 min-h-[500px]">
                {activeTab === "personal" && (
                  <div className="space-y-8 max-w-5xl">
                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">Profile</h2>
                      <KeyValueGrid data={profileInfo} columns={4} />
                    </section>
                  </div>
                )}

                {activeTab === "employment" && (
                  <div className="space-y-8 max-w-5xl">
                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">Employment & Payroll</h2>
                      <KeyValueGrid columns={4} data={{ ...(employmentCompact || {}), ...(payrollCompact || {}) }} />
                    </section>

                    {weeklyScheduleRows.length > 0 && (
                      <section>
                        <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">Weekly Schedule</h2>
                        <div className="overflow-x-auto border border-border rounded-lg">
                          <table className="w-full">
                            <thead className="bg-muted/5 border-b border-border">
                              <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-muted text-left whitespace-nowrap">Day</th>
                                <th className="px-4 py-3 text-xs font-semibold text-muted text-left whitespace-nowrap">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {weeklyScheduleRows.map((r) => (
                                <tr key={r.day} className="border-b border-border last:border-0">
                                  <td className="px-4 py-3 text-sm font-medium text-main whitespace-nowrap">{r.day}</td>
                                  <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{r.time}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === "compensation" && (
                  <div className="space-y-8 max-w-5xl">
                    <div className="bg-muted/5 border border-border rounded-lg p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Assigned Salary Structure</p>
                          <h2 className="text-xl font-bold text-main">
                            {String(assignedSalaryStructureName ?? "").trim() || "No Structure Assigned"}
                          </h2>
                          {String(assignedSalaryStructureFromDate ?? "").trim() ? (
                            <p className="text-sm text-muted mt-1">Effective from: {assignedSalaryStructureFromDate}</p>
                          ) : null}
                        </div>

                        <div className="md:text-right">
                          <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Net</p>
                          <h3 className="text-2xl font-bold text-main tabular-nums">
                            {currency} {Number(netSalary || 0).toLocaleString()}
                          </h3>
                          <div className="flex md:justify-end gap-6 mt-2 text-sm">
                            <div>
                              <span className="text-muted mr-1">Gross:</span>
                              <span className="font-medium">{Number(totalEarnings || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted mr-1">Deductions:</span>
                              <span className="font-medium">{Number(totalDeductions || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <section>
                        <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">Earnings</h2>
                        <div className="space-y-0 text-sm">
                          {salaryBreakdown.length ? (
                            salaryBreakdown.map((r: any) => (
                              <div key={r.label} className="flex justify-between py-2.5 border-b border-border/50">
                                <span className="text-main">{r.label}</span>
                                <span className="font-medium text-main tabular-nums">
                                  {currency} {Number(r.amount ?? 0).toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-muted font-medium py-2">—</div>
                          )}
                          <div className="flex justify-between py-3 font-bold mt-2">
                            <span className="text-main">Total Gross</span>
                            <span className="text-main tabular-nums">
                              {currency} {Number(totalEarnings || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">Deductions</h2>
                        <div className="space-y-0 text-sm">
                          {hasStructureDeductions ? (
                            structureDeductionRows.map((d: any) => (
                              <div key={d.label} className="flex justify-between py-2.5 border-b border-border/50">
                                <span className="text-main">{d.label}</span>
                                <span className="font-medium text-main tabular-nums">
                                  {currency} {Number(d.amount ?? 0).toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            [
                              {
                                label: "Napsa Employee",
                                rate: statutoryCalc?.rates?.napsaEmployeeRate,
                                amount: statutoryCalc?.statutory?.napsaEmployee,
                              },
                              {
                                label: "Napsa Employer",
                                rate: statutoryCalc?.rates?.napsaEmployerRate,
                                amount: statutoryCalc?.statutory?.napsaEmployer,
                              },
                              {
                                label: "Nhima",
                                rate: statutoryCalc?.rates?.nhimaRate,
                                amount: statutoryCalc?.statutory?.nhima,
                              },
                              {
                                label: "Paye",
                                rate: null,
                                amount: statutoryCalc?.statutory?.paye,
                              },
                            ].map((r) => (
                              <div key={r.label} className="flex justify-between py-2.5 border-b border-border/50">
                                <span className="text-main">{r.label}</span>
                                <span className="font-medium text-main tabular-nums">
                                  {r.rate === null || r.rate === undefined ? "" : `${Number(r.rate)}% • `}
                                  {currency} {Number(r.amount ?? 0).toLocaleString()}
                                </span>
                              </div>
                            ))
                          )}
                          <div className="flex justify-between py-3 font-bold mt-2">
                            <span className="text-main">Total Deductions</span>
                            <span className="text-main tabular-nums">
                              {currency} {Number(totalDeductions || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </section>
                    </div>

                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">Bank</h2>
                      <KeyValueGrid data={bankInfo} columns={3} />
                    </section>
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="space-y-6 max-w-5xl">
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-main">Employee Documents</h2>
                        <p className="text-sm text-muted mt-1">Files and identification documents</p>
                      </div>
                      <div className="text-sm text-muted font-medium">{Array.isArray(documents) ? documents.length : 0}</div>
                    </div>

                    {Array.isArray(documents) && documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc, idx) => (
                          <div key={idx} className="border border-border rounded-lg p-4 hover:bg-muted/5 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-muted/10 rounded text-muted">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="text-sm font-semibold text-main truncate">{String((doc as any)?.description ?? (doc as any)?.name ?? "Document")}</div>
                            </div>
                            <KeyValueGrid data={(doc || {}) as AnyRecord} columns={4} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-border rounded-lg bg-muted/5">
                        <FileText className="w-8 h-8 text-muted mx-auto mb-3" />
                        <h3 className="text-sm font-medium text-main mb-1">No Documents Found</h3>
                        <p className="text-sm text-muted">No documents uploaded for this employee.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;

const QuickDetail = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
}) => (
  <div className="flex items-center gap-3">
    <div className="text-muted flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-main truncate">{value || "—"}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  </div>
);
