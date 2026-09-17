import {
  Users,
  Truck,
  Boxes,
  UserCog,
  Network,
  ShoppingCart,
  FileText,
} from "lucide-react";
import type { ImportModuleConfig } from "../../types/importdata/importdata_type";

import { customerImportApi } from "../../api/imports/customer import/customerimportapi";
import { inventoryItemImportApi } from "../../api/imports/inventory import/inventoryimportapi";
import { purchaseInvoiceImportApi } from "../../api/imports/purchase import/purchaseinvoice_importapi";
import { supplierImportApi } from "../../api/imports/supplier import/supplierimportapi";
import { itemClassificationImportApi } from "../../api/imports/codes import/itemClassificationImportApi";
import type { SubscriptionAccess } from "../../store/subscriptionStore";


export const IMPORT_MODULES: ImportModuleConfig[] = [
  {
    key: "customers",
    title: "Customers",
    description: "Contact details, billing addresses, and credit limits.",
    category: "General",
    icon: Users,
    status: "active",
    api: customerImportApi,
    subscriptionCheck: (a: SubscriptionAccess) => a.customer,
  },
 {
  key: "suppliers",
  title: "Suppliers",
  description: "Supplier records, tax IDs, and procurement preferences.",
  category: "General",
  icon: Truck,
  status: "active",         
  api: supplierImportApi,
  subscriptionCheck: (a: SubscriptionAccess) => a.procurement,
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
      subscriptionCheck: (a: SubscriptionAccess) => a.inventory,
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
     subscriptionCheck: (a: SubscriptionAccess) => a.sales,
  },
  {
    key: "procurement",
    title: "Procurement",
    description: "Purchase orders, RFQs, purchase invoices, and debit notes.",
    category: "General",
    icon: FileText,
    status: "active",
    subTypes: [
      { key: "purchase-order", label: "Purchase Order" },
      { key: "rfq", label: "RFQ" },
      { key: "purchase-invoice", label: "Purchase Invoice", api: purchaseInvoiceImportApi },
      { key: "debit-note", label: "Debit Note" },
    ],
     subscriptionCheck: (a: SubscriptionAccess) => a.procurement,
  },
  {
    key: "codes",
    title: "Codes",
    description: "Item Classification codes, Packaging codes, and UOM codes.",
    category: "General",
    icon: FileText,
    status: "active",
    subTypes: [
      { key: "item-classification", label: "Item Classification", api: itemClassificationImportApi },
      { key: "packaging", label: "Packaging" },
      { key: "uom", label: "UOM" },
    ],
     subscriptionCheck: (a: SubscriptionAccess) => a.procurement,
  },
  {
    key: "transactions",
    title: "Transactions",
    description: "Ledger entries, payment records, and reconciliations.",
    category: "Finance",
    icon: FileText,
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