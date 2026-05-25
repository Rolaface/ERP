import { useState } from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import AppraisalFormModal from "../../../components/Hr/performance/AppraisalFormModal";

const mockCycle = {
  name: "Annual Review 2025",
  period: "Jan 2025 – Dec 2025",
  frequency: "Yearly",
  status: "Active",
  department: "All Departments",
};

const mockEmployees = [
  {
    id: 1,
    name: "Rohan Sharma",
    dept: "Engineering",
    status: "Completed",
    selfScore: 4.2,
    managerScore: 4.0,
  },
  {
    id: 2,
    name: "Priya Mehta",
    dept: "Design",
    status: "In Review",
    selfScore: 3.8,
    managerScore: null,
  },
  {
    id: 3,
    name: "Arjun Singh",
    dept: "Engineering",
    status: "Pending",
    selfScore: null,
    managerScore: null,
  },
  {
    id: 4,
    name: "Sneha Kapoor",
    dept: "HR",
    status: "Completed",
    selfScore: 4.5,
    managerScore: 4.3,
  },
  {
    id: 5,
    name: "Karan Verma",
    dept: "Sales",
    status: "Pending",
    selfScore: null,
    managerScore: null,
  },
  {
    id: 6,
    name: "Divya Nair",
    dept: "Design",
    status: "In Review",
    selfScore: 4.0,
    managerScore: null,
  },
];

const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  "In Review": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

interface CycleDetailProps {
  onBack?: () => void;
}

const CycleDetail = ({ onBack }: CycleDetailProps) => {
  const [search, setSearch] = useState("");

  const filtered = mockEmployees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.dept.toLowerCase().includes(search.toLowerCase()),
  );

  const total = mockEmployees.length;
  const completed = mockEmployees.filter(
    (e) => e.status === "Completed",
  ).length;
  const inReview = mockEmployees.filter((e) => e.status === "In Review").length;
  const pending = mockEmployees.filter((e) => e.status === "Pending").length;
  const [appraisalOpen, setAppraisalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);

  return (
    <div className="space-y-5 p-4">
      {/* Back + Cycle Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-3 transition"
        >
          <FaArrowLeft size={12} />
          Back to Cycles
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {mockCycle.name}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {mockCycle.period} &middot; {mockCycle.frequency} &middot;{" "}
              {mockCycle.department}
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            {mockCycle.status}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, color: "text-gray-800" },
          { label: "Completed", value: completed, color: "text-green-600" },
          { label: "In Review", value: inReview, color: "text-blue-600" },
          { label: "Pending", value: pending, color: "text-yellow-600" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-100 rounded-xl p-4"
          >
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Send Reminder */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-64 bg-white">
          <FaSearch className="text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search employee, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm outline-none bg-transparent w-full text-gray-700"
          />
        </div>
        <button className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition">
          Send Reminder
        </button>
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">
                Employee
              </th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">
                Department
              </th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">
                Status
              </th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">
                Self Score
              </th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">
                Manager Score
              </th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400 text-sm"
                >
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="font-medium text-gray-800">
                        {emp.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{emp.dept}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[emp.status]}`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {emp.selfScore ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {emp.managerScore ?? (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedEmpId(emp.id);
                        setAppraisalOpen(true);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AppraisalFormModal
        modalId={`appraisal-${selectedEmpId}`}
        isOpen={appraisalOpen}
        onClose={() => setAppraisalOpen(false)}
      />
    </div>
  );
};

export default CycleDetail;
