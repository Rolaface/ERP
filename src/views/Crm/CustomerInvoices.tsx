import { useEffect, useMemo, useState } from "react";
import {
  Receipt,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import { getAllSalesInvoices } from "../../api/salesApi";
import { showApiError } from "../../utils/alert";

interface SalesInvoice {
  id: string;
  invoiceDate: string;
  status: string;
  total: number;
  outstandingAmount: number;
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
          "id",
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
      render: (row: SalesInvoice) => (
        <span className="text-xs font-black text-primary">{row.id}</span>
      ),
    },
    {
      key: "invoiceDate",
      header: "Date",
      render: (row: SalesInvoice) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {new Date(row.invoiceDate).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: SalesInvoice) => (
        <span
          className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
            row.status === "Paid"
              ? "bg-success/10 text-success"
              : row.status === "Draft"
              ? "bg-warning/10 text-warning"
              : "bg-muted/10 text-muted"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right" as const,
      render: (row: SalesInvoice) => (
        <span className="text-sm font-black text-primary">
          {row.total?.toLocaleString()}
        </span>
      ),
    },
    {
      key: "outstandingAmount",
      header: "Outstanding",
      align: "right" as const,
      render: (row: SalesInvoice) => (
        <span className="text-sm font-black text-danger">
          {row.outstandingAmount?.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-4 gap-2">
        <SummaryCard icon={<ClipboardList size={14} />} label="Total Invoices" value={summary.total} />
        <SummaryCard icon={<Clock size={14} />} label="Draft" value={summary.draft} />
        <SummaryCard icon={<CheckCircle2 size={14} />} label="Paid" value={summary.paid} />
        <SummaryCard icon={<Receipt size={14} />} label="Total Value" value={`${summary.totalValue.toLocaleString()}`} />
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