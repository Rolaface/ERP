import { useEffect, useMemo, useState } from "react";
import {
  Receipt,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Table from "../../components/ui/Table/Table";
import { getAllSalesInvoices } from "../../api/salesApi";

interface SalesInvoice {
  invoiceNumber: string;
  dateOfInvoice: string;
  invoiceStatus: string;
  totalAmount: number;
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

  /* FETCH DATA */

  useEffect(() => {
    if (!customerName) return;

    const loadInvoices = async () => {
      setLoading(true);

      try {
        const res = await getAllSalesInvoices(
          page,
          pageSize,
          "invoiceNumber",
          "desc",
          "",
          customerName
        );

        setInvoices(res?.data || []);
        setTotalPages(res?.pagination?.total_pages || 1);
        setTotalItems(res?.pagination?.total || 0);
      } catch (err) {
        console.error("Invoice fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [customerName, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [customerName]);

  /* SUMMARY */

  const summary = useMemo(() => {
    const total = invoices.length;

    const draft = invoices.filter(
      (inv) => inv.invoiceStatus === "Draft"
    ).length;

    const paid = invoices.filter(
      (inv) => inv.invoiceStatus === "Paid"
    ).length;

    const totalValue = invoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    return { total, draft, paid, totalValue };
  }, [invoices]);

  /* TABLE COLUMNS */

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice No",
      render: (row: SalesInvoice) => (
        <span className="text-xs font-black text-primary">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      key: "dateOfInvoice",
      header: "Date",
      render: (row: SalesInvoice) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {new Date(row.dateOfInvoice).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      key: "invoiceStatus",
      header: "Status",
      render: (row: SalesInvoice) => (
        <span
          className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
            row.invoiceStatus === "Paid"
              ? "bg-success/10 text-success"
              : row.invoiceStatus === "Draft"
              ? "bg-warning/10 text-warning"
              : "bg-muted/10 text-muted"
          }`}
        >
          {row.invoiceStatus}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      align: "right" as const,
      render: (row: SalesInvoice) => (
        <span className="text-sm font-black text-primary">
          ₹{row.totalAmount?.toLocaleString()}
        </span>
      ),
    },
    {
      key: "outstandingAmount",
      header: "Outstanding",
      align: "right" as const,
      render: (row: SalesInvoice) => (
        <span className="text-sm font-black text-danger">
          ₹{row.outstandingAmount?.toLocaleString()}
        </span>
      ),
    },
  ];

  /* UI */

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* SUMMARY */}

      <div className="grid grid-cols-4 gap-2">
        <SummaryCard
          icon={<ClipboardList size={14} />}
          label="Total Invoices"
          value={summary.total}
        />

        <SummaryCard
          icon={<Clock size={14} />}
          label="Draft"
          value={summary.draft}
        />

        <SummaryCard
          icon={<CheckCircle2 size={14} />}
          label="Paid"
          value={summary.paid}
        />

        <SummaryCard
          icon={<Receipt size={14} />}
          label="Total Value"
          value={`₹${summary.totalValue.toLocaleString()}`}
        />
      </div>

      {/* TABLE */}

      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <Table
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

/* SUMMARY CARD */

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
    <div className="p-2 rounded-lg bg-row-hover text-primary">
      {icon}
    </div>

    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-muted">
        {label}
      </p>

      <p className="text-lg font-black text-primary">
        {value}
      </p>
    </div>
  </div>
);

export default CustomerInvoices;