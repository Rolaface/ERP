import { lazy, Suspense, useState } from "react";
import {
  FaChartLine,
  FaClipboardList,
  FaStar,
  FaChartBar,
  FaCog,
} from "react-icons/fa";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../../components/ui/app-shell";
import AppSkeleton from "../../../components/ui/AppSkeleton";
import { HrContentFrame, HrPrimaryTabs } from "../components/HrTabLayout";


const AppraisalPage = lazy(() => import("./Employeeappraisalview"));
// const ScoreView   = lazy(() => import("./Scoreview"));
const SetupPage   = lazy(() => import("./Setuppage"));
// const GoalTracker = lazy(() => import("./GoalTracker"));
// const Reports     = lazy(() => import("./Reports"));

const TABS = [
  { id: "appraisal", label: "Appraisal", icon: <FaClipboardList /> },
  { id: "scores",    label: "Scores",    icon: <FaStar />         },
  { id: "reports",   label: "Reports",   icon: <FaChartBar />     },
  { id: "setup",     label: "Setup",     icon: <FaCog />          },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PerformanceModule = () => {
  const [tab, setTab] = useState<TabId>("appraisal");
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);

  const handleTabChange = (newTab: string) => {
    setTab(newTab as TabId);
    setSelectedCycle(null);
  };

  const renderContent = () => {
    switch (tab) {

      case "appraisal":
        return <AppraisalPage />;

      // case "scores":
      //   return <ScoreView />;

      // case "reports":
      //   return <Reports />;

      case "setup":
        return <SetupPage />;

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