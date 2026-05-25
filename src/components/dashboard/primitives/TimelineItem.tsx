import type { ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Circle,
  LucideIcon,
} from "lucide-react";

type TimelineStatus =
  | "completed"
  | "active"
  | "pending"
  | "warning"
  | "neutral";

type TimelineDensity = "compact" | "comfortable";

interface TimelineItemProps {
  /**
   * Main event title
   * Example:
   * "Leave request approved"
   */
  title: string;

  /**
   * Supporting operational context
   */
  description?: string;

  /**
   * Time metadata
   * Example:
   * "2h ago"
   * "Today • 09:30 AM"
   */
  timestamp?: string;

  /**
   * Event state
   */
  status?: TimelineStatus;

  /**
   * Optional custom icon
   */
  icon?: LucideIcon;

  /**
   * Right-side metadata
   * Example:
   * "HR Team"
   * "Auto-generated"
   */
  meta?: string;

  /**
   * Connector visibility
   * Last item should hide line
   */
  showConnector?: boolean;

  /**
   * Density system
   */
  density?: TimelineDensity;

  /**
   * Optional footer
   */
  footer?: ReactNode;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Click interaction
   */
  onClick?: () => void;

  className?: string;
}

const statusStyles: Record<
  TimelineStatus,
  {
    dot: string;
    icon: string;
    card: string;
    line: string;
  }
> = {
  completed: {
    dot: "bg-emerald-500 text-white",
    icon: "text-emerald-600",
    card: "border-emerald-500/15",
    line: "bg-emerald-500/20",
  },

  active: {
    dot: "bg-[color:var(--primary)] text-white",
    icon: "text-primary",
    card: "border-[color:var(--primary)]/15",
    line: "bg-[color:var(--primary)]/20",
  },

  pending: {
    dot: "bg-amber-500 text-white",
    icon: "text-amber-600",
    card: "border-amber-500/15",
    line: "bg-amber-500/20",
  },

  warning: {
    dot: "bg-red-500 text-white",
    icon: "text-red-600",
    card: "border-red-500/15",
    line: "bg-red-500/20",
  },

  neutral: {
    dot: "bg-surface-2 text-muted",
    icon: "text-muted",
    card: "border-theme",
    line: "bg-[var(--border)]",
  },
};

const densityStyles: Record<
  TimelineDensity,
  {
    wrapperGap: string;
    dot: string;
    cardPadding: string;
    title: string;
    description: string;
  }
> = {
  compact: {
    wrapperGap: "gap-3",
    dot: "h-9 w-9",
    cardPadding: "p-4 rounded-2xl",
    title: "text-sm",
    description: "text-xs",
  },

  comfortable: {
    wrapperGap: "gap-4",
    dot: "h-11 w-11",
    cardPadding: "p-5 rounded-3xl",
    title: "text-base",
    description: "text-sm",
  },
};

export default function TimelineItem({
  title,
  description,
  timestamp,
  status = "neutral",
  icon: Icon,
  meta,
  showConnector = true,
  density = "comfortable",
  footer,
  loading = false,
  onClick,
  className = "",
}: TimelineItemProps) {
  const statusStyle = statusStyles[status];
  const densityStyle = densityStyles[density];

  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`
        relative
        flex
        ${densityStyle.wrapperGap}
        ${className}
      `}
    >
      {/* Timeline Rail */}
      <div className="relative flex flex-col items-center">
        {/* Dot */}
        <div
          className={`
            relative
            z-10
            flex
            shrink-0
            items-center
            justify-center
            rounded-full
            shadow-sm
            ${densityStyle.dot}
            ${statusStyle.dot}
          `}
        >
          <TimelineStatusIcon
            status={status}
            icon={Icon}
          />
        </div>

        {/* Connector */}
        {showConnector ? (
          <div
            className={`
              mt-2
              w-px
              flex-1
              min-h-[48px]
              ${statusStyle.line}
            `}
          />
        ) : null}
      </div>

      {/* Content */}
      <article
        onClick={onClick}
        className={`
          group
          relative
          min-w-0
          flex-1
          overflow-hidden
          border
          bg-card
          transition-all
          duration-300
          ${densityStyle.cardPadding}
          ${statusStyle.card}
          ${
            isInteractive
              ? "cursor-pointer interactive-lift"
              : ""
          }
        `}
      >
        {/* Ambient top line */}
        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/40
            to-transparent
            opacity-50
          "
        />

        {loading ? (
          <TimelineItemSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3
                  className={`
                    font-semibold
                    leading-tight
                    text-main
                    ${densityStyle.title}
                  `}
                >
                  {title}
                </h3>

                {description ? (
                  <p
                    className={`
                      mt-1
                      leading-relaxed
                      text-muted
                      ${densityStyle.description}
                    `}
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              {meta ? (
                <div
                  className="
                    shrink-0
                    rounded-full
                    bg-surface-2
                    px-3
                    py-1
                    text-[11px]
                    font-medium
                    text-muted
                  "
                >
                  {meta}
                </div>
              ) : null}
            </div>

            {/* Timestamp */}
            {timestamp ? (
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-xs
                  text-muted
                "
              >
                <Clock3 size={14} />

                <span>{timestamp}</span>
              </div>
            ) : null}

            {/* Footer */}
            {footer ? (
              <>
                <div className="divider" />

                <div>{footer}</div>
              </>
            ) : null}
          </div>
        )}
      </article>
    </div>
  );
}

/* =========================================
   STATUS ICON SYSTEM
========================================= */

interface TimelineStatusIconProps {
  status: TimelineStatus;
  icon?: LucideIcon;
}

function TimelineStatusIcon({
  status,
  icon: CustomIcon,
}: TimelineStatusIconProps) {
  if (CustomIcon) {
    return <CustomIcon size={18} />;
  }

  switch (status) {
    case "completed":
      return <CheckCircle2 size={18} />;

    case "active":
      return <Clock3 size={18} />;

    case "pending":
      return <Clock3 size={18} />;

    case "warning":
      return <AlertTriangle size={18} />;

    default:
      return <Circle size={14} />;
  }
}

/* =========================================
   SKELETON
========================================= */

function TimelineItemSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div
            className="
              h-4
              w-48
              rounded-full
              bg-[var(--skeleton-base)]
            "
          />

          <div
            className="
              h-3
              w-full
              rounded-full
              bg-[var(--skeleton-base)]
            "
          />
        </div>

        <div
          className="
            h-6
            w-20
            rounded-full
            bg-[var(--skeleton-base)]
          "
        />
      </div>

      <div
        className="
          h-3
          w-32
          rounded-full
          bg-[var(--skeleton-base)]
        "
      />
    </div>
  );
}