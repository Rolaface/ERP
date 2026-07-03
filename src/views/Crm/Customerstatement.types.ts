

export interface LedgerEntry {
  date: string;
  type: string;
  ref: string;
  debit: number;
  credit: number;
  balance: number;
  note: string;
}

export interface StatementSummary {
  totalInvoiced: number;
  totalCollected: number;
  netOutstanding: number;
  totalDebit: number;
  totalCredit: number;
}

export interface AgingBuckets {
  current: number;
  "1_30": number;
  "31_60": number;
  "61_90": number;
  "90_plus": number;
}

export interface StatementPagination {
  total: number;
  total_pages: number;
}

export interface StatementData {
  openingBalance: number;
  summary: StatementSummary;
  aging: AgingBuckets;
  ledger: LedgerEntry[];
  pagination?: StatementPagination;
  customerName?:string,customerEmail:string
  currency?: string;
currency_symbol?: string;
  
}

// ─── Component prop shapes ────────────────────────────────────────────────────

export interface CustomerStatementProps {
  customerId: string;
}

export interface StatCellProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  valueClass: string;
  highlight?: boolean;
}

export interface AgingCellProps {
  label: string;
  value: number;
  active?: boolean;
  warn?: boolean;
}