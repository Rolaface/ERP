

import { defineModal } from "../../../../store/modal/defineModal";
import TimesheetFormModal from "../../../../components/project management/timesheet/TimesheetFormModal";

export const openTimesheetFormModal = defineModal(
  "timesheetForm",
  TimesheetFormModal,
);