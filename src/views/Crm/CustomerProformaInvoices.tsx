import { useEffect, useMemo, useState } from "react";
import { FileText, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import { showApiError } from "../../utils/alert";
import { getAllProformaInvoices } from "../../api/proformaInvoiceApi";

interface ProformaInvoice {
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

const CustomerProformaInvoices = ({ customerId }: Props) => {
  const [invoices, setInvoices] = useState<ProformaInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!customerId) return;

    const loadInvoices = async () => {
      setLoading(true);
      try {
        const res = await getAllProformaInvoices(
          page,
          pageSize,
          "",
          "desc",
          "",
          { party_name: customerId },
        );

        const payload = res || {};
        setInvoices(payload?.data || payload?.quotations || []);
        setTotalPages(
          payload?.pagination?.total_pages ||
            payload?.pagination?.totalPages ||
            1,
        );
        setTotalItems(payload?.pagination?.total || 0);
      } catch (err) {
        showApiError(err);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [customerId, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [customerId]);

  const summary = useMemo(() => {
    const total = invoices.length;
    const draft = invoices.filter(
      (q: any) => q.status === "Draft" || q.invoiceStatus === "Draft",
    ).length;
    const approved = invoices.filter(
      (q: any) => q.status === "Open" || q.invoiceStatus === "Open",
    ).length;
    const totalValue = invoices.reduce(
      (sum, q) => sum + (q.grandTotal || (q as any).total || 0),
      0,
    );
    return { total, draft, approved, totalValue };
  }, [invoices]);

  const columns = [
    {
      key: "id",
      header: "Proforma No",
      render: (row: ProformaInvoice) => (
        <span className="text-xs font-black text-primary">{row.id}</span>
      ),
    },
    {
      key: "transactionDate",
      header: "Date",
      render: (row: ProformaInvoice) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {new Date(
            row.transactionDate || (row as any).postingDate,
          ).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      key: "validTill",
      header: "Due Till",
      render: (row: ProformaInvoice) =>
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
      render: (row: ProformaInvoice) => {
        const status = row.invoiceStatus || (row as any).status;
        return (
          <span
            className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
              status === "Open"
                ? "bg-success/10 text-success"
                : status === "Draft"
                  ? "bg-warning/10 text-warning"
                  : "bg-muted/10 text-muted"
            }`}
          >
            {status === "Open" ? "Approved" : status}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (row: ProformaInvoice) => (
        <span className="text-sm font-black text-primary">
          {row.currency}{" "}
          {(row.grandTotal || (row as any).total || 0).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-4 gap-2">
        <SummaryCard
          icon={<ClipboardList size={14} />}
          label="Total Proformas"
          value={summary.total}
        />
        <SummaryCard
          icon={<Clock size={14} />}
          label="Draft"
          value={summary.draft}
        />
        <SummaryCard
          icon={<CheckCircle2 size={14} />}
          label="Approved"
          value={summary.approved}
        />
        <SummaryCard
          icon={<FileText size={14} />}
          label="Total Value"
          value={`${summary.totalValue.toLocaleString()}`}
        />
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
          emptyMessage="No proforma invoices found"
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
      <p className="text-[9px] font-black uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="text-lg font-black text-primary">{value}</p>
    </div>
  </div>
);

export default CustomerProformaInvoices;
