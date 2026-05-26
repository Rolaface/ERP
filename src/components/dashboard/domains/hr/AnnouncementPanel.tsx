import React from "react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  priority:
    | "critical"
    | "high"
    | "normal"
    | "low";
  time: string;
};

const announcements: Announcement[] = [
  {
    id: "1",
    title: "Payroll processing delayed",
    message:
      "Expected completion shifted by 24 hours.",
    priority: "critical",
    time: "Just now",
  },
  {
    id: "2",
    title: "Sprint planning scheduled",
    message:
      "Engineering sync begins Monday at 10 AM.",
    priority: "high",
    time: "2h ago",
  },
  {
    id: "3",
    title: "Leave policy updated",
    message:
      "New policy documentation is now available.",
    priority: "normal",
    time: "1d ago",
  },
];

function getTone(
  priority: Announcement["priority"]
) {
  switch (priority) {
    case "critical":
      return {
        dot: "bg-rose-500",
        badge:
          "bg-rose-500/10 text-rose-700",
      };

    case "high":
      return {
        dot: "bg-amber-500",
        badge:
          "bg-amber-500/10 text-amber-700",
      };

    case "normal":
      return {
        dot: "bg-blue-500",
        badge:
          "bg-blue-500/10 text-blue-700",
      };

    case "low":
      return {
        dot: "bg-zinc-400",
        badge:
          "bg-zinc-500/10 text-zinc-700",
      };
  }
}

export default function AnnouncementPanel() {
  return (
    <section
      className="
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        px-5
        py-4
      "
    >

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.16em]
              text-[var(--muted-foreground)]
            "
          >
            Awareness Feed
          </p>

          <h2
            className="
              mt-2
              text-lg
              font-semibold
              text-[var(--foreground)]
            "
          >
            Organizational Updates
          </h2>

        </div>

        <div
          className="
            rounded-full
            border
            border-[var(--border)]
            bg-[var(--background)]
            px-2.5
            py-1
            text-xs
            font-medium
            text-[var(--muted-foreground)]
          "
        >
          {announcements.length} updates
        </div>

      </div>

      {/* FEED */}
      <div className="mt-5 divide-y divide-[var(--border)]">

        {announcements.map((item) => {
          const tone = getTone(item.priority);

          return (
            <div
              key={item.id}
              className="
                flex
                items-start
                gap-3
                py-3
              "
            >

              {/* DOT */}
              <div className="pt-1.5">

                <div
                  className={`
                    h-2
                    w-2
                    rounded-full
                    ${tone.dot}
                  `}
                />

              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">

                      <h3
                        className="
                          text-sm
                          font-medium
                          text-[var(--foreground)]
                        "
                      >
                        {item.title}
                      </h3>

                      <span
                        className={`
                          rounded-full
                          px-2
                          py-0.5
                          text-[10px]
                          font-medium
                          ${tone.badge}
                        `}
                      >
                        {item.priority}
                      </span>

                    </div>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-relaxed
                        text-[var(--muted-foreground)]
                      "
                    >
                      {item.message}
                    </p>

                  </div>

                  <span
                    className="
                      shrink-0
                      text-xs
                      text-[var(--muted-foreground)]
                    "
                  >
                    {item.time}
                  </span>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
};
