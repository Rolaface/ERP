import { useEffect, useMemo, useState } from "react";
import {
  Receipt,
  ClipboardList,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import { getAllSalesInvoices } from "../../api/salesApi";
import { showApiError } from "../../utils/alert";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface SalesInvoice {
  id: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: string;
  total: number;
  outstandingAmount: number;
  baseOutstandingAmount: number;
}

interface Props {
  customerName: string;
}

const CustomerInvoices = ({ customerName }: Props) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!customerName) return;

    const loadInvoices = async () => {
      setLoading(true);
      try {
        const res = await getAllSalesInvoices(
          page,
          pageSize,
          "name",
          "desc",
          "",
          customerName,
        );
        setInvoices(res?.data || []);
        setTotalPages(res?.pagination?.total_pages || 1);
        setTotalItems(res?.pagination?.total || 0);
      } catch (err) {
        showApiError(err);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [customerName, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [customerName]);
  const handleExportExcel = () => {
    if (!invoices.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      invoices.map((inv) => ({
        "Invoice No": inv.id,
        "Invoice Date": new Date(inv.invoiceDate).toLocaleDateString("en-GB"),
        "Due Date": inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-GB") : "",
        Currency: inv.currency,
        "Invoice Amount": inv.total,
        Outstanding: inv.baseOutstandingAmount,
        Status: inv.status,
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    saveAs(
      new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${customerName || "Customer"}_Invoices.xlsx`,
    );
  };

  const summary = useMemo(() => {
    const total = invoices.length;
    const draft = invoices.filter((inv) => inv.status === "Draft").length;
    const paid = invoices.filter((inv) => inv.status === "Paid").length;
    const totalValue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    return { total, draft, paid, totalValue };
  }, [invoices]);

  const columns = [
    {
      key: "id",
      header: "Invoice No",
      width: "120px",
      render: (row: SalesInvoice) => (
        <span className="text-xs font-black text-primary">{row.id}</span>
      ),
    },
    {
      key: "invoiceDate",
      header: "Invoice Date",
      width: "110px",
      render: (row: SalesInvoice) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {new Date(row.invoiceDate).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
       width: "110px",
      render: (row: SalesInvoice) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-GB") : "-"}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      width: "90px",
      align: "center" as const,
      render: (row: SalesInvoice) => (
        <span className="text-xs font-black text-muted uppercase">
          {row.currency || "-"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Invoice Amount",
      width: "130px",
      align: "center" as const,
      render: (row: SalesInvoice) => (
        <span className="text-sm font-black text-primary">
          {row.total?.toLocaleString()}
        </span>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      width: "100px",
      align: "center" as const,
      render: () => (
        <span className="text-sm font-black text-muted">-</span>
      ),
    },
    {
      key: "outstandingAmount",
      header: "Outstanding",
       width: "130px",
      align: "center" as const,
      render: (row: SalesInvoice) => (
        <span className="text-sm font-black text-danger">
          {row.baseOutstandingAmount?.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      align: "center" as const,
      render: (row: SalesInvoice) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
            row.status === "Paid"
              ? "bg-success/10 text-success"
              : row.status === "Overdue"
              ? "bg-danger/10 text-danger"
              : row.status === "Draft"
              ? "bg-warning/10 text-warning"
              : "bg-muted/10 text-muted"
          }`}
        >
          {row.status || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-5 gap-2">
        <SummaryCard icon={<ClipboardList size={14} />} label="Total Invoices" value={summary.total} />
        <SummaryCard icon={<Clock size={14} />} label="Draft" value={summary.draft} />
        <SummaryCard icon={<CheckCircle2 size={14} />} label="Paid" value={summary.paid} />
        <SummaryCard icon={<Receipt size={14} />} label="Total Value" value={`${summary.totalValue.toLocaleString()}`} />
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 rounded-xl border border-theme bg-card px-3 py-2 text-xs font-black uppercase text-main transition-colors hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <ModalTable
          columns={columns}
          data={invoices}
          loading={loading}
          showToolbar={false}
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
          emptyMessage="No invoices found"
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

export default CustomerInvoices;