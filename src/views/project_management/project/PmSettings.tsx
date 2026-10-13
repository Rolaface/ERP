import React, { useMemo, useState } from "react";
import { HrSecondaryTabs } from "../../hr/components/HrTabLayout";
import { usePermission } from "../../../hooks/permission/usePermission";
import { CONTENT_HEIGHT } from "../task/components/Tasktable.config";
import PmListTable from "./projecttabe";
import {
  ACTIVITY_COST_LIST,
  ACTIVITY_TYPE_LIST,
  PROJECT_TEMPLATE_LIST,
  PROJECT_TYPE_LIST,
} from "./pmLists.config";

const NESTED_HEIGHT = `calc(${CONTENT_HEIGHT} - 2.5rem)`;

const SETTINGS_TABS = [
  {
    id: "activity-type",
    label: "Activity Type",
    module: "Activity Type",
    render: () => (
      <PmListTable config={ACTIVITY_TYPE_LIST} height={NESTED_HEIGHT} />
    ),
  },
  {
    id: "activity-cost",
    label: "Activity Cost",
    module: "Activity Cost",
    render: () => (
      <PmListTable config={ACTIVITY_COST_LIST} height={NESTED_HEIGHT} />
    ),
  },
  {
    id: "project-template",
    label: "Project Template",
    module: "Project Template",
    render: () => (
      <PmListTable config={PROJECT_TEMPLATE_LIST} height={NESTED_HEIGHT} />
    ),
  },
  {
    id: "project-type",
    label: "Project Type",
    module: "Project Type",
    render: () => (
      <PmListTable config={PROJECT_TYPE_LIST} height={NESTED_HEIGHT} />
    ),
  },
];

export const PM_SETTINGS_MODULES = SETTINGS_TABS.map((t) => t.module);

const PmSettings: React.FC = () => {
  const { can, permissions, isAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].id);

  const tabs = useMemo(
    () => SETTINGS_TABS.filter((t) => can(t.module, "read")),
    [can, permissions, isAdmin],
  );

  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {tabs.length > 1 && (
        <HrSecondaryTabs
          tabs={tabs}
          activeTab={current.id}
          onChange={setActiveTab}
        />
      )}
      {current.render()}
    </div>
  );
};

export default PmSettings;