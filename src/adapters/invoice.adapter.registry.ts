import type { InvoiceAdapter } from "../types/paymententryrecord.types";
import { salesInvoiceAdapter } from "./sales.invoice.adapter";
import { purchaseInvoiceAdapter } from "./purchase.invoice.adapter";

// ─── Registry ─────────────────────────────────────────────────────────────────
//
// To add a new party type (Employee, Shareholder, etc.):

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