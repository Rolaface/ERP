import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import { showApiError } from "../../utils/alert";
import { getAllQuotation } from "../../api/proformaInvoiceApi";
 import { openQuotationModal } from "../../store/modalStore";
 import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Quotation {
  id: string;
  customerName: string;
  transactionDate: string;
  validTill: string;
  grandTotal: number;
  invoiceStatus: string;
  currency: string;
}

interface Props {
  customerId: string;
  customerName?: string;
  
}

const CustomerQuotations = ({ customerId, customerName }: Props) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!customerId) return;

    const loadQuotations = async () => {
      setLoading(true);
      try {
        const res = await getAllQuotation(
          page, 
          pageSize, 
          "", 
          "desc", 
          "", 
          { party_name: customerId }
        );        
        const payload = res|| {};
        setQuotations(payload?.data || payload?.quotations || []);
        setTotalPages(payload?.pagination?.total_pages || payload?.pagination?.totalPages || 1);
        setTotalItems(payload?.pagination?.total || 0);
      } catch (err) {
        showApiError(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, [customerId, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [customerId]);

   const handleExportExcel = () => {
 if (!quotations.length) return;

  const worksheet = XLSX.utils.json_to_sheet(
   quotations.map((q) => ({
      "Quotation No": q.id,
     Date: new Date(q.transactionDate || (q as any).postingDate).toLocaleDateString("en-GB"),
      "Valid Till": q.validTill ? new Date(q.validTill).toLocaleDateString("en-GB") : "",
      Status: q.invoiceStatus || (q as any).status || "",
      Currency: q.currency,
      Amount: q.grandTotal || (q as any).total || 0,
    })),
  );

   const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");
 saveAs(
    new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
   }),
   `${customerName || "Customer"}_Quotations.xlsx`,
 );
};


  const summary = useMemo(() => {
    const total = quotations.length;
    const draft = quotations.filter((q: any) => q.status === "Draft" || q.invoiceStatus === "Draft").length;
    const open = quotations.filter((q: any) => q.status === "Open" || q.invoiceStatus === "Open").length;
    const lost = quotations.filter((q: any) => q.status === "Lost" || q.invoiceStatus === "Lost").length;
    const totalValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
    return { total, draft, open, lost, totalValue };
  }, [quotations]);

  const columns = [
    {
      key: "id",
      header: "Quotation No",
      render: (row: Quotation) => (
        <span className="text-xs font-black text-primary">{row.id}</span>
      ),
    },
    {
      key: "transactionDate",
      header: "Date",
      render: (row: Quotation) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {new Date(row.transactionDate || (row as any).postingDate).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      key: "validTill",
      header: "Valid Till",
      render: (row: Quotation) =>
        row.validTill ? (
          <span className="text-xs text-main">
            {new Date(row.validTill).toLocaleDateString("en-GB")}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "invoiceStatus",
      header: "Status",
      render: (row: Quotation) => {
        const status = row.invoiceStatus || (row as any).status;
        return (
          <span
            className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
              status === "open"
                ? "bg-success/10 text-success"
                : status === "Draft"
                ? "bg-warning/10 text-warning"
                : "bg-muted/10 text-muted"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (row: Quotation) => (
        <span className="text-sm font-black text-primary">
          {row.currency} {(row.grandTotal || (row as any).total || 0).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-5 gap-2">
        <SummaryCard icon={<ClipboardList size={14} />} label="Total Quotations" value={summary.total} />
        <SummaryCard icon={<Clock size={14} />} label="Draft" value={summary.draft} />
        <SummaryCard icon={<CheckCircle2 size={14} />} label="Open" value={summary.open} />
        <SummaryCard icon={<XCircle size={14} />} label="Lost" value={summary.lost} />
        <SummaryCard icon={<FileText size={14} />} label="Total Value" value={`${summary.totalValue.toLocaleString()}`} />
      </div>

      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <ModalTable
          columns={columns}
          data={quotations}
          loading={loading}
          showToolbar={true}
           enableExport={true}
             onExport={handleExportExcel}
          enableAdd={true}
          addLabel="Add Quotation"
           onAdd={() => openQuotationModal({ customerName, customerId })}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          pageSizeOptions={[5, 10, 25]}
          emptyMessage="No quotations found"
        />
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="bg-card border border-theme rounded-xl p-3 flex items-center gap-3">
    <div className="p-2 rounded-lg bg-row-hover text-primary">{icon}</div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</p>
      <p className="text-lg font-black text-primary">{value}</p>
    </div>
  </div>
);

export default CustomerQuotations;