import {
  ShieldCheck,
  Play,
  X,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";

export const PayrollIcons = {
  preview: ShieldCheck,
  run: Play,
  revert: X,
  view: Eye,
  payslip: FileText,
  rerun: RefreshCw,
} as const;