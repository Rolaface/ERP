import React, { Suspense, lazy, useMemo } from "react";
import { Layers, Layers3, UserCheck, ShieldCheck } from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import { usePermission } from "../../hooks/permission/usePermission";
import { useUrlTab } from "../../hooks/useUrlTab";

const PlanManagement = lazy(() => import("./Plan/Plan"));
const CustomerSubscription = lazy(
  () => import("./Subscribe/CustomerSubscription"),
);
const MySubscription = lazy(
  () => import("./MySubscription/MySubscription"),
);

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const ALL_TABS = [
  {
    id: "plans",
    label: "Plans",
    icon: <Layers3 {...iconProps} />,
    module: null,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: <UserCheck {...iconProps} />,
    module: null,
  },
  {
    id: "mysubscription",
    label: "My Subscription",
    icon: <ShieldCheck {...iconProps} />,
    module: null,
  },
];

// Tabs that need full viewport lock (no scroll, fixed height layout)
const VIEWPORT_LOCKED_TABS = new Set(["plans", "subscriptions"]);

const DEFAULT_TAB = "plans";

const Subscription: React.FC = () => {
  const { can } = usePermission();

  const subscriptionTabs = useMemo(
    () => ALL_TABS.filter((t) => !t.module || can(t.module, "read")),
    [can],
  );

  const fallbackTab = subscriptionTabs[0]?.id ?? DEFAULT_TAB;
  const [resolvedTab, handleTabChange] = useUrlTab({
    tabs: subscriptionTabs,
    defaultTab: fallbackTab,
    basePath: "/subscribe",
  });

  const tabComponents = useMemo(
    () => ({
      plans: <PlanManagement />,
      subscriptions: <CustomerSubscription />,
      mysubscription: <MySubscription />,
    }),
    [],
  );

  const currentTabComponent = tabComponents[
    resolvedTab as keyof typeof tabComponents
  ] ?? <PlanManagement />;

  const isViewportLocked = VIEWPORT_LOCKED_TABS.has(resolvedTab);

  return (
    <AppPage viewportLocked={isViewportLocked}>
      <AppPageHeader
        title="Subscription"
        description="Manage plans, pricing schedules and module entitlements"
        icon={<Layers size={20} strokeWidth={1.75} />}
      />
      <AppTabs
        tabs={subscriptionTabs}
        activeTab={resolvedTab}
        onChange={handleTabChange}
      />
      <AppPageBody viewportLocked={isViewportLocked}>
        <Suspense fallback={null}>{currentTabComponent}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default Subscription;