import React from "react";

import {
  ambientSignals,
  AmbientSignal,
} from "./data/ambientSignals";

import {
  Activity,
  Orbit,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────

function getToneStyles(
  tone: AmbientSignal["tone"]
) {
  switch (tone) {
    case "attention":
      return {
        dot: "bg-amber-500",
        badge:
          "bg-amber-500/10 text-amber-700 border-amber-500/20",
      };

    case "momentum":
      return {
        dot: "bg-sky-500",
        badge:
          "bg-sky-500/10 text-sky-700 border-sky-500/20",
      };

    case "collaboration":
      return {
        dot: "bg-violet-500",
        badge:
          "bg-violet-500/10 text-violet-700 border-violet-500/20",
      };

    default:
      return {
        dot: "bg-emerald-500",
        badge:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      };
  }
}

// ─────────────────────────────────────────────────────────────────

export default function AmbientSignalRail() {
  return (
    <aside className="sticky top-5">

      <section
        className="
          rounded-3xl
          border
          border-[var(--border)]
          bg-[var(--card)]
          p-5
          shadow-sm
        "
      >

        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">

          <div>
            <div className="flex items-center gap-2">

              <Orbit className="h-4 w-4 text-[var(--primary)]" />

              <h2
                className="
                  text-sm
                  font-semibold
                  tracking-wide
                  text-[var(--foreground)]
                "
              >
                Workflow Intelligence
              </h2>

            </div>

            <p
              className="
                mt-1
                text-xs
                leading-relaxed
                text-[var(--muted-foreground)]
              "
            >
              Live operational awareness across your workflow ecosystem
            </p>

          </div>

          <div
            className="
              flex
              items-center
              gap-1.5
              rounded-full
              bg-emerald-500/10
              px-2.5
              py-1
              text-[10px]
              font-medium
              text-emerald-700
            "
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />

            Live
          </div>

        </div>

        {/* SIGNAL STREAM */}
        <div className="mt-5 space-y-3">

          {ambientSignals.map((signal) => {
            const styles = getToneStyles(signal.tone);

            return (
              <div
                key={signal.id}
                className="
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--background)]
                  px-3
                  py-3
                  transition-all
                  duration-200
                  hover:border-[color-mix(in_srgb,var(--primary)_18%,var(--border))]
                "
              >

                <div className="pt-1">

                  <div
                    className={`
                      h-2
                      w-2
                      rounded-full
                      ${styles.dot}
                    `}
                  />

                </div>

                <div className="min-w-0 flex-1">

                  <p
                    className="
                      text-sm
                      leading-relaxed
                      text-[var(--foreground)]
                    "
                  >
                    {signal.label}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </section>

    </aside>
  );
}