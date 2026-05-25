import React from "react";

import DashboardSection from "../../primitives/DashboardSection";
import DashboardStack from "../../layout/DashboardStack";
import TimelineItem from "../../primitives/TimelineItem";

type Announcement = {
  id: string;
  title: string;
  message: string;
  priority: "critical" | "high" | "normal" | "low";
  audience: "all" | "hr" | "engineering" | "sales" | "ops";
  time: string;
  expiresIn?: string;
};

const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Payroll Processing Delay",
    message: "Payroll will be delayed by 24 hours due to system maintenance.",
    priority: "critical",
    audience: "all",
    time: "Just now",
    expiresIn: "6h",
  },
  {
    id: "2",
    title: "Engineering Sprint Planning",
    message: "Sprint planning scheduled for Monday 10 AM.",
    priority: "high",
    audience: "engineering",
    time: "2h ago",
  },
  {
    id: "3",
    title: "HR Policy Update",
    message: "Updated leave policy has been published in the portal.",
    priority: "normal",
    audience: "all",
    time: "1d ago",
  },
  {
    id: "4",
    title: "Office Maintenance Notice",
    message: "Cafeteria will remain closed during maintenance window.",
    priority: "low",
    audience: "all",
    time: "2d ago",
  },
];

function getPriorityTone(priority: Announcement["priority"]) {
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

function getPriorityLabel(priority: Announcement["priority"]) {
  switch (priority) {
    case "critical":
      return "CRITICAL";
    case "high":
      return "HIGH";
    case "normal":
      return "NORMAL";
    case "low":
      return "LOW";
  }
}

function AnnouncementMeta({
  audience,
  time,
  expiresIn,
}: {
  audience: Announcement["audience"];
  time: string;
  expiresIn?: string;
}) {
  return (
    <div className="flex gap-2 text-xs text-[var(--text-muted)]">
      <span>👥 {audience.toUpperCase()}</span>
      <span>•</span>
      <span>{time}</span>
      {expiresIn && (
        <>
          <span>•</span>
          <span>⏱ expires in {expiresIn}</span>
        </>
      )}
    </div>
  );
}

export default function AnnouncementPanel() {
  const sorted = [...mockAnnouncements].sort((a, b) => {
    const order = { critical: 0, high: 1, normal: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <DashboardSection
      title="Organizational Broadcasts"
      subtitle="Priority-based communication system"
    >
      <DashboardStack gap="sm">
        {sorted.map((a) => (
          <div
            key={a.id}
            className={`p-4 rounded-xl border bg-[var(--surface)] ${getPriorityTone(
              a.priority
            )}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]">
                  {a.title}
                </h3>

                <AnnouncementMeta
                  audience={a.audience}
                  time={a.time}
                  expiresIn={a.expiresIn}
                />
              </div>

              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-muted)]">
                {getPriorityLabel(a.priority)}
              </span>
            </div>

            {/* Message */}
            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
              {a.message}
            </p>
          </div>
        ))}
      </DashboardStack>
    </DashboardSection>
  );
}