import React, { useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Users, ShieldCheck } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
  AppTabs,
} from "../../components/ui/app-shell";
import { usePermission } from "../../hooks/permission/usePermission";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();   

 
  const visibleTabs = useMemo(
    () =>
      TAB_DEFINITIONS.filter((tab) =>
        can(tab.requiredModule, tab.requiredAction)
      ),
    [can]
  );

  const activeTab = searchParams.get("tab") || DEFAULT_TAB;

  // If the current tab is no longer visible, fall back to the first visible tab
  const resolvedTab =
    visibleTabs.find((t) => t.id === activeTab)?.id ??
    visibleTabs[0]?.id ??
    DEFAULT_TAB;

  const handleTabChange = useCallback(
    (tabId: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", tabId);
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    },
    [navigate, location.pathname, searchParams]
  );

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