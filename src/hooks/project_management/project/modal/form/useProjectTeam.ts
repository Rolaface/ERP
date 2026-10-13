import { useCallback, useMemo } from "react";
import type {
  ProjectTeamActions,
  ProjectTeamMember,
  SetMembersHandler,
} from "../../../../../types/Project_Management/project_modal/Projectformmodal";
import { createMember } from "../../../../../utils/project_management/project/Projectformmodal.utils";

type MemberChanges = Partial<Omit<ProjectTeamMember, "id">>;

export const useProjectTeam = (
  setMembers: SetMembersHandler,
): ProjectTeamActions => {
  const patch = useCallback(
    (id: string, changes: MemberChanges) =>
      setMembers((members) =>
        members.map((m) => (m.id === id ? { ...m, ...changes } : m)),
      ),
    [setMembers],
  );

  const add = useCallback(
    () => setMembers((members) => [...members, createMember()]),
    [setMembers],
  );

  const remove = useCallback(
    (id: string) => setMembers((members) => members.filter((m) => m.id !== id)),
    [setMembers],
  );

  return useMemo(
    () => ({
      add,
      remove,
      setUser: (id, user) => patch(id, { user }),
      setActivities: (id, activities) => patch(id, { activities }),
      setViewAttachments: (id, viewAttachments) => patch(id, { viewAttachments }),
    }),
    [add, remove, patch],
  );
};