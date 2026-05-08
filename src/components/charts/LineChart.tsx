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
  filterNode?: React.ReactNode; 
}

const LineChart: React.FC<LineChartProps> = ({ title, loading, trendData = {}, metrics, filterNode }) => {
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: "compact"
  }), []);

  const option = useMemo(() => {

    const rawData: any[][] = [['Month', 'MetricName', 'Value']];
    const months = Object.keys(trendData).sort();
    
    months.forEach(month => {
      metrics.forEach(metric => {
        rawData.push([month, metric.name, trendData[month][metric.key] || 0]);
      });
    });

    // 2. Setup the dataset filters and series automatically (like the Apache example)
    const datasetWithFilters: any[] = [];
    const seriesList: any[] = [];

    metrics.forEach(metric => {
      const datasetId = 'dataset_' + metric.key;
      
      // Filter dataset by Metric Name
      datasetWithFilters.push({
        id: datasetId,
        fromDatasetId: 'dataset_raw',
        transform: {
          type: 'filter',
          config: { dimension: 'MetricName', '=': metric.name }
        }
      });

      // Push line series for each filtered dataset
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

    // 3. Construct the final option
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
        // Format the tooltip values using your currency formatter
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