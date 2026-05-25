import React from "react";
import {
  Users,
  Clock3,
  Video,
  CheckCircle2,
} from "lucide-react";

const TeamAvailability: React.FC = () => {
  const teams = [
    {
      name: "Engineering",
      status: "Busy",
      availability: "6 available",
      meetings: "2 in meetings",
      statusColor:
        "text-orange-600 bg-orange-500/10 border-orange-500/20",
    },
    {
      name: "HR",
      status: "Available",
      availability: "5 available",
      meetings: "1 in meetings",
      statusColor:
        "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      name: "Design",
      status: "Focused",
      availability: "3 available",
      meetings: "0 in meetings",
      statusColor:
        "text-blue-600 bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <section
      className="
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--background)]
        p-5
        space-y-5
      "
    >
      {/* ─────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2
          className="
            text-base
            font-semibold
            text-[var(--foreground)]
          "
        >
          Team Availability
        </h2>

        <p
          className="
            text-sm
            text-[var(--muted-foreground)]
          "
        >
          Lightweight collaboration visibility across teams
        </p>
      </div>

      {/* ─────────────────────────────────────────────
          METRICS ROW
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--card)]
            p-3
            space-y-2
          "
        >
          <Users className="h-4 w-4 text-blue-500" />

          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Teams Online
            </p>

            <h3 className="text-lg font-semibold">
              4
            </h3>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--card)]
            p-3
            space-y-2
          "
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />

          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Available Now
            </p>

            <h3 className="text-lg font-semibold">
              18
            </h3>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--card)]
            p-3
            space-y-2
          "
        >
          <Video className="h-4 w-4 text-orange-500" />

          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              In Meetings
            </p>

            <h3 className="text-lg font-semibold">
              7
            </h3>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          TEAM STATUS CARDS
      ───────────────────────────────────────────── */}
      <div className="space-y-3">
        {teams.map((team) => (
          <div
            key={team.name}
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--card)]
              p-4
            "
          >
            <div className="flex items-start justify-between gap-3">

              <div className="space-y-2">
                <div>
                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-[var(--foreground)]
                    "
                  >
                    {team.name}
                  </h3>

                  <p
                    className="
                      text-xs
                      text-[var(--muted-foreground)]
                    "
                  >
                    Collaboration visibility
                  </p>
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-4
                    text-xs
                    text-[var(--muted-foreground)]
                  "
                >
                  <span>{team.availability}</span>
                  <span>{team.meetings}</span>
                </div>
              </div>

              <div
                className={`
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  font-medium
                  border
                  ${team.statusColor}
                `}
              >
                {team.status}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────
          LIVE COLLABORATION HINTS
      ───────────────────────────────────────────── */}
      <div
        className="
          rounded-2xl
          border
          border-dashed
          border-[var(--border)]
          bg-[var(--card)]
          p-4
          space-y-3
        "
      >
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[var(--muted-foreground)]" />

          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-[var(--muted-foreground)]
            "
          >
            Live Collaboration Signals
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-[var(--foreground)]">
            Backend team currently reviewing deployment requests
          </p>

          <p className="text-[var(--foreground)]">
            Product team available after 3 PM
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamAvailability;