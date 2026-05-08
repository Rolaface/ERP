import React, { Suspense, lazy, useMemo } from "react";
import {
  Landmark,
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { usePermission } from "../../hooks/permission/usePermission";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const BankPage = lazy(() => import("./Bank"));
const BankAccountSetup = lazy(() => import("./BankAccountSetup"));

const ALL_BANK_TABS = [
  {
    id: "bank",
    label: "Bank",
    icon: <Landmark size={16} strokeWidth={1.75} />,
    module: "Bank",
    action: "read" as const,
  },
  {
    id: "bankAccount",
    label: "Bank Accounts",
    icon: <Landmark size={16} strokeWidth={1.75} />,
    module: "Bank Account",
    action: "read" as const,
  },
];

const DEFAULT_TAB = "bank";

const BankModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { can } = usePermission();

  const bankTabs = useMemo(
    () =>
      ALL_BANK_TABS.filter(
        (t) => !t.module || can(t.module, t.action)
      ),
    [can]
  );

  const activeTab =
    searchParams.get("tab") || DEFAULT_TAB;

  const resolvedTab =
    bankTabs.find((t) => t.id === activeTab)?.id ??
    bankTabs[0]?.id ??
    DEFAULT_TAB;

  const handleTabChange = (tabId: string) => {
    const newParams = new URLSearchParams(searchParams);

    newParams.set("tab", tabId);

    navigate(
      `${location.pathname}?${newParams.toString()}`,
      { replace: true }
    );
  };

  const renderTab = () => {
    switch (resolvedTab) {
      case "bank":
        return <BankPage />;

      case "bankAccount":
        return <BankAccountSetup />;

      default:
        return <BankPage />;
    }
  };

  return (
    <AppPage>
      <AppPageHeader
        title="Bank Management"
        description="Manage banks and bank accounts"
        icon={<Landmark size={20} strokeWidth={1.75} />}
      />

      <AppTabs
        tabs={bankTabs}
        activeTab={resolvedTab}
        onChange={handleTabChange}
      />

      <AppPageBody>
        <Suspense fallback={<AppSkeleton />}>
          {renderTab()}
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default BankModule;