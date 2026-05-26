import { lazy, Suspense, useState } from "react";
import {
  FaChartLine,
  FaClipboardList,
  FaStar,
  FaChartBar,
  FaCog,
  FaCommentDots,
} from "react-icons/fa";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../../components/ui/app-shell";
import AppSkeleton from "../../../components/ui/AppSkeleton";
import { HrContentFrame, HrPrimaryTabs } from "../components/HrTabLayout";
import CycleList from "./sections/CycleList";

const FeedbackPage  = lazy(() => import("./feedbackpage"));
const SetupPage     = lazy(() => import("./Setuppage"));

const TABS = [
    { id: "cycle" , label: "Cycles" , icon:FaCommentDots},
  { id: "setup",     label: "Setup",     icon: <FaCog />            },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PerformanceModule = () => {
  const [tab, setTab] = useState<TabId>("cycle");

  const handleTabChange = (newTab: string) => {
    setTab(newTab as TabId);
  };

  const renderContent = () => {
    switch (tab) {
      case "cycle":
        return <CycleList />;
      case "setup":
        return <SetupPage />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            Coming soon…
          </div>
        );
    }
  };

  return (
    <AppPage>
      <AppPageHeader
        title="Performance"
        icon={<FaChartLine />}
        description="Manage appraisal cycles, goals, and performance reviews"
      />
      <HrPrimaryTabs
        tabs={[...TABS]}
        activeTab={tab}
        onChange={handleTabChange}
      />
      <AppPageBody>
        <Suspense fallback={<AppSkeleton />}>
          <HrContentFrame>{renderContent()}</HrContentFrame>
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default PerformanceModule;