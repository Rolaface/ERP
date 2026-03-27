import { useEffect,  useState } from "react";
import {
  CreditCard,
} from "lucide-react";
import Table from "../../components/ui/Table/Table";
import { getAllPayments } from "../../api/CustomerPayment";

interface Payment {
  id: string;
  paymentDate: string;
  modeOfPayment: string;
  amount: number;
  status: string;
}

interface Props { 
  customerName: string;
}

const CustomerdetailviewPayment = ({ customerName }: Props) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /* FETCH */
  useEffect(() => {
    if (!customerName) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getAllPayments("Customer", page, pageSize, undefined, customerName);

        const all = res?.data?.payments ?? [];

        const mapped: Payment[] = all.map((p: any) => ({
          id: p.paymentId ?? "",
          paymentDate: p.paymentDate ?? "",
          modeOfPayment: p.paymentMode ?? "",
          amount: Number(p.amount ?? 0),
          status: p.status ?? "—",
        }));

        setPayments(mapped);
        setTotalPages(res?.data?.pagination?.totalPages ?? 1);
        setTotalItems(res?.data?.pagination?.total ?? mapped.length);
      } catch (err) {
        console.error("Payment fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [customerName, page, pageSize]);

  /* Reset page on customer change */
  useEffect(() => {
    setPage(1);
  }, [customerName]);



  /* COLUMNS */
  const columns = [
    {
      key: "id",
      header: "Payment No",
      render: (row: Payment) => (
        <span className="text-xs font-black text-primary">{row.id}</span>
      ),
    },
    {
      key: "paymentDate",
      header: "Date",
      render: (row: Payment) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {row.paymentDate
            ? new Date(row.paymentDate).toLocaleDateString("en-GB")
            : "—"}
        </span>
      ),
    },
    {
      key: "modeOfPayment",
      header: "Mode of Payment",
      render: (row: Payment) => (
        <span className="text-xs text-main capitalize">
          {row.modeOfPayment || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: Payment) => (
        <span
          className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
            row.status === "Submitted"
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
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (row: Payment) => (
        <span className="text-sm font-black text-primary">
           {row.amount.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
     

      {/* TABLE */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <Table
          columns={columns}
          data={payments}
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
          emptyMessage="No payments found"
        />
      </div>
    </div>
  );
};


export default CustomerdetailviewPayment;