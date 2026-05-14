import React from "react";

interface KPIItem {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;

  tone?: "primary" | "success" | "warning" | "danger" | "info";

  trend?: {
    value: string;
    positive?: boolean;
  };

  subtitle?: string;

  priority?: "high" | "medium" | "low";
}

interface KPIPriorityStripProps {
  title?: string;
  description?: string;
  items: KPIItem[];
}

// ─────────────────────────────────────────────────────────────
// Tone System
// ─────────────────────────────────────────────────────────────

const toneStyles = {
  primary: {
    ring: "ring-primary/10",
    bg: "bg-primary/10",
    text: "text-primary",
  },

  success: {
    ring: "ring-success/10",
    bg: "bg-success/10",
    text: "text-success",
  },

  warning: {
    ring: "ring-warning/10",
    bg: "bg-warning/10",
    text: "text-warning",
  },

  danger: {
    ring: "ring-danger/10",
    bg: "bg-danger/10",
    text: "text-danger",
  },

  info: {
    ring: "ring-info/10",
    bg: "bg-info/10",
    text: "text-info",
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const KPIPriorityStrip: React.FC<KPIPriorityStripProps> = ({
  title = "Operational Snapshot",
  description = "Real-time employee operational overview",
  items,
}) => {
  return (
    <section
      className="
        relative
        overflow-hidden
        app-surface
        edge-highlight
        rounded-[28px]
        p-5
        lg:p-6
      "
    >
      {/* Background Atmosphere */}

      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 left-[15%] w-72 h-72 rounded-full bg-primary blur-3xl" />

        <div className="absolute bottom-0 right-[10%] w-64 h-64 rounded-full bg-success blur-3xl" />
      </div>

      {/* Header */}

      <div
        className="
          relative
          z-10
          flex
          flex-col
          gap-2
          mb-6
        "
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.18em]
                font-bold
                text-muted
              "
            >
              Priority Strip
            </p>

            <h2
              className="
                mt-2
                text-xl
                lg:text-2xl
                font-bold
                tracking-tight
                text-main
              "
            >
              {title}
            </h2>
          </div>

          {/* Optional Live Status */}

          <div
            className="
              hidden
              md:flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              border
              border-theme
              bg-app/60
              backdrop-blur-md
            "
          >
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />

            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-muted
              "
            >
              Live Operational Data
            </span>
          </div>
        </div>

        <p
          className="
            text-sm
            text-muted
            max-w-2xl
            leading-relaxed
          "
        >
          {description}
        </p>
      </div>

      {/* KPI GRID */}

      <div
        className="
          relative
          z-10
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
        "
      >
        {items.map((item) => {
          const tone =
            toneStyles[item.tone ?? "primary"];

          return (
            <div
              key={item.id}
              className={`
                group
                relative
                overflow-hidden

                rounded-[24px]
                border
                border-theme

                bg-app/70
                backdrop-blur-md

                p-5

                transition-all
                duration-300

                hover:-translate-y-0.5
                hover:shadow-[var(--shadow-md)]

                ring-1
                ${tone.ring}
              `}
            >
              {/* Hover Glow */}

              <div
                className={`
                  absolute
                  inset-0
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                  duration-300
                  ${tone.bg}
                `}
              />

              {/* Content */}

              <div className="relative z-10">
                {/* Top Row */}

                <div className="flex items-start justify-between gap-4">
                  {/* Icon */}

                  <div
                    className={`
                      ${tone.bg}
                      ${tone.text}

                      w-12
                      h-12
                      rounded-2xl

                      flex
                      items-center
                      justify-center

                      shrink-0
                    `}
                  >
                    {item.icon}
                  </div>

                  {/* Priority */}

                  {item.priority && (
                    <div
                      className="
                        px-2.5
                        py-1
                        rounded-full
                        border
                        border-theme

                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.12em]

                        text-muted
                        bg-app
                      "
                    >
                      {item.priority}
                    </div>
                  )}
                </div>

                {/* Value */}

                <div className="mt-5">
                  <p
                    className="
                      text-3xl
                      lg:text-[32px]
                      font-bold
                      tracking-tight
                      leading-none
                      text-main
                    "
                  >
                    {item.value}
                  </p>

                  <p
                    className="
                      mt-2
                      text-sm
                      font-semibold
                      text-main
                    "
                  >
                    {item.label}
                  </p>

                  {item.subtitle && (
                    <p
                      className="
                        mt-1.5
                        text-xs
                        leading-relaxed
                        text-muted
                      "
                    >
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Trend */}

                {item.trend && (
                  <div
                    className="
                      mt-5
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <div
                      className={`
                        px-2.5
                        py-1
                        rounded-full
                        text-[11px]
                        font-semibold

                        ${
                          item.trend.positive
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }
                      `}
                    >
                      {item.trend.value}
                    </div>

                    <span
                      className="
                        text-xs
                        text-muted
                      "
                    >
                      vs previous cycle
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default KPIPriorityStrip;