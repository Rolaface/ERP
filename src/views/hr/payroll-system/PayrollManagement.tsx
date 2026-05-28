// views/hr/payroll-system/PayrollManagement.tsx
// ─── Only the verify-related additions shown; merge with your existing file ───

import { useState, useMemo, useEffect } from "react";
import {
  createPayrollEntry,
  getAllPayrollEntries,
  runPayrollEntry,
  getPayrollEntryDetail,
  updatePayrollEntry,
  deletePayrollEntry,
} from "../../../api/payroll/payrollEntryApi";
import type { CreatePayrollEntryPayload } from "../../../api/payroll/payrollEntryApi";

// ── NEW import ────────────────────────────────────────────────────────────────
import {
  getPayrollVerificationDetail,
  type PayrollVerificationData,
} from "../../../api/payroll/payrollEntryApi";
import PayrollVerificationModal from "./PayrollPreview";
// ─────────────────────────────────────────────────────────────────────────────

import { openPayrollModal }       from "../../../store/modalStore";
import { showSuccess, showApiError, showLoading, closeSwal } from "../../../utils/alert";
import type { PayrollRecord, PayrollEntry } from "../../../types/payrolltypes";
import { runPayrollValidation }   from "./utils";
import { PayrollDashboard }       from "./Payrolldashboard ";
import { EmployeeDetailPage }     from "./Employeedetailpage";
import { PayslipModal }           from "./PayslipModal";
import { QuickCreateModal }       from "../../../components/Hr/payrollmodal/QuickCreatePayrollModal";
import { PayrollValidationModal } from "../../../components/Hr/payrollmodal/payrollvalidationmodal";
import { usePermission }          from "../../../hooks/permission/usePermission";
import { HrTableFrame }           from "../components/HrTabLayout";

// ─── Month helper ─────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
] as const;

const monthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return "";
  const monthIndex = parseInt(dateStr.split("-")[1], 10) - 1;
  return MONTH_NAMES[monthIndex] ?? "";
};

// ─── Payload builder ──────────────────────────────────────────────────────────
const buildPayload = (
  formData: PayrollEntry,
  empIds: string[],
): CreatePayrollEntryPayload => ({
  payroll_frequency:    formData.payrollFrequency || "Monthly",
  posting_date:         formData.postingDate,
  start_date:           formData.startDate,
  end_date:             formData.endDate,
  exchange_rate:        formData.exchangeRate ?? 1,
  payroll_payable_account: formData.payrollPayableAccount,
  payment_account:      formData.paymentAccount,
  bank_account:
    typeof formData.bankAccount === "object" && formData.bankAccount !== null
      ? (formData.bankAccount as any).value
      : (formData.bankAccount ?? ""),
  employees: empIds.map((id) => ({ employee: id, is_salary_withheld: 0 })),
  ...(formData.costCenter ? { cost_center: formData.costCenter } : {}),
  ...(formData.project    ? { project:     formData.project    } : {}),
  ...(formData.currency   ? { currency:    formData.currency   } : {}),
  deduct_tax_for_unsubmitted_tax_exemption_proof: formData.deductTaxForProof  ? 1 : 0,
  salary_slip_based_on_timesheet:                 formData.salarySlipTimesheet ? 1 : 0,
  validate_attendance: 0,
  validate_holidays:   0,
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function PayrollManagement() {
  const { can } = usePermission();
  const canCreate = can("Payroll Entry", "create");
  const canWrite  = can("Payroll Entry", "write");

  const [page,           setPage]           = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [showCreateModal,setShowCreateModal]= useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [detailRecord,   setDetailRecord]   = useState<PayrollRecord | null>(null);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [searchTerm,     setSearchTerm]     = useState("");
  type ValidationResult = ReturnType<typeof runPayrollValidation> | null;
  const [validationResult, setValidationResult] = useState<ValidationResult>(null);
  const [isProcessing,   setIsProcessing]   = useState(false);

  // ── NEW: verify modal state ───────────────────────────────────────────────
  const [verifyModalOpen,  setVerifyModalOpen]  = useState(false);
  const [verifyRawData,    setVerifyRawData]    = useState<PayrollVerificationData | null>(null);
  const [verifyLoading,    setVerifyLoading]    = useState(false);
  const [verifyPayrollId,  setVerifyPayrollId]  = useState<string>("");

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadPayrollEntries = async () => {
    try {
      setLoading(true);
      const resp = await getAllPayrollEntries(page, 10);
      setPayrollRecords(resp?.data                 || []);
      setTotalPages(resp?.pagination?.total_pages  || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayrollEntries(); }, [page, searchTerm]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreatePayroll = async (empIds: string[], formData?: PayrollEntry) => {
    if (!empIds.length) return;
    try {
      showLoading("Creating Payroll");
      if (formData) {
        const payload = buildPayload(formData, empIds);
        const created = await createPayrollEntry(payload);
        if (!created) throw new Error("Payroll creation failed");
      }
      await loadPayrollEntries();
      setSelectedEmpIds([]);
      setShowCreateModal(false);
      closeSwal();
      showSuccess(`Payroll created for ${empIds.length} employee${empIds.length > 1 ? "s" : ""}`);
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    }
  };

  const pendingRecords = payrollRecords.filter((r) => r.status === "Pending");

  const handleRunPayroll = async (id: string) => {
    try {
      showLoading("Running Payroll");
      await runPayrollEntry(id);
      closeSwal();
      showSuccess("Payroll executed successfully");
      await loadPayrollEntries();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleDeletePayroll = async (id: string) => {
    try {
      showLoading("Deleting Payroll");
      await deletePayrollEntry(id);
      closeSwal();
      showSuccess("Payroll deleted successfully");
      await loadPayrollEntries();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleConfirmPayroll = () => {
    setIsProcessing(true);
    const ids = pendingRecords.map((r) => r.id);
    setPayrollRecords((p) =>
      p.map((r) => ids.includes(r.id) ? { ...r, status: "Processing" as const } : r),
    );
    setTimeout(() => {
      setPayrollRecords((p) =>
        p.map((r) =>
          ids.includes(r.id)
            ? { ...r, status: "Paid" as const, paymentDate: new Date().toLocaleDateString("en-IN") }
            : r,
        ),
      );
      setIsProcessing(false);
      setShowValidation(false);
      setValidationResult(null);
      showSuccess(`Payroll processed for ${ids.length} employee${ids.length > 1 ? "s" : ""}.`);
    }, 2500);
  };

  // ── NEW: open verify preview modal ────────────────────────────────────────
  /**
   * Called when user clicks "Verify Payroll" from the actions menu.
   * Fetches the full detail via API then opens the preview modal.
   */
  const handleVerify = async (record: PayrollRecord) => {
    const payrollId =
      (record as any).name ||
      (record as any).id;

    console.debug("[PayrollVerification] verify clicked", { record, payrollId });

    if (!payrollId) {
      console.error("[PayrollVerification] Payroll ID missing", record);
      return;
    }
    setVerifyPayrollId(payrollId);
    setVerifyRawData(null);
    setVerifyLoading(true);
    setVerifyModalOpen(true);

    try {
      const rawData = await getPayrollVerificationDetail(payrollId);
      console.debug("[PayrollVerification] rawData received", rawData);
      setVerifyRawData(rawData);
    } catch (error) {
      console.error("[PayrollVerification] failed to load verification detail", error);
      showApiError(error);
      setVerifyModalOpen(false);
    } finally {
      setVerifyLoading(false);
    }
  };

  useEffect(() => {
    console.debug("[PayrollVerification] modal state changed", {
      isOpen: verifyModalOpen,
      loading: verifyLoading,
      payrollId: verifyPayrollId,
      hasRawData: !!verifyRawData,
      employeeCount: verifyRawData?.employees?.length ?? 0,
    });
  }, [verifyModalOpen, verifyLoading, verifyPayrollId, verifyRawData]);

  const availableEmployees = useMemo(() => [], []);

  if (detailRecord)
    return (
      <EmployeeDetailPage
        records={payrollRecords}
        initialRecord={detailRecord}
        onBack={() => setDetailRecord(null)}
        onViewPayslip={(r) => setSelectedRecord(r)}
      />
    );

  return (
    <HrTableFrame>
      <PayrollDashboard
        records={payrollRecords}
        loading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onQuickCreate={() => setShowCreateModal(true)}
        canCreate={canCreate}
        canWrite={canWrite}
        onNewPayroll={() =>
          openPayrollModal(null, false, {
            onSubmit: async ({ empIds, formData }: any) => {
              await handleCreatePayroll(empIds, formData);
            },
          })
        }
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onRunPayroll={handleRunPayroll}
        onViewPayslip={(r) => setSelectedRecord(r)}
        onDeleteRecord={(r) => handleDeletePayroll((r as any).name)}
        onVerify={handleVerify}   
        onEditRecord={async (r) => {
          try {
            showLoading("Loading Payroll");
            const payroll = await getPayrollEntryDetail((r as any).name);
            const mappedPayroll = {
              payrollName:          payroll.name,
              postingDate:          payroll.posting_date,
              payrollMonth:         monthFromDateStr(payroll.start_date),
              startDate:            payroll.start_date,
              endDate:              payroll.end_date,
              currency:             payroll.currency,
              exchangeRate:         payroll.exchange_rate,
              company:              payroll.company,
              payrollPayableAccount: payroll.payroll_payable_account,
              status:               payroll.status,
              salarySlipTimesheet:  payroll.salary_slip_based_on_timesheet === 1,
              deductTaxForProof:    payroll.deduct_tax_for_unsubmitted_tax_exemption_proof === 1,
              payrollFrequency:     payroll.payroll_frequency,
              paymentAccount:       payroll.payment_account || "",
              bankAccount:          payroll.bank_account    || "",
              project:              payroll.project         || "",
              costCenter:           payroll.cost_center     || "",
              selectedEmployees:    payroll.employees?.map((e: any) => e.employee) || [],
            };
            closeSwal();
            openPayrollModal(mappedPayroll, true, {
              onSubmit: async ({ formData }: any) => {
                try {
                  showLoading("Updating Payroll");
                  const payload = buildPayload(formData, formData.selectedEmployees || []);
                  await updatePayrollEntry(payroll.name, payload);
                  closeSwal();
                  await loadPayrollEntries();
                  showSuccess("Payroll updated successfully");
                } catch (error) {
                  closeSwal();
                  showApiError(error);
                  throw error;
                }
              },
            });
          } catch (error) {
            closeSwal();
            showApiError(error);
          }
        }}
        onViewDetails={(r) => setDetailRecord(r)}
      />

      <QuickCreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        employees={availableEmployees}
        selectedEmployees={selectedEmpIds}
        onToggleEmployee={(id) =>
          setSelectedEmpIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id])
        }
        onSelectAll={() => {
          const all = availableEmployees
            .filter((e: { isActive: boolean }) => e.isActive)
            .map((e: { id: string }) => e.id);
          setSelectedEmpIds(selectedEmpIds.length === all.length ? [] : all);
        }}
        onCreate={() => handleCreatePayroll(selectedEmpIds)}
      />

      <PayrollValidationModal
        show={showValidation}
        result={validationResult}
        isRunning={isProcessing}
        onClose={() => { setShowValidation(false); setValidationResult(null); }}
        onProceed={handleConfirmPayroll}
        onRevalidate={() => setValidationResult(runPayrollValidation(pendingRecords))}
      />

      <PayslipModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onDownload={() => showSuccess(`Payslip downloaded for ${selectedRecord?.employeeName}`)}
        onEmail={() =>    showSuccess(`Payslip emailed to ${selectedRecord?.email}`)}
      />

      {/* ── NEW: Verify / Preview modal ── */}
      <PayrollVerificationModal
        modalId={`payroll-verify-${verifyPayrollId}`}
        isOpen={verifyModalOpen}
        onClose={() => { setVerifyModalOpen(false); setVerifyRawData(null); }}
        rawData={verifyRawData}
        loading={verifyLoading}
      />
    </HrTableFrame>
  );
}
