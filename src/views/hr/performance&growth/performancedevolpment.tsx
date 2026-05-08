import React from "react";
import { Clipboard, BookOpen } from "lucide-react";
import { FaMedal } from "react-icons/fa";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { HrSectionFrame } from "../components/HrTabLayout";
import Appraisals from "../performance&growth/appraisals";
import PerformanceReviews from "../performance&growth/PerformanceReviews";
import TrainingDevelopment from "../performance&growth/TrainingDevelopment";

const PerformanceDevelopment: React.FC = () => {
  const tabs = [
    { id: "performance", label: "Performance Reviews", icon: <Clipboard size={15} /> },
    { id: "training", label: "Training", icon: <BookOpen size={15} /> },
    { id: "appraisals", label: "Appraisals", icon: <FaMedal size={15} /> },
  ];

  const [tab, setTab] = useUrlTab({
    tabs,
    defaultTab: "performance",
    param: "performanceTab",
    basePath: "/hr",
  });

  const screens = {
    performance: <PerformanceReviews key="performance" />,
    training: <TrainingDevelopment key="training" />,
    appraisals: <Appraisals key="appraisals" />,
  };

  return (
    <HrSectionFrame
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      {screens[tab as keyof typeof screens]}
    </HrSectionFrame>
  );
};

export default PerformanceDevelopment;
