import React, { useEffect, useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { getAllSalesInvoices } from "../../api/salesApi";

interface Props {
  form: any;
  onFormChange: (data: any) => void;
}

interface InvoiceRow {
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  outstanding: number;
  status: string;
}

const InvoiceList: React.FC<Props> = ({ form, onFormChange }) => {
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocated, setAllocated] = useState<Record<string, number>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // READ ONLY — never write back to this
  const paymentAmount = Number(form?.amount || 0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await getAllSalesInvoices(1, 50);
      const mapped = res?.data?.map((inv: any) => ({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        date: new Date(inv.dateOfInvoice).toLocaleDateString(),
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-",
        amount: Number(inv.totalAmount || 0),
        outstanding: Number(inv.OutStandingAmount ?? inv.outstandingAmount ?? 0),
        status: inv.invoiceStatus,
      }));
      setData(mapped.filter((i: any) => i.outstanding > 0));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (invoiceNumber: string, raw: string) => {
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setInputValues((prev) => ({ ...prev, [invoiceNumber]: raw }));
  };

  const handleInputBlur = (invoiceNumber: string, outstandingMax: number) => {
    const raw = inputValues[invoiceNumber] ?? "";
    const value = parseFloat(raw) || 0;

    const totalAllocatedOthers = Object.entries(allocated)
      .filter(([k]) => k !== invoiceNumber)
      .reduce((sum, [, v]) => sum + v, 0);

    const remainingPayment = paymentAmount - totalAllocatedOthers;
    const maxAllowable = Math.min(outstandingMax, Math.max(0, remainingPayment));
    const safeValue = Math.max(0, Math.min(value, maxAllowable));

    setInputValues((prev) => ({
      ...prev,
      [invoiceNumber]: safeValue > 0 ? String(safeValue) : "",
    }));

    const updated = { ...allocated, [invoiceNumber]: safeValue };
    setAllocated(updated);

    const selectedInvoices = data.filter((d) => updated[d.invoiceNumber] > 0);
    const totalAllocated = selectedInvoices.reduce(
      (sum, i) => sum + (updated[i.invoiceNumber] || 0),
      0
    );

    // Never send `amount` key — that overwrites the payment budget
    onFormChange({
      selectedInvoices,
      allocatedAmount: totalAllocated,
      allocations: updated,
    });
  };

  const totalAllocated = Object.values(allocated).reduce((a, b) => a + b, 0);
  const remainingToAllocate = paymentAmount - totalAllocated;

  const columns: Column<InvoiceRow>[] = [
    { key: "invoiceNumber", header: "Invoice No" },
    { key: "dueDate", header: "Due Date" },
    {
      key: "amount",
      header: "Total Due",
      align: "right",
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover">
          ₹ {r.amount.toLocaleString()}
        </code>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover">
          ₹ {(r.amount - r.outstanding).toLocaleString()}
        </code>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover font-bold">
          ₹ {r.outstanding.toLocaleString()}
        </code>
      ),
    },
    {
      key: "allocated",
      header: "Allocated",
      align: "right",
      render: (r) => {
        const isAllocated = (allocated[r.invoiceNumber] ?? 0) > 0;
        const noBalance = remainingToAllocate <= 0 && !isAllocated;
        return (
          <input
            type="text"
            inputMode="decimal"
            value={inputValues[r.invoiceNumber] ?? ""}
            onChange={(e) => handleInputChange(r.invoiceNumber, e.target.value)}
            onBlur={() => handleInputBlur(r.invoiceNumber, r.outstanding)}
            placeholder="0"
            disabled={noBalance}
            className="w-24 px-2 py-1 text-xs border rounded bg-card focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
          />
        );
      },
    },
  ];

  return (
    <Table columns={columns} data={data} loading={loading} showToolbar={false} />
  );
};

export default InvoiceList;