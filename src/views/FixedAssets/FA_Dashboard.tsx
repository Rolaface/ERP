import React from "react";
import { FaEllipsisH, FaFilter, FaWarehouse, FaArrowUp } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

/* ------------------ DUMMY DATA ------------------ */

const assetTrend = [
  { month: "Jan", value: 120 },
  { month: "Feb", value: 180 },
  { month: "Mar", value: 260 },
  { month: "Apr", value: 310 },
  { month: "May", value: 400 },
];

const categoryData = [
  { name: "Machinery", value: 45 },
  { name: "Electronics", value: 30 },
  { name: "Furniture", value: 25 },
];

const locationData = [
  { location: "Delhi", value: 120 },
  { location: "Mumbai", value: 200 },
  { location: "Bangalore", value: 150 },
];

const COLORS = [
  "var(--brand-blue-bottom)",
  "var(--brand-blue-top)",
  "var(--primary)",
];

/* ------------------ UI COMPONENTS ------------------ */

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-white border border-[var(--border)] rounded-xl p-5 relative">
    <button className="absolute top-4 right-4 text-gray-500">
      <FaEllipsisH />
    </button>

    <div className="flex items-center gap-3 text-gray-700">
      <div className="text-xl">{icon}</div>
      <p className="text-xs font-medium uppercase tracking-wide">{title}</p>
    </div>

    <p className="text-3xl font-semibold text-gray-900 mt-3">{value}</p>

    <div className="flex items-center text-xs mt-2 text-gray-500">
      <FaArrowUp className="mr-1" /> +12% this year
    </div>
  </div>
);

const Panel = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-gray-200">
    <div className="flex items-center justify-between px-5 py-3 border-b">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
          <FaFilter size={14} />
        </button>
        <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
          <FaEllipsisH size={14} />
        </button>
      </div>
    </div>
    <div className="p-4 h-[260px]">{children}</div>
  </div>
);

/* ------------------ MAIN DASHBOARD ------------------ */

const FixedAssetDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Assets" value="24" icon={<FaWarehouse />} />
        <StatCard
          title="New Assets (This Year)"
          value="6"
          icon={<FaWarehouse />}
        />
        <StatCard
          title="Asset Value"
          value="ZK 4,80,000"
          icon={<FaWarehouse />}
        />
      </div>

      {/* Asset Value Analytics */}
      <Panel title="Asset Value Analytics">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={assetTrend}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--brand-blue-bottom)"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Category-wise Asset Value">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Location-wise Asset Value">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationData}>
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
};

export default FixedAssetDashboard;
