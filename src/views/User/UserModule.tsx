import React, { useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Users, UserCog, ShieldCheck } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
  AppTabs,
} from "../../components/ui/app-shell";

const UserCreation = React.lazy(() => import("./UserCreation"));
const UserRole = React.lazy(() => import("./UserRoles"));

const DEFAULT_TAB = "users";

const iconProps = { size: 16, strokeWidth: 1.75 };

const allTabs = [
  {
    id: "users",
    label: "User Management",
    icon: <UserCog {...iconProps} />,
  },
  {
    id: "roles",
    label: "Role Management",
    icon: <ShieldCheck {...iconProps} />,
  },
];

const UserModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = searchParams.get("tab") || DEFAULT_TAB;

  const handleTabChange = useCallback((tabId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabId);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  }, [navigate, location.pathname, searchParams]);

  const tabComponents = useMemo(() => ({
    users: <UserCreation />,
    roles: <UserRole />,
  }), []);

  const currentTab =
    tabComponents[activeTab as keyof typeof tabComponents] ||
    tabComponents.users;

  return (
    <AppPage>
      <AppPageHeader
        title="User Management"
        description="Manage users, roles, and access permissions."
        icon={<Users />}
      />
      <AppTabs
        tabs={allTabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />
      <AppPageBody>
        {currentTab}
      </AppPageBody>
    </AppPage>
  );
};

export default UserModule;