import type { PurchaseInvoiceFormData } from "../types/Supply/purchaseInvoice";

export const validatePI = (form: PurchaseInvoiceFormData) => {
  const errors: string[] = [];

  if (!form.supplier) errors.push("Supplier is required");

  if (!form.items.length) {
    errors.push("At least one item is required");
  }

  form.items.forEach((item, i) => {
    if (!item.quantity) errors.push(`Item ${i + 1}: Quantity missing`);
    if (!item.rate) errors.push(`Item ${i + 1}: Rate missing`);

  
    if (item.requiresBatch) {
      if (!item.batchNo?.trim()) {
        errors.push(`Row ${i + 1}: Batch No required`);
      }

      if (!item.mfgDate) {
        errors.push(`Row ${i + 1}: Mfg Date required`);
      }

      if (!item.expDate) {
        errors.push(`Row ${i + 1}: Expiry Date required`);
      }
      if(item.barcodeId && item.barcodeId.toString().length !== 9)
        errors.push(`Row ${i + 1}: Barcode Id must be 9 characters long`);
      if(!item.barcodeId)
        errors.push(`Row ${i + 1}: Barcode Id is required`);
    }
  });

  return errors;
};