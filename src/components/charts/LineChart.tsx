import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useCompanyStore } from '../../store/companyStore';

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
  filterNode?: React.ReactNode; 
}

const LineChart: React.FC<LineChartProps> = ({ title, loading, trendData = {}, metrics, filterNode }) => {
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
    const rawData: any[][] = [['Month', 'MetricName', 'Value']];
    
    const chronologicalOrder = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      "Q1", "Q2", "Q3", "Q4",
      "H1", "H2"
    ];

    // 2. Sort the keys based on the predefined chronological index
    const periods = Object.keys(trendData).sort((a, b) => {
      const indexA = chronologicalOrder.indexOf(a);
      const indexB = chronologicalOrder.indexOf(b);
      
      // If both exist in our array, sort by their index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Fallback for Yearly data (e.g., "2024", "2025") - regular string sort
      return a.localeCompare(b);
    });
    
    periods.forEach(period => {
      metrics.forEach(metric => {
        rawData.push([period, metric.name, trendData[period][metric.key] || 0]);
      });
    });

    // Setup the dataset filters and series automatically
    const datasetWithFilters: any[] = [];
    const seriesList: any[] = [];

    metrics.forEach(metric => {
      const datasetId = 'dataset_' + metric.key;
      
      datasetWithFilters.push({
        id: datasetId,
        fromDatasetId: 'dataset_raw',
        transform: {
          type: 'filter',
          config: { dimension: 'MetricName', '=': metric.name }
        }
      });

      seriesList.push({
        type: 'line',
        datasetId: datasetId,
        name: metric.name,
        showSymbol: false,
        smooth: true,
        itemStyle: { color: metric.color },
        endLabel: {
          show: true,
          color: metric.color,
          fontWeight: 'bold',
          formatter: function (params: any) {
            return params.value[1] + ':\n' + currencyFormatter.format(params.value[2]);
          }
        },
        labelLayout: {
          moveOverlap: 'shiftY'
        },
        emphasis: {
          focus: 'series'
        },
        encode: {
          x: 'Month',
          y: 'Value',
          label: ['MetricName', 'Value'],
          itemName: 'Month',
          tooltip: ['Value']
        }
      });
    });

    return {
      animationDuration: 3000,
      dataset: [
        {
          id: 'dataset_raw',
          source: rawData
        },
        ...datasetWithFilters
      ],
      tooltip: { 
        trigger: 'axis',
        order: 'valueDesc',
        valueFormatter: (value: number) => currencyFormatter.format(value)
      },
      grid: { 
        left: '3%', 
        right: 130, 
        bottom: '3%', 
        top: '15%', 
        containLabel: true 
      },
      xAxis: { 
        type: 'category', 
        boundaryGap: false
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { formatter: (val: number) => currencyFormatter.format(val) }, 
        axisLine: { show: true }, 
        axisTick: { show: true }
      },
      series: seriesList
    };
  }, [trendData, metrics, currencyFormatter]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col min-h-0 h-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-bold text-gray-800 tracking-wider uppercase">{title}</h3>
        {filterNode && <div>{filterNode}</div>}
      </div>
      
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