import { defineModal } from "../../../store/modal/defineModal";
import { ImportModal } from "../../../components/Import data/importdatamodal";

export const openImportDataModal = defineModal("importData", ImportModal);