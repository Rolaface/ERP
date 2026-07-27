import {
  Users,
  Truck,
  Package,
  UserCog,
  Warehouse,
  Network,
  ShoppingBag,
  Tags,
  Receipt,
} from "lucide-react";
import type { ImportModuleConfig } from "../../types/importdata/importdata_type";

// ── API integration is disabled for now — modules are plain data below.
// When APIs are ready, come back here and:
//   1. import * as customersApi from "../../api/customersApi"; (etc. per module)
//   2. add back a `handlers: { downloadTemplate, uploadFile }` block per module
//      (see ImportModuleHandlers in the types file for the expected shape)
//
// import * as customersApi from "../../api/customersApi";
// import * as suppliersApi from "../../api/suppliersApi";
// import * as itemsApi from "../../api/itemsApi";
// import * as productsApi from "../../api/productsApi";
// import * as ordersApi from "../../api/ordersApi";
// import * as transactionsApi from "../../api/transactionsApi";

// ── This is the ONE place to look when:
// - adding a new importable module
// - changing which API a module's import/template hits (once wired back in)
// - flipping a module from "soon" to "active" once its API is ready
export const IMPORT_MODULES: ImportModuleConfig[] = [
  {
    key: "customers",
    title: "Customers",
    description: "Contact details, billing addresses, and credit limits.",
    category: "General",
    icon: Users,
    status: "active",
    lastImport: "2 hours ago",
    // handlers: {
    //   downloadTemplate: customersApi.downloadImportTemplate,
    //   uploadFile: customersApi.importFromFile,
    // },
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description: "Supplier records, tax IDs, and procurement preferences.",
    category: "General",
    icon: Truck,
    status: "active",
    lastImport: "Yesterday",
    // handlers: {
    //   downloadTemplate: suppliersApi.downloadImportTemplate,
    //   uploadFile: suppliersApi.importFromFile,
    // },
  },
  {
    key: "items",
    title: "Items",
    description: "Inventory items, SKUs, and pricing tiers.",
    category: "General",
    icon: Package,
    status: "active",
    lastImport: "3 days ago",
    // handlers: {
    //   downloadTemplate: itemsApi.downloadImportTemplate,
    //   uploadFile: itemsApi.importFromFile,
    // },
  },
  {
    key: "products",
    title: "Products",
    description: "Product catalogs, variants, and categorization data.",
    category: "General",
    icon: Tags,
    status: "active",
    lastImport: "3 days ago",
    // handlers: {
    //   downloadTemplate: productsApi.downloadImportTemplate,
    //   uploadFile: productsApi.importFromFile,
    // },
  },
  {
    key: "orders",
    title: "Orders",
    description: "Sales orders, purchase orders, and historical transactions.",
    category: "Logistics",
    icon: ShoppingBag,
    status: "active",
    lastImport: "5 hours ago",
    // handlers: {
    //   downloadTemplate: ordersApi.downloadImportTemplate,
    //   uploadFile: ordersApi.importFromFile,
    // },
  },
  {
    key: "warehouses",
    title: "Warehouses",
    description: "Warehouse locations, zones, and storage capacity.",
    category: "Logistics",
    icon: Warehouse,
    status: "soon",
    // No handlers yet — wire these up once the warehouses API exists,
    // then flip status to "active".
  },
  {
    key: "transactions",
    title: "Transactions",
    description: "Ledger entries, payment records, and reconciliations.",
    category: "Finance",
    icon: Receipt,
    status: "active",
    lastImport: "1 day ago",
    // handlers: {
    //   downloadTemplate: transactionsApi.downloadImportTemplate,
    //   uploadFile: transactionsApi.importFromFile,
    // },
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