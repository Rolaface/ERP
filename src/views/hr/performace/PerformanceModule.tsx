import { lazy, Suspense, useState } from "react";
import {
  ClipboardCheck,
  Repeat,
  Settings2 ,
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
} from "../../../components/ui/app-shell";
import AppSkeleton from "../../../components/ui/AppSkeleton";
import { HrContentFrame, HrPrimaryTabs } from "../components/HrTabLayout";
import CycleList from "./sections/CycleList";
import AppraisalPage from "./Employeeappraisalview";

const FeedbackPage = lazy(() => import("./feedbackpage"));
const SetupPage = lazy(() => import("./Setuppage"));

const TABS = [
  { id: "app", label: "Appraisal Form", icon: <ClipboardCheck size={16} strokeWidth={1.75} /> },
  { id: "cycle", label: "Cycles", icon: <Repeat size={16} strokeWidth={1.75}/> },
  { id: "setup", label: "Setup", icon: <Settings2 size={16} strokeWidth={1.75}/> },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PerformanceModule = () => {
  const [tab, setTab] = useState<TabId>("app");

  const handleTabChange = (newTab: string) => {
    setTab(newTab as TabId);
  };

  const renderContent = () => {
    switch (tab) {
      case "cycle":
        return <CycleList />;
      case "setup":
        return <SetupPage />;
      case "app":
        return <AppraisalPage />;
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