
import { defineModal } from "../../../store/modal/defineModal";
import ProcessImportPurchaseInvoiceModal from "../../procurement/ImportedPurchaseInvoice/ProcessImportPurchaseInvoiceModal";

export const openProcessImportModal = defineModal(
  "processImportpi",
  ProcessImportPurchaseInvoiceModal
);