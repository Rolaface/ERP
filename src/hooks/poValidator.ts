import { PurchaseOrderFormData } from "../types/Supply/purchaseOrder";

export const validatePO = (form: PurchaseOrderFormData) => {
  const errors: string[] = [];

  // Basic Information
  if (!form.supplierId) {
    errors.push("Supplier is required");
  }

  if (!form.date) {
    errors.push("PO Date is required");
  }

  if (!form.requiredBy) {
    errors.push("Required By date is required");
  }

  // Items Validation
  if (form.items.length === 0) {
    errors.push("At least 1 item required");
  }

  form.items.forEach((it, i) => {
    if (!it.itemCode) {
      errors.push(`Item code missing at row ${i + 1}`);
    }
    if (!it.quantity || it.quantity <= 0) {
      errors.push(`Quantity invalid at row ${i + 1}`);
    }
    if (!it.rate || it.rate <= 0) {
      errors.push(`Rate invalid at row ${i + 1}`);
    }
  });

  return errors;
};
