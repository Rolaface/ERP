import React from "react";

interface WorkspaceClusterProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  action?: React.ReactNode;
}

const WorkspaceCluster: React.FC<WorkspaceClusterProps> = ({
  eyebrow,
  title,
  description,
  children,
  className = "",
  contentClassName = "",
  action,
}) => {
  return (
    <section
      className={`
        app-surface
        edge-highlight
        rounded-[28px]
        p-5
        lg:p-6
        overflow-hidden
        ${className}
      `}
    >
      {/* ─────────────────────────────
          CLUSTER HEADER
      ───────────────────────────── */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-start
          lg:justify-between
          mb-6
        "
      >
        {/* LEFT */}

        <div className="min-w-0">
          {eyebrow && (
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-muted
              "
            >
              {eyebrow}
            </p>
          )}

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

          {description && (
            <p
              className="
                mt-2
                text-sm
                leading-relaxed
                text-muted
                max-w-3xl
              "
            >
              {description}
            </p>
          )}
        </div>

        {/* RIGHT ACTION */}

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* ─────────────────────────────
          CONTENT
      ───────────────────────────── */}

      <div className={contentClassName}>
        {children}
      </div>
    </section>
  );
};

export default WorkspaceCluster;