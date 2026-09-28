

import { defineModal } from "../../../../store/modal/defineModal";
import TimesheetFormModal from "../../../../components/project management/timesheet/TimesheetFormModal";

const openTimesheetModal = defineModal(
  "timesheetForm",
  TimesheetFormModal,
);

export const openAdminTimesheetFormModal = (props: any = {}) => {
  return openTimesheetModal({
    ...props,
    context: "admin",
  });
};

export const openEmployeeTimesheetFormModal = (props: any = {}) => {
  return openTimesheetModal({
    ...props,
    context: "employee",
  });
};