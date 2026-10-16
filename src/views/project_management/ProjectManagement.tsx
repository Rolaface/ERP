import React, { lazy, Suspense, useMemo } from "react";
import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Clock,
  Megaphone,
  FileText,
  Settings,
} from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { HrContentFrame, HrPrimaryTabs } from "../hr/components/HrTabLayout";
import { useUrlTab } from "../../hooks/useUrlTab";
import { usePermission } from "../../hooks/permission/usePermission";
import { useHRView } from "../../hooks/permission/useHRView";
import { useAuth } from "../../context/AuthContext";
import HrTaskView from "./task/table/HrTaskView";
import HrTimesheetView from "./timesheet/table/HrTimesheetView";
import PmListTable from "../project_management/project/projecttabe";
import PmSettings, { PM_SETTINGS_MODULES } from "./project/PmSettings";
import ProjectDashboard from "../project_management/project/Projectdashboard";
import ProjectsView from "./project/Projectsview";
import { UPDATE_LIST } from "./project/pmLists.config";

const ReportsTab = lazy(() => import("./ReportsTab/ReportsHub"));

const PM_BASE_PATH = "/project-management";

const PM_TABS = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} />, modules: ["Project"] },
  { id: "projects", label: "Projects", icon: <FolderKanban size={14} />, modules: ["Project"] },
  { id: "tasks", label: "Tasks", icon: <ListTodo size={14} />, modules: ["Task"] },
  { id: "timesheets", label: "Timesheets", icon: <Clock size={14} />, modules: ["Timesheet"] },
  { id: "updates", label: "Updates", icon: <Megaphone size={14} />, modules: ["Project Update"] },
  { id: "reports", label: "Reports", icon: <FileText size={14} />, modules: ["Timesheet"], professionalOnly: true },
  { id: "settings", label: "Settings", icon: <Settings size={14} />, modules: PM_SETTINGS_MODULES, professionalOnly: true },
];

const ProjectManagement: React.FC = () => {
  const { user } = useAuth();
  const { canAccessAnyOf, permissions, isAdmin } = usePermission();
  const { viewMode } = useHRView();
  const isProfessional = viewMode === "professional";

  const tabs = useMemo(
    () =>
      PM_TABS.filter(
        (t) =>
          canAccessAnyOf(t.modules) && (!t.professionalOnly || isProfessional),
      ),
    [canAccessAnyOf, permissions, isAdmin, isProfessional],
  );

  const [tab, setTab] = useUrlTab({
    tabs,
    defaultTab: tabs[0]?.id ?? PM_TABS[0].id,
    basePath: PM_BASE_PATH,
    pathPrefix: PM_BASE_PATH,
  });

  if (tabs.length === 0) return null;

  return (
    <AppPage>
      <AppPageHeader
        title="Project Management"
        icon={<FolderKanban size={18} />}
        description="Plan, execute, and monitor projects, tasks, and timesheets"
      />
      <HrPrimaryTabs tabs={tabs} activeTab={tab} onChange={setTab} />
      <AppPageBody>
        <Suspense fallback={<AppSkeleton />}>
          <HrContentFrame>
            {tab === "dashboard" && <ProjectDashboard />}
            {tab === "projects" && <ProjectsView />}
            {tab === "tasks" && <HrTaskView currentUserEmail={user?.email} />}
            {tab === "timesheets" && <HrTimesheetView />}
            {tab === "updates" && <PmListTable config={UPDATE_LIST} />}
            {tab === "reports" && <ReportsTab />}
            {tab === "settings" && <PmSettings />}
          </HrContentFrame>
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default ProjectManagement;