import React, { useEffect, useMemo, useState } from "react";
import { Users, DollarSign, Calculator, Crown } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAllCustomers } from "../../api/customerApi";
import { getAllSalesInvoices } from "../../api/salesApi";
import { getExchangeRate } from "../../api/exchangeRateApi";
import { showApiError } from "../../utils/alert";
import type { CustomerSummary } from "../../types/customer";

function exportToCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",") + "\n";
  const body = rows
    .map((row) =>
      Object.values(row)
        .map((s) => `"${String(s ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CRMReports: React.FC = () => {
  const [filters, setFilters] = useState({
    dateRange: "last_30" as "last_7" | "last_30" | "last_90" | "ytd",
    type: "all" as "all" | "Company" | "Individual",
    currency: "ZMW" as "ZMW" | "USD" | "ZAR" | "GBP" | "CNY" | "EUR",
    search: "",
  });

  const chartColors = useMemo(
    () => ({
      primary: "var(--primary)",
      primary700: "var(--primary-700)",
      brandBlue: "var(--brand-blue-bottom)",
      brandBlueTop: "var(--brand-blue-top)",
      success: "var(--success)",
      danger: "var(--danger)",
      warning: "#f59e0b",
      purple: "#a855f7",
    }),
    [],
  );

  const [topCustomersPage, setTopCustomersPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [selectedCurrencyRate, setSelectedCurrencyRate] = useState<number>(1);

  const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
  const startDateForRange = (range: typeof filters.dateRange): Date => {
    const now = new Date();
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);

    if (range === "last_7") {
      d.setDate(d.getDate() - 6);
      return d;
    }
    if (range === "last_30") {
      d.setDate(d.getDate() - 29);
      return d;
    }
    if (range === "last_90") {
      d.setDate(d.getDate() - 89);
      return d;
    }
    return new Date(new Date().getFullYear(), 0, 1);
  };

  const isWithinRange = (raw: any, start: Date): boolean => {
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return false;
    return dt >= start;
  };

  const normalizeInvoiceTotalToSelected = (inv: any): number => {
    const total = Number(inv?.totalAmount ?? inv?.total ?? 0);
    if (!Number.isFinite(total)) return 0;

    const currency = String(inv?.currency ?? "")
      .trim()
      .toUpperCase();
    const exchangeRate = Number(inv?.exchangeRate ?? inv?.exchangeRt ?? 1);

    const amountZmw =
      currency &&
      currency !== "ZMW" &&
      Number.isFinite(exchangeRate) &&
      exchangeRate > 0
        ? total * exchangeRate
        : total;

    if (filters.currency === "ZMW") return amountZmw;

    const rate = Number(selectedCurrencyRate);
    if (!Number.isFinite(rate) || rate <= 0) return 0;
    return amountZmw / rate;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);

        const start = startDateForRange(filters.dateRange);

        const currencyRate =
          filters.currency === "ZMW"
            ? 1
            : Number((await getExchangeRate(filters.currency)).exchange_rate);

        if (!Number.isFinite(currencyRate) || currencyRate <= 0) {
          throw new Error("Invalid exchange rate");
        }

        const customersRes = await getAllCustomers(1, 5000);
        const customerRows: CustomerSummary[] = Array.isArray(
          customersRes?.data,
        )
          ? customersRes.data
          : [];

        let allInvoices: any[] = [];
        let current = 1;
        let totalPages = 1;
        do {
          const invRes = await getAllSalesInvoices(current, 200, "", "asc");
          if (invRes?.status_code === 200) {
            const rows = Array.isArray(invRes?.data) ? invRes.data : [];
            allInvoices = allInvoices.concat(rows);
            totalPages = invRes.pagination?.total_pages || 1;
          } else {
            totalPages = 1;
          }
          current++;
        } while (current <= totalPages && current <= 50);

        const invoicesInRange = allInvoices.filter((inv) =>
          isWithinRange(inv?.dateOfInvoice, start),
        );

        if (cancelled) return;
        setSelectedCurrencyRate(currencyRate);
        setCustomers(customerRows);
        setInvoices(invoicesInRange);
      } catch (err) {
        if (!cancelled) showApiError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [filters.dateRange, filters.currency]);

  const currencyFormatter = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const tooltipLight = {
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(148,163,184,0.35)",
    borderRadius: 12,
    color: "rgba(15,23,42,1)",
    fontSize: 12,
  } as const;

  const safeKey = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return "";
  };

  const normalizeCustomerType = (
    raw: unknown,
  ): "Company" | "Individual" | "" => {
    const t = safeKey(raw).trim().toLowerCase();
    if (t === "company") return "Company";
    if (t === "individual") return "Individual";
    return "";
  };

  const customersFilteredByType = useMemo(() => {
    if (filters.type === "all") return customers;
    return customers.filter(
      (c) => normalizeCustomerType(c.type) === filters.type,
    );
  }, [customers, filters.type]);

  const typeDistribution = useMemo(() => {
    const company = customers.filter(
      (c) => normalizeCustomerType(c.type) === "Company",
    ).length;
    const individual = customers.filter(
      (c) => normalizeCustomerType(c.type) === "Individual",
    ).length;
    return [
      { label: "Company", value: company, color: "var(--brand-blue-bottom)" },
      { label: "Individual", value: individual, color: "var(--primary)" },
    ];
  }, [customers]);

  const currencyDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of customersFilteredByType) {
      const cur =
        String(c.currency ?? "")
          .trim()
          .toUpperCase() || "UNKNOWN";
      map.set(cur, (map.get(cur) ?? 0) + 1);
    }
    const palette = [
      chartColors.brandBlue,
      chartColors.primary,
      chartColors.brandBlueTop,
      chartColors.success,
      chartColors.danger,
      chartColors.warning,
    ];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count], idx) => ({
        label,
        value: count,
        color: palette[idx],
      }));
  }, [customersFilteredByType, chartColors]);

  const totalRevenue = useMemo(
    () =>
      invoices.reduce(
        (sum, inv) => sum + normalizeInvoiceTotalToSelected(inv),
        0,
      ),
    [invoices, selectedCurrencyRate, filters.currency],
  );

  const avgOrderValue = useMemo(() => {
    if (!invoices.length) return 0;
    return totalRevenue / invoices.length;
  }, [invoices.length, totalRevenue]);

  const activityTrendChartData = useMemo(() => {
    const start = startDateForRange(filters.dateRange);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const buckets: Array<{
      key: string;
      label: string;
      tooltipLabel: string;
      start: Date;
      end: Date;
    }> = [];

    const fmtDay = (d: Date) =>
      d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });

    const fmtAxisDay = (d: Date) =>
      d.toLocaleDateString(undefined, {
        year: "2-digit",
        month: "short",
        day: "2-digit",
      });

    if (filters.dateRange === "last_7") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const e = new Date(d);
        e.setDate(e.getDate() + 1);
        buckets.push({
          key: toDateInput(d),
          label: fmtAxisDay(d),
          tooltipLabel: fmtDay(d),
          start: d,
          end: e,
        });
      }
    } else if (filters.dateRange === "ytd") {
      const year = now.getFullYear();
      const monthCount = now.getMonth() + 1;
      for (let m = 0; m < monthCount; m++) {
        const d = new Date(year, m, 1);
        const e = new Date(year, m + 1, 1);
        buckets.push({
          key: `${year}-${String(m + 1).padStart(2, "0")}`,
          label: d.toLocaleDateString(undefined, { month: "short" }),
          tooltipLabel: d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
          }),
          start: d,
          end: e,
        });
      }
    } else {
      const weeks = filters.dateRange === "last_90" ? 12 : 5;
      const totalDays = filters.dateRange === "last_90" ? 90 : 30;
      const step = Math.ceil(totalDays / weeks);
      for (let w = 0; w < weeks; w++) {
        const d = new Date(start);
        d.setDate(d.getDate() + w * step);
        const e = new Date(d);
        e.setDate(e.getDate() + step);
        const eInclusive = new Date(e);
        eInclusive.setDate(eInclusive.getDate() - 1);
        buckets.push({
          key: `w${w + 1}`,
          label: fmtAxisDay(d),
          tooltipLabel: `${fmtDay(d)} - ${fmtDay(eInclusive)}`,
          start: d,
          end: e,
        });
      }
    }

    const counts = buckets.map((b) => {
      const c = invoices.reduce((acc, inv) => {
        const dt = new Date(inv?.dateOfInvoice);
        if (Number.isNaN(dt.getTime())) return acc;
        if (dt >= b.start && dt < b.end) return acc + 1;
        return acc;
      }, 0);

      return { name: b.label, value: c, tooltipLabel: b.tooltipLabel };
    });

    return counts;
  }, [filters.dateRange, invoices]);

  const typeChartData = useMemo(
    () => typeDistribution.map((x) => ({ name: x.label, value: x.value })),
    [typeDistribution],
  );

  const currencyChartData = useMemo(
    () => currencyDistribution.map((x) => ({ name: x.label, value: x.value })),
    [currencyDistribution],
  );

  const customerReportRows = useMemo(() => {
    const q = String(filters.search ?? "")
      .trim()
      .toLowerCase();
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        type: string;
        currency: string;
        invoices: number;
        revenue: number;
        lastInvoice: string;
      }
    >();

    const customersIndex = new Map<string, CustomerSummary>();

    const addCustomerKey = (k: unknown, c: CustomerSummary) => {
      const key = safeKey(k).trim().toLowerCase();
      if (!key) return;
      if (!customersIndex.has(key)) customersIndex.set(key, c);
    };

    for (const c of customersFilteredByType) {
      addCustomerKey(c.id, c);
      addCustomerKey(c.name, c);
      addCustomerKey((c as any).displayName, c);
    }

    for (const inv of invoices) {
      const invCustomerId =
        inv?.customerId ??
        inv?.customerCode ??
        inv?.customer_id ??
        inv?.customer;
      const invCustomerName = String(inv?.customerName ?? "").trim();

      const customer =
        customersIndex.get(
          String(invCustomerId ?? "")
            .trim()
            .toLowerCase(),
        ) ??
        customersIndex.get(invCustomerName.toLowerCase()) ??
        null;

      const type = normalizeCustomerType(customer?.type);
      if (filters.type !== "all" && type !== filters.type) continue;

      const displayName = String((customer as any)?.displayName ?? "").trim();
      const name =
        invCustomerName ||
        displayName ||
        String(customer?.name ?? "").trim() ||
        "Unknown";
      const key = name.toLowerCase();

      const existing = map.get(key);
      const dt = new Date(inv?.dateOfInvoice);
      const dtStr = Number.isNaN(dt.getTime())
        ? ""
        : dt.toISOString().slice(0, 10);
      const rev = normalizeInvoiceTotalToSelected(inv);

      if (!existing) {
        map.set(key, {
          id: String(customer?.id ?? invCustomerId ?? name),
          name,
          type,
          currency: String(customer?.currency ?? inv?.currency ?? ""),
          invoices: 1,
          revenue: rev,
          lastInvoice: dtStr,
        });
      } else {
        existing.invoices += 1;
        existing.revenue += rev;
        if (dtStr && (!existing.lastInvoice || dtStr > existing.lastInvoice)) {
          existing.lastInvoice = dtStr;
        }
      }
    }

    const rows = Array.from(map.values())
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.id} ${r.name} ${r.currency} ${r.type}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => b.revenue - a.revenue);

    return rows;
  }, [
    filters.search,
    filters.type,
    customersFilteredByType,
    invoices,
    selectedCurrencyRate,
    filters.currency,
  ]);

  const top10ByRevenue = useMemo(
    () => customerReportRows.slice(0, 10),
    [customerReportRows],
  );

  const topCustomers = customerReportRows;

  useEffect(() => {
    setTopCustomersPage(1);
  }, [filters.dateRange, filters.currency, filters.type]);

  const topCustomersPageSize = 10;
  const topCustomersTotalPages = Math.max(
    1,
    Math.ceil(topCustomers.length / topCustomersPageSize),
  );
  const topCustomersPageRows = useMemo(() => {
    const p = Math.min(Math.max(1, topCustomersPage), topCustomersTotalPages);
    const start = (p - 1) * topCustomersPageSize;
    return topCustomers.slice(start, start + topCustomersPageSize);
  }, [topCustomers, topCustomersPage, topCustomersTotalPages]);

  const topCustomer = top10ByRevenue[0] ?? null;

  const kpis = useMemo(
    () => [
      {
        label: "Total Customers",
        value: String(customersFilteredByType.length),
        sub: filters.type === "all" ? "All types" : filters.type,
        icon: Users,
      },
      {
        label: "Revenue",
        value: `${filters.currency} ${currencyFormatter(totalRevenue)}`,
        sub: `Invoices: ${invoices.length}`,
        icon: DollarSign,
      },
      {
        label: "Avg. Order Value",
        value: `${filters.currency} ${currencyFormatter(avgOrderValue)}`,
        sub: `Range: ${filters.dateRange.replace("_", " ")}`,
        icon: Calculator,
      },
      {
        label: "Top Customer",
        value: topCustomer ? topCustomer.name : "—",
        sub: topCustomer
          ? `${filters.currency} ${currencyFormatter(topCustomer.revenue)}`
          : "No data",
        icon: Crown,
      },
    ],
    [
      customersFilteredByType.length,
      filters.currency,
      filters.dateRange,
      filters.type,
      invoices.length,
      totalRevenue,
      avgOrderValue,
      topCustomer,
    ],
  );

  const top10CustomersChartData = useMemo(
    () =>
      top10ByRevenue.map((r) => ({
        name: String(r.name ?? "").slice(0, 18),
        revenue: Number(r.revenue ?? 0),
      })),
    [top10ByRevenue],
  );

  return (
    <div className="p-6 bg-app min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-main">Customer Reports</h2>
          <p className="text-xs text-muted mt-1">
            Live reporting based on Customers and Sales Invoices
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={filters.dateRange}
            onChange={(e) =>
              setFilters((p) => ({ ...p, dateRange: e.target.value as any }))
            }
            className="px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main"
          >
            <option value="last_7">Last 7 days</option>
            <option value="last_30">Last 30 days</option>
            <option value="last_90">Last 90 days</option>
            <option value="ytd">Year to date</option>
          </select>

          <select
            value={filters.currency}
            onChange={(e) =>
              setFilters((p) => ({ ...p, currency: e.target.value as any }))
            }
            className="px-3 py-2 rounded-lg border border-theme bg-card text-sm text-main"
          >
            <option value="ZMW">ZMW</option>
            <option value="USD">USD</option>
            <option value="ZAR">ZAR</option>
            <option value="GBP">GBP</option>
            <option value="CNY">CNY</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-card border border-theme rounded-2xl p-5 shadow-sm"
              >
                <div className="h-3 w-24 bg-gray-300/80 rounded animate-pulse" />
                <div className="mt-3 h-6 w-40 bg-gray-300/80 rounded animate-pulse" />
                <div className="mt-2 h-3 w-28 bg-gray-300/80 rounded animate-pulse" />
              </div>
            ))
          : kpis.map((k) => (
              <div
                key={k.label}
                className={`bg-card border border-theme rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 ${
                  k.label === "Revenue"
                    ? "border-l-primary"
                    : k.label === "Avg. Order Value"
                      ? "border-l-[var(--brand-blue-bottom)]"
                      : k.label === "Top Customer"
                        ? "border-l-[var(--primary-700)]"
                        : "border-l-[var(--brand-blue-top)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
                      {k.label}
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-main leading-tight break-words">
                      {k.value}
                    </div>
                    <div className="mt-2 text-xs text-muted font-semibold break-words">
                      {k.sub}
                    </div>
                  </div>

                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl border border-theme flex items-center justify-center ${
                      k.label === "Revenue"
                        ? "bg-primary/10 text-primary"
                        : k.label === "Avg. Order Value"
                          ? "bg-[rgba(33,158,188,0.10)] text-[var(--brand-blue-bottom)]"
                          : k.label === "Top Customer"
                            ? "bg-primary/10 text-[var(--primary-700)]"
                            : "bg-[rgba(142,202,230,0.18)] text-[var(--brand-blue-bottom)]"
                    }`}
                  >
                    <k.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
        <div className="bg-card border border-theme rounded-xl p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-main">
                Customer Activity
              </div>
              <div className="text-xs text-muted mt-1">
                Invoices issued (based on date range)
              </div>
            </div>
            <div className="text-xs text-muted">{filters.dateRange}</div>
          </div>

          <div className="mt-4 h-[260px] w-full">
            {loading ? (
              <div className="h-full w-full bg-gray-300/70 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activityTrendChartData}
                  margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="activityFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={chartColors.brandBlue}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartColors.brandBlue}
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.35)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(100,116,139,1)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(148,163,184,0.5)" }}
                    tickLine={{ stroke: "rgba(148,163,184,0.5)" }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(100,116,139,1)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(148,163,184,0.5)" }}
                    tickLine={{ stroke: "rgba(148,163,184,0.5)" }}
                    width={32}
                  />
                  <Tooltip
                    cursor={{
                      stroke: "rgba(204,0,0,0.18)",
                      strokeWidth: 1,
                    }}
                    contentStyle={tooltipLight}
                    labelStyle={{ color: "rgba(15,23,42,1)", fontWeight: 600 }}
                    labelFormatter={(_: any, payload: any) =>
                      payload?.[0]?.payload?.tooltipLabel || ""
                    }
                    formatter={(v: any) => [String(v), "Invoices"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors.brandBlue}
                    strokeWidth={2}
                    fill="url(#activityFill)"
                    dot={{
                      r: 3,
                      strokeWidth: 2,
                      fill: chartColors.brandBlue,
                    }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-theme">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-main">
                  Top 10 Customers
                </div>
                <div className="text-xs text-muted mt-1">
                  By revenue in selected currency
                </div>
              </div>
              <div className="text-xs text-muted">{filters.currency}</div>
            </div>

            <div className="mt-3 h-[260px] w-full">
              {loading ? (
                <div className="h-full w-full bg-gray-300/70 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={top10CustomersChartData}
                    margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.35)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "rgba(100,116,139,1)", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(148,163,184,0.5)" }}
                      tickLine={{ stroke: "rgba(148,163,184,0.5)" }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: "rgba(100,116,139,1)", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(148,163,184,0.5)" }}
                      tickLine={{ stroke: "rgba(148,163,184,0.5)" }}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(204,0,0,0.08)" }}
                      contentStyle={tooltipLight}
                      formatter={(v: any) => [
                        `${filters.currency} ${currencyFormatter(Number(v) || 0)}`,
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill={chartColors.primary}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card border border-theme rounded-xl p-4">
            <div className="text-sm font-semibold text-main">
              Type Distribution
            </div>
            <div className="text-xs text-muted mt-1">Company vs Individual</div>

            <div className="mt-4 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={tooltipLight}
                    formatter={(v: any, n: any) => [String(v), String(n)]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    formatter={(value: any) => (
                      <span className="text-xs text-muted">
                        {String(value)}
                      </span>
                    )}
                  />
                  <Pie
                    data={typeChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                    stroke="rgba(15,23,42,0.08)"
                  >
                    {typeDistribution.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-theme rounded-xl p-4">
            <div className="text-sm font-semibold text-main">
              Currency Distribution
            </div>
            <div className="text-xs text-muted mt-1">Customers by currency</div>

            <div className="mt-4 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={tooltipLight}
                    formatter={(v: any, n: any) => [String(v), String(n)]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    formatter={(value: any) => (
                      <span className="text-xs text-muted">
                        {String(value)}
                      </span>
                    )}
                  />
                  <Pie
                    data={currencyChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                    stroke="rgba(15,23,42,0.08)"
                  >
                    {currencyDistribution.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-theme rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-main">Top Customers</div>
            <div className="text-xs text-muted mt-1">
              Based on invoices in selected date range
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-theme bg-card text-xs text-main"
              onClick={() => {
                const rows = topCustomers.map((r) => ({
                  customerId: r.id,
                  customerName: r.name,
                  type: r.type,
                  invoices: r.invoices,
                  revenue: Number(r.revenue ?? 0),
                  currency: filters.currency,
                  lastInvoice: r.lastInvoice,
                }));
                exportToCsv(
                  rows,
                  `top_customers_${filters.currency}_${filters.dateRange}.csv`,
                );
              }}
              disabled={!topCustomers.length}
            >
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-app border-b border-theme sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-muted font-semibold">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted font-semibold">
                  Type
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted font-semibold">
                  Invoices
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted font-semibold">
                  Revenue
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted font-semibold">
                  Last Invoice
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted font-semibold">
                  Currency
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-theme">
                      <td className="px-4 py-3" colSpan={6}>
                        <div className="h-4 w-full bg-gray-300/80 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : topCustomersPageRows.map((r) => (
                    <tr key={r.id} className="border-b border-theme row-hover">
                      <td className="px-4 py-3">
                        <div className="text-main font-medium">{r.name}</div>
                        <div className="text-[11px] text-muted">{r.id}</div>
                      </td>
                      <td className="px-4 py-3 text-main">
                        {String(r.type || "—")}
                      </td>
                      <td className="px-4 py-3 text-right text-main">
                        {r.invoices}
                      </td>
                      <td className="px-4 py-3 text-right text-main font-medium">
                        {filters.currency} {currencyFormatter(r.revenue)}
                      </td>
                      <td className="px-4 py-3 text-main">
                        {r.lastInvoice || "—"}
                      </td>
                      <td className="px-4 py-3 text-main">
                        {String(r.currency || "—")}
                      </td>
                    </tr>
                  ))}

              {!loading && topCustomersPageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    No customers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-theme bg-card flex items-center justify-end gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-theme bg-card text-xs text-main disabled:opacity-50"
            onClick={() => setTopCustomersPage((p) => Math.max(1, p - 1))}
            disabled={topCustomersPage <= 1}
          >
            Prev
          </button>
          <div className="text-xs text-muted">
            Page {Math.min(topCustomersPage, topCustomersTotalPages)} of{" "}
            {topCustomersTotalPages}
          </div>
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-theme bg-card text-xs text-main disabled:opacity-50"
            onClick={() =>
              setTopCustomersPage((p) =>
                Math.min(topCustomersTotalPages, p + 1),
              )
            }
            disabled={topCustomersPage >= topCustomersTotalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMReports;
