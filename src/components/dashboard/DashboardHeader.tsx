import React from "react";
import clsx from "clsx";
import {
  Bell,
  CalendarDays,
  Clock3,
  Plus,
} from "lucide-react";

import DashboardPanel from "./primitives/DashboardPanel";

interface DashboardHeaderProps {
  greeting: string;

  userName: string;

  employeeId?: string;

  attendanceStatus?: string;

  shiftLabel?: string;

  notificationCount?: number;

  onNotificationClick?: () => void;

  onQuickActionClick?: () => void;

  actions?: React.ReactNode;

  className?: string;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const getFormattedDate = () => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
};

const getCurrentTime = () => {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
};

/* ─────────────────────────────────────────────────────────────
   DASHBOARD HEADER
───────────────────────────────────────────────────────────── */

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  greeting,
  userName,

  employeeId,

  attendanceStatus = "Present",
  shiftLabel = "General Shift",

  notificationCount = 0,

  onNotificationClick,
  onQuickActionClick,

  actions,

  className,
}) => {
  return (
    <DashboardPanel
      padding="md"
      elevation="sm"
      className={clsx(
        "min-h-[112px]",
        className
      )}
    >
      <div
        className={clsx(
          "flex flex-col gap-5",
          "xl:flex-row xl:items-center xl:justify-between"
        )}
      >
        {/* ── Left Side ───────────────────────── */}
        <div className="min-w-0 flex-1">
          {/* Greeting */}
          <p
            className={clsx(
              "text-[13px]",
              "font-medium",
              "text-[var(--text-secondary)]"
            )}
          >
            {greeting}
          </p>

          {/* User Name */}
          <h1
            className={clsx(
              "mt-1",
              "truncate",
              "text-[28px]",
              "font-bold",
              "leading-tight",
              "tracking-[-0.04em]",
              "text-[var(--text-primary)]"
            )}
          >
            {userName}
          </h1>

          {/* Metadata */}
          <div
            className={clsx(
              "mt-ds-3",
              "flex flex-wrap items-center gap-x-4 gap-y-2"
            )}
          >
            {/* Employee ID */}
            {employeeId && (
              <div
                className={clsx(
                  "inline-flex items-center gap-2",
                  "text-[12px]",
                  "text-[var(--text-secondary)]"
                )}
              >
                <div
                  className={clsx(
                    "h-2 w-2 rounded-full",
                    "bg-[var(--brand-primary)]"
                  )}
                />

                <span className="truncate">
                  Employee ID: {employeeId}
                </span>
              </div>
            )}

            {/* Attendance */}
            <div
              className={clsx(
                "inline-flex items-center gap-2",
                "rounded-full",
                "bg-[var(--success-soft)]",
                "px-2.5 py-1",
                "text-[11px]",
                "font-semibold",
                "text-[var(--success)]"
              )}
            >
              <div className="h-2 w-2 rounded-full bg-[var(--success)]" />

              <span>{attendanceStatus}</span>
            </div>

            {/* Shift */}
            <div
              className={clsx(
                "inline-flex items-center gap-2",
                "text-[12px]",
                "text-[var(--text-tertiary)]"
              )}
            >
              <Clock3 size={14} />

              <span>{shiftLabel}</span>
            </div>
          </div>
        </div>

        {/* ── Right Side ─────────────────────── */}
        <div
          className={clsx(
            "flex flex-wrap items-center gap-3",
            "xl:justify-end"
          )}
        >
          {/* Context Indicators */}
          <div
            className={clsx(
              "hidden md:flex",
              "items-center gap-3",
              "rounded-[var(--radius-lg)]",
              "border border-[var(--border-subtle)]",
              "bg-[var(--surface-secondary)]",
              "px-ds-4 py-ds-3"
            )}
          >
            <div
              className={clsx(
                "flex h-10 w-10 items-center justify-center",
                "rounded-xl",
                "bg-[var(--surface-primary)]",
                "text-[var(--brand-primary)]"
              )}
            >
              <CalendarDays size={18} />
            </div>

            <div className="min-w-0">
              <p
                className={clsx(
                  "text-[11px]",
                  "font-medium uppercase tracking-[0.08em]",
                  "text-[var(--text-tertiary)]"
                )}
              >
                Today
              </p>

              <p
                className={clsx(
                  "text-[13px]",
                  "font-semibold",
                  "text-[var(--text-primary)]"
                )}
              >
                {getFormattedDate()}
              </p>

              <p
                className={clsx(
                  "text-[12px]",
                  "text-[var(--text-secondary)]"
                )}
              >
                {getCurrentTime()}
              </p>
            </div>
          </div>

          {/* Notification Button */}
          <button
            type="button"
            onClick={onNotificationClick}
            className={clsx(
              "relative inline-flex items-center justify-center",
              "h-11 w-11",
              "rounded-xl",
              "border border-[var(--border-subtle)]",
              "bg-[var(--surface-primary)]",
              "text-[var(--text-secondary)]",
              "transition-all duration-[var(--motion-fast)]",
              "hover:border-[var(--border-strong)]",
              "hover:bg-[var(--surface-secondary)]",
              "hover:text-[var(--text-primary)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--brand-primary)]"
            )}
          >
            <Bell size={18} />

            {notificationCount > 0 && (
              <span
                className={clsx(
                  "absolute -right-1 -top-1",
                  "flex h-5 min-w-[20px] items-center justify-center",
                  "rounded-full",
                  "bg-[var(--danger)]",
                  "px-1",
                  "text-[10px] font-bold",
                  "text-white"
                )}
              >
                {notificationCount > 9
                  ? "9+"
                  : notificationCount}
              </span>
            )}
          </button>

          {/* Quick Action */}
          <button
            type="button"
            onClick={onQuickActionClick}
            className={clsx(
              "inline-flex items-center gap-2",
              "rounded-xl",
              "bg-[var(--brand-primary)]",
              "px-ds-4 py-ds-3",
              "text-[13px]",
              "font-semibold",
              "text-white",
              "transition-all duration-[var(--motion-fast)]",
              "hover:opacity-90",
              "active:scale-[0.98]",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--brand-primary)]",
              "focus-visible:ring-offset-2"
            )}
          >
            <Plus size={16} />

            <span>Quick Action</span>
          </button>

          {/* Additional Actions */}
          {actions}
        </div>
      </div>
    </DashboardPanel>
  );
};

export default DashboardHeader;