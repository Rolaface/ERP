import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Table from "../../components/ui/Table/Table";
import { getAllQuotations } from "../../api/quotationApi";
import { showApiError } from "../../utils/alert";


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
}

const CustomerQuotations = ({ customerId }: Props) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /* FETCH DATA */

  useEffect(() => {
    if (!customerId) return;

    const loadQuotations = async () => {
      setLoading(true);

      try {
        const res = await getAllQuotations(page, pageSize, {
          customer: customerId,
        });

        const payload = res?.data || {};

        setQuotations(payload?.quotations || []);
        setTotalPages(payload?.pagination?.totalPages || 1);
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

  /* SUMMARY */

  const summary = useMemo(() => {
    const total = quotations.length;

    const draft = quotations.filter((q: any) => q.invoiceStatus === "Draft").length;

    const sent = quotations.filter((q: any) => q.invoiceStatus === "Sent").length;

    const totalValue = quotations.reduce(
      (sum, q) => sum + (q.grandTotal || 0),
      0
    );

    return { total, draft, sent, totalValue };
  }, [quotations]);

  /* TABLE COLUMNS */

  const columns = [
    {
      key: "id",
      header: "Quotation No",
      render: (row: Quotation) => (
        <span className="text-xs font-black text-primary">
          {row.id}
        </span>
      ),
    },
    {
      key: "transactionDate",
      header: "Date",
      render: (row: Quotation) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {new Date(row.transactionDate).toLocaleDateString("en-GB")}
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
  render: (row: Quotation) => (
    <span
      className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
        row.invoiceStatus === "Sent"
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
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (row: Quotation) => (
        <span className="text-sm font-black text-primary">
          {row.currency} {row.grandTotal.toLocaleString()}
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
          label="Total Quotations"
          value={summary.total}
        />

        <SummaryCard
          icon={<Clock size={14} />}
          label="Draft"
          value={summary.draft}
        />

        <SummaryCard
          icon={<CheckCircle2 size={14} />}
          label="Sent"
          value={summary.sent}
        />

        <SummaryCard
          icon={<FileText size={14} />}
          label="Total Value"
          value={`${summary.totalValue.toLocaleString()}`}
        />
      </div>

      {/* TABLE */}

      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <Table
          columns={columns}
          data={quotations}
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
          emptyMessage="No quotations found"
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

export default CustomerQuotations;