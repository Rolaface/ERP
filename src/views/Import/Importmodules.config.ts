import {
  Users,
  Truck,
  Boxes,
  UserCog,
  Network,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import type { ImportModuleConfig } from "../../types/importdata/importdata_type";

import { customerImportApi } from "../../api/imports/customer import/customerimportapi";
import { inventoryItemImportApi } from "../../api/imports/inventory import/inventoryimportapi";
import { purchaseInvoiceImportApi } from "../../api/imports/purchase import/purchaseinvoice_importapi";

// ── This is the ONE place to look when:
// - adding a new importable module: write its api file (see createImportApi.ts
//   for the pattern), import it here, add one object below.
// - adding/removing a sub-type: add/remove an entry in that module's subTypes array.
// - flipping a module from "soon" to "active": set status once its api exists.
// - wiring a module/sub-type to its backend: just set `api: yourImportApi` —
//   no other file needs to change.
export const IMPORT_MODULES: ImportModuleConfig[] = [
  {
    key: "customers",
    title: "Customers",
    description: "Contact details, billing addresses, and credit limits.",
    category: "General",
    icon: Users,
    status: "active",
    api: customerImportApi,
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description: "Supplier records, tax IDs, and procurement preferences.",
    category: "General",
    icon: Truck,
    status: "soon",
    lastImport: "Yesterday",
  },
  {
    key: "inventory",
    title: "Inventory",
    description: "Items, warehouses, and stock records.",
    category: "Logistics",
    icon: Boxes,
    status: "active",
    subTypes: [
      { key: "item", label: "Item", api: inventoryItemImportApi },
      { key: "warehouse", label: "Warehouse" },
      { key: "stock", label: "Stock" },
    ],
  },
  {
    key: "sales",
    title: "Sales",
    description: "Sales orders, quotations, proforma invoices, invoices, and credit notes.",
    category: "Sales",
    icon: ShoppingCart,
    status: "active",
    subTypes: [
      { key: "sales-order", label: "Sales Order" },
      { key: "quotation", label: "Quotation" },
      { key: "proforma-invoice", label: "Proforma Invoice" },
      { key: "invoice", label: "Invoice" },
      { key: "credit-note", label: "Credit Note" },
    ],
  },
  {
    key: "procurement",
    title: "Procurement",
    description: "Purchase orders, RFQs, purchase invoices, and debit notes.",
    category: "General",
    icon: Receipt,
    status: "active",
    subTypes: [
      { key: "purchase-order", label: "Purchase Order" },
      { key: "rfq", label: "RFQ" },
      { key: "purchase-invoice", label: "Purchase Invoice", api: purchaseInvoiceImportApi },
      { key: "debit-note", label: "Debit Note" },
    ],
  },
  {
    key: "transactions",
    title: "Transactions",
    description: "Ledger entries, payment records, and reconciliations.",
    category: "Finance",
    icon: Receipt,
    status: "soon",
    lastImport: "1 day ago",
  },
  {
    key: "chart-of-accounts",
    title: "Chart of Accounts",
    description: "Financial structure, GL codes, and cost center mapping.",
    category: "Finance",
    icon: Network,
    status: "soon",
  },
  {
    key: "employees",
    title: "Employees",
    description: "Employee records, hierarchy levels, and departments.",
    category: "HR",
    icon: UserCog,
    status: "soon",
  },
];

export const CATEGORY_OPTIONS = Array.from(
  new Set(IMPORT_MODULES.map((m) => m.category)),
).map((c) => ({ label: c, value: c }));