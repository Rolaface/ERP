// constants.ts — Static config, rates, and dropdown options only.
// All employee/attendance/leave data must come from your API.

// ── Tax Slabs ─────────────────────────────────────────────────────────────────
export const TAX_SLABS_OLD = [
  { min: 0,       max: 250000,   rate: 0  },
  { min: 250000,  max: 500000,   rate: 5  },
  { min: 500000,  max: 1000000,  rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

export const TAX_SLABS_NEW = [
  { min: 0,        max: 300000,   rate: 0  },
  { min: 300000,   max: 600000,   rate: 5  },
  { min: 600000,   max: 900000,   rate: 10 },
  { min: 900000,   max: 1200000,  rate: 15 },
  { min: 1200000,  max: 1500000,  rate: 20 },
  { min: 1500000,  max: Infinity, rate: 30 },
];

// ── Statutory Rates ───────────────────────────────────────────────────────────
export const PF_RATE                = 0.12;
export const ESI_RATE               = 0.0075;
export const ESI_EMPLOYER_RATE      = 0.0325;
export const PROFESSIONAL_TAX       = 200;
export const STANDARD_DEDUCTION     = 50000;
export const OVERTIME_RATE_PER_HOUR = 200;
export const ESI_ELIGIBILITY_LIMIT  = 21000;

// ── Dropdown Options ──────────────────────────────────────────────────────────
export const LEAVE_TYPES = [
  { value: "Casual",    label: "Casual Leave",     paid: true  },
  { value: "Sick",      label: "Sick Leave",        paid: true  },
  { value: "Earned",    label: "Earned Leave",      paid: true  },
  { value: "LWP",       label: "Leave Without Pay", paid: false },
  { value: "Maternity", label: "Maternity Leave",   paid: true  },
  { value: "Paternity", label: "Paternity Leave",   paid: true  },
];

export const BONUS_TYPES = [
  { value: "Performance", label: "Performance Bonus"        },
  { value: "Festival",    label: "Festival Bonus"           },
  { value: "Retention",   label: "Retention Bonus"          },
  { value: "Referral",    label: "Referral Bonus"           },
  { value: "Project",     label: "Project Completion Bonus" },
];

export const PAYROLL_STATUS_OPTIONS = [
  "All", "Paid", "Pending", "Processing", "Draft", "Rejected",
] as const;

export const DEFAULT_COMPANY = "";
export const DEFAULT_PAYROLL_PAYABLE_ACCOUNT = "";
export const DEFAULT_PAYMENT_ACCOUNT = "";
export const DEFAULT_BANK_ACCOUNT = "";
export const DEFAULT_CURRENCY = "";
export const DEFAULT_EXCHANGE_RATE = 1;