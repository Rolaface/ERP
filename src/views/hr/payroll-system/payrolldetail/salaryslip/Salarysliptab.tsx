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
import { type SlipListItem } from "./Salarysliphelpers ";
import { SalarySlipList, ListSkeleton } from "./Salarysliplist";
import { DetailPanel, DetailSkeleton, EmptyDetail } from "./Salaryslipdetail";

interface Props {
  employee: PayrollEmployeeDetail;
  payrollEntryId: string;
}

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

export const SalarySlipTab: React.FC<Props> = ({
  employee,
  payrollEntryId,
}) => {
  const [listLoading, setListLoading] = useState(false);
  const [slips, setSlips] = useState<SlipListItem[]>([]);
  const [detailCache, setDetailCache] = useState<Record<string, SalarySlip>>({});
  const [selectedSlipName, setSelectedSlipName] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const selectedSlip = selectedSlipName ? detailCache[selectedSlipName] ?? null : null;
  const latestSlipName = slips[0]?.name ?? null;

  useEffect(() => {
    const load = async () => {
      setListLoading(true);
      setSlips([]);
      setDetailCache({});
      setSelectedSlipName(null);
      setMobileView("list");

      try {
        const list = await getSalarySlipsByEmployee(
  payrollEntryId,
  employee.employee
);
        if (!list?.length) return;

        const sorted = [...list].sort(
          (a: SlipListItem, b: SlipListItem) =>
            new Date(b.posting_date).getTime() - new Date(a.posting_date).getTime()
        );

      setSlips(sorted);

setSelectedSlipName((prev) => {
  if (prev && sorted.some((s) => s.name === prev)) {
    return prev;
  }

  return sorted[0].name;
});

        sorted.forEach(async (item: SlipListItem) => {
          try {
            const detail = await getSalarySlipDetail(item.name);
            if (detail) {
              setDetailCache((prev) => ({ ...prev, [item.name]: detail }));
            }
          } catch {}
        });
      } finally {
        setListLoading(false);
      }
    };

    load();
  }, [employee.employee]);

  const handleSelect = useCallback(
    async (name: string) => {
      setSelectedSlipName(name);
     

      if (detailCache[name]) return;

      setDetailLoading(true);
      try {
        const detail = await getSalarySlipDetail(name);
        if (detail) {
          setDetailCache((prev) => ({ ...prev, [name]: detail }));
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [detailCache]
  );

  const handleDownload = useCallback(
    async (name: string, slipData?: SalarySlip) => {
      setPdfLoading(true);
      try {
        const blob = await getSalarySlipPdf(name);
        const slip = slipData ?? detailCache[name];
        downloadSalarySlipPdf(
          blob,
          `salary-slip-${slip?.employee ?? name}-${slip?.start_date ?? "unknown"}.pdf`
        );
      } catch (err) {
        console.error("Download failed", err);
      } finally {
        setPdfLoading(false);
      }
    },
    [detailCache]
  );

  const handleView = useCallback(async () => {
    if (!selectedSlipName) return;
    setPdfLoading(true);
    try {
      const blob = await getSalarySlipPdf(selectedSlipName);
      viewSalarySlipPdf(blob);
    } catch (err) {
      console.error("View failed", err);
    } finally {
      setPdfLoading(false);
    }
  }, [selectedSlipName]);

  const handlePrint = useCallback(async () => {
    if (!selectedSlipName) return;
    setPdfLoading(true);
    try {
      const blob = await getSalarySlipPdf(selectedSlipName);
      const url = URL.createObjectURL(blob);
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
  }, [selectedSlipName]);

  if (listLoading) {
    return (
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)", minHeight: 500 }}
      >
        <div className="w-64 shrink-0 border-r" style={{ borderColor: "var(--border)" }}>
          <ListSkeleton />
        </div>
        <div className="flex-1">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (!slips.length) {
    return <EmptyList employeeName={employee.employee_name} />;
  }

  return (
    <div
      className="flex rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        background: "var(--card)",
        minHeight: 560,
        height: "calc(100vh - 180px)",
        maxHeight: 900,
      }}
    >
      <div
        className="shrink-0 border-r overflow-hidden"
        style={{
          width: 256,
          borderColor: "var(--border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SalarySlipList
          slips={slips}
          detailCache={detailCache}
          selectedSlipName={selectedSlipName}
          latestSlipName={latestSlipName}
          onSelect={handleSelect}
          onDownload={handleDownload}
        />
      </div>

      <div
        className="flex-1 overflow-hidden"
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {detailLoading ? (
          <DetailSkeleton />
        ) : selectedSlip ? (
          <DetailPanel
            slip={selectedSlip}
            onDownload={() => handleDownload(selectedSlipName!, selectedSlip)}
            onView={handleView}
            onPrint={handlePrint}
            pdfLoading={pdfLoading}
            onBack={() => setMobileView("list")}
            isMobile={mobileView === "detail"}
          />
        ) : (
          <EmptyDetail />
        )}
      </div>
    </div>
  );
};