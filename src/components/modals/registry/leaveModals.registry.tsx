import { lazy } from "react";
import type { LeaveApplication } from "../../../api/leaveApplicationApi";
import type { LeaveType } from "../../../api/leaveConfigApi";
import { getInitialData } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const LeaveApplyModal = lazy(() => import("../../Hr/hrsetupmodals/LeaveApplyModal"));
const LeaveTypeModal = lazy(() =>
  import("../../Hr/hrsetupmodals/LeaveTypeModal").then((m) => ({
    default: m.LeaveTypeModal,
  })),
);
const LeavePeriodModal = lazy(() =>
  import("../../Hr/hrsetupmodals/LeavePeriodModal").then((m) => ({
    default: m.LeavePeriodModal,
  })),
);
const LeavePolicyModal = lazy(() =>
  import("../../Hr/hrsetupmodals/LeavePolicyModal").then((m) => ({
    default: m.LeavePolicyModal,
  })),
);
const LeavePolicyAssignmentModal = lazy(() =>
  import("../../Hr/hrsetupmodals/LeavePolicyAssignmentModal").then((m) => ({
    default: m.LeavePolicyAssignmentModal,
  })),
);
const HolidayListModal = lazy(() =>
  import("../../Hr/hrsetupmodals/HolidayListModal").then((m) => ({
    default: m.HolidayListModal,
  })),
);
const ShiftTypeModal = lazy(() =>
  import("../../Hr/hrsetupmodals/ShiftTypeModal").then((m) => ({
    default: m.ShiftTypeModal,
  })),
);

export const leaveModalsRegistry: Record<string, ModalRenderFn> = {
  leaveApply: (modal, context, { handleClose }) => (
    <LeaveApplyModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData<LeaveApplication>(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),

  leaveType: (modal, context, { handleClose }) => (
    <LeaveTypeModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData<LeaveType>(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),

  leavePeriod: (modal, context, { handleClose }) => (
    <LeavePeriodModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),

  leavePolicy: (modal, context, { handleClose }) => (
    <LeavePolicyModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),

  leavePolicyAssignment: (modal, context, { handleClose }) => (
    <LeavePolicyAssignmentModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
        handleClose();
      }}
    />
  ),

  holidayList: (modal, context, { handleClose }) => (
    <HolidayListModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      isViewMode={context?.isViewMode ?? false}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),

  shiftType: (modal, context, { handleClose }) => (
    <ShiftTypeModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      initialData={getInitialData(modal.initialData)}
      isViewMode={context?.isViewMode ?? false}
      onSuccess={() => {
        if (context?.onSuccess) context.onSuccess(undefined);
      }}
    />
  ),
};