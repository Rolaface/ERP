import React from "react";

import {
  CalendarClock,
  Timer,
  Focus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// ── WORKDAY TIMELINE MODEL ───────────────────────────────────────

type TimelineStatus =
  | "completed"
  | "active"
  | "focus"
  | "upcoming"
  | "urgent";

type TimelineEvent = {
  id: number;
  time: string;
  title: string;
  duration: string;
  status: TimelineStatus;
};

const timeline: TimelineEvent[] = [
  {
    id: 1,
    time: "09:00",
    title: "Team Standup",
    duration: "20 min",
    status: "completed",
  },
  {
    id: 2,
    time: "11:30",
    title: "Invoice Review",
    duration: "45 min",
    status: "active",
  },
  {
    id: 3,
    time: "01:00",
    title: "Focus Window",
    duration: "2 hours",
    status: "focus",
  },
  {
    id: 4,
    time: "03:00",
    title: "Approval Queue",
    duration: "30 min",
    status: "urgent",
  },
  {
    id: 5,
    time: "05:30",
    title: "Deployment Sync",
    duration: "1 hour",
    status: "upcoming",
  },
];

// ── STATUS CONFIG ────────────────────────────────────────────────

function getStatusConfig(status: TimelineStatus) {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        iconTone: "text-emerald-500",
        dot: "bg-emerald-500",
        badge:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        card:
          "border-[color-mix(in_srgb,theme(colors.emerald.500)_18%,transparent)]",
      };

    case "active":
      return {
        icon: Timer,
        iconTone: "text-sky-500",
        dot: "bg-sky-500",
        badge:
          "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        card:
          "border-sky-500/30 bg-sky-500/[0.04]",
      };

    case "focus":
      return {
        icon: Focus,
        iconTone: "text-violet-500",
        dot: "bg-violet-500",
        badge:
          "bg-violet-500/10 text-violet-700 dark:text-violet-300",
        card:
          "border-violet-500/25 bg-violet-500/[0.03]",
      };

    case "urgent":
      return {
        icon: AlertTriangle,
        iconTone: "text-rose-500",
        dot: "bg-rose-500",
        badge:
          "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        card:
          "border-rose-500/30 bg-rose-500/[0.03]",
      };

    default:
      return {
        icon: CalendarClock,
        iconTone: "text-[var(--muted-foreground)]",
        dot: "bg-zinc-400",
        badge:
          "bg-[var(--background)] text-[var(--muted-foreground)]",
        card:
          "border-[var(--border)]",
      };
  }
}

// ── COMPONENT ────────────────────────────────────────────────────

export default function CalendarStrip() {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-[var(--border)]
        bg-[var(--card)]
        px-5
        py-5
      "
    >

      {/* TOP CONTEXT BAR */}
      <div
        className="
          flex
          flex-col
          gap-4
          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >

        {/* LEFT */}
        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <div
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-500
                animate-pulse
              "
            />

            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-[var(--muted-foreground)]
              "
            >
              Live Workday Timeline
            </span>

          </div>

          <div className="mt-3">

            <h2
              className="
                text-xl
                font-semibold
                tracking-tight
                text-[var(--foreground)]
              "
            >
              You are currently in
              {" "}
              <span className="text-sky-500">
                Invoice Review
              </span>
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-[var(--muted-foreground)]
              "
            >
              Next high-priority workload begins at 3:00 PM
            </p>

          </div>

        </div>

        {/* RIGHT */}
        <div
          className="
            flex
            items-center
            gap-3
            self-start
            xl:self-auto
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--background)]
              px-4
              py-3
            "
          >

            <p
              className="
                text-[11px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-[var(--muted-foreground)]
              "
            >
              Remaining Load
            </p>

            <div className="mt-1 flex items-end gap-2">

              <span
                className="
                  text-2xl
                  font-semibold
                  leading-none
                  text-[var(--foreground)]
                "
              >
                3
              </span>

              <span
                className="
                  pb-0.5
                  text-sm
                  text-[var(--muted-foreground)]
                "
              >
                key events
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* RESPONSIVE TIMELINE */}
      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-4
          md:grid-cols-2
          xl:grid-cols-5
        "
      >

        {timeline.map((event) => {
          const config = getStatusConfig(event.status);
          const Icon = config.icon;

          return (
            <div
              key={event.id}
              className={`
                relative
                rounded-3xl
                border
                p-4
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-[color-mix(in_srgb,var(--border)_70%,black)]
                ${config.card}
              `}
            >

              {/* STATUS HEADER */}
              <div className="flex items-start justify-between gap-3">

                <div
                  className={`
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[var(--background)]
                    ${config.iconTone}
                  `}
                >

                  <Icon className="h-5 w-5" />

                </div>

                <div
                  className={`
                    rounded-full
                    px-2.5
                    py-1
                    text-[11px]
                    font-medium
                    capitalize
                    ${config.badge}
                  `}
                >
                  {event.status}
                </div>

              </div>

              {/* CONTENT */}
              <div className="mt-5">

                <div
                  className="
                    text-xs
                    font-medium
                    tracking-wide
                    text-[var(--muted-foreground)]
                  "
                >
                  {event.time}
                </div>

                <h3
                  className="
                    mt-2
                    text-base
                    font-semibold
                    leading-tight
                    text-[var(--foreground)]
                  "
                >
                  {event.title}
                </h3>

                <div
                  className="
                    mt-4
                    flex
                    items-center
                    justify-between
                  "
                >

                  <span
                    className="
                      text-sm
                      text-[var(--muted-foreground)]
                    "
                  >
                    {event.duration}
                  </span>

                  <div
                    className={`
                      h-2
                      w-2
                      rounded-full
                      ${config.dot}
                    `}
                  />

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}