
import { defineModal } from "../../../store/modal/defineModal";
import ProcessImportModal from "../../inventory/ImportedItems/ImportItemsModal";

export const openProcessImportModal = defineModal(
  "processImport",
  ProcessImportModal
);