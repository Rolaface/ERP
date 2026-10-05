
import { defineModal } from "../../store/modal/defineModal";
import ExplorePlanModal from "./ExplorePlanModal";

export const openExplorePlanModal = defineModal(
  "exploreplan",
  ExplorePlanModal
);