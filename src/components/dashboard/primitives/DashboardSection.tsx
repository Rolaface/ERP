import React from "react";

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  action,
  children,
  className = "",
  contentClassName = "",
}) => {
  return (
    <section
      className={`
        bg-[var(--surface-2)]
        border border-[var(--border)]
        rounded-2xl
        p-5
        overflow-hidden
        ${className}
      `}
    >
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        
        {/* Left Content */}
        <div className="min-w-0">
          <h2
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.16em]
              text-[var(--text)]
            "
          >
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Optional Action */}
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className={`mt-5 ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
};

export default DashboardSection;