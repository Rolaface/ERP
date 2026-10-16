import { defineModal } from "../../../store/modal/defineModal";
import ProjectFormModal from "../../project management/project_modal/ProjectFormModal";

export const openProjectFormModal = defineModal(
  "projectForm",
  ProjectFormModal
);