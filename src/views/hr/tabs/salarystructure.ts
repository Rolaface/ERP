// salarystructure.ts - FIXED VERSION
export type SalaryComponent = {
  id: string;
  name: string;
  category: "Earning" | "Deduction";
  valueType: "percentage" | "fixed" | "auto";
  value: number | string;
  taxable: boolean;
  statutory?: string;
  editable?: boolean; // Can be modified during onboarding
};

export type SalaryStructure = {
  id: string;
  name: string;
  description: string;
  effectiveFrom: string;
  status: "Active" | "Draft";
  components: SalaryComponent[];
  usedBy: number;
  level: string;
  defaultGrossSalary?: number; // ✅ DEFAULT GROSS SALARY
};

// In-memory storage
let salaryStructures: SalaryStructure[] = [
  {
    id: "exec",
    name: "Executive Level",
    description: "For senior management and executives",
    effectiveFrom: "2025-01-01",
    status: "Active",
    level: "Senior",
    usedBy: 12,
    defaultGrossSalary: 240000, // ✅ Default: ZMW 240,000/year (20K/month)
    components: [
      {
        id: "c1",
        name: "Basic Salary",
        category: "Earning",
        valueType: "percentage",
        value: 60,
        taxable: true,
        statutory: "NAPSA Base",
        editable: false,
      },
      {
        id: "c2",
        name: "House Allowance",
        category: "Earning",
        valueType: "percentage",
        value: 20,
        taxable: true,
        editable: true,
      },
      {
        id: "c3",
        name: "Transport",
        category: "Earning",
        valueType: "percentage",
        value: 15,
        taxable: true,
        editable: true,
      },
      {
        id: "c4",
        name: "Medical",
        category: "Earning",
        valueType: "fixed",
        value: 500,
        taxable: false,
        editable: true,
      },
      {
        id: "c7",
        name: "Reward",
        category: "Earning",
        valueType: "fixed",
        value: 0,
        taxable: true,
        editable: true,
      }, // ✅ OPTIONAL REWARD
      {
        id: "c5",
        name: "NAPSA (5%)",
        category: "Deduction",
        valueType: "auto",
        value: "5% of Basic",
        taxable: false,
        statutory: "NAPSA",
        editable: false,
      },
      {
        id: "c6",
        name: "PAYE",
        category: "Deduction",
        valueType: "auto",
        value: "Tax Slab",
        taxable: false,
        statutory: "PAYE",
        editable: false,
      },
    ],
  },
  {
    id: "mid",
    name: "Mid-Level Staff",
    description: "For middle management and senior staff",
    effectiveFrom: "2025-01-01",
    status: "Active",
    level: "Mid",
    usedBy: 45,
    defaultGrossSalary: 120000, // ✅ Default: ZMW 120,000/year (10K/month)
    components: [
      {
        id: "c1",
        name: "Basic Salary",
        category: "Earning",
        valueType: "percentage",
        value: 65,
        taxable: true,
        statutory: "NAPSA Base",
        editable: false,
      },
      {
        id: "c2",
        name: "House Allowance",
        category: "Earning",
        valueType: "percentage",
        value: 18,
        taxable: true,
        editable: true,
      },
      {
        id: "c3",
        name: "Medical",
        category: "Earning",
        valueType: "fixed",
        value: 300,
        taxable: false,
        editable: true,
      },
      {
        id: "c7",
        name: "Reward",
        category: "Earning",
        valueType: "fixed",
        value: 0,
        taxable: true,
        editable: true,
      }, // ✅ OPTIONAL REWARD
      {
        id: "c4",
        name: "NAPSA (5%)",
        category: "Deduction",
        valueType: "auto",
        value: "5% of Basic",
        taxable: false,
        statutory: "NAPSA",
        editable: false,
      },
      {
        id: "c5",
        name: "PAYE",
        category: "Deduction",
        valueType: "auto",
        value: "Tax Slab",
        taxable: false,
        statutory: "PAYE",
        editable: false,
      },
    ],
  },
  {
    id: "entry",
    name: "Entry Level",
    description: "For junior staff and new hires",
    effectiveFrom: "2025-01-01",
    status: "Active",
    level: "Junior",
    usedBy: 78,
    defaultGrossSalary: 60000, // ✅ Default: ZMW 60,000/year (5K/month)
    components: [
      {
        id: "c1",
        name: "Basic Salary",
        category: "Earning",
        valueType: "percentage",
        value: 70,
        taxable: true,
        statutory: "NAPSA Base",
        editable: false,
      },
      {
        id: "c2",
        name: "House Allowance",
        category: "Earning",
        valueType: "percentage",
        value: 15,
        taxable: true,
        editable: true,
      },
      {
        id: "c3",
        name: "Transport",
        category: "Earning",
        valueType: "fixed",
        value: 200,
        taxable: true,
        editable: true,
      },
      {
        id: "c7",
        name: "Reward",
        category: "Earning",
        valueType: "fixed",
        value: 0,
        taxable: true,
        editable: true,
      }, // ✅ OPTIONAL REWARD
      {
        id: "c4",
        name: "NAPSA (5%)",
        category: "Deduction",
        valueType: "auto",
        value: "5% of Basic",
        taxable: false,
        statutory: "NAPSA",
        editable: false,
      },
      {
        id: "c5",
        name: "PAYE",
        category: "Deduction",
        valueType: "auto",
        value: "Tax Slab",
        taxable: false,
        statutory: "PAYE",
        editable: false,
      },
    ],
  },
];

// API Functions
export const getSalaryStructures = (): SalaryStructure[] => {
  return salaryStructures;
};

export const getActiveSalaryStructures = (): SalaryStructure[] => {
  return salaryStructures.filter((s) => s.status === "Active");
};

export const getSalaryStructureById = (
  id: string,
): SalaryStructure | undefined => {
  return salaryStructures.find((s) => s.id === id);
};

export const createSalaryStructure = (structure: SalaryStructure): void => {
  salaryStructures.push(structure);
};

export const updateSalaryStructure = (
  id: string,
  structure: SalaryStructure,
): void => {
  const index = salaryStructures.findIndex((s) => s.id === id);
  if (index >= 0) {
    salaryStructures[index] = structure;
  }
};

export const deleteSalaryStructure = (id: string): void => {
  salaryStructures = salaryStructures.filter((s) => s.id !== id);
};

export const calculateSalaryBreakdown = (
  structureId: string,
  grossSalary: number,
  customComponents?: SalaryComponent[],
): { component: SalaryComponent; amount: number }[] => {
  const structure = getSalaryStructureById(structureId);
  if (!structure) return [];

  const components = customComponents || structure.components;

  return components.map((comp) => {
    let amount = 0;
    if (comp.valueType === "percentage") {
      amount = (grossSalary * (comp.value as number)) / 100;
    } else if (comp.valueType === "fixed") {
      amount = comp.value as number;
    }
    return { component: comp, amount };
  });
};

export function getSalaryStructureByDesignation(
  designation: string,
): string | null {
  const map: Record<string, string> = {
    "Software Developer": "exec",
    "Senior Developer": "exec",
    "Product Manager": "exec",
    Manager: "mid",
    Accountant: "mid",
    Intern: "entry",
    "Junior Developer": "entry",
  };

  return map[designation] ?? null;
}

export const getSalaryStructureByLevel = (level: string) => {
  return getActiveSalaryStructures().find((s) => s.level === level)?.id || null;
};

export const getLevelsFromHrSettings = () => {
  const active = getActiveSalaryStructures();
  return Array.from(new Set(active.map((s) => s.level)));
};

export const getDefaultGrossSalary = (structureId: string): number => {
  const structure = getSalaryStructureById(structureId);
  return structure?.defaultGrossSalary || 0;
};
