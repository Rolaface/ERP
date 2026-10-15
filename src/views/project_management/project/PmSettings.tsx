import React, { useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Coins,
  FolderTree,
  LayoutTemplate,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePermission } from "../../../hooks/permission/usePermission";
import { CONTENT_HEIGHT } from "../task/components/Tasktable.config";
import PmListTable from "./projecttabe";
import {
  ACTIVITY_COST_LIST,
  ACTIVITY_TYPE_LIST,
  PROJECT_TEMPLATE_LIST,
  PROJECT_TYPE_LIST,
} from "./pmLists.config";
// NEW: the four modals (adjust the path if you place them elsewhere)
import ActivityTypeModal from "../project_settings/ActivityTypeModal";
import ActivityCostModal from "../project_settings/ActivityCostModal";
import ProjectTemplateModal from "../project_settings/ProjectTemplateModal";
import ProjectTypeModal from "../project_settings/ProjectTypeModal";
interface SettingsTab {
  id: string;
  label: string;
  description: string;
  module: string;
  icon: LucideIcon;
  render: (onAdd: AddHandler) => React.ReactNode; // CHANGED: receives onAdd
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: "activity-type",
    label: "Activity Type",
    description: "Work categories",
    module: "Activity Type",
    icon: Activity,
    render: (onAdd) => (
      <PmListTable
        config={ACTIVITY_TYPE_LIST}
        height={CONTENT_HEIGHT}
        addLabel="Add Activity Type"
        onAdd={onAdd}
      />
    ),
  },
  {
    id: "activity-cost",
    label: "Activity Cost",
    description: "Billing and costing rates",
    module: "Activity Cost",
    icon: Coins,
    render: (onAdd) => (
      <PmListTable
        config={ACTIVITY_COST_LIST}
        height={CONTENT_HEIGHT}
        addLabel="Add Activity Cost"
        onAdd={onAdd}
      />
    ),
  },
  {
    id: "project-template",
    label: "Project Template",
    description: "Reusable project plans",
    module: "Project Template",
    icon: LayoutTemplate,
    render: (onAdd) => (
      <PmListTable
        config={PROJECT_TEMPLATE_LIST}
        height={CONTENT_HEIGHT}
        addLabel="Add Project Template"
        onAdd={onAdd}
      />
    ),
  },
  {
    id: "project-type",
    label: "Project Type",
    description: "Project classification",
    module: "Project Type",
    icon: FolderTree,
    render: (onAdd) => (
      <PmListTable
        config={PROJECT_TYPE_LIST}
        height={CONTENT_HEIGHT}
        addLabel="Add Project Type"
        onAdd={onAdd}
      />
    ),
  },
];

export const PM_SETTINGS_MODULES = SETTINGS_TABS.map((t) => t.module);

const PmSettings: React.FC = () => {
  const { can, permissions, isAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].id);
  const [collapsed, setCollapsed] = useState(false);

  // NEW: which modal is open (and how to refresh that tab's list afterwards)
  const [addTarget, setAddTarget] = useState<{
    tab: string;
    reload: () => void;
  } | null>(null);

  const tabs = useMemo(
    () => SETTINGS_TABS.filter((t) => can(t.module, "read")),
    [can, permissions, isAdmin],
  );

  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const closeAdd = () => setAddTarget(null);

  return (
    <div className="flex min-h-0 flex-1 gap-3">
      {tabs.length > 1 && (
        <aside
          style={{ height: CONTENT_HEIGHT }}
          className={`flex flex-shrink-0 flex-col overflow-hidden rounded-lg border border-theme bg-card transition-[width] duration-200 ${
            collapsed ? "w-14" : "w-64"
          }`}
        >
          <div
            className={`flex items-center border-b border-theme px-3 py-3 ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!collapsed && (
              <h3 className="text-sm font-semibold text-main">Setup</h3>
            )}
            <button
              type="button"
              aria-label={collapsed ? "Expand setup menu" : "Collapse setup menu"}
              onClick={() => setCollapsed((prev) => !prev)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-app hover:text-main"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {tabs.map((tab) => {
              const active = tab.id === current.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  title={collapsed ? tab.label : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex w-full items-center gap-3 py-2.5 text-left transition-colors ${
                    collapsed ? "justify-center px-0" : "px-4"
                  } ${active ? "bg-app" : "hover:bg-app"}`}
                >
                  {active && (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
                  )}
                  <Icon
                    size={18}
                    className={`flex-shrink-0 ${
                      active ? "text-primary" : "text-muted"
                    }`}
                  />
                  {!collapsed && (
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-[13px] ${
                          active ? "font-semibold text-main" : "font-medium text-main"
                        }`}
                      >
                        {tab.label}
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {tab.description}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {current.render((ctx) =>
          setAddTarget({ tab: current.id, reload: ctx.reload }),
        )}
      </div>

      {/* NEW: modals mount only while open, so each open starts with a fresh form */}
      {addTarget?.tab === "activity-type" && (
        <ActivityTypeModal
          isOpen
          onClose={closeAdd}
          onSuccess={addTarget.reload}
        />
      )}
      {addTarget?.tab === "activity-cost" && (
        <ActivityCostModal
          isOpen
          onClose={closeAdd}
          onSuccess={addTarget.reload}
        />
      )}
      {addTarget?.tab === "project-template" && (
        <ProjectTemplateModal
          isOpen
          onClose={closeAdd}
          onSuccess={addTarget.reload}
        />
      )}
      {addTarget?.tab === "project-type" && (
        <ProjectTypeModal
          isOpen
          onClose={closeAdd}
          onSuccess={addTarget.reload}
        />
      )}
    </div>
  );
};

export default PmSettings;