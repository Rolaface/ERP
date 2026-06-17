import { getCurrencySymbol } from "../../utils/currency";

export type PLNode = {
  id: string;
  account: string;
  account_name: string;
  currency?: string;
  parent_account: string;
  indent: number;
  is_group: number;
  periods: Record<string, number>;
  children: PLNode[];
};

export type PLSummaryItem = {
  label: string;
  value: number;
  datatype?: string;
  currency?: string;
  indicator?: string;
  type?: string;
};

export type PLColumn = {
  fieldname: string
  label: string
  fieldtype: string
  width?: number
  options?: string
  hidden?: number
}

export type PLData = {
  columns: PLColumn[]
  summary: PLSummaryItem[]
  income: PLNode[]
  expense: PLNode[]
}


export type PLResponse = {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: PLData;
  };
};

export function mapNode(node: Partial<PLNode> & any): PLNode {
  return {
    id: node.account,
    account: node.account,
    account_name: node.account_name,
    currency: node.currency,
    parent_account: node.parent_account,
    indent: node.indent,
    is_group: node.is_group,
    periods: node.periods ?? {},
    children: node.children?.map(mapNode) ?? [],
  };
}

export function formatPeriod(key: string) {
  if (key === "total") return "Total";

  const [month, year] = key.split("_");
  return `${month.slice(0, 3).toUpperCase()} ${year}`;
}



export const nf = (
  value: number | null | undefined,
): string => {
  if (value === null || value === undefined) return "—";

  const symbol = getCurrencySymbol();

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  return value < 0
    ? `${symbol} -${formatted}`
    : `${symbol} ${formatted}`;
};