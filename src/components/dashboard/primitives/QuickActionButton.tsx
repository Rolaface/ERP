import type { ReactNode } from "react";
import { ArrowRight, LucideIcon } from "lucide-react";

type QuickActionTone =
  | "primary"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

type QuickActionSize = "sm" | "md" | "lg";

interface QuickActionButtonProps {
  /**
   * Main action label
   */
  title: string;

  /**
   * Optional operational hint
   * Example:
   * "Create reimbursement request"
   */
  description?: string;

  /**
   * Left icon
   */
  icon?: LucideIcon;

  /**
   * Optional badge
   * Example:
   * "New"
   * "3 Pending"
   */
  badge?: string;

  /**
   * Semantic emphasis
   */
  tone?: QuickActionTone;

  /**
   * Density
   */
  size?: QuickActionSize;

  /**
   * Full width layout
   */
  fullWidth?: boolean;

  /**
   * Right-side accessory
   */
  trailing?: ReactNode;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Interaction
   */
  onClick?: () => void;

  className?: string;
}

const toneStyles: Record<
  QuickActionTone,
  {
    root: string;
    icon: string;
    badge: string;
  }
> = {
  primary: {
    root: `
      border-[color:var(--primary)]
      bg-[color:var(--primary)]
      text-white
      shadow-lg
      shadow-black/5
      hover:brightness-[1.03]
    `,
    icon: `
      bg-white/15
      text-white
    `,
    badge: `
      bg-white/15
      text-white
    `,
  },

  neutral: {
    root: `
      border-theme
      bg-card
      text-main
      hover:bg-[var(--row-hover)]
    `,
    icon: `
      bg-surface-2
      text-main
    `,
    badge: `
      bg-surface-2
      text-muted
    `,
  },

  success: {
    root: `
      border-emerald-500/20
      bg-emerald-500
      text-white
      hover:brightness-[1.03]
    `,
    icon: `
      bg-white/15
      text-white
    `,
    badge: `
      bg-white/15
      text-white
    `,
  },

  warning: {
    root: `
      border-amber-500/20
      bg-amber-500
      text-white
      hover:brightness-[1.03]
    `,
    icon: `
      bg-white/15
      text-white
    `,
    badge: `
      bg-white/15
      text-white
    `,
  },

  danger: {
    root: `
      border-red-500/20
      bg-red-500
      text-white
      hover:brightness-[1.03]
    `,
    icon: `
      bg-white/15
      text-white
    `,
    badge: `
      bg-white/15
      text-white
    `,
  },
};

const sizeStyles: Record<
  QuickActionSize,
  {
    root: string;
    icon: string;
    title: string;
    description: string;
  }
> = {
  sm: {
    root: "min-h-[72px] px-4 py-3 rounded-2xl gap-3",
    icon: "h-10 w-10 rounded-xl",
    title: "text-sm",
    description: "text-xs",
  },

  md: {
    root: "min-h-[88px] px-5 py-4 rounded-3xl gap-4",
    icon: "h-12 w-12 rounded-2xl",
    title: "text-base",
    description: "text-sm",
  },

  lg: {
    root: "min-h-[108px] px-6 py-5 rounded-3xl gap-5",
    icon: "h-14 w-14 rounded-2xl",
    title: "text-lg",
    description: "text-sm",
  },
};

export default function QuickActionButton({
  title,
  description,
  icon: Icon,
  badge,
  tone = "neutral",
  size = "md",
  fullWidth = true,
  trailing,
  loading = false,
  disabled = false,
  onClick,
  className = "",
}: QuickActionButtonProps) {
  const toneStyle = toneStyles[tone];
  const sizeStyle = sizeStyles[size];

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        group
        relative
        flex
        items-center
        border
        text-left
        transition-all
        duration-300
        interactive-press
        ${fullWidth ? "w-full" : "w-auto"}
        ${sizeStyle.root}
        ${toneStyle.root}
        ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer interactive-lift"
        }
        ${className}
      `}
    >
      {/* Top highlight */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/50
          to-transparent
          opacity-60
        "
      />

      {/* Loading */}
      {loading ? (
        <QuickActionSkeleton size={size} />
      ) : (
        <>
          {/* Left */}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {Icon ? (
              <div
                className={`
                  flex
                  shrink-0
                  items-center
                  justify-center
                  ${sizeStyle.icon}
                  ${toneStyle.icon}
                `}
              >
                <Icon size={20} />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`
                    truncate
                    font-semibold
                    leading-none
                    ${sizeStyle.title}
                  `}
                >
                  {title}
                </span>

                {badge ? (
                  <span
                    className={`
                      inline-flex
                      shrink-0
                      items-center
                      rounded-full
                      px-2.5
                      py-1
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      ${toneStyle.badge}
                    `}
                  >
                    {badge}
                  </span>
                ) : null}
              </div>

              {description ? (
                <p
                  className={`
                    mt-1
                    line-clamp-2
                    opacity-80
                    ${sizeStyle.description}
                  `}
                >
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-3">
            {trailing}

            <ArrowRight
              size={18}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-1
              "
            />
          </div>
        </>
      )}
    </button>
  );
}

/* =========================================
   SKELETON
========================================= */

interface QuickActionSkeletonProps {
  size: QuickActionSize;
}

function QuickActionSkeleton({
  size,
}: QuickActionSkeletonProps) {
  const sizeStyle = sizeStyles[size];

  return (
    <div className="flex w-full items-center gap-4 animate-pulse">
      <div
        className={`
          shrink-0
          bg-white/10
          ${sizeStyle.icon}
        `}
      />

      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 rounded-full bg-white/10" />

        <div className="h-3 w-52 rounded-full bg-white/10" />
      </div>

      <div className="h-5 w-5 rounded-full bg-white/10" />
    </div>
  );
}