import React, { useEffect, useMemo, useState } from 'react';
import { Users, FileText, TrendingUp, DollarSign, Package } from 'lucide-react';
import LineChart from '../components/charts/LineChart';
import UserMenu from '../layout/UserMenu';
import { 
  getDashboardSummary, 
  getDashboardNotes, 
  getSalesChart, 
  getPurchaseChart,
  DashboardSummaryResponse,
  DashboardNotesResponse,
  SalesChartResponse,
  PurchaseChartResponse
} from '../api/dashboardApi';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  // --- Filter State ---
  const [filterMode, setFilterMode] = useState<'year' | 'custom'>('year');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // --- Data State ---
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse['data'] | null>(null);
  const [notesData, setNotesData] = useState<DashboardNotesResponse['data'] | null>(null);
  const [salesData, setSalesData] = useState<SalesChartResponse['data'] | null>(null);
  const [purchaseData, setPurchaseData] = useState<PurchaseChartResponse['data'] | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: "compact"
  }), []);
const availableYears = Array.from({ length: 4 }, (_, i) => (new Date().getFullYear() - i).toString());
  // --- Fetch Data ---
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Build correct parameters based on the selected filter mode
        let queryParams: any = {};
        if (filterMode === 'year') {
          queryParams.year = year;
        } else {
          if (fromDate) queryParams.from_date = fromDate;
          if (toDate) queryParams.to_date = toDate;
        }

        const [summary, notes, sales, purchase] = await Promise.all([
          getDashboardSummary(),
          getDashboardNotes(),
          getSalesChart(queryParams),
          getPurchaseChart(queryParams)
        ]);

        if (mounted) {
          setSummaryData(summary?.data || null);
          setNotesData(notes?.data || null);
          setSalesData(sales?.data || null);
          setPurchaseData(purchase?.data || null);
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [filterMode, year, fromDate, toDate]);

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 p-4 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Dashboard Summary</h1>
        <UserMenu />
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        
        {/* LEFT AREA */}
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          
          {/* Top 4 Info Boxes */}
          <div className="grid grid-cols-4 gap-4 shrink-0 h-[100px]">
            <InfoBox title="Sales" loading={loading}>
              <div className="text-lg font-bold text-blue-600">{currencyFormatter.format(summaryData?.sales?.totalSales || 0)}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Count: {summaryData?.sales?.salesCount || 0}</span>
                <span className="text-red-500">Overdue: {currencyFormatter.format(summaryData?.sales?.totalOverdue || 0)}</span>
              </div>
            </InfoBox>

            <InfoBox title="Purchase" loading={loading}>
              <div className="text-lg font-bold text-amber-600">{currencyFormatter.format(summaryData?.purchase?.totalPurchase || 0)}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Count: {summaryData?.purchase?.purchaseCount || 0}</span>
                <span className="text-red-500">Overdue: {currencyFormatter.format(summaryData?.purchase?.totalOverdue || 0)}</span>
              </div>
            </InfoBox>

            <InfoBox title="Customer" loading={loading}>
              <div className="text-lg font-bold text-emerald-600">{summaryData?.customer?.totalCustomers || 0}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Active: {summaryData?.customer?.activeCustomers || 0}</span>
                <span>Inactive: {summaryData?.customer?.inactiveCustomers || 0}</span>
              </div>
            </InfoBox>

            <InfoBox title="Supplier" loading={loading}>
              <div className="text-lg font-bold text-purple-600">{summaryData?.supplier?.totalSuppliers || 0}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Active: {summaryData?.supplier?.activeSuppliers || 0}</span>
                <span>Inactive: {summaryData?.supplier?.inactiveSuppliers || 0}</span>
              </div>
            </InfoBox>
          </div>

          {/* Chart Filters Bar */}
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-gray-700">Chart Filters</span>
            <div className="flex gap-6">
              
              {/* Year Toggle */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="filter"
                  className="accent-blue-600"
                  checked={filterMode === 'year'} 
                  onChange={() => setFilterMode('year')} 
                />
                <span className={filterMode === 'year' ? 'text-gray-900 font-medium' : 'text-gray-500'}>Year</span>
                <select 
  value={year}
  disabled={filterMode !== 'year'}
  onChange={(e) => setYear(e.target.value)}
  className="ml-1 border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
>
  {availableYears.map(y => (
    <option key={y} value={y}>{y}</option>
  ))}
</select>
              </label>

              {/* Custom Range Toggle */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="filter"
                  className="accent-blue-600"
                  checked={filterMode === 'custom'} 
                  onChange={() => setFilterMode('custom')} 
                />
                <span className={filterMode === 'custom' ? 'text-gray-900 font-medium' : 'text-gray-500'}>Date Range</span>
                <div className={`flex items-center gap-2 ml-1 ${filterMode !== 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                  <span className="text-gray-400">to</span>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
              </label>

            </div>
          </div>

          {/* 4 Charts (2x2 Grid) */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
            
            <LineChart 
              title="SALES CHART" 
              loading={loading} 
              trendData={salesData?.trend} 
              metrics={[
                { key: 'receivable', name: 'Receivable', color: '#3b82f6' },
                { key: 'received', name: 'Received', color: '#10b981' }
              ]} 
            />
            
            <LineChart 
              title="PURCHASE CHART" 
              loading={loading} 
              trendData={purchaseData?.trend} 
              metrics={[
                { key: 'payable', name: 'Payable', color: '#f59e0b' },
                { key: 'paid', name: 'Paid', color: '#ef4444' }
              ]} 
            />
            
            {/* Empty Placeholders */}
            <LineChart title="EXPENSE CHART" loading={loading} trendData={{}} metrics={[]} />
            <LineChart title="INVENTORY CHART" loading={loading} trendData={{}} metrics={[]} />
            
          </div>
        </div>

        {/* RIGHT AREA (Vertical Notes) */}
        <div className="w-[300px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-5 overflow-y-auto">
          <h2 className="text-sm font-bold tracking-wider text-gray-800 border-b pb-2 mb-4 uppercase">Notes</h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg w-full"></div>)}
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1">
              <NoteItem 
                label="Top Customer" 
                title={notesData?.topCustomer?.name || 'N/A'} 
                value={currencyFormatter.format(notesData?.topCustomer?.value || 0)} 
                icon={<Users size={16} className="text-blue-500" />} 
              />
              <NoteItem 
                label="Top Supplier" 
                title={notesData?.topSupplier?.name || 'N/A'} 
                value={currencyFormatter.format(notesData?.topSupplier?.value || 0)} 
                icon={<FileText size={16} className="text-amber-500" />} 
              />
              <NoteItem 
                label="Top Item By Qty" 
                title={notesData?.topSellingItemQty?.itemName || 'N/A'} 
                value={`${notesData?.topSellingItemQty?.quantity || 0} Units`} 
                subTitle={notesData?.topSellingItemQty?.itemCode}
                icon={<Package size={16} className="text-emerald-500" />} 
              />
              <NoteItem 
                label="Top Item By Value" 
                title={notesData?.topSellingItemValue?.itemName || 'N/A'} 
                value={currencyFormatter.format(notesData?.topSellingItemValue?.value || 0)} 
                subTitle={notesData?.topSellingItemValue?.itemCode}
                icon={<DollarSign size={16} className="text-purple-500" />} 
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// --- Sub-Components ---
const InfoBox = ({ title, loading, children }: { title: string, loading: boolean, children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-center">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
    {loading ? <div className="animate-pulse h-8 bg-gray-100 rounded w-full mt-1"></div> : children}
  </div>
);

const NoteItem = ({ label, title, subTitle, value, icon }: any) => (
  <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 border border-gray-100">
    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {icon} {label}
    </div>
    <div className="font-medium text-sm text-gray-800 truncate" title={title}>{title}</div>
    {subTitle && subTitle !== 'N/A' && <div className="text-xs text-gray-400 truncate">Code: {subTitle}</div>}
    <div className="text-base font-bold text-gray-900 mt-1">{value}</div>
  </div>
);

export default Dashboard;