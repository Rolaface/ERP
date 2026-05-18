import React, { useState, useEffect, useMemo } from 'react';
import { Users, FileText, TrendingUp, Banknote, Package, ArrowLeftRight } from 'lucide-react';
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
  PurchaseChartResponse,
  getInventoryChart
} from '../api/dashboardApi';
import BarChart from '../components/charts/BarChart';
import { useHRView } from '../hooks/permission/useHRView';

const availableYears = Array.from({ length: 4 }, (_, i) => (new Date().getFullYear() - i).toString());

const Dashboard = () => {
  // HR view mode — only used to render the switch button
  const { viewMode, canSwitchView, toggleViewMode } = useHRView();
  const isEmployeeView = viewMode === "employee";

  // 1. Independent Loading States
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryYear, setInventoryYear] = useState(availableYears[0]);
  const [inventoryMode, setInventoryMode] = useState<'value' | 'quantity'>('value');
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  // 2. Independent Filter States for Charts
  const [salesYear, setSalesYear] = useState(availableYears[0]);
  const [salesInterval, setSalesInterval] = useState('Monthly');
  const [purchaseYear, setPurchaseYear] = useState(availableYears[0]);
  const [purchaseInterval, setPurchaseInterval] = useState('Monthly');
  // 3. Data States
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse['data'] | null>(null);
  const [notesData, setNotesData] = useState<DashboardNotesResponse['data'] | null>(null);
  const [salesData, setSalesData] = useState<SalesChartResponse['data'] | null>(null);
  const [purchaseData, setPurchaseData] = useState<PurchaseChartResponse['data'] | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: "compact"
  }), []);


  useEffect(() => {
    let mounted = true;
    const fetchGlobal = async () => {
      setLoadingSummary(true);
      try {
        const [summary, notes] = await Promise.all([getDashboardSummary(), getDashboardNotes()]);
        if (mounted) {
          setSummaryData(summary?.data || null);
          setNotesData(notes?.data || null);
        }
      } catch (e) {
        console.error("Error fetching summary:", e);
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    };
    fetchGlobal();
    return () => { mounted = false; };
  }, []);

  // --- Fetch Inventory Chart independently ---
  useEffect(() => {
    let mounted = true;
    const fetchInventory = async () => {
      setLoadingInventory(true);
      try {
        const inv = await getInventoryChart({ year: inventoryYear, mode: inventoryMode });

        if (mounted) {
          const rawData = inv?.data as any;

          if (Array.isArray(rawData)) {
            setInventoryData(rawData);
          }
          else if (rawData && typeof rawData === 'object') {
            const itemMap = new Map();

            const parseItem = (itemData: any, type: 'buy' | 'sell', metric: 'qty' | 'val') => {
              if (!itemData || !itemData.itemName || itemData.itemName === 'N/A') return;

              const name = itemData.itemName;
              if (!itemMap.has(name)) {
                itemMap.set(name, { itemName: name, buyQty: 0, buyValue: 0, sellQty: 0, sellValue: 0 });
              }

              const entry = itemMap.get(name);
              if (type === 'buy' && metric === 'qty') entry.buyQty = itemData.quantity || 0;
              if (type === 'buy' && metric === 'val') entry.buyValue = itemData.value || 0;
              if (type === 'sell' && metric === 'qty') entry.sellQty = itemData.quantity || 0;
              if (type === 'sell' && metric === 'val') entry.sellValue = itemData.value || 0;
            };

            parseItem(rawData.buying?.topItemByQuantity, 'buy', 'qty');
            parseItem(rawData.buying?.topItemByValue, 'buy', 'val');
            parseItem(rawData.selling?.topItemByQuantity, 'sell', 'qty');
            parseItem(rawData.selling?.topItemByValue, 'sell', 'val');

            setInventoryData(Array.from(itemMap.values()));
          } else {
            setInventoryData([]);
          }
        }
      } catch (e) {
        console.error("Error fetching inventory chart:", e);
      } finally {
        if (mounted) setLoadingInventory(false);
      }
    };

    fetchInventory();
    return () => { mounted = false; };
  }, [inventoryYear, inventoryMode]);

  useEffect(() => {
    let mounted = true;
    const fetchSales = async () => {
      setLoadingSales(true);
      try {
        const sales = await getSalesChart({ year: salesYear, interval: salesInterval });
        if (mounted) setSalesData(sales?.data || null);
      } catch (e) {
        console.error("Error fetching sales chart:", e);
      } finally {
        if (mounted) setLoadingSales(false);
      }
    };
    fetchSales();
    return () => { mounted = false; };
  }, [salesYear, salesInterval]);

  useEffect(() => {
    let mounted = true;
    const fetchPurchase = async () => {
      setLoadingPurchase(true);
      try {
        const purchase = await getPurchaseChart({ year: purchaseYear, interval: purchaseInterval });
        if (mounted) setPurchaseData(purchase?.data || null);
      } catch (e) {
        console.error("Error fetching purchase chart:", e);
      } finally {
        if (mounted) setLoadingPurchase(false);
      }
    };
    fetchPurchase();
    return () => { mounted = false; };
  }, [purchaseYear, purchaseInterval]);

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 p-4">

      {/* Header */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Dashboard Summary</h1>
        <div className="flex items-center gap-3">
          {/* View switch button — only visible to users who have both employee + professional roles */}
          {canSwitchView && (
            <button
              onClick={toggleViewMode}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold
                border transition-all duration-200
                ${isEmployeeView
                  ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
            >
              <ArrowLeftRight size={13} />
              {isEmployeeView ? "Switch to Professional View" : "Switch to Employee View"}
            </button>
          )}
          {/* <UserMenu /> */}
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">

        <div className="flex flex-1 flex-col gap-4 min-w-0">

          <div className="grid grid-cols-4 gap-4 shrink-0 h-[100px]">
            <InfoBox title="Sales" loading={loadingSummary}
              icon={<Users size={16} className="text-blue-500" />}>
              <div className="text-lg font-bold text-blue-600">{currencyFormatter.format(summaryData?.sales?.totalSales || 0)}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Count: {summaryData?.sales?.salesCount || 0}</span>
                <span className="text-red-500">Overdue: {currencyFormatter.format(summaryData?.sales?.totalOverdue || 0)}</span>
              </div>
            </InfoBox>

            <InfoBox title="Purchase" loading={loadingSummary}
              icon={<Banknote size={16} className="text-green-500" />}>
              <div className="text-lg font-bold text-amber-600">{currencyFormatter.format(summaryData?.purchase?.totalPurchase || 0)}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Count: {summaryData?.purchase?.purchaseCount || 0}</span>
                <span className="text-red-500">Overdue: {currencyFormatter.format(summaryData?.purchase?.totalOverdue || 0)}</span>
              </div>
            </InfoBox>

            <InfoBox title="Customer" loading={loadingSummary}
              icon={<Users size={16} className="text-blue-500" />}>
              <div className="text-lg font-bold text-emerald-600">{summaryData?.customer?.totalCustomers || 0}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Active: {summaryData?.customer?.activeCustomers || 0}</span>
                <span>Inactive: {summaryData?.customer?.inactiveCustomers || 0}</span>
              </div>
            </InfoBox>

            <InfoBox title="Supplier" loading={loadingSummary}
              icon={<FileText size={16} className="text-amber-500" />}>
              <div className="text-lg font-bold text-purple-600">{summaryData?.supplier?.totalSuppliers || 0}</div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Active: {summaryData?.supplier?.activeSuppliers || 0}</span>
                <span>Inactive: {summaryData?.supplier?.inactiveSuppliers || 0}</span>
              </div>
            </InfoBox>
          </div>

          {/* 4 Charts (2x2 Grid) */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
            <LineChart
              title="SALES CHART"
              loading={loadingSales}
              trendData={salesData?.trend}
              metrics={[
                { key: 'receivable', name: 'Receivable', color: '#3b82f6' },
                { key: 'received', name: 'Received', color: '#10b981' }
              ]}
              filterNode={
                <div className="flex gap-2">
                  <select
                    value={salesInterval}
                    onChange={e => setSalesInterval(e.target.value)}
                    className="border rounded-xl text-xs px-2 py-1 outline-none text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                  <select
                    value={salesYear}
                    onChange={e => setSalesYear(e.target.value)}
                    className="border rounded-xl text-xs px-2 py-1 outline-none text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              }
            />

            <LineChart
              title="PURCHASE CHART"
              loading={loadingPurchase}
              trendData={purchaseData?.trend}
              metrics={[
                { key: 'payable', name: 'Payable', color: '#f59e0b' },
                { key: 'paid', name: 'Paid', color: '#ef4444' }
              ]}
              filterNode={
                <div className="flex gap-2">
                  <select
                    value={purchaseInterval}
                    onChange={e => setPurchaseInterval(e.target.value)}
                    className="border rounded-xl text-xs px-2 py-1 outline-black text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                  <select
                    value={purchaseYear}
                    onChange={e => setPurchaseYear(e.target.value)}
                    className="border rounded-xl text-xs px-2 py-1 outline-none text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              }
            />

            <LineChart title="EXPENSE CHART" loading={loadingSummary} trendData={{}} metrics={[]} />
            <BarChart
              title="INVENTORY CHART"
              loading={loadingInventory}
              data={inventoryData}
              mode={inventoryMode}
              filterNode={
                <div className="flex gap-2">
                  <select
                    value={inventoryMode}
                    onChange={e => setInventoryMode(e.target.value as 'value' | 'quantity')}
                    className="border rounded-xl text-xs px-2 py-1 outline-black text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <option value="value">By Value</option>
                    <option value="quantity">By Qty</option>
                  </select>
                  <select
                    value={inventoryYear}
                    onChange={e => setInventoryYear(e.target.value)}
                    className="border rounded-xl text-xs px-2 py-1 outline-none text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              }
            />
          </div>
        </div>

        {/* RIGHT AREA (Vertical Notes) */}
        <div className="w-[300px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-300 flex flex-col p-5 overflow-y-auto">
          <h2 className="text-sm font-bold tracking-wider text-gray-800 border-b pb-2 mb-4 uppercase">Notes</h2>
          {loadingSummary ? (
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
                // subTitle={notesData?.topSellingItemQty?.itemCode}
                icon={<Package size={16} className="text-emerald-500" />}
              />
              <NoteItem 
                label="Top Item By Value" 
                title={notesData?.topSellingItemValue?.itemName || 'N/A'} 
                value={currencyFormatter.format(notesData?.topSellingItemValue?.value || 0)} 
                // subTitle={notesData?.topSellingItemValue?.itemCode}
                icon={<Banknote size={16} className="text-purple-500" />} 
              />
            </div>
          )}
        </div>

      </div>
      {/* FLOATING CHAT LAYER */}


    </div>
  );
};

// --- Sub-Components ---
const InfoBox = ({ title, icon, loading, children }: { title: string, icon?: React.ReactNode, loading: boolean, children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-4 flex flex-col justify-center">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className="text-gray-400">{icon}</span>}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
    </div>
    {loading ? <div className="animate-pulse h-8 bg-gray-100 rounded w-full mt-1"></div> : children}
  </div>
);

const NoteItem = ({ label, title, subTitle, value, icon }: any) => (
  <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 border border-gray-300">
    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {icon} {label}
    </div>
    <div className="font-medium text-sm text-gray-800 truncate" title={title}>{title}</div>
    {subTitle && subTitle !== 'N/A' && <div className="text-xs text-gray-400 truncate">Code: {subTitle}</div>}
    <div className="text-base font-bold text-gray-900 mt-1">{value}</div>
  </div>
);

export default Dashboard;