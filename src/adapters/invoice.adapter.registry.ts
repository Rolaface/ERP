import type { InvoiceAdapter } from "../types/paymententryrecord.types";
import { salesInvoiceAdapter } from "./sales.invoice.adapter";
import { purchaseInvoiceAdapter } from "./purchase.invoice.adapter";

// ─── Registry ─────────────────────────────────────────────────────────────────
//
// To add a new party type (Employee, Shareholder, etc.):
//   1. Create src/adapters/invoices/employee.invoice.adapter.ts
//   2. Add one line here
//   Zero changes to hook, component, or modal.
//
const registry: Readonly<Record<string, InvoiceAdapter>> = {
  Customer: salesInvoiceAdapter,
  Supplier: purchaseInvoiceAdapter,
};

export function getInvoiceAdapter(partyType: string): InvoiceAdapter | null {
  return registry[partyType] ?? null;
}

export function isSupportedPartyType(partyType: string): boolean {
  return partyType in registry;
}