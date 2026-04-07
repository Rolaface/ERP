import React from "react";

export interface AppTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AppPageProps {
  children: React.ReactNode;
  viewportLocked?: boolean;
}

export const AppPage: React.FC<AppPageProps> = ({
  children,
  viewportLocked = false,
}) => (
  <div
    className={[
      "flex flex-1 flex-col gap-2",
      viewportLocked
        ? "h-[calc(100vh-2rem)] min-h-0 overflow-hidden"
        : "min-h-0 overflow-visible",
    ].join(" ")}
  >
    {children}
  </div>
);

export const AppPageBody: React.FC<{
  children: React.ReactNode;
  className?: string;
  viewportLocked?: boolean;
}> = ({ children, className = "", viewportLocked = false }) => (
  <div
    className={`flex flex-1 flex-col ${
      viewportLocked ? "min-h-0 overflow-auto" : "overflow-visible"
    } ${className}`.trim()}
  >
    {children}
  </div>
);

interface AppPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const AppPageHeader: React.FC<AppPageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
}) => (
  <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-2 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        {icon ? (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary"
            style={{
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-main">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
    {actions ? (
      <div className="flex shrink-0 items-center gap-3">{actions}</div>
    ) : null}
  </div>
);

interface AppTabsProps {
  tabs: AppTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const AppTabs: React.FC<AppTabsProps> = ({
  tabs,
  activeTab,
  onChange,
}) => (
  <div className="w-full overflow-hidden">
    <div className="flex w-full items-center justify-start gap-2 rounded-2xl border border-[var(--border)] bg-card p-2 shadow-[var(--app-shadow-soft)]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              isActive
                ? "bg-primary text-white"
                : "text-muted hover:bg-row-hover hover:text-main"
            }`}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export const AppSurface: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`app-surface ${className}`.trim()}>{children}</div>
);

interface AppSectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AppSectionCard: React.FC<AppSectionCardProps> = ({
  title,
  description,
  children,
  className = "",
}) => (
  <AppSurface className={className}>
    <div className="border-b border-[var(--border)] px-6 py-4">
      <h2 className="text-base font-semibold text-main">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : null}
    </div>
    <div className="px-6 py-4">{children}</div>
  </AppSurface>
);

interface AppMetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  accentClassName?: string;
}

export const AppMetricCard: React.FC<AppMetricCardProps> = ({
  label,
  value,
  icon: Icon,
  accentClassName = "from-slate-700 to-slate-800",
}) => (
  <AppSurface className="p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-3 truncate text-3xl font-semibold text-main">
          {value}
        </p>
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${accentClassName}`}
      >
        <Icon size={20} />
      </div>
    </div>
  </AppSurface>
);
