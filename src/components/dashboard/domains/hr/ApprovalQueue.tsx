import React from "react";

import DashboardSection from "../../primitives/DashboardSection";
import DashboardStack from "../../layout/DashboardStack";

type ApprovalItem = {
  id: string;
  title: string;
  requester: string;
  department: "hr" | "engineering" | "sales" | "ops";
  type: "leave" | "expense" | "onboarding" | "purchase" | "policy";
  priority: "low" | "normal" | "high" | "critical";
  status: "pending" | "in_review" | "approved" | "rejected";
  ageHours: number;
};

const mockQueue: ApprovalItem[] = [
  {
    id: "1",
    title: "Leave Request - Medical",
    requester: "Amit Sharma",
    department: "engineering",
    type: "leave",
    priority: "high",
    status: "pending",
    ageHours: 18,
  },
  {
    id: "2",
    title: "Laptop Purchase Approval",
    requester: "Neha Verma",
    department: "ops",
    type: "purchase",
    priority: "normal",
    status: "in_review",
    ageHours: 42,
  },
  {
    id: "3",
    title: "New Hire Onboarding Budget",
    requester: "HR Team",
    department: "hr",
    type: "onboarding",
    priority: "critical",
    status: "pending",
    ageHours: 6,
  },
  {
    id: "4",
    title: "Sales Travel Expense Claim",
    requester: "Rahul Mehta",
    department: "sales",
    type: "expense",
    priority: "normal",
    status: "pending",
    ageHours: 30,
  },
];

function getPriorityTone(priority: ApprovalItem["priority"]) {
  switch (priority) {
    case "critical":
      return "border-red-500";
    case "high":
      return "border-orange-500";
    case "normal":
      return "border-blue-500";
    case "low":
      return "border-gray-400";
  }
}

function getStatusBadge(status: ApprovalItem["status"]) {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-500";
    case "in_review":
      return "bg-blue-500/10 text-blue-500";
    case "approved":
      return "bg-green-500/10 text-green-500";
    case "rejected":
      return "bg-red-500/10 text-red-500";
  }
}

function getAgeSeverity(age: number) {
  if (age > 36) return "text-red-500";
  if (age > 18) return "text-yellow-500";
  return "text-[var(--text-muted)]";
}

function DepartmentBadge({ dept }: { dept: ApprovalItem["department"] }) {
  return (
    <span className="text-xs px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-muted)] uppercase">
      {dept}
    </span>
  );
}

export default function ApprovalQueue() {
  const sorted = [...mockQueue].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const statusOrder = { pending: 0, in_review: 1, approved: 2, rejected: 3 };

    return (
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      statusOrder[a.status] - statusOrder[b.status] ||
      b.ageHours - a.ageHours
    );
  });

  const pendingCount = mockQueue.filter(
    (i) => i.status === "pending"
  ).length;

  const avgAge =
    mockQueue.reduce((acc, i) => acc + i.ageHours, 0) / mockQueue.length;

  return (
    <DashboardSection
      title="Approval Flow Intelligence"
      subtitle="Organizational decision bottleneck system"
    >
      {/* Queue KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Pending Items
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {pendingCount}
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Avg Age (hrs)
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {avgAge.toFixed(1)}
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            System Load
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {mockQueue.length}
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <DashboardStack gap="sm">
        {sorted.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border bg-[var(--surface)] ${getPriorityTone(
              item.priority
            )}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]">
                  {item.title}
                </h3>

                <div className="text-xs text-[var(--text-muted)] mt-1">
                  Requested by {item.requester}
                </div>
              </div>

              <span
                className={`text-xs px-2 py-1 rounded-md ${getStatusBadge(
                  item.status
                )}`}
              >
                {item.status.toUpperCase()}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <DepartmentBadge dept={item.department} />

                <span className="text-xs text-[var(--text-muted)] capitalize">
                  {item.type}
                </span>
              </div>

              <div className={`text-xs ${getAgeSeverity(item.ageHours)}`}>
                {item.ageHours}h waiting
              </div>
            </div>
          </div>
        ))}
      </DashboardStack>
    </DashboardSection>
  );
}