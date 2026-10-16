
import { defineModal } from "../../../store/modal/defineModal";
import TaskFormModal from "../task/Taskformmodal";
export const openTaskFormModal = defineModal("taskForm", TaskFormModal);