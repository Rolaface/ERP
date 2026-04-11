export interface TermPhase {
  id: string;
  name: string;
  percentage: string;
  condition: string;
  credit_days: string;
  isDelete?: number;
}

export interface PaymentTerms {
  phases: TermPhase[];
  dueDates?: string;
  lateCharges?: string;
  taxes?: string;
  notes?: string;
}

export interface TermSection {
  general?: string;
  payment: PaymentTerms;
  delivery?: string;
  cancellation?: string;
  warranty?: string;
  liability?: string;
}
export interface Terms {
  buying?: TermSection;
  selling: TermSection;
}
