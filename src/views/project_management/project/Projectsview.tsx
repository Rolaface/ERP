import React, { useCallback, useState } from "react";
import PmListTable from "./projecttabe";
import ProjectDetailView from "./Projectdetailview";
import { PROJECT_LIST } from "./pmLists.config";
import { useProjectActions } from "../../../hooks/project_management/project/Useprojectactions";

/**
 * Projects tab: table  <->  full detail view (same pattern as CustomerManagement).
 */
const ProjectsView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const baseActions = useProjectActions();

  // Same row actions as before, but the eye icon opens the detail view
  const getActions = useCallback(
    (row: { name: string; status: string }, ctx: { reload: () => void }) => ({
      ...baseActions(row, ctx),
      onView: () => setSelectedId(row.name),
    }),
    [baseActions],
  );

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
      {selectedId ? (
        <ProjectDetailView
          projectId={selectedId}
          onBack={() => setSelectedId(null)}
          onProjectSelect={setSelectedId}
        />
      ) : (
        <PmListTable
          config={PROJECT_LIST}
          getActions={getActions}
          onRowOpen={(row) => setSelectedId(row.name)}
        />
      )}
    </div>
  );
};

export default ProjectsView;