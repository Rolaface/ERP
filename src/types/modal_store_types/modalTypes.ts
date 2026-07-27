import type { LucideIcon } from "lucide-react";
import type { ModalCallback } from "../../types/modal";


export type ModalType =
  | "invoice"
  | "proforma"
  | "quotation"
  | "salesOrder"
  | "customer"
  | "supplier"
  | "purchaseOrder"
  | "purchaseInvoice"
  | "item"
  | "itemCategory"
  | "warehouse"
  | "taxTemplate"
  | "salesTax"
  | "taxCategory"
  | "bankAccount"
  | "modeOfPayment"
  | "paymentEntry"
  | "currencyExchange"
  | "fixedAsset"
  |"assetCategory"
  | "assetMovement"
  | "Rfq"
  | "JournalEntries"
  | "CreditNote"
  | "SalesDebitNote"
  | "DebitNote"
  | "UserRole"
  | "Bank"
  | "employee"
  | "payroll"
  | "salaryComponent"
  |"compensationReview"
  | "salaryStructure"
  | "leaveApply"
  | "taxConfig"
  | "department"
  | "designation"
  | "grade"
  | "User"
  | "Payrollperiod"
  | "employeeType"
  | "employeeType"
  | "leaveType"
  | "leavePeriod"
  | "leavePolicy"
  | "leavePolicyAssignment"
  | "holidayList"
  | "expense"
  | "expenseType"
  | "emailTemplate"
  | "shiftType"
  | "scanPI"
  | "KRA"
  | "appraisalCycle"
  | "feedback"
  | "appraisal"
  | "employeeFeedback"
  |"employeeAdvance"
  |"payrollPreview"
  | "scheduler"
  | "scheduler"
  | "coaGLAccount"
  | "sendEmail"
  | "stockCorrection" 
  | "importInventory"  

  export interface ModalContext {
    source?: string;
    fieldId?: string;
    callback?: ModalCallback;
    onSuccess?: ModalCallback;
    onSubmit?: (data: unknown) => Promise<void> | void;
    isViewMode?: boolean;
    loading?: boolean;
  
  }
  
  export interface ModalMeta {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    onRequestClose?: () => void;
    isViewMode?: boolean;
  }
  
  export interface ModalInstance {
    id: string;
    type: ModalType;
    initialData?: unknown;
    isEdit: boolean;
    context?: ModalContext;
    meta?: ModalMeta;
    minimized: boolean;
    openedAt: number;
    focusOrder: number;
  }
  
  export interface ModalLayerPosition {
    backdrop: number;
    panel: number;
  }

  
  export const MODAL_LAYER = {
    sidebar: 100,
    appChrome: 120,
    modalBackdropBase: 1000,
    modalStep: 20,
    modalPanelOffset: 10,
    minimizedTaskbar: 1800,
  } as const;
