import { ENV } from "./env";


const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return ENV.apiBaseUrl;
  }

  const { protocol, hostname } = window.location;
  console.log("🚀 ~ getApiBaseUrl ~ protocol, hostname:", protocol, hostname)

  // let hostname1 ="gbfn.erp.rolaface.com/"

  // Dev / localhost fallback
  if (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.endsWith(".local")
  ) {
    return ENV.apiBaseUrl;
  }

  const hostSegments = hostname.split(".");
  console.log("🚀 ~ getApiBaseUrl ~ hostSegments:", hostSegments)

  if (hostSegments.length < 3) {
    console.log("🚀 ~ getApiBaseUrl ~ hostSegments.length < 3:", hostSegments.length < 3)
    return ENV.apiBaseUrl;
  }

  const tenantSubdomain = hostSegments[0];
  console.log("🚀 ~ getApiBaseUrl ~ tenantSubdomain:", tenantSubdomain)
  const baseDomain = hostSegments.slice(-2).join(".");
  console.log("🚀 ~ getApiBaseUrl ~ baseDomain:", baseDomain)

  const isValidTenant = /^[a-z0-9-]+$/i.test(tenantSubdomain);
  console.log("🚀 ~ getApiBaseUrl ~ isValidTenant:", isValidTenant)
  if (!isValidTenant) {
    return ENV.apiBaseUrl;
  }

  return `${protocol}//api.erp.${tenantSubdomain}.${baseDomain}`;
};



// export const ERP_BASE = getApiBaseUrl();
// export const ERP_BASE="";


// export const ERP_BASE = ENV.apiBaseUrl;
export const ERP_BASE = "";
export const CODES_BASE = ENV.zraCodesBaseUrl;
export const NAPSA_BASE = ENV.napsaBaseUrl;

export const API = {
  loginApi: {
    login: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.login`,
    logout: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.logout`,
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


  Get:{
    getAll:`${ERP_BASE}/api/method/frappe.desk.search.search_link`
  },


  /* =========================
   * COMPANY
   * ========================= */
  company: {
    getAll: `${ERP_BASE}/api/method/erpnext.company-setup.setup.get_companies_api`,
    getById: `${ERP_BASE}/api/method/custom_api.api.organization.company.api.get`,
    create: `${ERP_BASE}/api/method/erpnext.company-setup.setup.create_company_api`,
    // update: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_company_info`,
    createSite: `https://api.master.rolaface.com/api/method/saas_provisioning.api.create_site`, 
    updateById: `${ERP_BASE}/api/method/custom_api.api.organization.company.api.update`,
    delete: `${ERP_BASE}/api/method/erpnext.company-setup.setup.delete_company_api`,
    updateAccounts: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_accounts_company_info`,
    updateCompanyFiles: `${ERP_BASE}/api/method/custom_api.api.organization.company.api.upload_company_documents`,
    deleteCompanyBankAccount: `${ERP_BASE}/api/method/erpnext.company-setup.setup.delete_company_bank_account`,
  },
  Account: {
    createnewBankaccount: `${ERP_BASE}/api/method/custom_api.api.bank_account.create`,
    getBankAccounts: `${ERP_BASE}/api/method/custom_api.api.search.parties_and_accounts`,
    getAllBankAccounts: `${ERP_BASE}/api/method/custom_api.api.bank_account.get`,
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.bank_account.set_bank_account_status`,
    ModeOfPayment: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.create`,
    GetModeOfPayment: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.get`,
    GetDefaultAccounts: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.get_default_accounts`,
    UpdateStatusModeOfPayment: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.update`,
    GetPartyDetails: `${ERP_BASE}/api/method/custom_api.api.search.get_party_details`,
    getBankAccountMain: `${ERP_BASE}/api/method/custom_api.api.bank_account.get`,
    getLedgerAccount: `${ERP_BASE}/api/method/custom_api.api.payment.get_ledger_account`,
    getExchangeRate: `${ERP_BASE}/api/method/erpnext.setup.utils.get_exchange_rate`,
    createPaymentEntry: `${ERP_BASE}/api/method/custom_api.api.payment.create_payment_entry`,
  },

  accounting: {
    createCOA: `${ERP_BASE}/api/method/erpnext.accounts.utils.add_ac`,
    getCOA: `${ERP_BASE}/api/method/custom_api.api.chart_of_account.get_chart_of_accounts`,
    getTB: `${ERP_BASE}/api/method/custom_api.api.trial_balance.get_trial_balance`,
    getPL: `${ERP_BASE}/api/method/custom_api.api.profit_loss.get_profit_and_loss`,
    getBalanceSheet: `${ERP_BASE}/api/method/custom_api.api.balance_sheet.get_balance_sheet`,
    getCashFlow: `${ERP_BASE}/api/method/custom_api.api.cash_flow.get_cash_flow`,
    getAllPayables: `${ERP_BASE}/api/method/custom_api.api.accounts_payable.get_accounts_payable`,
    getAllReceivable: `${ERP_BASE}/api/method/custom_api.api.accounts_receivable.get_accounts_receivable`,
    getLedger: `${ERP_BASE}/api/method/custom_api.api.chart_of_account.get_general_ledger_detail`,
  },
  CurrencyExchange: {
    create: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.create_currency_exchange`,
    getAll: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.get_currency_exchanges`,
    update: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.update_currency_exchange?`,
    delete: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.delete_currency_exchange`,
    get:`${ERP_BASE}/api/method/erpnext.setup.utils.get_exchange_rate`,
   
  },
  /* =========================
   * CUSTOMER
   * ========================= */
  customer: {
    getAll: `${ERP_BASE}/api/method/custom_api.api.customer.get_customers`,
    getById: `${ERP_BASE}/api/method/custom_api.api.customer.get_customer_by_id`,
    create: `${ERP_BASE}/api/method/custom_api.api.customer.create_customer`,
    update: `${ERP_BASE}/api/method/custom_api.api.customer.update_customer`,
    delete: `${ERP_BASE}/api/method/erpnext.zra_client.customer.customer.delete_customer_by_id`,
    getStatement: `${ERP_BASE}/api/method/erpnext.zra_client.customer.statement.api.get_customer_statement`,
    receivePayment: `${ERP_BASE}/api/method/custom_api.api.payment.receive_payment`,
    getAllpayements: `${ERP_BASE}/api/method/custom_api.api.payment.get_all_payments`,
    getPaymentById: `${ERP_BASE}/api/method/custom_api.api.payment.get_payment_by_id`,
    group: `${ERP_BASE}/api/method/custom_api.api.search.get_customers_group`
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
    getAll: `${ERP_BASE}/api/method/custom_api.api.item.api.get`,
    getById: `${ERP_BASE}/api/method/custom_api.api.item.api.get_by_id`,
    create: `${ERP_BASE}/api/method/custom_api.api.item.api.create`,
    update: `${ERP_BASE}/api/method/custom_api.api.item.api.update`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,
    brand: `${ERP_BASE}/api/method/frappe.desk.search.search_link`
  },
    /* =========================
   * TAX
   * ========================= */

  tax:{
    getTemplates: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.get`,
    taxTemplate: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.create_or_update_tax_template`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,
    getTemplateGl:`${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.get_tax_accounts`,
    updatestatus:`${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.update_item_template_tax_status`,
    getAllTaxCategories: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.tax_category.api.get`,
    createTaxCategory: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.tax_category.api.create`,
    updateTaxCategory: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.tax_category.api.update`,
    deleteTaxCategory: `${ERP_BASE}/api/method/frappe.client.delete`
  },

  /* =========================
   * ITEM GROUP
   * ========================= */
  itemGroup: {
    getAll: `${ERP_BASE}/api/method/custom_api.api.item_group.get_item_group_tree`,
    getById: `${ERP_BASE}/api/method/erpnext.zra_client.item.item.get_item_group_by_id_api`,
    create: `${ERP_BASE}/api/method/frappe.desk.treeview.add_node`,
    update: `${ERP_BASE}/api/resource/Item Group`,
    rename: `${ERP_BASE}/api/method/frappe.rename_doc`,
    delete: `${ERP_BASE}/api/resource/Item Group`,
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
    delete: `${ERP_BASE}/api/method/erpnext.quotation.api.delete_quotation`,
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
    editInvoice: `${ERP_BASE}/api/method/erpnext.zra_client.sales.api.edit_sales_invoice`,
  },

  /* =========================
   * STOCK
   * ========================= */
  stock: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.get_stock_balance`,
    stockReport: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.get_batch_wise_stock_report`,
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
    getAll: `${ERP_BASE}/api/method/custom_api.api.warehouse.get_warehouse_tree`,
    create: `${ERP_BASE}/api/method/erpnext.stock.doctype.warehouse.warehouse.add_node`,
    update: `${ERP_BASE}/api/resource/Warehouse`,
    delete: `${ERP_BASE}/api/resource/Warehouse`,
    getAllWarehouses: `${ERP_BASE}/api/method/custom_api.api.warehouse.get_all_warehouse`,
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
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.update_po_status.update_purchase_order_status`,
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
    getAll: `${ERP_BASE}/api/method/custom_api.api.buying.supplier.api.get_suppliers`,
    getById: `${ERP_BASE}/api/method/custom_api.api.buying.supplier.api.get_supplier_by_id`,
    create: `${ERP_BASE}/api/method/custom_api.api.buying.supplier.api.create_supplier`,
    update: `${ERP_BASE}/api/method/custom_api.api.buying.supplier.api.update_supplier`,
    delete: `${ERP_BASE}/api/method/custom_api.api.buying.supplier.api.delete_supplier`,
    getStatement: `${ERP_BASE}/api/method/erpnext.supplier.statement.api.get_supplier_statement`,
    CreatePayment: `${ERP_BASE}/api/method/custom_api.api.payment.make_payment`,
  },

  places: {
    getCountry: `${CODES_BASE}/countries/`,
    getProvinces: `${CODES_BASE}/provinces/`,
    getTown: `${CODES_BASE}/towns/`,
  },

  /* =========================
   * ANALYTICS
   * ========================= */
  analytics: {
    getSalesAnalytics: `${ERP_BASE}/api/method/custom_api.api.sales_analytics.get_sales_analytics`,
    getPurchaseAnalytics: `${ERP_BASE}/api/method/custom_api.api.purchase_analytics.get_purchase_analytics`,
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
    getPackagingUnits: `${ERP_BASE}/api/method/erpnext.packaging_unit.get_all_packaging_units`,
    getCompanyPayableAccounts: `${ERP_BASE}/api/method/custom_api.api.search.get_payable_accounts`,
    getCompanyRecievableAccounts: `${ERP_BASE}/api/method/custom_api.api.search.get_receivable_accounts`,
    getCompanyCostCenter: `${ERP_BASE}/api/method/custom_api.api.search.get_cost_centers`,
    getCustomer: `${ERP_BASE}/api/method/custom_api.api.search.get_customers`,
    getSupplier: `${ERP_BASE}/api/method/custom_api.api.search.get_suppliers`,
    getCurrency: `${ERP_BASE}/api/method/custom_api.api.search.get_currencies`,
    getItemGroups: `${ERP_BASE}/api/method/custom_api.api.search.get_item_groups`,
  },
} as const;
