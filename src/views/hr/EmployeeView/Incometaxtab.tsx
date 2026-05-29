import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext"; // Adjust path if needed
import { getSalarySlipsByEmployeeOnly } from "../../../api/payroll/payrollEntryApi";
import ModalTable from "../../../components/ui/Table/ModalTableInside";
import type { Column } from "../../../components/ui/Table/type";
import type { SalarySlip } from "../EmployeeManagement/detailtab/salarytypes";
import { formatDate } from "../EmployeeManagement/detailtab/salarysliphelper";
import { formatCurrency, getSlipPeriodLabel } from "../EmployeeManagement/detailtab/salarysliphelper";

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const currentYear = new Date().getFullYear();

const YEARS = [
  { label: "All Years", value: "" },
  ...Array.from({ length: 6 }, (_, i) => ({
    label: String(currentYear - i),
    value: String(currentYear - i),
  })),
];

function getSlipYear(slip: SalarySlip): number | null {
  const d = slip.posting_date || slip.start_date;
  return d ? new Date(d).getFullYear() : null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface IncomeTaxProps {
  employeeId?: string;
}

// ─── Current regime card ──────────────────────────────────────────────────────

export const IncomeTax: React.FC<IncomeTaxProps> = ({
  employeeId,
}) => {
  const { user } = useAuth();
  
  // Safely fallback to logged-in user's employeeId if the prop isn't passed
  const targetEmployeeId = employeeId || user?.employeeId;

  // ── State ──────────────────────────────────────────────────────────────────
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!targetEmployeeId) return;
    
    setLoading(true);
    getSalarySlipsByEmployeeOnly(targetEmployeeId)
      .then(({ data }) => {
        setSlips(data || []);
      })
      .catch((e) => console.error("Failed to fetch tax data:", e))
      .finally(() => setLoading(false));
  }, [targetEmployeeId]);

  // ── Filters & Pagination ───────────────────────────────────────────────────
  const isFiltered = !!(search || yearFilter);

  const filtered = useMemo(() => {
    let list = [...slips];
    const q = search.trim().toLowerCase();
    
    if (q) {
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          getSlipPeriodLabel(s)?.toLowerCase().includes(q) ||
          s.tax_exemption_declaration?.toLowerCase().includes(q)
      );
    }
    
    if (yearFilter) {
      list = list.filter((s) => {
        const y = getSlipYear(s);
        return y !== null && String(y) === yearFilter;
      });
    }
    
    return list;
  }, [slips, search, yearFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = (fn: () => void) => {
    fn();
    setPage(1);
  };

  // ── Columns ────────────────────────────────────────────────────────────────
const columns: Column<SalarySlip>[] = [
  {
        key: "period",
        header: "Period",
        width: "220px",
        minWidth: "220px",
        render: (slip) => (
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-main">
              {getSlipPeriodLabel(slip)}
            </span>
            <span className="text-[10px] text-muted">
              {formatDate(slip.start_date)} - {formatDate(slip.end_date)}
            </span>
          </div>
        ),
      },
  {
    key: "current_month_income_tax",
    header: "Current Tax",
    // align: "right",
    width: "140px",
    minWidth: "140px",
    render: (slip) => (
      <span className="text-[12px] font-medium text-amber-600">
        {formatCurrency(slip.current_month_income_tax || 0, slip.currency)}
      </span>
    ),
  },
  {
    key: "annual_taxable_amount",
    header: "Annual Taxable",
    // align: "right",
    width: "150px",
    minWidth: "150px",
    render: (slip) => (
      <span className="text-[12px] text-main font-medium">
        {formatCurrency(slip.annual_taxable_amount || 0, slip.currency)}
      </span>
    ),
  },
  {
    key: "non_taxable_earnings",
    header: "Non-Taxable",
    // align: "right",
    width: "140px",
    minWidth: "140px",
    render: (slip) => (
      <span className="text-[12px] text-muted">
        {formatCurrency(slip.non_taxable_earnings || 0, slip.currency)}
      </span>
    ),
  },
  {
    key: "income_tax_deducted_till_date",
    header: "Deducted YTD",
    // align: "right",
    width: "150px",
    minWidth: "150px",
    render: (slip) => (
      <span className="text-[12px] font-medium text-emerald-600">
        {formatCurrency(slip.income_tax_deducted_till_date || 0, slip.currency)}
      </span>
    ),
  },
  {
    key: "standard_tax_exemption_amount",
    header: "Std Exemp",
    // align: "right",
    width: "140px",
    minWidth: "140px",
    render: (slip) => (
      <span className="text-[12px] text-main">
        {formatCurrency(slip.standard_tax_exemption_amount || 0, slip.currency)}
      </span>
    ),
  },
  {
    key: "total_income_tax",
    header: "Total Tax",
    // align: "right",
    width: "140px",
    minWidth: "140px",
    render: (slip) => (
      <span className="text-[12px] font-bold text-red-600">
        {formatCurrency(slip.total_income_tax || 0, slip.currency)}
      </span>
    ),
  },
];

  // ── Filters UI ─────────────────────────────────────────────────────────────
  const filtersNode = (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={yearFilter}
        onChange={(e) => resetPage(() => setYearFilter(e.target.value))}
        className="text-[11px] bg-card border border-theme rounded-lg px-2 py-1.5 text-main focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
      >
        {YEARS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      
      {isFiltered && (
        <button
          onClick={() =>
            resetPage(() => {
              setSearch("");
              setYearFilter("");
            })
          }
          className="text-[11px] font-medium text-muted hover:text-danger transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 h-full">
      <ModalTable<SalarySlip>
        tableId="employee-income-tax-slips"
        columns={columns}
        data={paginated}
        rowKey={(s) => s.name}
        loading={loading}
        emptyMessage={
          isFiltered ? "No matching tax records found" : "No tax records available"
        }
        showToolbar
        toolbarPlaceholder="Search by period or declaration..."
        searchValue={search}
        onSearch={(q) => resetPage(() => setSearch(q))}
        extraFilters={filtersNode}
        currentPage={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
};

export default IncomeTax;
