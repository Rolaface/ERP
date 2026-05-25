import React, { useMemo } from "react";
import { Clock3, CheckCircle2, AlertCircle, Plane } from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";

const EmployeeOperatingBanner: React.FC = () => {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";

    return "Good evening";
  }, []);

  const statusItems = [
    {
      icon: CheckCircle2,
      label: "Checked In",
      value: "9:42 AM",
      tone: "success",
    },
    {
      icon: AlertCircle,
      label: "Pending Actions",
      value: "3 items",
      tone: "warning",
    },
    {
      icon: Clock3,
      label: "Workload",
      value: "Moderate",
      tone: "neutral",
    },
    {
      icon: Plane,
      label: "Leave Balance",
      value: "Healthy",
      tone: "success",
    },
  ];

  const toneStyles: Record<string, string> = {
    success:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

    warning:
      "bg-amber-500/10 text-amber-600 border-amber-500/20",

    neutral:
      "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        px-6
        py-7
        shadow-sm
      "
    >
      {/* Background Accent */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.04]
          pointer-events-none
        "
        style={{
          background:
            "radial-gradient(circle at top right, var(--primary) 0%, transparent 60%)",
        }}
      />

      <div
        className="
          relative
          z-10
          flex
          flex-col
          gap-8
          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >
        {/* LEFT SIDE */}
        <div className="space-y-4">
          {/* Greeting */}
          <div className="space-y-1">
            <p
              className="
                text-sm
                font-medium
                text-[var(--muted-foreground)]
              "
            >
              {greeting}
            </p>

            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-[var(--foreground)]
              "
            >
              {user?.fullName ?? user?.username}
            </h1>
          </div>

          {/* Metadata */}
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
              text-sm
              text-[var(--muted-foreground)]
            "
          >
            <span>Frontend Engineer</span>

            <span className="opacity-40">•</span>

            <span>Product Team</span>

            <span className="opacity-40">•</span>

            <span>Remote</span>
          </div>

          {/* Shift */}
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[var(--border)]
              bg-[var(--background)]
              px-3
              py-1.5
              text-sm
              text-[var(--muted-foreground)]
            "
          >
            <Clock3 className="h-4 w-4" />

            <span>Shift: 10:00 AM – 7:00 PM</span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-4
          "
        >
          {statusItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`
                  min-w-[140px]
                  rounded-2xl
                  border
                  px-4
                  py-3
                  transition-all
                  ${toneStyles[item.tone]}
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />

                  <p className="text-xs font-medium opacity-80">
                    {item.label}
                  </p>
                </div>

                <p className="mt-2 text-lg font-semibold">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EmployeeOperatingBanner;