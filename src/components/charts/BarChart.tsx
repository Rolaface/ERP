import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCompanyStore } from '../../store/companyStore';

// 1. Updated interface to match your new backend response
interface Item {
  month: string;
  itemCode: string | null;
  itemName: string; 
  buyQty: number;
  buyValue: number;
  sellQty: number;
  sellValue: number;
}

interface BarChartProps {
  title: string;
  loading: boolean;
  data: Item[];
  mode: 'value' | 'quantity';
  filterNode?: React.ReactNode;
}

const BarChart: React.FC<BarChartProps> = ({ title, loading, data = [], mode, filterNode }) => {
  const baseCurrency = useCompanyStore((state) => state.baseCurrency) || '';
  
    const currencyFormatter = useMemo(() => {
      const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'; 
      
      return new Intl.NumberFormat(locale, {
        style: 'currency', 
        currency: baseCurrency, 
        maximumFractionDigits: 2, 
        notation: "compact"
      });
    }, [baseCurrency]);  

  const option = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];    
    const chartData = [...safeData];

    // 2. FIXED: Map the X-axis to the 'month' property, NOT 'itemName'
    const monthNames = chartData.map(d => d.month);
    const buyData = chartData.map(d => mode === 'value' ? d.buyValue : d.buyQty);
    const sellData = chartData.map(d => mode === 'value' ? d.sellValue : d.sellQty);

    const valFormatter = (val: number) => mode === 'value' ? currencyFormatter.format(val) : val.toString();

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (params: any) {
          const dataIndex = params[0].dataIndex;
          const row = chartData[dataIndex];
          
          // 3. FIXED: Show the Month AND the Top Item in the tooltip
          const itemDisplay = row.itemName && row.itemName !== "No Sales" 
            ? `<span style="color:#10b981; font-size:11px;">Top Item: ${row.itemName}</span>` 
            : `<span style="color:#9ca3af; font-size:11px;">No Sales</span>`;

          return `
            <div style="font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; margin-bottom:4px; display:flex; justify-content:space-between; gap:12px;">
              <span>${row.month}</span>
              ${itemDisplay}
            </div>
            <div style="font-size: 12px; line-height: 1.5;">
              <span style="color:${params[0].color}">●</span> <b>Buy:</b> 
              Qty: ${row.buyQty} | Val: ${currencyFormatter.format(row.buyValue)}<br/>
              <span style="color:${params[1]?.color || '#3b82f6'}">●</span> <b>Sell:</b> 
              Qty: ${row.sellQty} | Val: ${currencyFormatter.format(row.sellValue)}
            </div>
          `;
        }
      },
      legend: { 
        data: ['Buy', 'Sell'], 
        top: 0 
      },
      grid: { 
        left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true 
      },
      xAxis: { 
        type: 'category', 
        data: monthNames, // Now uses ["Jan", "Feb", "Mar"...]
        axisLabel: { 
          show: true,
          interval: 0, 
          rotate: 0, 
          color: '#6b7280' 
        },
        axisLine: {
          show: true,
          lineStyle: { color: '#9ca3af' }
        },
        axisTick: { show: true, alignWithLabel: true }
      },
      yAxis: { 
        type: 'value',
        axisLabel: { formatter: valFormatter },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#9ca3af', 
            width: 1
          }
        },
        axisTick: { show: true },
        splitLine: { show: true }
      },
      series: [
        {
          name: 'Buy',
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          },
          itemStyle: { color: '#f59e0b' }, // Amber
          data: buyData
        },
        {
          name: 'Sell',
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          },
          itemStyle: { color: '#3b82f6' }, // Blue
          data: sellData
        }
      ]
    };
  }, [data, mode, currencyFormatter]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col min-h-0 h-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-bold text-gray-800 tracking-wider uppercase">{title}</h3>
        {filterNode && <div>{filterNode}</div>}
      </div>
      
      <div className="flex-1 min-h-0 relative mt-2">
        {loading ? (
          <div className="absolute inset-0 bg-gray-50 animate-pulse rounded flex items-center justify-center text-sm text-gray-400">
            Loading chart...
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            No data available
          </div>
        ) : (
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default BarChart;