import React, { useMemo } from "react";
import { Users, ShieldCheck } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
  AppTabs,
} from "../../components/ui/app-shell";
import { usePermission } from "../../hooks/permission/usePermission";
import { useUrlTab } from "../../hooks/useUrlTab";

const UserCreation = React.lazy(() => import("./UserCreation"));
const UserRole = React.lazy(() => import("./UserRoles"));

const DEFAULT_TAB = "users";
const iconProps = { size: 16, strokeWidth: 1.75 };


const TAB_DEFINITIONS = [
  {
    id: "users",
    label: "User Management",
    icon: <Users {...iconProps} />,
    requiredModule: "User",  
    requiredAction: "read" as const,
  },
  {
    id: "roles",
    label: "Role Management",
    icon: <ShieldCheck {...iconProps} />,
    requiredModule: "User",   
    requiredAction: "read" as const,
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const UserModule: React.FC = () => {
  const { can } = usePermission();   

 
  const visibleTabs = useMemo(
    () =>
      TAB_DEFINITIONS.filter((tab) =>
        can(tab.requiredModule, tab.requiredAction)
      ),
    [can]
  );

  const fallbackTab = visibleTabs[0]?.id ?? DEFAULT_TAB;
  const [resolvedTab, handleTabChange] = useUrlTab({
    tabs: visibleTabs,
    defaultTab: fallbackTab,
    basePath: "/userManagement",
  });

  const tabComponents: Record<string, React.ReactNode> = useMemo(
    () => ({
      users: <UserCreation />,
      roles: <UserRole />,
    }),
    []
  );

  const currentTab = tabComponents[resolvedTab] ?? tabComponents.users;

  // Nothing to show — user has no access at all
  if (visibleTabs.length === 0) {
    return (
      <AppPage>
        <AppPageHeader
          title="User Management"
          description="Manage users, roles, and access permissions."
          icon={<Users />}
        />
        <AppPageBody>
          <div className="flex items-center justify-center h-40 text-muted text-sm">
            You don't have permission to access this section.
          </div>
        </AppPageBody>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <AppPageHeader
        title="User Management"
        description="Manage users, roles, and access permissions."
        icon={<Users />}
      />
      <AppTabs
        tabs={visibleTabs}
        activeTab={resolvedTab}
        onChange={handleTabChange}
      />
      <AppPageBody>{currentTab}</AppPageBody>
    </AppPage>
  );
};

export default UserModule;
