export interface SalesOrderItem {
  itemCode: string;
  itemName?: string;
  description?: string;
  quantity: number;
  rate: number;
  uom?: string;
  discount?: number;
  amount?: number;
  warehouse?: string;
  batchNo?: string;
  boxStart?: number | string;
  boxEnd?: number | string;
  deliveryDate?: string;
}

 
export type SalesOrderStatus =
  | "Draft"
  | "To Deliver and Bill"
  | "To Bill"
  | "To Deliver"
  | "Completed"
  | "On Hold"
  | "Closed"
  | "Cancelled";
 
export interface SalesOrderSummary {
  orderNumber: string;
  customerName: string;
  currency: string;
  deliveryDate: string | null;
  grandTotal: number;
  status: SalesOrderStatus;
  transactionDate: string;
  perDelivered?: number;
  perBilled?: number;
}
 
export interface SalesOrderData {
  id?: string;
  orderNumber?: string;
  title?: string;
  customerId?: string;
  customerName: string;
  contact_email?: string;

  currency: string;
  exchangeRate?: string | number;

  postingDate: string;
  deliveryDate: string;
  customerPoNo?: string;
  customerPoDate?: string;

  taxCategory?: string;
  destnCountryCd?: string;

  customerAddressId?: string;
  billingAddress?: string;
  shippingAddressId?: string;
  shippingAddress?: string;

  orderType?: string;
  salesTaxTemplate?: string;

  status: SalesOrderStatus;
  docstatus?: number;

  roundingAdjustment?: number;
  roundedTotal?: number;
  totalQty?: number;
  totalTax?: number;
  netTotal?: number;
  grandTotal: number;
  inWords?: string;
  perDelivered?: number;
  perBilled?: number;

  documentType?: "Sales Order";

  items: SalesOrderItem[];
  taxes: any[];
  charges: any[];
  terms: { selling?: Record<string, any> };

  payment_mode?: string;
  attachments?: {
    name: string;
    file_name: string;
    file_url?: string;
    file_size?: number;
    file_type?: string;
    is_private?: number;
    creation?: string;
  }[];
}

export const salesOrderStatusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "To Deliver and Bill", label: "To Deliver and Bill" },
  { value: "To Bill", label: "To Bill" },
  { value: "To Deliver", label: "To Deliver" },
  { value: "Completed", label: "Completed" },
  { value: "On Hold", label: "On Hold" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
] as const;