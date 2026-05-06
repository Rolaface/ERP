import { LucideIcon } from "lucide-react";
import React, { memo, useCallback, useState } from "react";


interface AppTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// AppPage / AppPageBody / AppPageHeader  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

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
      "flex flex-1 flex-col",
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
    className={`flex flex-1 flex-col p-4 ${
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

// ─────────────────────────────────────────────────────────────────────────────
// AppModuleHeader
//
// Matches the Payroll sub-header exactly:
//   [ 🔲icon  Module Name  |  Tab  Tab  Tab ]        [ trailing actions ]
//
// Usage:
//   <AppModuleHeader
//     icon={<Settings2 size={18} />}
//     moduleName="HR Setup"
//     tabs={TABS}
//     activeTab={activeTab}
//     onTabChange={setActiveTab}
//     trailing={<button>+ New</button>}
//   />
// ─────────────────────────────────────────────────────────────────────────────
interface AppModuleHeaderProps {
  icon: React.ReactNode;
  moduleName: string;
  tabs: AppTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  trailing?: React.ReactNode;
}

export const AppModuleHeader: React.FC<AppModuleHeaderProps> = memo(
  ({ icon, moduleName, tabs, activeTab, onTabChange, trailing }) => {
    const handleClick = useCallback(
      (id: string) => onTabChange(id),
      [onTabChange],
    );

    return (
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-card px-4 min-h-[52px]">
        {/* ── left: icon + name + divider + tab pills ─────────────────── */}
        <div className="flex items-center gap-3 min-w-0 overflow-x-auto scrollbar-hide py-2">
          {/* icon square */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary"
            style={{
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            {icon}
          </div>

          {/* module name */}
          <span className="text-base font-semibold text-main whitespace-nowrap shrink-0">
            {moduleName}
          </span>

          {/* vertical divider — only shown when there are tabs */}
          {tabs.length > 0 && (
            <span className="h-5 w-px shrink-0 bg-[var(--border)]" />
          )}

          {/* tab pill buttons */}
          <div className="flex items-center gap-1 min-w-max">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleClick(tab.id)}
                  className={[
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                    "text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-row-hover hover:text-main",
                  ].join(" ")}
                >
                  {tab.icon && (
                    <span className="shrink-0 text-[13px]">{tab.icon}</span>
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── right: trailing actions ──────────────────────────────────── */}
        {trailing && (
          <div className="flex shrink-0 items-center gap-2">{trailing}</div>
        )}
      </div>
    );
  },
);
AppModuleHeader.displayName = "AppModuleHeader";

// ─────────────────────────────────────────────────────────────────────────────
// AppTabs  (original pill-in-a-box style — dashboards / charts)
// ─────────────────────────────────────────────────────────────────────────────
interface AppTabsProps {
  tabs: AppTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const AppTabs: React.FC<AppTabsProps> = memo(
  ({ tabs, activeTab, onChange }) => {
    const handleClick = useCallback(
      (tabId: string) => onChange(tabId),
      [onChange],
    );

    return (
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-start gap-2 rounded-2xl border border-[var(--border)] bg-card p-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleClick(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-row-hover hover:text-main"
                }`}
              >
                {tab.icon && (
                  <span className="text-sm shrink-0">{tab.icon}</span>
                )}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
AppTabs.displayName = "AppTabs";

// ─────────────────────────────────────────────────────────────────────────────
// AppSubTabs  (underline style — nested tab panels)
// ─────────────────────────────────────────────────────────────────────────────
interface AppSubTabsProps {
  tabs: AppTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  trailing?: React.ReactNode;
}

export const AppSubTabs: React.FC<AppSubTabsProps> = memo(
  ({ tabs, activeTab, onChange, trailing }) => {
    const handleClick = useCallback(
      (tabId: string) => onChange(tabId),
      [onChange],
    );

    return (
      <div className="flex w-full items-center justify-between border-b border-[var(--border)] bg-card">
        <div className="flex min-w-0 flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-end gap-0 min-w-max px-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleClick(tab.id)}
                  className={[
                    "group relative flex items-center gap-2 px-4 py-3 text-sm font-medium",
                    "whitespace-nowrap transition-colors focus-visible:outline-none",
                    isActive ? "text-primary" : "text-muted hover:text-main",
                  ].join(" ")}
                >
                  {tab.icon && (
                    <span
                      className={`text-[15px] shrink-0 transition-colors ${
                        isActive
                          ? "text-primary"
                          : "text-muted group-hover:text-main"
                      }`}
                    >
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={[
                      "absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full transition-all",
                      isActive ? "bg-primary opacity-100" : "opacity-0",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </div>
        {trailing && (
          <div className="flex shrink-0 items-center gap-2 px-4">
            {trailing}
          </div>
        )}
      </div>
    );
  },
);
AppSubTabs.displayName = "AppSubTabs";

//app setuplayout can be used when we want to have a sidebar for navigation between different sections of the setup module. It provides a consistent layout with a sidebar and a main content area. The sidebar can contain links or buttons for navigating between different sections, while the main content area can display the relevant information or forms based on the selected section.
export interface AppSetupSection {
  key: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}
 
interface AppSetupLayoutProps {
  sections: AppSetupSection[];
  activeSection: string;
  onSectionChange: (key: string) => void;
  children: React.ReactNode;
}
 
export const AppSetupLayout: React.FC<AppSetupLayoutProps> = memo(
  ({ sections, activeSection, onSectionChange, children }) => {
   const [collapsed, setCollapsed] = useState(false);
    return (
     <div className="flex flex-1 min-h-0 gap-0 relative">
      
        {/* ── Vertical sidebar ──────────────────────────────────────────── */}
        
  <aside
  className={`flex flex-col shrink-0 border-r border-[var(--border)] bg-card py-2 gap-0.5 transition-all duration-300 ${
    collapsed ? "w-14" : "w-52"
  }`}
>
  <div className="flex items-center justify-between px-3 mb-2">
  {!collapsed && (
    <span className="text-sm font-semibold text-main">Setup</span>
  )}

  <button
    onClick={() => setCollapsed((p) => !p)}
    className="p-1 rounded hover:bg-gray-100"
  >
    {collapsed ? ">" : "<"}
  </button>
</div>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.key === activeSection;
 
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => onSectionChange(section.key)}
                className={[
                  "group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg",
                  "text-left transition-all duration-150 focus-visible:outline-none",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-row-hover hover:text-main",
                ].join(" ")}
              >
                {/* active left accent bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
                )}
 
                {/* icon */}
                <span
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted group-hover:text-main"
                  }`}
                >
                  <span className="flex justify-center w-full">
  <Icon size={16} />
</span>
                </span>
 
                {/* label + description */}
                {!collapsed && (
  <span className="flex flex-col min-w-0">
                  <span className="text-sm font-medium leading-tight truncate">
                    {section.label}
                  </span>
                  {section.description && (
                    <span
                      className={`text-[11px] leading-tight truncate mt-0.5 ${
                        isActive ? "text-primary/70" : "text-muted"
                      }`}
                    >
                      {section.description}
                    </span>
                  )}
                </span>
                )}
              </button>
            );
          })}
        </aside>
        
 
        {/* ── Content area ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-auto p-4 gap-4">

  {/* TOP BAR */}
 

  {children}
</div>

        
      </div>
    );
  },
);
AppSetupLayout.displayName = "AppSetupLayout";

// ─────────────────────────────────────────────────────────────────────────────
// AppSurface / AppSectionCard / AppMetricCard  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

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