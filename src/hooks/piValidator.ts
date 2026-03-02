import type { PurchaseInvoiceFormData } from "../types/Supply/purchaseInvoice";

export const validatePI = (form: PurchaseInvoiceFormData) => {
  const errors: string[] = [];

  if (!form.supplier) errors.push("Supplier is required");


  if (!form.items.length) {
    errors.push("At least one item is required");
  }

  form.items.forEach((item, i) => {
    if (!item.itemCode) errors.push(`Item ${i + 1}: Item Code missing`);
    if (!item.quantity) errors.push(`Item ${i + 1}: Quantity missing`);
    if (!item.rate) errors.push(`Item ${i + 1}: Rate missing`);
  });

  return errors;
};