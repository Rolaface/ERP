import { useMemo, useState, useEffect } from "react";
import { FileText, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import Table from "../../components/ui/Table/Table";
import { getPurchaseOrdersBySupplier } from "../../api/procurement/PurchaseOrderApi";

/*  TYPES  */

export interface PurchaseOrder {
  poId: string;
  supplierName: string;
  poDate: string;
  deliveryDate?: string;
  status: string;
  grandTotal: number;
}

interface Props {
  supplierName: string;
}

/*  COMPONENT  */

const SupplierPurchaseOrders = ({ supplierName }: Props) => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!supplierName) return;

    const loadPOs = async () => {
      setLoading(true);
      try {
        const resp = await getPurchaseOrdersBySupplier(
          supplierName,
          page,
          pageSize,
        );

        setPurchaseOrders(resp.data);
        setTotalPages(resp.pagination.total_pages || 1);
        setTotalItems(resp.pagination.total || 0);
      } catch (e) {
        console.error("PO fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    loadPOs();
  }, [supplierName, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [supplierName]);

  /*  SUMMARY  */

  const summary = useMemo(() => {
    const total = purchaseOrders.length;
    const draft = purchaseOrders.filter((p) => p.status === "Draft").length;
    const submitted = purchaseOrders.filter(
      (p) => p.status === "Submitted",
    ).length;
    const totalValue = purchaseOrders.reduce((s, p) => s + p.grandTotal, 0);

    return { total, draft, submitted, totalValue };
  }, [purchaseOrders]);

  /*  TABLE COLUMNS  */

  const columns = [
    {
      key: "poId",
      header: "PO No",
      render: (row: PurchaseOrder) => (
        <span className="text-xs font-black text-primary">{row.poId}</span>
      ),
    },
    {
      key: "poDate",
      header: "PO Date",
      render: (row: PurchaseOrder) => (
        <span className="text-[10px] font-black text-muted uppercase">
          {new Date(row.poDate).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      key: "deliveryDate",
      header: "Delivery",
      render: (row: PurchaseOrder) =>
        row.deliveryDate ? (
          <span className="text-xs text-main">
            {new Date(row.deliveryDate).toLocaleDateString("en-GB")}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: PurchaseOrder) => (
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
      key: "grandTotal",
      header: "Amount",
      align: "right" as const,
      render: (row: PurchaseOrder) => (
        <span className="text-sm font-black text-primary">
          ₹{row.grandTotal.toLocaleString()}
        </span>
      ),
    },
  ];

  /*  UI  */

  return (
    <div className="max-w-[1400px] mx-auto ">
      {/* SUMMARY */}
      <div className="grid grid-cols-4 gap-2">
        <SummaryCard
          icon={<ClipboardList size={14} />}
          label="Total POs"
          value={summary.total}
        />
        <SummaryCard
          icon={<Clock size={14} />}
          label="Draft"
          value={summary.draft}
        />
        <SummaryCard
          icon={<CheckCircle2 size={14} />}
          label="Submitted"
          value={summary.submitted}
        />
        <SummaryCard
          icon={<FileText size={14} />}
          label="Total Value"
          value={`₹${summary.totalValue.toLocaleString()}`}
        />
      </div>

      {/* TABLE */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <Table
          columns={columns}
          data={purchaseOrders}
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
          emptyMessage="No purchase orders found"
        />
      </div>
    </div>
  );
};

/*  SUB COMPONENT  */

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

export default SupplierPurchaseOrders;
