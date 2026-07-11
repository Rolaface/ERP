import type {
  ComponentResult,
  ComponentType,
  SalaryComponentDef,
  SalaryResult,
} from "../../../../utils/Salary_Employee/salaryengine";
import type { TaxConfig } from "../../../../api/payrollConfigApi";

export type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  isEditMode?: boolean;
};

export type CustomComponent = {
  id: string;
  selected: boolean;
  detailsLoading?: boolean;
  def: SalaryComponentDef;
};

export type RowFlags = {
  depends_on_payment_days?: 0 | 1;
  is_tax_applicable?: 0 | 1;
  is_income_tax_component?: 0 | 1;
  variable_based_on_taxable_salary?: 0 | 1;
};

export type DisplayRow = ComponentResult & {
  editId: string;
  isCustom: boolean;
  selected: boolean;
  flags?: RowFlags;
  amount_based_on_formula?: 0 | 1;
  detailsLoading?: boolean;
};

export type ComponentOption = { label: string; value: string };

export type SalarySetupSectionProps = {
  formData: any;
  hasCustomizations: boolean;
  isLoadingTax: boolean;
  getAllSalaryStructures: (query: string) => Promise<any>;
  fetchCurrencyOptions: (query: string) => Promise<ComponentOption[]>;
  handleSalaryStructureChange: (val: any) => void;
  handleTaxSlabChange: (val: any) => void;
  stableHandleInputChange: (field: string, value: any) => void;

};
// A per-employee override that flips a STRUCTURE component into formula
// mode (or edits its formula), keyed by the same nameKey/editId space as
// `overrides`. Custom components track their own amount_based_on_formula /
// formula directly on their def, so they don't need an entry here.
export type FormulaOverride = {
  amount_based_on_formula: 0 | 1;
  formula: string;
};

export type ComponentsPanelProps = {
  hasCustomizations: boolean;
  customizationCount: number;
  isCustomizing: boolean;
  earningRows: DisplayRow[];
  deductionRows: DisplayRow[];
  removedEarningRows: DisplayRow[];
  removedDeductionRows: DisplayRow[];
  handleRestoreComponent: (editId: string) => void;
  overrides: Record<string, number>;
  formulaOverrides: Record<string, FormulaOverride>;
  hasPendingEarning: boolean;
  hasPendingDeduction: boolean;
 currency: string;
  
  fetchComponentOptions: (
    type: ComponentType,
    query: string,
  ) => Promise<ComponentOption[]>;
  handleResetAllCustomizations: () => void;
  handleToggleCustomize: () => void;
  handleAddCustomComponent: (type: ComponentType) => void;
  handleAmountChange: (
    editId: string,
    value: number | null,
    isCustomRow: boolean,
  ) => void;
  handleSelectCustomComponent: (
    editId: string,
    option: ComponentOption,
  ) => void;
  handleReselectCustomComponent: (editId: string) => void;
  handleRemoveCustomComponent: (editId: string) => void;
  
  handleExcludeComponent: (editId: string) => void;
  handleResetOverride: (editId: string) => void;
  handleToggleCustomFormulaMode: (
    editId: string,
    isCustomRow: boolean,
  ) => void;
  handleCustomFormulaChange: (
    editId: string,
    formula: string,
    isCustomRow: boolean,
  ) => void;
};

export type SummaryPanelProps = {
  salaryResult: SalaryResult | null;
  taxConfig: TaxConfig | null;
  summaryExpanded: boolean;
  setSummaryExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  fmt: (n: number) => string;
  cur: (n: number) => string;
};