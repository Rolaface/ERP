import React from "react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  priority: "critical" | "high" | "normal" | "low";
  time: string;
};

const announcements: Announcement[] = [
  {
    id: "1",
    title: "Payroll processing delayed",
    message: "Expected completion shifted by 24 hours.",
    priority: "critical",
    time: "Just now",
  },
  {
    id: "2",
    title: "Sprint planning scheduled",
    message: "Engineering sync begins Monday at 10 AM.",
    priority: "high",
    time: "2h ago",
  },
  {
    id: "3",
    title: "Leave policy updated",
    message: "New policy documentation is now available.",
    priority: "normal",
    time: "1d ago",
  },
];

function getTone(priority: Announcement["priority"]) {
  switch (priority) {
    case "critical":
      return "bg-rose-500";

    case "high":
      return "bg-amber-500";

    case "normal":
      return "bg-blue-500";

    case "low":
      return "bg-zinc-400";
  }
}

export default function AnnouncementPanel() {
  return (
    <section
      className="
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        px-4
        py-3
      "
    >

      <div className="flex items-center justify-between">

        <h2 className="text-sm font-medium text-[var(--foreground)]">
          Awareness
        </h2>

        <span className="text-xs text-[var(--muted-foreground)]">
          {announcements.length} updates
        </span>

      </div>

      <div className="mt-3 divide-y divide-[var(--border)]">

        {announcements.map((item) => (
          <div
            key={item.id}
            className="
              flex
              items-start
              gap-3
              py-3
            "
          >

            <div
              className={`
                mt-1.5
                h-2
                w-2
                rounded-full
                ${getTone(item.priority)}
              `}
            />

            <div className="min-w-0 flex-1">

              <div className="flex items-center justify-between gap-3">

                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  {item.title}
                </h3>

                <span className="text-xs text-[var(--muted-foreground)]">
                  {item.time}
                </span>

              </div>

              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {item.message}
              </p>

            </div>

          </div>
        ))}

      </div>
    </section>
  );
}