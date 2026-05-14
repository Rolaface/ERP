// EmployeeManagement.tsx
// Permission pattern mirrors Sales.tsx:
//   ALL_TABS array has { module, action } per tab.
//   visibleTabs = ALL_TABS.filter(t => !t.module || can(t.module, t.action))
//   If user has no Employee read → directory tab hidden → nothing renders.
//   Recruitment tab has no module guard (unchanged — per requirement).

import React, { useMemo } from "react";
import { Users, UserCheck } from "lucide-react";
import { useUrlTab }        from "../../../hooks/useUrlTab";
import { HrSectionFrame }   from "../components/HrTabLayout";
import { usePermission }    from "../../../hooks/permission/usePermission";
import EmployeeDirectory    from "./EmployeeDirectory";
import Recruitment          from "../Recruitment";

interface EmployeeManagementProps {
  isEmployeeView?: boolean;
}

// ── Tab definitions with module/action guards (same shape as ALL_SALES_TAB) ──
const ALL_EMPLOYEE_TABS = [
  {
    id:     "directory",
    label:  "Employee Directory",
    icon:   <Users size={15} />,
    module: "Employee" as const,   // hidden if no Employee read
    action: "read"     as const,
  },
  {
    id:     "recruitment",
    label:  "Recruitment",
    icon:   <UserCheck size={15} />,
    module: null,                  // no guard — always visible (per requirement)
    action: "read"     as const,
  },
];

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  isEmployeeView = false,
}) => {
  const { can } = usePermission();

  // ── Tab-level permission filter (exact Sales pattern) ─────────────────────
  const visibleTabs = useMemo(
    () =>
      ALL_EMPLOYEE_TABS.filter(
        (t) => !t.module || can(t.module, t.action),
      ),
    [can],
  );

  // ── Action-level permission flags ─────────────────────────────────────────
  // isEmployeeView suppresses all mutations regardless of permissions
  const canCreate = !isEmployeeView && can("Employee", "create");
  const canEdit   = !isEmployeeView && can("Employee", "write");
  const canDelete = !isEmployeeView && can("Employee", "delete");

  const [mainTab, setMainTab] = useUrlTab({
    tabs:       visibleTabs,
    defaultTab: visibleTabs[0]?.id ?? "directory",
    param:      "employeeTab",
    basePath:   "/hr",
  });

  // Nothing to show if user has no access to any tab
  if (visibleTabs.length === 0) return null;

  return (
    <HrSectionFrame
      tabs={visibleTabs}
      activeTab={mainTab}
      onTabChange={setMainTab}
    >
      {mainTab === "directory" && (
        <EmployeeDirectory
          isEmployeeView={isEmployeeView}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
      {mainTab === "recruitment" && <Recruitment />}
    </HrSectionFrame>
  );
};

export default EmployeeManagement;