export type Money = number;

export type PayeBand = {
  lowerInclusive: Money;
  upperInclusive: Money | null;
  rate: number;
};

export const ZM_PAYE_BANDS_MONTHLY: PayeBand[] = [
  { lowerInclusive: 0, upperInclusive: 5100, rate: 0 },
  { lowerInclusive: 5100.01, upperInclusive: 7100, rate: 20 },
  { lowerInclusive: 7100.01, upperInclusive: 9200, rate: 30 },
  { lowerInclusive: 9200.01, upperInclusive: null, rate: 37 },
];

export type StatutoryRates = {
  napsaEmployeeRate: number;
  napsaEmployerRate: number;
  nhimaRate: number;
};

export const DEFAULT_ZM_RATES: StatutoryRates = {
  napsaEmployeeRate: 5,
  napsaEmployerRate: 5,
  nhimaRate: 1,
};

export const DEFAULT_NAPSA_CEILING = 1861.8;

export type NapsaCeilingMode = "salary" | "contribution";

export type NapsaCeilingApiResponse = {
  status?: string;
  message?: string;
  data?: {
    year?: string | number;
    amount?: string | number;
    ceiling_amount?: string | number;
  };
  year?: string | number;
  amount?: string | number;
  ceiling_amount?: string | number;
};

const clampMoney = (n: any) => {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, v);
};

export const calculateNapsa = (
  grossSalary: Money,
  ratePercent: number = DEFAULT_ZM_RATES.napsaEmployeeRate,
  ceiling: Money = DEFAULT_NAPSA_CEILING,
  ceilingMode: NapsaCeilingMode = "contribution",
): Money => {
  const gross = clampMoney(grossSalary);
  const rate = Number(ratePercent ?? 0) / 100;

  const cap = clampMoney(ceiling);
  if (cap <= 0) {
    return gross * rate;
  }

  if (ceilingMode === "contribution") {
    const contribution = gross * rate;
    return Math.min(contribution, cap);
  }

  const cappedSalary = Math.min(gross, cap);
  return cappedSalary * rate;
};

export const parseNapsaCeilingAmount = (res: NapsaCeilingApiResponse | any): Money => {
  const raw =
    res?.data?.ceiling_amount ??
    res?.ceiling_amount ??
    res?.data?.amount ??
    res?.amount ??
    0;
  return clampMoney(raw);
};

export const calculateNhima = (
  grossSalary: Money,
  ratePercent: number = DEFAULT_ZM_RATES.nhimaRate,
): Money => {
  const gross = clampMoney(grossSalary);
  return (gross * Number(ratePercent ?? 0)) / 100;
};

export const calculatePaye = (
  taxableIncome: Money,
  bands: PayeBand[] = ZM_PAYE_BANDS_MONTHLY,
): Money => {
  const income = clampMoney(taxableIncome);
  if (income <= 0) return 0;

  let tax = 0;

  for (const band of bands) {
    const lower = clampMoney(band.lowerInclusive);
    const upper = band.upperInclusive === null ? null : clampMoney(band.upperInclusive);
    const rate = Number(band.rate ?? 0) / 100;

    if (income < lower) continue;

    const bandUpper = upper === null ? income : Math.min(income, upper);
    const amountInBand = Math.max(0, bandUpper - lower);
    if (amountInBand <= 0) continue;
    tax += amountInBand * rate;
  }

  return Math.max(0, tax);
};

export type ZmPayrollResult = {
  grossSalary: Money;
  taxableIncome: Money;
  rates: StatutoryRates;
  napsaCeiling: Money;
  napsaCeilingMode: NapsaCeilingMode;
  statutory: {
    napsaEmployee: Money;
    napsaEmployer: Money;
    nhima: Money;
    paye: Money;
  };
  deductionsEmployeeSide: {
    totalContributions: Money;
    totalTax: Money;
    totalDeductions: Money;
  };
  netPay: Money;
};

export const calculateZmPayrollFromGross = (
  grossSalary: Money,
  opts?: {
    rates?: Partial<StatutoryRates>;
    napsaCeiling?: Money;
    napsaCeilingMode?: NapsaCeilingMode;
    payeBands?: PayeBand[];
    taxableIncome?: Money;
  },
): ZmPayrollResult => {
  const gross = clampMoney(grossSalary);
  const rates: StatutoryRates = { ...DEFAULT_ZM_RATES, ...(opts?.rates ?? {}) };
  const napsaCeiling = clampMoney(opts?.napsaCeiling ?? DEFAULT_NAPSA_CEILING);
  const napsaCeilingMode: NapsaCeilingMode = opts?.napsaCeilingMode ?? "contribution";

  const contributionBase = gross;

  const napsaEmployee = calculateNapsa(
    contributionBase,
    rates.napsaEmployeeRate,
    napsaCeiling,
    napsaCeilingMode,
  );
  const napsaEmployer = calculateNapsa(
    contributionBase,
    rates.napsaEmployerRate,
    napsaCeiling,
    napsaCeilingMode,
  );
  const nhima = calculateNhima(contributionBase, rates.nhimaRate);

  const taxableIncome = clampMoney(opts?.taxableIncome ?? gross);
  const paye = calculatePaye(taxableIncome, opts?.payeBands ?? ZM_PAYE_BANDS_MONTHLY);

  const totalContributions = napsaEmployee + nhima;
  const totalTax = paye;
  const totalDeductions = totalContributions + totalTax;
  const netPay = gross - totalDeductions;

  return {
    grossSalary: gross,
    taxableIncome,
    rates,
    napsaCeiling,
    napsaCeilingMode,
    statutory: {
      napsaEmployee,
      napsaEmployer,
      nhima,
      paye,
    },
    deductionsEmployeeSide: {
      totalContributions,
      totalTax,
      totalDeductions,
    },
    netPay,
  };
};