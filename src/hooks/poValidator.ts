import type { PurchaseOrderFormData } from "../types/Supply/purchaseOrder";

// ─── helpers ──────────────────────────────────────────────────────────────────

const required = (val: any) =>
  val === null || val === undefined || String(val).trim() === "";

// ─── main validator ───────────────────────────────────────────────────────────

export const validatePO = (form: PurchaseOrderFormData): string[] => {
  const errors: string[] = [];

  // ── 1. Header fields ───────────────────────────────────────────────────────
  if (required(form.supplierId)) errors.push("Supplier is required");
  if (required(form.date)) errors.push("PO Date is required");
  if (required(form.currency)) errors.push("Currency is required");
  if (required(form.taxCategory)) errors.push("Tax Category is required");

  // ── 2. Items ───────────────────────────────────────────────────────────────
  if (!form.items || form.items.length === 0) {
    errors.push("At least one item is required");
  } else {
    form.items.forEach((item, i) => {
      const row = `Row ${i + 1}`;

      if (required(item.itemCode)) errors.push(`${row}: Item is required`);

      const qty = Number(item.quantity);
      if (!item.quantity || isNaN(qty) || qty <= 0)
        errors.push(`${row}: Quantity must be greater than 0`);

      const rate = Number(item.rate);
      if (!item.rate || isNaN(rate) || rate <= 0)
        errors.push(`${row}: Rate must be greater than 0`);

      if (required(item.warehouse)) errors.push(`${row}: Warehouse is required`);

      if (required(item.vatCd)) errors.push(`${row}: Tax Code is required`);

      if (required(item.uom)) errors.push(`${row}: Unit of Measure is required`);
    });
  }

  // ── 3. Supplier address ────────────────────────────────────────────────────
  const supplierAddr = form.addresses?.supplierAddress;
  if (!supplierAddr?.addressLine1?.trim())
    errors.push("Supplier Address Line 1 is required");

  return [...new Set(errors)]; // deduplicate
};

// ─── tab-level validators (used for inline tab feedback) ──────────────────────

export const validateDetailsTab = (form: PurchaseOrderFormData): string | null => {
  if (required(form.supplierId)) return "Supplier is required";
  if (required(form.date)) return "PO Date is required";
  if (required(form.currency)) return "Currency is required";
  if (required(form.taxCategory)) return "Tax Category is required";

  if (!form.items.length || required(form.items[0].itemCode))
    return "Please add at least one item";

  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i];
    const row = `Row ${i + 1}`;

    if (required(item.itemCode)) return `${row}: Item is required`;

    const qty = Number(item.quantity);
    if (!item.quantity || isNaN(qty) || qty <= 0)
      return `${row}: Quantity must be greater than 0`;

    const rate = Number(item.rate);
    if (!item.rate || isNaN(rate) || rate <= 0)
      return `${row}: Rate must be greater than 0`;

    if (required(item.warehouse)) return `${row}: Warehouse is required`;
    if (required(item.vatCd)) return `${row}: Tax Code is required`;
    if (required(item.uom)) return `${row}: Unit of Measure is required`;
  }

  return null;
};

// export const validateAddressTab = (form: PurchaseOrderFormData): string | null => {
//   const supplierAddr = form.addresses?.supplierAddress;
//   if (!supplierAddr?.addressLine1?.trim())
//     return "Supplier Address Line 1 is required";
//   return null;
// };

export const validateTabByName = (
  tab: import("../types/Supply/purchaseOrder").POTab,
  form: PurchaseOrderFormData,
): string | null => {
  switch (tab) {
    case "details":
      return validateDetailsTab(form);
    case "address":
      return validateAddressTab(form);
    default:
      return null;
  }
};