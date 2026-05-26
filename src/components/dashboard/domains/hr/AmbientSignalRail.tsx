import React from "react";

import {
  ambientSignals,
  AmbientSignal,
} from "./data/ambientSignals";

// ─────────────────────────────────────────────────────────────────

function getToneStyles(
  tone: AmbientSignal["tone"]
) {
  switch (tone) {
    case "attention":
      return {
        dot: "bg-amber-400",
        text: "text-amber-300/80",
      };

    case "momentum":
      return {
        dot: "bg-sky-400",
        text: "text-sky-300/80",
      };

    case "collaboration":
      return {
        dot: "bg-violet-400",
        text: "text-violet-300/80",
      };

    default:
      return {
        dot: "bg-emerald-400",
        text: "text-emerald-300/80",
      };
  }
}

// ─────────────────────────────────────────────────────────────────

export default function AmbientSignalRail() {
  return (
    <aside
      className="
        sticky
        top-5
      "
    >

      <div
        className="
          flex
          items-center
          gap-2
          pb-4
        "
      >

        <div
          className="
            h-1.5
            w-1.5
            rounded-full
            bg-emerald-400
            animate-pulse
          "
        />

        <span
          className="
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.22em]
            text-[var(--muted-foreground)]
          "
        >
          Operational Signals
        </span>

      </div>

      {/* SIGNAL STREAM */}
      <div
        className="
          space-y-3
        "
      >

        {ambientSignals.map((signal) => {
          const styles = getToneStyles(signal.tone);

          return (
            <div
              key={signal.id}
              className="
                group
                flex
                items-start
                gap-2.5
              "
            >

              {/* SIGNAL DOT */}
              <div className="pt-[5px]">

                <div
                  className={`
                    h-1.5
                    w-1.5
                    rounded-full
                    transition-transform
                    duration-200
                    group-hover:scale-125
                    ${styles.dot}
                  `}
                />

              </div>

              {/* SIGNAL LABEL */}
              <p
                className={`
                  text-[11px]
                  leading-relaxed
                  tracking-wide
                  transition-colors
                  duration-200
                  ${styles.text}
                `}
              >
                {signal.label}
              </p>

            </div>
          );
        })}

      </div>

    </aside>
  );
}