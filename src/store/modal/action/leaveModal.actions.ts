import { useModalStore } from "../../modalStore";
import type { ModalContext, ModalMeta, ModalType } from "../../../types/modal_store_types/modalTypes";

const createModalOpener =
  (type: ModalType) =>
  (
    initialData?: unknown,
    isEdit = false,
    context?: ModalContext,
    meta?: ModalMeta,
  ) =>
    useModalStore.getState().openModal(type, initialData, isEdit, context, meta);

export const openLeaveApplyModal = createModalOpener("leaveApply");
export const openLeaveTypeModal = createModalOpener("leaveType");
export const openLeavePeriodModal = createModalOpener("leavePeriod");
export const openLeavePolicyModal = createModalOpener("leavePolicy");
export const openLeavePolicyAssignmentModal = createModalOpener("leavePolicyAssignment");
export const openHolidayListModal = createModalOpener("holidayList");
export const openShiftTypeModal = createModalOpener("shiftType");