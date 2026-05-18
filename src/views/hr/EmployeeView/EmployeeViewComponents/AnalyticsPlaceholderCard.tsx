import React from "react";

interface AnalyticsPlaceholderCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

const AnalyticsPlaceholderCard: React.FC<
  AnalyticsPlaceholderCardProps
> = ({
  icon,
  title,
  description,
  badge,
}) => {
  return (
    <div
      className="
        group
        relative
        overflow-hidden

        rounded-[24px]
        border
        border-theme

        bg-surface
        p-5

        transition-all
        duration-300

        hover:border-primary/30
        hover:shadow-lg
      "
    >

      {/* TOP ROW */}

      <div className="flex items-start justify-between gap-4">

        <div
          className="
            w-12
            h-12
            rounded-2xl

            bg-primary/10
            text-primary

            flex
            items-center
            justify-center

            shrink-0
          "
        >
          {icon}
        </div>

        {badge && (
          <span
            className="
              badge
              bg-[var(--row-hover)]
              text-muted
            "
          >
            {badge}
          </span>
        )}

      </div>

      {/* CONTENT */}

      <div className="mt-5">

        <h3
          className="
            text-base
            font-semibold
            text-main
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-relaxed
            text-muted
          "
        >
          {description}
        </p>

      </div>

    </div>
  );
};

export default AnalyticsPlaceholderCard;