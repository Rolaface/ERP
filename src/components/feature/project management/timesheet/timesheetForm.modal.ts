import { defineModal } from "../../../../store/modal/defineModal";
import TimesheetFormModal from "../../../../components/project management/timesheet/TimesheetFormModal";

const openTimesheetModal = defineModal(
  "timesheetForm",
  TimesheetFormModal,
);

const getStoredEmployee = (): { id: string; name: string } | undefined => {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return undefined;
    const u = JSON.parse(raw);
    return u?.employeeId
      ? { id: u.employeeId, name: u.fullName || u.employeeId }
      : undefined;
  } catch {
    return undefined;
  }
};

export const openAdminTimesheetFormModal = (props: any = {}) => {
  return openTimesheetModal({
    ...props,
    context: "admin",
  });
};

export const openEmployeeTimesheetFormModal = (props: any = {}) => {
  const employee = getStoredEmployee();
  return openTimesheetModal({
    ...props,
    context: "employee",
    restrictions: {
      ...(employee ? { employee } : {}),
      ...(props.restrictions ?? {}),
    },
  });
};