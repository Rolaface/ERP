import React, { useEffect, useState, useCallback } from "react";
import { FileText } from "lucide-react";
import {
  getSalarySlipsByEmployee,
  getSalarySlipDetail,
  type SalarySlip,
  type PayrollEmployeeDetail,
  getSalarySlipPdf,
  viewSalarySlipPdf,
  downloadSalarySlipPdf,
} from "../../../../../api/payroll/payrollEntryApi";

import { DetailPanel, DetailSkeleton } from "./Salaryslipdetail";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  employee: PayrollEmployeeDetail;
  payrollEntryId: string;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyList: React.FC<{ employeeName: string }> = ({ employeeName }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <FileText className="w-6 h-6" style={{ color: "var(--muted)", opacity: 0.4 }} />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        No salary slips
      </p>
      <p className="text-xs mt-1 leading-relaxed max-w-[200px]" style={{ color: "var(--muted)" }}>
        No slips generated for{" "}
        <span className="font-medium" style={{ color: "var(--text)" }}>
          {employeeName}
        </span>{" "}
        yet.
      </p>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const SalarySlipTab: React.FC<Props> = ({ employee, payrollEntryId }) => {
  const [loading,     setLoading]     = useState(false);
  const [slip,        setSlip]        = useState<SalarySlip | null>(null);
  const [pdfLoading,  setPdfLoading]  = useState(false);

  // ── Fetch latest slip detail on mount ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSlip(null);
      try {
        const list = await getSalarySlipsByEmployee(payrollEntryId, employee.employee);
        if (!list?.length) return;

        // Sort by posting_date desc, pick latest
        const sorted = [...list].sort(
          (a, b) => new Date(b.posting_date).getTime() - new Date(a.posting_date).getTime(),
        );

        const detail = await getSalarySlipDetail(sorted[0].name);
        if (detail) setSlip(detail);
      } catch (err) {
        console.error("Failed to load salary slip", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [employee.employee, payrollEntryId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!slip) return;
    setPdfLoading(true);
    try {
      const blob = await getSalarySlipPdf(slip.name);
      downloadSalarySlipPdf(
        blob,
        `salary-slip-${slip.employee}-${slip.start_date}.pdf`,
      );
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setPdfLoading(false);
    }
  }, [slip]);

  const handleView = useCallback(async () => {
    if (!slip) return;
    setPdfLoading(true);
    try {
      const blob = await getSalarySlipPdf(slip.name);
      viewSalarySlipPdf(blob);
    } catch (err) {
      console.error("View failed", err);
    } finally {
      setPdfLoading(false);
    }
  }, [slip]);

  const handlePrint = useCallback(async () => {
    if (!slip) return;
    setPdfLoading(true);
    try {
      const blob = await getSalarySlipPdf(slip.name);
      const url    = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (err) {
      console.error("Print failed", err);
    } finally {
      setPdfLoading(false);
    }
  }, [slip]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <DetailSkeleton />;

  if (!slip) return <EmptyList employeeName={employee.employee_name} />;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        background: "var(--card)",
        minHeight: 560,
        height: "calc(100vh - 180px)",
        maxHeight: 900,
      }}
    >
      <DetailPanel
        slip={slip}
        onDownload={handleDownload}
        onView={handleView}
        onPrint={handlePrint}
        pdfLoading={pdfLoading}
      />
    </div>
  );
};