import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';  
import { useCompanyStore } from "../../store/companyStore"; 

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
  // 1. Hook into your store
  const baseCurrency = useCompanyStore((state) => state.baseCurrency) || '';
      const currencySymbol = useCompanyStore((state) => state.currencySymbol || '');
  

 const currencyFormatter = useMemo(() => {
    const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'; 
    
    const numberFormatter = new Intl.NumberFormat(locale, {
      style: 'decimal', 
      maximumFractionDigits: 2, 
      notation: "compact"
    });

    return {
      format: (value: number) => {
        const num = Number(value) || 0;
        const formattedNumber = numberFormatter.format(Math.abs(num));
        
         const sign = num < 0 ? '-' : '';
        
         const space = currencySymbol.length > 1 ? ' ' : '';
        
        return `${sign}${currencySymbol}${space}${formattedNumber}`;
      }
    };
  }, [baseCurrency, currencySymbol]);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      // 3. Format the values inside the hover tooltip
      valueFormatter: (value: any) => currencyFormatter.format(Number(value))
    },
    legend: {
      data: ['Total Sales', 'Received', 'Receivable'],
      bottom: 0
    },
 grid: {
  left: '1%',
  right: '2%',
  bottom: '14%',
  top: '5%',
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
        // 4. Format the labels on the Y-axis
        axisLabel: {
          formatter: (value: any) => currencyFormatter.format(Number(value))
        },
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