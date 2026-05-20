import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface Item {
  itemName: string; // This should now represent the Month (e.g., "Jan", "Feb")
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
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: "compact"
  }), []);

  const option = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];    
    // Removed .reverse() so months flow naturally left to right
    const chartData = [...safeData];

    const monthNames = chartData.map(d => d.itemName);
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
          
          return `
            <div style="font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; margin-bottom:4px;">
              ${row.itemName}
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
      // X-Axis is now Category (Months)
      xAxis: { 
        type: 'category', 
        data: monthNames,
        axisLabel: { 
          show: true,
          interval: 0, // Forces ECharts to show ALL labels
          rotate: 0, // Change to 45 if month names are long and overlapping
          color: '#6b7280' // Gray-500 text color for better visibility
        },
        axisLine: {
          show: true,
          lineStyle: { color: '#9ca3af' }
        },
        axisTick: { show: true, alignWithLabel: true }
      },
      // Y-Axis is now Value
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