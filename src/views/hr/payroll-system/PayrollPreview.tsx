import React, { useState, useMemo, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Users, AlertCircle, Download } from "lucide-react";

import type { PayrollVerificationData } from "../../../api/payroll/payrollEntryApi";
import type { MappedEmployee } from "../../../utils/payroll_Utils/mapPayrollVerificationData";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { Button } from "../../../components/ui/modal/formComponent";
import ModalTable from "../../../components/ui/Table/ModalTableInside";

import { StatChip } from "../../../components/UI_Utils/StatChip";
import { SearchBar } from "../../../components/UI_Utils/SearchBar";
import { SlipDrawer } from "../../../components/Hr/payrollmodal/SlipDrawer";
import { usePayrollTableColumns } from "../../../hooks/payroll_hooks/usePayrollTableColumns";
import { buildEmployees, fmtMoney, tokenize, employeeMatchesQuery } from "../../../utils/payroll_Utils/payrollPreview.utils";
import { exportPayrollExcel } from "../../../utils/payroll_Utils/Exportpayrollexcel";

interface PayrollPreviewModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  rawData: PayrollVerificationData | null;
  loading?: boolean;
}
export const PayrollPreviewModal: React.FC<PayrollPreviewModalProps> = ({
  modalId, isOpen, onClose, rawData, loading = false,
}) => {
  const currency = rawData?.currency ?? "INR";
  const employees = useMemo(() => (rawData ? buildEmployees(rawData) : []), [rawData]);

  const totalGross = rawData?.financial_summary?.total_gross_payable ?? 0;
  const totalDeductions = rawData?.financial_summary?.total_deduction ?? 0;
  const totalNet = rawData?.financial_summary?.total_net_payable ?? 0;
  const employeeCount = rawData?.financial_summary?.employee_count ?? rawData?.number_of_employees ?? employees.length;

  const [selectedEmp, setSelectedEmp] = useState<MappedEmployee | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => { if (!isOpen) setSearchQuery(""); }, [isOpen]);

  const monthLabel = useMemo(() => {
    if (!rawData?.start_date) return rawData?.name ?? "Payroll";
    return new Date(rawData.start_date + "T00:00:00").toLocaleString("en-IN", { month: "long", year: "numeric" });
  }, [rawData]);

  const sortedEmployees = useMemo(() => {
    const list = [...employees];
    list.sort((a, b) => {
      const av: any = (a as any)[sortBy] ?? "";
      const bv: any = (b as any)[sortBy] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [employees, sortBy, sortOrder]);

  const searchTokens = useMemo(() => tokenize(searchQuery), [searchQuery]);
  const filteredEmployees = useMemo(
    () => (searchTokens.length === 0 ? sortedEmployees : sortedEmployees.filter((emp) => employeeMatchesQuery(emp, searchTokens))),
    [sortedEmployees, searchTokens],
  );

  const columns = usePayrollTableColumns(currency);

  const handleExport = async () => {
    if (!rawData) return;
    setExporting(true);
    try {
      await exportPayrollExcel(rawData, employees);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={loading ? "Loading…" : `Payroll Preview — ${monthLabel}`}
      subtitle={loading ? "" : `${rawData?.name ?? ""} · ${rawData?.start_date ?? ""} → ${rawData?.end_date ?? ""}`}
      maxWidth="full"
      height="90vh"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted text-sm">Loading payroll data…</div>
      ) : !rawData ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="text-sm font-semibold text-main">No payroll data available.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-2 relative h-full min-h-0">
          <div className="grid grid-cols-4 gap-2 shrink-0">
            <StatChip icon={<Users className="w-4 h-4" />} label="Employees" value={`${employeeCount}`} />
            <StatChip icon={<TrendingUp className="w-4 h-4" />} label="Total gross" value={fmtMoney(totalGross, currency)} />
            <StatChip icon={<TrendingDown className="w-4 h-4" />} label="Total deductions" value={fmtMoney(totalDeductions, currency)} valueClass="text-danger" />
            <StatChip icon={<Wallet className="w-4 h-4" />} label="Net payable" value={fmtMoney(totalNet, currency)} valueClass="text-success" />
          </div>

          <div className="shrink-0 flex items-center justify-between gap-4 mt-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} resultCount={filteredEmployees.length} totalCount={employees.length} />
            {employees.length > 0 && (
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="h-9 px-3.5 rounded-xl border border-theme bg-card hover:bg-emerald-500/5 hover:border-emerald-500/40 text-xs font-bold text-main transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                {exporting ? "Exporting…" : "Export Excel"}
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0">
            <ModalTable<MappedEmployee>
              tableId="payroll-preview-table"
              columns={columns}
              data={filteredEmployees}
              rowKey={(emp) => emp.id}
              loading={loading}
              emptyMessage={searchTokens.length > 0 ? `No employees match "${searchQuery}"` : "No employees found"}
              onRowClick={(emp) => setSelectedEmp(emp)}
              showToolbar={false}
              enableColumnSelector
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={({ sortBy, sortOrder }) => { setSortBy(sortBy); setSortOrder(sortOrder); }}
              totalItems={filteredEmployees.length}
            />
          </div>
        </div>
      )}
      <SlipDrawer emp={selectedEmp} currency={currency} onClose={() => setSelectedEmp(null)} />
    </MinimizableModal>
  );
};

export default PayrollPreviewModal;