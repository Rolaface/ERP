import React from "react";
import ReactECharts from "echarts-for-react";

// Interfaces for incoming data props
interface EmployeeTrendProps {
  data?: { month: string; hired: number; resigned: number; fired: number }[];
  loading?: boolean;
}

interface DepartmentPayrollProps {
  data?: { department: string; "base net pay": number }[];
  loading?: boolean;
}

interface AttendancePatternProps {
  data?: { Present: number; Absent: number; Late: number };
  loading?: boolean;
}

// 1. Employee Trend (Now a Vertical Stacked Bar Chart)
export const EmployeeTrendChart: React.FC<EmployeeTrendProps> = ({ data, loading }) => {
  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["Hired", "Resigned", "Fired"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "10%",
      containLabel: true,
    },
    // Swapped xAxis and yAxis to make it vertical
    xAxis: {
      type: "category",
      data: data?.map((d) => d.month) || [],
    },
    yAxis: {
      type: "value",
      minInterval: 1,
    },
    series: [
      {
        name: "Hired",
        type: "bar",
        stack: "total",
        label: { show: true },
        emphasis: { focus: "series" },
        itemStyle: { color: "#22c55e" }, // green-500
        data: data?.map((d) => d.hired) || [],
      },
      {
        name: "Resigned",
        type: "bar",
        stack: "total",
        label: { show: true },
        emphasis: { focus: "series" },
        itemStyle: { color: "#f97316" }, // orange-500
        data: data?.map((d) => d.resigned) || [],
      },
      {
        name: "Fired",
        type: "bar",
        stack: "total",
        label: { show: true },
        emphasis: { focus: "series" },
        itemStyle: { color: "#ef4444" }, // red-500
        data: data?.map((d) => d.fired) || [],
      },
    ],
  };

  return (
    <ReactECharts 
      option={option} 
      showLoading={loading}
      style={{ height: "300px", width: "100%" }} 
    />
  );
};

// 2. Department Wise Payroll (Rose Type Pie Chart)
export const DepartmentPayrollChart: React.FC<DepartmentPayrollProps> = ({ data, loading }) => {
  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b} : {c} ({d}%)",
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        name: "Payroll",
        type: "pie",
        radius: [20, 100],
        center: ["50%", "45%"],
        roseType: "area",
        itemStyle: {
          borderRadius: 8,
        },
        data: data?.map((d) => ({
          name: d.department,
          value: d["base net pay"],
        })) || [],
      },
    ],
  };

  return (
    <ReactECharts 
      option={option} 
      showLoading={loading}
      style={{ height: "300px", width: "100%" }} 
    />
  );
};

// 3. Attendance Pattern 
// (Converted to a clean Doughnut Chart since the API returns an aggregate count for the current period, not historical multi-year datasets)
export const AttendancePatternChart: React.FC<AttendancePatternProps> = ({ data, loading }) => {
  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        name: "Attendance",
        type: "pie",
        radius: ["40%", "70%"], // Creates the Doughnut effect
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "20",
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { 
            value: data?.Present || 0, 
            name: "Present", 
            itemStyle: { color: "#22c55e" } // green-500
          },
          { 
            value: data?.Late || 0, 
            name: "Late", 
            itemStyle: { color: "#f59e0b" } // amber-500
          },
          { 
            value: data?.Absent || 0, 
            name: "Absent", 
            itemStyle: { color: "#ef4444" } // red-500
          },
        ],
      },
    ],
  };

  return (
    <ReactECharts 
      option={option} 
      showLoading={loading}
      style={{ height: "300px", width: "100%" }} 
    />
  );
};