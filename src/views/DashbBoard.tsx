import React, { useEffect, useMemo, useState } from 'react';
import { getDashboardSummary } from '../api/dashboardApi';
import { ChartSkeleton } from '../components/ChartSkeleton';
import UserMenu from '../layout/UserMenu';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DollarSign, FileText, TrendingUp, Users } from 'lucide-react';
import {
  AppMetricCard,
  AppPage,
  AppPageHeader,
  AppSectionCard,
} from '../components/ui/app-shell';

const Dashboard = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    totalCustomers: number;
    totalSuppliers: number;
    totalSalesInvoices: number;
    totalPurchaseInvoices: number;
    totalSalesAmount: number;
    monthlySalesGraph: { labels: string[]; data: number[] };
    recentSales: Array<{
      name: string;
      customer: string;
      posting_date: string;
      grand_total: number;
    }>;
  } | null>(null);

  const [monthlyTrendData, setMonthlyTrendData] = useState<
    Array<{ name: string; revenue: number }>
  >([]);

  // const chartsLoading = summaryLoading || !summaryData;
  const chartsLoading = summaryLoading || (!summaryData && !summaryError);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummaryData(null);
        setMonthlyTrendData([]);

        const resp = await getDashboardSummary();
        if (!mounted) return;
        const d = resp.data;
        setSummaryData({
          totalCustomers: d.totalCustomers,
          totalSuppliers: d.totalSuppliers,
          totalSalesInvoices: d.totalSalesInvoices,
          totalPurchaseInvoices: d.totalPurchaseInvoices,
          totalSalesAmount: d.totalSalesAmount,
          monthlySalesGraph: d.monthlySalesGraph,
          recentSales: d.recentSales,
        });

        const labels = d.monthlySalesGraph?.labels ?? [];
        const values = d.monthlySalesGraph?.data ?? [];
        if (labels.length && labels.length === values.length) {
          setMonthlyTrendData(
            labels.map((name, i) => ({
              name,
              revenue: Number(values[i] ?? 0),
            })),
          );
        }
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(e?.message ?? 'Failed to load dashboard summary');
      } finally {
        if (!mounted) return;
        setSummaryLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const currencyINR = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }),
    [],
  );

  const dateWithDay = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [],
  );

  const kpiCards = [
    {
      label: 'Total Customers',
      value: String(summaryData?.totalCustomers ?? 0),
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Total Suppliers',
      value: String(summaryData?.totalSuppliers ?? 0),
      icon: FileText,
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      label: 'Sales Invoices',
      value: String(summaryData?.totalSalesInvoices ?? 0),
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Purchase Invoices',
      value: String(summaryData?.totalPurchaseInvoices ?? 0),
      icon: FileText,
      gradient: 'from-sky-500 to-sky-600',
    },
    {
      label: 'Total Sales Amount',
      value: currencyINR.format(summaryData?.totalSalesAmount ?? 0),
      icon: DollarSign,
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  const recentSalesRows = summaryData?.recentSales ?? [];

  const recentSalesChartData = useMemo(
    () =>
      [...recentSalesRows]
        .sort((a, b) => Number(b.grand_total ?? 0) - Number(a.grand_total ?? 0))
        .slice(0, 10)
        .map((r) => ({
          name: r.name,
          total: Number(r.grand_total ?? 0),
          customer: r.customer,
          posting_date: r.posting_date,
        })),
    [recentSalesRows],
  );

  const salesByCustomerChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recentSalesRows) {
      const key = r.customer ?? 'Unknown';
      map.set(key, (map.get(key) ?? 0) + Number(r.grand_total ?? 0));
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [recentSalesRows]);

  const totalsOverviewChartData = useMemo(
    () => [
      { name: 'Customers', value: Number(summaryData?.totalCustomers ?? 0) },
      { name: 'Suppliers', value: Number(summaryData?.totalSuppliers ?? 0) },
      { name: 'Sales Invoices', value: Number(summaryData?.totalSalesInvoices ?? 0) },
      { name: 'Purchase Invoices', value: Number(summaryData?.totalPurchaseInvoices ?? 0) },
    ],
    [summaryData],
  );

  return (
    <AppPage>
      <AppPageHeader
        title="Dashboard"
        description="Business overview and key performance trends"
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-bold text-main">Admin User</div>
              <div className="text-xs font-semibold text-muted">Administrator</div>
            </div>
            <UserMenu />
          </div>
        }
      />

      {summaryLoading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-700">
          Loading dashboard summary...
        </div>
      )}

      {summaryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          {summaryError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {chartsLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="app-surface min-h-[124px] animate-pulse p-6">
                <div className="flex h-full items-center justify-between">
                  <div>
                    <div className="h-3 w-28 rounded bg-gray-300" />
                    <div className="mt-3 h-8 w-20 rounded bg-gray-300" />
                  </div>
                  <div className="h-12 w-12 rounded-xl border border-gray-300 bg-gray-300" />
                </div>
              </div>
            ))
          : kpiCards.map((card, idx) => (
              <AppMetricCard
                key={idx}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accentClassName={card.gradient}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppSectionCard title="Monthly Sales">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card">
            {chartsLoading ? (
              <ChartSkeleton variant="line" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={52} />
                  <Tooltip formatter={(v: any) => currencyINR.format(Number(v ?? 0))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Top 10 Invoices">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card">
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentSalesChartData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 12 }} width={52} />
                  <Tooltip
                    formatter={(v: any) => currencyINR.format(Number(v ?? 0))}
                    labelFormatter={(
                      _label: any,
                      payload: readonly { payload?: { name?: string; customer?: string; posting_date?: string } }[],
                    ) => {
                      const p = payload?.[0]?.payload;
                      const labelParts: string[] = [];
                      if (p?.name) labelParts.push(p.name);
                      if (p?.customer) labelParts.push(p.customer);
                      if (p?.posting_date) {
                        const d = new Date(p.posting_date);
                        if (!Number.isNaN(d.getTime())) {
                          labelParts.push(dateWithDay.format(d));
                        }
                      }
                      return labelParts.join(' � ');
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} name="Total" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Top 10 Customers">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card">
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCustomerChartData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={52} />
                  <YAxis tick={{ fontSize: 12 }} width={52} />
                  <Tooltip formatter={(v: any) => currencyINR.format(Number(v ?? 0))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Total" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Totals Overview">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card">
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalsOverviewChartData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 12 }} width={52} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>
      </div>
    </AppPage>
  );
};

export default Dashboard;
