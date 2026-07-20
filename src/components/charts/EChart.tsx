import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface EChartProps {
  option: echarts.EChartsCoreOption;
  height?: string | number;
  className?: string;
  onEvents?: Record<string, (params: any) => void>;
  loading?: boolean;
}

export const EChart: React.FC<EChartProps> = ({
  option,
  height = "100%",
  className = "",
  onEvents,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current, undefined, { renderer: "svg" });
    chartRef.current = chart;

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(option, true);
  }, [option]);

  // loading state
  useEffect(() => {
    if (!chartRef.current) return;
    if (loading) {
      chartRef.current.showLoading("default", {
        text: "",
        color: "var(--primary, #4F46E5)",
        textColor: "#94a3b8",
        maskColor: "rgba(255, 255, 255, 0.6)",
        zlevel: 0,
        spinnerRadius: 10,
        lineWidth: 3,
      });
    } else {
      chartRef.current.hideLoading();
    }
  }, [loading]);


  useEffect(() => {
    if (!chartRef.current || !onEvents) return;
    Object.entries(onEvents).forEach(([event, handler]) => {
      chartRef.current?.on(event, handler);
    });
    return () => {
      Object.keys(onEvents).forEach((event) => chartRef.current?.off(event));
    };
  }, [onEvents]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height }} />;
};

export default EChart;