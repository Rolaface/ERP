import { ENV } from "./env";

export const ERP_BASE = "";
export const CODES_BASE = ENV.zraCodesBaseUrl;
export const NAPSA_BASE = ENV.napsaBaseUrl;

export const API = {


  loginApi:{
    login : `${ERP_BASE}/api/method/auth_api.user_management.api.auth.login`
  },

   /* =========================
   * DASHBOARD
   * ========================= */
  dashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.main.api.summary`,
  },

  
   /* =========================
   * SALES DASHBOARD
   * ========================= */
  salesDashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.sale.api.summary`,
  },

  /* =========================
   * CUSTOMER DASHBOARD
   * ========================= */
  customerDashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.customer.api.summary`,
  },

  /* =========================
   * PROCUREMENT DASHBOARD
   * ========================= */
  procurementDashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.procurement.api.summary`,
  },

  /* =========================
   * INVENTORY DASHBOARD
   * ========================= */
  inventoryDashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.inventory.api.summary`,
  },

  /* =========================
   * HR DASHBOARD
   * ========================= */
  hrDashboard: {
    summary: `${ERP_BASE}/api/method/hrms.dashboards.main.api.summary`,
  },

  /* =========================
   * COMPANY
   * ========================= */
  company: {
    getAll: `${ERP_BASE}/api/method/erpnext.company-setup.setup.get_companies_api`,
    getById: `${ERP_BASE}/api/method/erpnext.company-setup.setup.get_company_api`,
    create: `${ERP_BASE}/api/method/erpnext.company-setup.setup.create_company_api`,
    // update: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_company_info`,
    updateById: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_company_api`,
    delete: `${ERP_BASE}/api/method/erpnext.company-setup.setup.delete_company_api`,
    updateAccounts: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_accounts_company_info`,
    updateCompanyFiles: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_company_files`,
    deleteCompanyBankAccount: `${ERP_BASE}/api/method/erpnext.company-setup.setup.delete_company_bank_account`,
  },

  /* =========================
   * CUSTOMER
   * ========================= */
  customer: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.customer.customer.get_all_customers_api`,
    getById: `${ERP_BASE}/api/method/erpnext.zra_client.customer.customer.get_customer_by_id`,
    create: `${ERP_BASE}/api/method/erpnext.zra_client.customer.customer.create_customer_api`,
    update: `${ERP_BASE}/api/method/erpnext.zra_client.customer.customer.update_customer_by_id`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.customer.customer.delete_customer_by_id`,
    getStatement: `${ERP_BASE}/api/method/erpnext.zra_client.customer.statement.api.get_customer_statement`,
  },

  /* =========================
   * EMPLOYEE / HRMS
   * ========================= */
  employee: {
    getAll: `${ERP_BASE}/api/method/hrms.napsa_client.employee.api.get_all_employees`,
    getById: `${ERP_BASE}/api/method/hrms.napsa_client.employee.api.get_employee`,
    create: `${ERP_BASE}/api/method/hrms.napsa_client.employee.api.create_employee`,
    update: `${ERP_BASE}/api/method/hrms.napsa_client.employee.api.update_employee`,
    delete: `${ERP_BASE}/api/method/hrms.napsa_client.employee.api.delete_employee`,
    updateDocuments: `${ERP_BASE}/api/method/hrms.napsa_client.employee.api.manage_employee_documents`,
    getByNrc: `${NAPSA_BASE}/v1/member/`,
    getCurrentCeiling: `${NAPSA_BASE}/v1/ceiling`,
    

  },

  /* =========================
   * ITEM
   * ========================= */
  item: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.get_all_items_api`,
    getById: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.get_item_by_id_api`,
    create: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.create_item_api`,
    update: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.update_item_api`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.delete_item_by_id`,
  },

  /* =========================
   * ITEM GROUP
   * ========================= */
  itemGroup: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.get_all_item_groups_api`,
    getById: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.get_item_group_by_id_api`,
    create: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.create_item_group_api`,
    update: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.update_item_group_api`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.delete_item_group`,
  },

  /* =========================
   * LEAVE / HR
   * ========================= */
  leave: {
    getAll: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.get_all_leaves`,
    getPending: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.get_all_pending_leaves`,
    getById: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.get_leave_by_id`,
    getByEmployee: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.get_leaves_by_employee_id`,
    create: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.create_leave_application`,
    update: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.update_leave_application`,
    updateStatus: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.update_leave_status`,
    cancel: `${ERP_BASE}/api/method/hrms.napsa_client.leave.api.cancel_leave`,
    createAllocation: `${ERP_BASE}/api/method/hrms.napsa_client.leave_allocation.api.create_leave_allocation`,
    getAllocationsByEmployee: `${ERP_BASE}/api/method/hrms.napsa_client.leave_allocation.api.get_leave_allocations_by_employee_id`,
    getBalance: `${ERP_BASE}/api/method/hrms.napsa_client.leave_balance.api.get_employee_leave_balance_report`,
    getHolidays: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.get_holidays`,
  },

  holidays: {
    getAll: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.get_holidays`,
    create: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.create_holiday`,
    update: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.update_holiday`,
    delete: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.delete_holiday`,
  },

  /* =========================
   * MODULES (SYSTEM)
   * ========================= */
  modules: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.company-setup.modules.get_all_modules_api`,
    getByKey: `${ERP_BASE}/api/method/erpnext.zra_client.company-setup.modules.get_module_by_key_api`,
    create: `${ERP_BASE}/api/method/erpnext.zra_client.company-setup.modules.create_module_api`,
    update: `${ERP_BASE}/api/method/erpnext.zra_client.company-setup.modules.update_module_by_key_api`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.company-setup.modules.delete_module_by_key_api`,
  },

  /* =========================
   * PROFORMA
   * ========================= */
  proforma: {
    getAll: `${ERP_BASE}/api/method/erpnext.proforma.api.get_proforma_api`,
    getById: `${ERP_BASE}/api/method/erpnext.proforma.api.get_proforma_by_id`,
    create: `${ERP_BASE}/api/method/erpnext.proforma.api.create_proforma_api`,
    updateStatus: `${ERP_BASE}/api/method/erpnext.proforma.api.update_proforma_status`,
    delete: `${ERP_BASE}/api/method/erpnext.proforma.api.delete_proforma`,
  },

  /* =========================
   * QUOTATION
   * ========================= */
  quotation: {
    getAll: `${ERP_BASE}/api/method/erpnext.quotation.api.get_all_quotations`,
    getById: `${ERP_BASE}/api/method/erpnext.quotation.api.get_quotation_by_id`,
    getDetails: `${ERP_BASE}/api/method/erpnext.quotation.api.get_quotation_details`,
    create: `${ERP_BASE}/api/method/erpnext.quotation.api.create_quotation`,
    update: `${ERP_BASE}/api/method/erpnext.zra_client.quotation.api.update_quotation`,
    updateTerms: `${ERP_BASE}/api/method/erpnext.quotation.api.update_quotation_terms_and_conditions_by_id`,
    updateAddress: `${ERP_BASE}/api/method/erpnext.quotation.api.update_quotation_address`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.quotation.api.delete_quotation`,
  },

  /* =========================
   * SALES / INVOICES
   * ========================= */
  invoice: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.get_sales_invoice`,
    getById: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.get_sales_invoice_by_id`,
    create: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.create_sales_invoice`,

    updateStatus: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.update_invoice_status`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.delete_sales_invoice`,
    createCreditNote: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.create_credit_note_from_sales_invoice`,
    createDebitNote: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.create_debit_note_from_invoice`,
    getCreditNotes: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.get_credit_notes`,
    getDebitNotes: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.get_debit_notes`,
  },

  /* =========================
   * STOCK
   * ========================= */
  stock: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.get_all_stock_entries`,
    getbyId: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.get_stock_by_id`,
    //  getAllStockItems:'${ERP_BASE}/api'

    create: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.create_item_stock_api`,
    correct: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.correct_stock`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.delete_stock_entry`,
  },

  /* =========================
   * WAREHOUSE
   * ========================= */
  warehouse: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.stock.warehouse.get_all_warehouses`,
    create: `${ERP_BASE}/api/method/erpnext.zra_client.stock.warehouse.create_warehouse_api`,
    update: `${ERP_BASE}/api/method/erpnext.zra_client.stock.warehouse.update_warehouse_api`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.stock.warehouse.delete_warehouse_api`,
  },

  /* =========================
   * IMPORT
   * ========================= */
  import: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.item.imports.api.get_all_import_items`,
    getById: `${ERP_BASE}/api/method/erpnext.zra_client.item.imports.api.get_import_item_by_id`,
    updateAutomatic: `${ERP_BASE}/api/method/erpnext.zra_client.item.imports.api.update_stock_automatic`,
  },

  /* =========================
   * PURCHASE ORDER
   * ========================= */
  purchaseOrder: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.order.get_purchase_orders`,

    getById: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.order.get_purchase_order`,

    create: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.order.create_purchase_order`,

    update: `${ERP_BASE}/api/method/erpnext.zra_client.update_purchase_order`,
    updateStatus: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.order.update_purchase_order_status`,
  },
  //purchase invoice
  purchaseIvoice: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.invoice.get_all_purchase_invoices`,

    getById: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.invoice.get_purchase_invoice_by_id`,
    create: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.invoice.create_purchase_invoice`,

    updateStatus: `${ERP_BASE}/api/method/erpnext.zra_client.purchase.invoice.update_purchase_invoices_status`,
  },

  /* =========================
   * SUPPLIER
   * ========================= */
  supplier: {
    getAll: `${ERP_BASE}/api/method/erpnext.supplier.api.get_suppliers`,
    getById: `${ERP_BASE}/api/method/erpnext.supplier.api.get_supplier_details_id`,
    create: `${ERP_BASE}/api/method/erpnext.supplier.api.create_supplier`,
    update: `${ERP_BASE}/api/method/erpnext.supplier.api.update_supplier`,
    delete: `${ERP_BASE}/api/method/erpnext.supplier.api.delete_supplier`,
  },

  places: {
    getCountry: `${CODES_BASE}/countries/`,
    getProvinces: `${CODES_BASE}/provinces/`,
    getTown: `${CODES_BASE}/towns/`,
  },

  /* =========================
   * LOOKUPS / CODES
   * ========================= */
  lookup: {
    getPackagingUnits: `${CODES_BASE}/packaging-unit-codes/`,
    getCountries: `${CODES_BASE}/country-list/`,
    getUnitOfMeasure: `${CODES_BASE}/unit-of-measure-list/`,
    getItemClasses: `${CODES_BASE}/item-class-list/`,
  },

  /* =========================
   * EXCHANGE RATE
   * ========================= */ 
  exchangeRate: {
    get: `${CODES_BASE}/exchange/`,
  },
  rolaLookup: {
    getUnitOfMeasure: `${ERP_BASE}/api/resource/UOM?limit_start=0&limit_page_length=500`,
    getItemClasses: `${ERP_BASE}/api/item-class-list/`,
    getCountries: `${ERP_BASE}/api/resource/Country?fields=["name","country_name","code"]&limit_page_length=300`,
    getPackagingUnits : `${ERP_BASE}/api/method/erpnext.packaging_unit.get_all_packaging_units`
  },
} as const;
