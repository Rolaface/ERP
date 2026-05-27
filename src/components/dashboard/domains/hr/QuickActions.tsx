import React from "react";

import {
  CalendarPlus,
  CreditCard,
  Clock3,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { openLeaveApplyModal } from "../../../../store/modalStore";

interface QuickActionItem {
  id: string;

  label: string;

  description: string;

  icon: React.ElementType;

  tone:
    | "primary"
    | "success"
    | "warning"
    | "neutral";

  action: () => void;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Quick Action Definitions
   */
  const quickActions: QuickActionItem[] = [
    {
      id: "apply-leave",

      label: "Apply Leave",

      description:
        "Request leave instantly",

      icon: CalendarPlus,

      tone: "primary",

      action: () =>
        openLeaveApplyModal(
          null,
          false,
          {}
        ),
    },

    {
      id: "expense-claim",

      label: "Expense Claim",

      description:
        "Submit reimbursements",

      icon: CreditCard,

      tone: "warning",

      action: () =>
        navigate("/hr/emp-expenses"),
    },

    {
      id: "attendance",

      label: "Attendance",

      description:
        "View logs & sessions",

      icon: Clock3,

      tone: "success",

      action: () =>
        navigate(
          "/hr/emp-timesheet"
        ),
    },
  ];

  /**
   * Tone Styles
   */
  const toneStyles: Record<
    QuickActionItem["tone"],
    string
  > = {
    primary:
      "border-[var(--primary)]/15 bg-[var(--primary)]/6 text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/10",

    success:
      "border-emerald-500/15 bg-emerald-500/6 text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/10",

    warning:
      "border-amber-500/15 bg-amber-500/6 text-amber-600 hover:border-amber-500/30 hover:bg-amber-500/10",

    neutral:
      "border-blue-500/15 bg-blue-500/6 text-blue-600 hover:border-blue-500/30 hover:bg-blue-500/10",
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="px-1">
        <h3
          className="
            text-sm
            font-semibold
            tracking-tight
            text-[var(--foreground)]
          "
        >
          Quick Actions
        </h3>

        <p
          className="
            mt-0.5
            text-xs
            text-[var(--muted-foreground)]
          "
        >
          Fast operational shortcuts
        </p>
      </div>

      {/* Vertical Actions */}
      <div className="space-y-2">
        {quickActions.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`
                group
                relative
                flex
                w-full
                items-center
                gap-3
                overflow-hidden
                rounded-2xl
                border
                px-4
                py-3
                text-left
                transition-all
                duration-200
                hover:translate-x-0.5
                hover:shadow-sm

                ${toneStyles[item.tone]}
              `}
            >
              {/* Hover Accent */}
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-y-0
                  left-0
                  w-1
                  rounded-r-full
                  bg-current
                  opacity-0
                  transition-opacity
                  duration-200
                  group-hover:opacity-100
                "
              />

              {/* Icon */}
              <div
                className="
                  relative
                  z-10
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-current/10
                  bg-white/40
                  backdrop-blur-sm
                "
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="relative z-10 min-w-0 flex-1">
                <h4
                  className="
                    truncate
                    text-sm
                    font-semibold
                    tracking-tight
                  "
                >
                  {item.label}
                </h4>

                <p
                  className="
                    truncate
                    text-xs
                    opacity-75
                  "
                >
                  {item.description}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight
                className="
                  relative
                  z-10
                  h-4
                  w-4
                  shrink-0
                  opacity-40
                  transition-all
                  duration-200
                  group-hover:translate-x-0.5
                  group-hover:opacity-80
                "
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;