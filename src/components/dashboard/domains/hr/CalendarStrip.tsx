import React from "react";

// ── OPERATIONAL RHYTHM DATA ──────────────────────────────────────

type TimelineEvent = {
  time: string;
  title: string;
  status: "stable" | "active" | "focus" | "urgent";
};

const timeline: TimelineEvent[] = [
  {
    time: "09:00",
    title: "Team Standup",
    status: "active",
  },
  {
    time: "11:30",
    title: "Invoice Review",
    status: "focus",
  },
  {
    time: "01:00",
    title: "Lunch Window",
    status: "stable",
  },
  {
    time: "03:00",
    title: "Approval Queue",
    status: "urgent",
  },
  {
    time: "05:30",
    title: "Deployment Sync",
    status: "active",
  },
];

// ── STATUS TONES ─────────────────────────────────────────────────

function getStatusTone(status: TimelineEvent["status"]) {
  switch (status) {
    case "urgent":
      return "bg-rose-400";

    case "active":
      return "bg-sky-400";

    case "focus":
      return "bg-violet-400";

    default:
      return "bg-emerald-400";
  }
}

// ── COMPONENT ────────────────────────────────────────────────────

export default function CalendarStrip() {
  return (
    <section
      className="
        relative
        overflow-x-auto
        scrollbar-none
      "
    >

      <div
        className="
          flex
          items-center
          gap-0
          min-w-max
        "
      >

        {/* NOW MARKER */}
        <div
          className="
            flex
            items-center
            gap-3
            pr-5
            shrink-0
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <div
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-400
                animate-pulse
              "
            />

            <span
              className="
                text-[11px]
                font-semibold
                tracking-[0.24em]
                text-[var(--muted-foreground)]
              "
            >
              NOW
            </span>

          </div>

          <div
            className="
              h-px
              w-14
              bg-[color-mix(in_srgb,var(--border)_45%,transparent)]
            "
          />

        </div>

        {/* TIMELINE EVENTS */}
        {timeline.map((event, index) => (
          <React.Fragment key={event.time}>

            <div
              className="
                group
                relative
                flex
                items-start
                gap-3
                px-4
                py-1
                shrink-0
              "
            >

              {/* STATUS NODE */}
              <div className="pt-[3px]">

                <div
                  className={`
                    h-2
                    w-2
                    rounded-full
                    transition-transform
                    duration-200
                    group-hover:scale-125
                    ${getStatusTone(event.status)}
                  `}
                />

              </div>

              {/* EVENT CONTENT */}
              <div className="space-y-1">

                <div
                  className="
                    text-[11px]
                    font-medium
                    tracking-wide
                    text-[var(--muted-foreground)]
                  "
                >
                  {event.time}
                </div>

                <div
                  className="
                    whitespace-nowrap
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                  "
                >
                  {event.title}
                </div>

              </div>

            </div>

            {/* CONNECTOR */}
            {index !== timeline.length - 1 && (
              <div
                className="
                  h-px
                  w-10
                  shrink-0
                  bg-[color-mix(in_srgb,var(--border)_28%,transparent)]
                "
              />
            )}

          </React.Fragment>
        ))}

      </div>

    </section>
  );
}