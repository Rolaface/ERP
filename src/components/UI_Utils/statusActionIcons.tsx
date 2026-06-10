import type { ReactNode } from "react";
import {
  FileCheck,
  PackageCheck,
  Ban,
  CircleCheckBig,
  FileMinus,
  Undo2,
  FileText,
  Send,
  CreditCard,
  Banknote,
  ReceiptText,
  Scan,
  ToggleRight,
  ToggleLeft,Eye,
  Play,
  RotateCcw,
} from "lucide-react";

export const ACTION_ICONS = {
  APPROVE: <FileCheck size={16} />,
  COMPLETE: <PackageCheck size={16} />,
  CANCEL: <Ban size={16} />,
  PAID: <CircleCheckBig size={16} />,
  RETURN: <Undo2 size={16} />,
  DEBIT_NOTE: <FileMinus size={16} />,
  ENABLE: <ToggleRight size={16} />,
  DISABLE: <ToggleLeft size={16} />,

  PDF: <FileText size={16} />,
  SCAN: <Scan size={16} />,
  EMAIL: <Send size={16} />,
  PAYMENT: <CreditCard size={16} />,
  ADVANCE_PAYMENT: <Banknote size={16} />,
  PURCHASE_INVOICE: <ReceiptText size={16} />,
  PAYROLL_PREVIEW: <Eye size={16} />,
PAYROLL_RUN: <Play size={16} />,
PAYROLL_REVERT: <RotateCcw size={16} />,
} as const;

export const getStatusActionIcon = (status: string): ReactNode | undefined => {
  switch (status) {
    case "Approved":
    case "Submitted":
      return ACTION_ICONS.APPROVE;

    case "Completed":
      return ACTION_ICONS.COMPLETE;

    case "Cancelled":
      return ACTION_ICONS.CANCEL;

    case "Paid":
      return ACTION_ICONS.PAID;

    case "Return":
      return ACTION_ICONS.RETURN;

    case "Debit Note Issued":
      return ACTION_ICONS.DEBIT_NOTE;

    case "Scanned":
      return ACTION_ICONS.SCAN;

    default:
      return undefined;
  }
};
