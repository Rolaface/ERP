import { create } from "zustand";

interface DataRefreshState {
  refreshFlags: Record<string, boolean>;
  subscribers: Record<string, Subscriber[]>;
  triggerRefresh: (key: string) => void;
  subscribeToRefresh: (key: string, callback: () => void) => () => void;
  clearRefresh: (key: string) => void;
}

type Subscriber = () => void;

export const useDataRefreshStore = create<DataRefreshState>((set, get) => ({
  refreshFlags: {},
  subscribers: {},

  triggerRefresh: (key: string) => {
    set((state) => ({
      refreshFlags: { ...state.refreshFlags, [key]: true },
    }));

    const subscribers = get().subscribers[key];
    if (subscribers) {
      subscribers.forEach((callback) => callback());
    }

    setTimeout(() => {
      set((state) => ({
        refreshFlags: { ...state.refreshFlags, [key]: false },
      }));
    }, 100);
  },

  subscribeToRefresh: (key: string, callback: Subscriber) => {
    set((state) => ({
      subscribers: {
        ...state.subscribers,
        [key]: [...(state.subscribers[key] || []), callback],
      },
    }));

    return () => {
      set((state) => ({
        subscribers: {
          ...state.subscribers,
          [key]: (state.subscribers[key] || []).filter((cb) => cb !== callback),
        },
      }));
    };
  },

  clearRefresh: (key: string) => {
    set((state) => ({
      refreshFlags: { ...state.refreshFlags, [key]: false },
    }));
  },
}));

// Pre-defined refresh keys for consistent usage across the app
export const REFRESH_KEYS = {
  // CRM
  CUSTOMER_LIST: "customer_list",
  CUSTOMER_DETAIL: "customer_detail",

  // Procurement
  SUPPLIER_LIST: "supplier_list",
  SUPPLIER_DETAIL: "supplier_detail",
  PURCHASE_ORDER_LIST: "purchase_order_list",
  PURCHASE_INVOICE_LIST: "purchase_invoice_list",
  RFQ_LIST: "rfq_list",

  // Sales
  INVOICE_LIST: "invoice_list",
  QUOTATION_LIST: "quotation_list",
  PROFORMA_LIST: "proforma_list",

  // Inventory
  ITEM_LIST: "item_list",
  ITEM_DETAIL: "item_detail",
  ITEM_CATEGORY_LIST: "item_category_list",
  WAREHOUSE_LIST: "warehouse_list",
  TAX_TEMPLATE_LIST: "tax_template_list",
  TAX_CATEGORY_LIST: "tax_category_list",
  SALES_TAX_LIST: "sales_tax_list",

  // Payment
  PAYMENT_LIST: "payment_list",
  MODE_OF_PAYMENT_LIST: "mode_of_payment_list",
  BANK_ACCOUNT_LIST: "bank_account_list",
  FIXED_ASSET_LIST: "fixed_asset_list",
  ASSET_MOVEMENT_LIST: "asset_movement_list",
   ASSET_CATEGORY_LIST: "asset_category_list", 
  CREDIT_NOTE_LIST: "credit_note_list",
  DEBIT_NOTE_LIST: "debit_note_list",
  USER_ROLE_LIST: "user_role_list",
  Bank: "bank",
  CREATE_USER_LIST: "create_user_list",
  EMPLOYEE_LIST: "employee_list",
  SALARY_COMPONENT_LIST: "salary_component_list",
  SALARY_STRUCTURE_LIST: "salary_structure_list",
  TAX_CONFIGURATION_LIST: "tax_configuration_list",
  EMPLOYEE_TYPE_LIST: "employee_type_list",
  EMPLOYEE_GRADE_LIST: "employee_grade_list",
  DEPARTMENTN_LIST: "designation_list",
  EMAIL_TEMP_LIST: "department_list",
  DESIGNATIOLATE_LIST: "email_template",
  APPRAISAL_CYCLE_LIST: "appraisal_cycle_list",
  APPRAISAL_LIST: "appraisal_list",
  FEEDBACK_LIST:  "feedback_list",

} as const;

export type RefreshKey = typeof REFRESH_KEYS[keyof typeof REFRESH_KEYS];