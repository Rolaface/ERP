import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useCompanyStore } from "../../store/companyStore";

interface NightingaleChartProps {
  data: { name: string; total: number }[];
}


export const NightingaleChart: React.FC<NightingaleChartProps> = ({ data }) => {
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
  

 const top3Data = useMemo(() => {
    return [...data]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((item) => ({
        value: item.total,
        name: item.name,
      }));
  }, [data]);

  const option = {
    tooltip: {
      trigger: "item",
      // 2. Use a callback function here to access your currencyFormatter
      formatter: (params: any) => {
        const formattedValue = currencyFormatter.format(params.value);
        return `${params.name} : ${formattedValue} (${params.percent}%)`;
      },
      backgroundColor: "var(--card)",
      borderColor: "var(--border)",
      textStyle: {
        color: "var(--text)",
        fontWeight: 600,
        fontSize: 12,
      },
    },
    legend: {
      bottom: "0",
      left: "center",
      textStyle: {
        fontSize: 12,
      },
      itemWidth: 14,
      itemHeight: 14,
      icon: "roundRect",
    },
    series: [
      {
        name: "Sales Share",
        type: "pie",
        radius: [20, 90],
        center: ["50%", "45%"],
        roseType: "area",
        itemStyle: {
          borderRadius: 6,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            const formattedValue = currencyFormatter.format(params.value);
            return `${params.name}\n${formattedValue}`; // You can change \n to : if you want them on the same line
          },
        },
        // 3. Feed the sorted/sliced Top 3 data here
        data: top3Data,
        color: ["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#14b8a6"],
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "100%", width: "100%" }}
      opts={{ renderer: "svg" }}
    />
  );
};