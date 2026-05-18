import React from "react";
import {
  Brain,
  Bell,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

interface IntelligenceItem {
  id: string;
  label: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
}

interface IntelligenceRailProps {
  items: IntelligenceItem[];
}

const priorityStyles = {
  low: "bg-info/10 text-info",
  medium: "bg-warning/10 text-warning",
  high: "bg-danger/10 text-danger",
};

const IntelligenceRail: React.FC<IntelligenceRailProps> = ({
  items,
}) => {
  return (
    <aside
      className="
        flex
        flex-col
        gap-4
      "
    >
      {/* HEADER */}

      <section
        className="
          app-surface
          edge-highlight
          rounded-[28px]
          p-5
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-muted
              "
            >
              Intelligence Rail
            </p>

            <h2
              className="
                mt-2
                text-lg
                font-bold
                text-main
              "
            >
              Operational Intelligence
            </h2>
          </div>

          <div
            className="
              w-11
              h-11
              rounded-2xl
              flex
              items-center
              justify-center
              bg-primary/10
              text-primary
            "
          >
            <Brain size={18} />
          </div>
        </div>
      </section>

      {/* FEED */}

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="
              app-surface
              rounded-[24px]
              p-4
              border
              border-theme
              transition-all
              duration-200
              hover:translate-y-[-2px]
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10
                  h-10
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-[var(--row-hover)]
                  text-main
                  shrink-0
                "
              >
                {item.priority === "high" ? (
                  <AlertTriangle size={16} />
                ) : (
                  <Bell size={16} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p
                    className="
                      text-[10px]
                      uppercase
                      tracking-[0.14em]
                      font-bold
                      text-muted
                    "
                  >
                    {item.label}
                  </p>

                  <span
                    className={`
                      px-2
                      py-1
                      rounded-full
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wide
                      ${priorityStyles[item.priority || "low"]}
                    `}
                  >
                    {item.priority || "low"}
                  </span>
                </div>

                <h3
                  className="
                    mt-2
                    text-sm
                    font-semibold
                    text-main
                    leading-relaxed
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    mt-2
                    text-xs
                    leading-relaxed
                    text-muted
                  "
                >
                  {item.description}
                </p>

                <button
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    text-primary
                  "
                >
                  Open Insight
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default IntelligenceRail;