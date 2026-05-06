import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export interface ChartMetric {
  key: string;
  name: string;
  color: string;
}

interface LineChartProps {
  title: string;
  loading: boolean;
  trendData?: Record<string, any>;
  metrics: ChartMetric[];
}

const LineChart: React.FC<LineChartProps> = ({ title, loading, trendData = {}, metrics }) => {
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: "compact"
  }), []);

  const option = useMemo(() => {
    // Extract months (YYYY-MM) and sort them chronologically
    const months = Object.keys(trendData).sort();

    const series = metrics.map(metric => ({
      name: metric.name,
      type: 'line',
      smooth: true,
      itemStyle: { color: metric.color },
      // Map the specific metric key (e.g., 'receivable', 'paid') for each month
      data: months.map(m => trendData[m][metric.key] || 0)
    }));

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: metrics.map(m => m.name), top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        boundaryGap: false, 
        data: months // Displays months on the X-axis
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { formatter: (val: number) => currencyFormatter.format(val) } 
      },
      series
    };
  }, [trendData, metrics, currencyFormatter]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col min-h-0 h-full">
      <h3 className="text-xs font-bold text-gray-800 tracking-wider mb-2 uppercase">{title}</h3>
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="absolute inset-0 bg-gray-50 animate-pulse rounded flex items-center justify-center text-sm text-gray-400">
            Loading chart...
          </div>
        ) : (
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default LineChart;