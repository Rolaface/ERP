import { ENV } from "./env";

const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return ENV.apiBaseUrl;
  }

  const { protocol, hostname } = window.location;
  // Dev / localhost fallback
  if (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.endsWith(".local")
  ) {
    return ENV.apiBaseUrl;
  }

  const hostSegments = hostname.split(".");
  if (hostSegments.length < 3) {
    return ENV.apiBaseUrl;
  }

  const tenantSubdomain = hostSegments[0];
  const baseDomain = hostSegments.slice(-2).join(".");
  const isValidTenant = /^[a-z0-9-]+$/i.test(tenantSubdomain);
  if (!isValidTenant) {
    return ENV.apiBaseUrl;
  }

  return `${protocol}//api.erp.${tenantSubdomain}.${baseDomain}`;
};

export const ERP_BASE = getApiBaseUrl();
// export const ERP_BASE = "";
export const CODES_BASE = ENV.zraCodesBaseUrl;
export const NAPSA_BASE = ENV.napsaBaseUrl;

export const API = {
  loginApi: {
    login: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.login`,
    forgotPassword: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.forgot_password`,
    logout: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.logout`,
  },

  /* =========================
   * DASHBOARD
   * ========================= */
  dashboard: {
    summary: `${ERP_BASE}/api/method/custom_api.api.dashboard.main.api.summary`,
    dashboardSummary: `${ERP_BASE}/api/method/custom_api.api.dashboard.main.api.dashboard_summary`,
    salesChart: `${ERP_BASE}/api/method/custom_api.api.dashboard.main.api.sales_chart`,
    purchaseChart: `${ERP_BASE}/api/method/custom_api.api.dashboard.main.api.purchase_chart`,
    inventoryChart: `${ERP_BASE}/api/method/custom_api.api.dashboard.main.api.inventory_chart`,
    notes: `${ERP_BASE}/api/method/custom_api.api.dashboard.main.api.notes`,
  },

  /* =========================
   * SALES DASHBOARD
   * ========================= */
  salesDashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.sale.api.summary`,
    recentSales: `${ERP_BASE}/api/method/custom_api.api.dashboard.sales.api.top_recent_sales`,
    salesSummary: `${ERP_BASE}/api/method/custom_api.api.dashboard.sales.api.monthly_sales_breakdown`,
   },

  /* =========================
   * CUSTOMER DASHBOARD
   * ========================= */
  customerDashboard: {
    summary: `${ERP_BASE}/api/method/custom_api.api.dashboard.customer.api.summary`,
  },

  /* =========================
   * PROCUREMENT DASHBOARD
   * ========================= */
  procurementDashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.procurement.api.summary`,
    procurementSummary: `${ERP_BASE}/api/method/custom_api.api.dashboard.procurement.api.get_procurement_summary`,
    procurementDetails: `${ERP_BASE}/api/method/custom_api.api.dashboard.procurement.api.get_procurement_details`, 
  },

  /* =========================
   * INVENTORY DASHBOARD
   * ========================= */
  inventoryDashboard: {
    summary: `${ERP_BASE}/api/method/erpnext.dashboards.inventory.api.summary`,
    itemBreakdown: `${ERP_BASE}/api/method/custom_api.api.dashboard.inventory.api.get_item_breakdown`,
    topItems: `${ERP_BASE}/api/method/custom_api.api.dashboard.inventory.api.get_top_3_items`,
  },

  /* =========================
   * HR DASHBOARD
   * ========================= */
  hrDashboard: {
    summary: `${ERP_BASE}/api/method/hrms.dashboards.main.api.summary`,
  },

  Get: {
    getAll: `${ERP_BASE}/api/method/frappe.desk.search.search_link`,
  },

  /* =========================
   * COMPANY
   * ========================= */
  company: {
    getAll: `${ERP_BASE}/api/method/erpnext.company-setup.setup.get_companies_api`,
    getById: `${ERP_BASE}/api/method/custom_api.api.organization.company.api.get`,
    create: `${ERP_BASE}/api/method/erpnext.company-setup.setup.create_company_api`,
    // update: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_company_info`,
    createSite: `${ERP_BASE}/api/method/saas_provisioning.api.create_site`,
    updateById: `${ERP_BASE}/api/method/custom_api.api.organization.company.api.update`,

    delete: `${ERP_BASE}/api/method/erpnext.company-setup.setup.delete_company_api`,
    updateAccounts: `${ERP_BASE}/api/method/erpnext.company-setup.setup.update_accounts_company_info`,
    updateCompanyFiles: `${ERP_BASE}/api/method/custom_api.api.organization.company.api.upload_company_documents`,
    deleteCompanyBankAccount: `${ERP_BASE}/api/method/erpnext.company-setup.setup.delete_company_bank_account`,
  },

  RoleManagement: {
    createUserRoles: `${ERP_BASE}/api/method/auth_api.role_management.api.role.create`,
    getUserRoles: `${ERP_BASE}/api/method/auth_api.role_management.api.role.get`,
    getUserRolesbyId: `${ERP_BASE}/api/method/auth_api.role_management.api.role.get_by_id`,
    updateUserRoles: `${ERP_BASE}/api/method/auth_api.role_management.api.role.update`,
    updateUserRolesStatus: `${ERP_BASE}/api/method/auth_api.role_management.api.role.update_status`,
    createUser: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.signup`,
    Language: `${ERP_BASE}/api/method/frappe.desk.search.search_link`,
    getUser: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.get`,
    getUserbyId: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.get_user_by_id`,
    updateUser: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.update`,
    deleteUser:  `${ERP_BASE}/api/method/frappe.client.delete`,
    getUserDetails: `${ERP_BASE}/api/method/auth_api.user_management.api.auth.get_login_user`
  },

  Account: {
    createnewBankaccount: `${ERP_BASE}/api/method/custom_api.api.bank_account.create`,
    getBankAccounts: `${ERP_BASE}/api/method/custom_api.api.search.parties_and_accounts`,
    getAllBankAccounts: `${ERP_BASE}/api/method/custom_api.api.bank_account.get`,
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.bank_account.set_bank_account_status`,
    ModeOfPayment: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.create`,
    UpdateModeOfPayment: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.update`,
    GetModeOfPayment: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.get`,
    GetDefaultAccounts: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.get_default_accounts`,
    UpdateStatusModeOfPayment: `${ERP_BASE}/api/method/custom_api.api.mode_of_payment.update`,
    GetPartyDetails: `${ERP_BASE}/api/method/custom_api.api.search.get_party_details`,
    getBankAccountMain: `${ERP_BASE}/api/method/custom_api.api.bank_account.get`,
    getLedgerAccount: `${ERP_BASE}/api/method/custom_api.api.payment.get_ledger_account`,
    getExchangeRate: `${ERP_BASE}/api/method/erpnext.setup.utils.get_exchange_rate`,
    createPaymentEntry: `${ERP_BASE}/api/method/custom_api.api.payment.create_payment_entry`,
    getAccountsResource: `${ERP_BASE}/api/resource/Account`,
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

  journalEntry: {
    getByIdOnly: `${ERP_BASE}/api/resource`,
    create: `${ERP_BASE}/api/resource/Journal Entry`,
    getAll: `${ERP_BASE}/api/resource/Journal Entry`,
    getById: `${ERP_BASE}/api/resource/Journal Entry`,
    update: `${ERP_BASE}/api/resource/Journal Entry`,
    delete: `${ERP_BASE}/api/resource/Journal Entry`,
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.accounting.journal_entry.api.update_journal_entry_status`,
  },
  CurrencyExchange: {
    create: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.create_currency_exchange`,
    getAll: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.get_currency_exchanges`,
    update: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.update_currency_exchange?`,
    delete: `${ERP_BASE}/api/method/custom_api.api.currency_exchange.delete_currency_exchange`,
    get: `${ERP_BASE}/api/method/erpnext.setup.utils.get_exchange_rate`,
  },
  /* =========================
   * CUSTOMER
   * ========================= */
  customer: {
    getAll: `${ERP_BASE}/api/method/custom_api.api.selling.customer.api.get_customers`,
    getById: `${ERP_BASE}/api/method/custom_api.api.selling.customer.api.get_customer_by_id`,
    create: `${ERP_BASE}/api/method/custom_api.api.selling.customer.api.create_customer`,
    update: `${ERP_BASE}/api/method/custom_api.api.selling.customer.api.update_customer`,
    delete: `${ERP_BASE}/api/method/custom_api.api.selling.customer.api.delete_customer`,
    getStatement: `${ERP_BASE}/api/method/custom_api.api.reports.customer_statement.get_customer_statement`,
    receivePayment: `${ERP_BASE}/api/method/custom_api.api.payment.receive_payment`,
    getAllpayements: `${ERP_BASE}/api/method/custom_api.api.payment.get_all_payments`,
    getPaymentById: `${ERP_BASE}/api/method/custom_api.api.payment.get_payment_by_id`,
    group: `${ERP_BASE}/api/method/custom_api.api.search.get_customers_group`,
    grouptree: `${ERP_BASE}/api/method/custom_api.api.customer_group_item_restriction.get_customer_group_tree`,
    updateStatus:`${ERP_BASE}/api/method/custom_api.api.selling.customer.api.update_customer_status`,
  },

  /* =========================
   * EMPLOYEE / HRMS
   * ========================= */
  employee: {
    getAll: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.get_employees`,
    getById: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.get_employee_by_id`,
    Dp: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.upload_employee_image`,
    create: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.create_employee`,
    update: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.update_employee`,
    delete: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.delete_employee`,
    updateStatus:`${ERP_BASE}/api/method/custom_hrms.api.employee.api.update_employee_status`,
    employeeDetailsById: `${ERP_BASE}/api/method/custom_hrms.api.leave.api.custom_employee_details`,
    leaveApproverDetails: `${ERP_BASE}/api/method/custom_hrms.api.leave.api.get_leave_approvers`,
    getByNrc: `${NAPSA_BASE}/v1/member/`,
    getCurrentCeiling: `${NAPSA_BASE}/v1/ceiling`,
  },

  employeeDocumnet: {
    uploadDocument: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.upload_employee_document`,
    getDocuments: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.get_employee_documents`,
    getDocumentById: `${ERP_BASE}/api/method/custom_hrms.api.employee.api.get_employees`,
    updateDocument: `${ERP_BASE}/api/method/update_employee_document`,
    deleteDocument: `${ERP_BASE}/api/method/delete_employee_document`,
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
    brand: `${ERP_BASE}/api/method/frappe.desk.search.search_link`,
  },
  /* =========================
   * TAX
   * ========================= */

  tax: {
    getTemplates: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.get`,
    taxTemplate: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.create_or_update_tax_template`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,
    getTemplateGl: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.get_tax_accounts`,
    updatestatus: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.update_item_template_tax_status`,
    getAllTaxCategories: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.tax_category.api.get`,
    createTaxCategory: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.tax_category.api.create`,
    updateTaxCategory: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.tax_category.api.update`,
    deleteTaxCategory: `${ERP_BASE}/api/method/frappe.client.delete`,
  },

  salesTax: {
    createSalesTemplate: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.sales.api.create_sales_tax_template`,
    getsalesTemplates: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.sales.api.get_sales_tax_templates`,
    getsalesTemplatesbyid: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.sales.api.get_sales_tax_template`,
    deleteSalesTemplate: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.sales.api.delete_sales_tax_template`,
    getTemplateGl: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.item.api.get_tax_accounts`,
    updateSalesTaxTemplate: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.sales.api.update_sales_tax_template`,
    updateSalesTaxTemplateStatus: `${ERP_BASE}/api/method/custom_api.api.taxes_and_charges.sales.api.update_sales_tax_status`,
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

  Address: {
    getaddress: `${ERP_BASE}/api/method/custom_api.utils.address.api.get_address_list`,
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

  holidayList: {
    getAll: `${ERP_BASE}/api/method/custom_hrms.api.leave.holiday.api.list_holiday_lists`,
    getByName: `${ERP_BASE}/api/method/custom_hrms.api.leave.holiday.api.get_holiday_list`,
    create: `${ERP_BASE}/api/method/custom_hrms.api.leave.holiday.api.create_holiday_list`,
    update: `${ERP_BASE}/api/method/custom_hrms.api.leave.holiday.api.update_holiday_list`,
    delete: `${ERP_BASE}/api/method/custom_hrms.api.leave.holiday.api.delete_holiday_list`,
  },
  // holidays: {
  //   getAll: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.get_holidays`,
  //   create: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.create_holiday`,
  //   update: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.update_holiday`,
  //   delete: `${ERP_BASE}/api/method/hrms.napsa_client.holidays.api.delete_holiday`,
  // },

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
    getAll: `${ERP_BASE}/api/method/custom_api.api.selling.sales_invoice.api.get_sales_invoices`,
    getById: `${ERP_BASE}/api/method/custom_api.api.selling.sales_invoice.api.get_sales_invoice_by_id`,
    create: `${ERP_BASE}/api/method/custom_api.api.selling.sales_invoice.api.create_sales_invoice`,
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.selling.sales_invoice.api.update_sales_invoice_status`,
    delete: `${ERP_BASE}/api/method/custom_api.api.selling.sales_invoice.api.delete_sales_invoice`,
    editInvoice: `${ERP_BASE}/api/method/custom_api.api.selling.sales_invoice.api.update_sales_invoice`,
  },

  CreditNote: {
    Credit_note: `${ERP_BASE}/api/resource/Sales Invoice`,
  },
  DebitNote: {
    Debit_note: `${ERP_BASE}/api/resource/Purchase Invoice`,
  },

  Bank: {
    Bank: `${ERP_BASE}/api/resource/Bank`,
  },
    /* =========================
   * expanse claims
   * ========================= */

  ExpenseClaim:{
    Expense_Claim: `${ERP_BASE}/api/resource/Expense Claim`,
    Claim_Type: `${ERP_BASE}/api/resource/Expense Claim Type`,
  },
  /* =========================
   * STOCK
   * ========================= */
  stock: {
    getAll: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.get_stock_balance`,
    stockReport: `${ERP_BASE}/api/method/custom_api.api.stock.api.get_batch_wise_stock_report`,
    // stockReport: `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.get_batch_wise_stock_report`,
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
    getAll: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_order.api.get`,

    getById: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_order.api.get_by_id`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,

    create: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_order.api.create`,

    update: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_order.api.update`,
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.update_po_status.update_purchase_order_status`,
    createInvoiceFromPO: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_order.api.create_pi_from_po`,
  },
  //purchase invoice
  purchaseInvoice: {
    getAll: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_invoice.api.get`,

    getById: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_invoice.api.get_by_id`,
    create: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_invoice.api.create`,
    update: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_invoice.api.update`,
    updateStatus: `${ERP_BASE}/api/method/custom_api.api.buying.purchase_invoice.api.update_status`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,
  },

  rfq: {
    create: `${ERP_BASE}/api/method/custom_api.api.buying.request_for_quotation.api.create_rfq`,
    GetAll: `${ERP_BASE}/api/resource/Request for Quotation`,
    update: `${ERP_BASE}/api/method/custom_api.api.buying.request_for_quotation.api.update_rfq`,
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
    getStatement: `${ERP_BASE}/api/method/custom_api.api.reports.supplier_statement.get_supplier_statement`,
    CreatePayment: `${ERP_BASE}/api/method/custom_api.api.payment.make_payment`,
  },

  places: {
    getCountry: `${CODES_BASE}/countries/`,
    getProvinces: `${CODES_BASE}/provinces/`,
    getTown: `${CODES_BASE}/towns/`,
  },

  AssetsTypes: {
    getall: `${ERP_BASE}/api/resource/Asset Category`,
    create: `${ERP_BASE}/api/method/custom_api.api.fixed_assets.api.create_asset_category`,
    update: `${ERP_BASE}/api/method/custom_api.api.fixed_assets.api.update_asset_category`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,
  },
  Assets: {
    getall: `${ERP_BASE}/api/resource/Asset`,
    create: `${ERP_BASE}/api/resource/Asset`,
    update: `${ERP_BASE}/api/resource/Asset`,
    delete: `${ERP_BASE}/api/method/frappe.client.delete`,
    // Assit movement
    Movement: `${ERP_BASE}/api/resource/Asset Movement`,
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
  /* =========================
   * SHIPPING AND INCOTERMS
   * ========================= */
  ShippingAPI: {
    getshipping: `${ERP_BASE}/api/method/custom_api.api.search.get_shipping_rules`,
  },
  IncotermsApi: {
    getIncoterms: `${ERP_BASE}/api/method/custom_api.api.search.get_incoterms`,
  },

  /* =========================
   * PAYROLL CONFIGURATION
   * ========================= */
  payroll: {
    // Salary Component
    salaryComponent: {
      getAll: `${ERP_BASE}/api/resource/Salary Component`,
      getById: `${ERP_BASE}/api/resource/Salary Component`,
      create: `${ERP_BASE}/api/resource/Salary Component`,
      update: `${ERP_BASE}/api/resource/Salary Component`,
      delete: `${ERP_BASE}/api/resource/Salary Component`,
    },

    // Salary Structure
    salaryStructure: {
      getAll: `${ERP_BASE}/api/resource/Salary Structure`,
      getById: `${ERP_BASE}/api/resource/Salary Structure`,
      create: `${ERP_BASE}/api/resource/Salary Structure`,
      update: `${ERP_BASE}/api/resource/Salary Structure`,
      delete: `${ERP_BASE}/api/resource/Salary Structure`,
    },

    incomeTaxSlab: {
      getAll: `${ERP_BASE}/api/resource/Income Tax Slab`,
      getById: `${ERP_BASE}/api/resource/Income Tax Slab`,
      create: `${ERP_BASE}/api/resource/Income Tax Slab`,
      update: `${ERP_BASE}/api/resource/Income Tax Slab`,
      delete: `${ERP_BASE}/api/resource/Income Tax Slab`,
    },

    payrollPeriod: {
      getAll: `${ERP_BASE}/api/resource/Payroll Period`,
      getById: `${ERP_BASE}/api/resource/Payroll Period`,
      create: `${ERP_BASE}/api/resource/Payroll Period`,
      update: `${ERP_BASE}/api/resource/Payroll Period`,
      delete: `${ERP_BASE}/api/resource/Payroll Period`,
    },

    payrollentry: {
      createpayrollentry: `${ERP_BASE}/api/resource/Payroll Entry`,
      runpayroll: `${ERP_BASE}/api/method/custom_hrms.api.payroll.api.run_payroll`,
      salaryslip: `${ERP_BASE}/api/resource/Salary Slip`,
      salaryslip_pdf:  `${ERP_BASE}/api/method/custom_hrms.api.pdf.api.get_document_pdf`,
    },

  },

  employeeConfig: {
    department: {
      getAll: `${ERP_BASE}/api/resource/Department`,
      getById: `${ERP_BASE}/api/resource/Department`,
      create: `${ERP_BASE}/api/resource/Department`,
      update: `${ERP_BASE}/api/resource/Department`,
      delete: `${ERP_BASE}/api/resource/Department`,
    },
    designation: {
      getAll: `${ERP_BASE}/api/resource/Designation`,
      getById: `${ERP_BASE}/api/resource/Designation`,
      create: `${ERP_BASE}/api/resource/Designation`,
      update: `${ERP_BASE}/api/resource/Designation`,
      delete: `${ERP_BASE}/api/resource/Designation`,
    },
    grade: {
      getAll: `${ERP_BASE}/api/resource/Employee Grade`,
      getById: `${ERP_BASE}/api/resource/Employee Grade`,
      create: `${ERP_BASE}/api/resource/Employee Grade`,
      update: `${ERP_BASE}/api/resource/Employee Grade`,
      delete: `${ERP_BASE}/api/resource/Employee Grade`,
    },
    employeeType: {
      getAll: `${ERP_BASE}/api/resource/Employment Type`,
      getById: `${ERP_BASE}/api/resource/Employment Type`,
      create: `${ERP_BASE}/api/resource/Employment Type`,
      update: `${ERP_BASE}/api/resource/Employment Type`,
      delete: `${ERP_BASE}/api/resource/Employment Type`,
    },
  },
  leaveType: {
    getAll: `${ERP_BASE}/api/resource/Leave Type`,
    getById: `${ERP_BASE}/api/resource/Leave Type`,
    create: `${ERP_BASE}/api/resource/Leave Type`,
    update: `${ERP_BASE}/api/resource/Leave Type`,
    delete: `${ERP_BASE}/api/resource/Leave Type`,
  },
  leaveApplication: {
    getAll: `${ERP_BASE}/api/resource/Leave Application`,
    getById: `${ERP_BASE}/api/resource/Leave Application`,
    create: `${ERP_BASE}/api/resource/Leave Application`,
    update: `${ERP_BASE}/api/resource/Leave Application`,
    delete: `${ERP_BASE}/api/resource/Leave Application`,
  },

  /* =========================
   * UTILS
   * ========================= */
  frappeUtilsAPI: {
    getCompanyCurrentFiscalYear: `${ERP_BASE}/api/method/custom_api.utils.frappe_utils.get_current_fiscal_year`,
    locationSearch: `${ERP_BASE}/api/method/custom_api.api.search.get_locations`,
    createlocation: `${ERP_BASE}/api/resource/Location`,
    getitemcodeforFaixedAsset: `${ERP_BASE}/api/method/custom_api.api.search.get_items`,
    getemployeeforAssetMovement: `${ERP_BASE}/api/method/custom_api.api.search.get_employees`,
    getdepartment: `${ERP_BASE}/api/method/custom_hrms.api.search.get_departments`,
    getgrade: `${ERP_BASE}/api/method/custom_hrms.api.search.get_employee_grades`,
    getdesignation: `${ERP_BASE}/api/method/custom_hrms.api.search.get_designations`,
    getemployeetype: `${ERP_BASE}/api/method/custom_hrms.api.search.get_employment_types`,
    getsalarystructure: `${ERP_BASE}/api/method/custom_hrms.api.search.get_salary_structures`,
    getleavepolicy: `${ERP_BASE}/api/method/custom_hrms.api.search.get_leave_policies`,
    getUsers: `${ERP_BASE}/api/method/custom_hrms.api.search.get_users`,
    getPayrollEmployees:`${ERP_BASE}/api/method/custom_hrms.api.payroll.api.get_payroll_employee`,
    getBranches:`${ERP_BASE}/api/method/custom_hrms.api.search.get_branches`,
    createbranch:`${ERP_BASE}/api/resource/Branch`
  },
} as const;
