import React from 'react';
import ReactECharts from 'echarts-for-react';  

interface MonthlySalesData {
  month: string;
  year: number;
  "total-sales": number;
  receivable: number;
  received: number;
}

interface Props {
  data: MonthlySalesData[];
}

export const MonthlySalesBarChart: React.FC<Props> = ({ data }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Total Sales', 'Received', 'Receivable'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: data.map((item) => item.month),
        axisTick: { alignWithLabel: true }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLine: {
          show: true,  
          lineStyle: {
            color: 'black'  
          }
        },
        axisTick: {
          show: true  
        }
      }
    ],
    series: [
      {
        name: 'Total Sales',
        type: 'bar',
        stack: 'Ad',
        emphasis: { focus: 'series' },
        itemStyle: { color: '#3b82f6' }, // Blue
        data: data.map((item) => item["total-sales"])
      },
      {
        name: 'Received',
        type: 'bar',
        stack: 'Ad',
        emphasis: { focus: 'series' },
        itemStyle: { color: '#10b981' }, // Emerald
        data: data.map((item) => item.received)
      },
      {
        name: 'Receivable',
        type: 'bar',
        stack: 'Ad',
        emphasis: { focus: 'series' },
        itemStyle: { 
          color: '#f59e0b', // Amber
          borderRadius: [6, 6, 0, 0] // Rounded corners on the top segment
        },
        data: data.map((item) => item.receivable)
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};