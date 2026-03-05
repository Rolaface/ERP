import React, { useEffect, useState } from "react";
import Modal from "../../../components/ui/modal/modal";
import { FileText, Package, MapPin } from "lucide-react";
import { getPurchaseInvoiceById } from "../../../api/procurement/PurchaseInvoiceApi";

type Props = {
  open: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onViewPdf?: (id: string) => void;
};

const Field = ({ label, value }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase text-muted">{label}</span>
    <div className="px-3 py-2 rounded border border-theme bg-card text-sm">
      {value || "—"}
    </div>
  </div>
);

const PurchaseInvoiceDetailsModal: React.FC<Props> = ({
  open,
  invoiceId,
  onClose,
  onViewPdf,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !invoiceId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await getPurchaseInvoiceById(invoiceId);

        if (res?.status === "success") {
          setData(res.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, invoiceId]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Purchase Invoice ${data?.pId || ""}`}
      icon={FileText}
      maxWidth="6xl"
      height="80vh"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={() => data?.pId && onViewPdf?.(data.pId)}
            className="bg-primary px-4 py-2 rounded text-white text-sm"
          >
            View PDF
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-sm"
          >
            Close
          </button>
        </div>
      }
    >
      {loading && <p>Loading...</p>}

      {!loading && data && (
        <div className="flex flex-col gap-6">

          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Invoice ID" value={data.pId} />
            <Field label="Supplier" value={data.supplierName} />
            <Field label="Supplier Invoice No" value={data.spplrInvcNo} />
            <Field label="Invoice Date" value={data.pDate} />
            <Field label="Required By" value={data.requiredBy} />
            <Field label="Currency" value={data.currency} />
            <Field label="Status" value={data.status} />
            <Field label="Payment Method" value={data.paymentMethod} />
            <Field label="Registration Type" value={data.registrationType} />
            <Field label="LPO Number" value={data.lpoNumber} />
          </div>

          {/* Financial */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Subtotal" value={`INR ${data.summary?.subTotal}`} />
            <Field label="Tax Total" value={`INR ${data.summary?.taxTotal}`} />
            <Field label="Grand Total" value={`INR ${data.summary?.grandTotal}`} />
          </div>

          {/* Items */}
          <div>
            <p className="text-xs uppercase text-muted mb-2 flex items-center gap-2">
              <Package size={14} /> Items
            </p>

            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-row-hover">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">UOM</th>
                    <th className="p-2">Rate</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">VAT</th>
                  </tr>
                </thead>

                <tbody>
                  {data.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{item.item_name}</td>
                      <td className="p-2 text-center">{item.qty}</td>
                      <td className="p-2 text-center">{item.uom}</td>
                      <td className="p-2 text-center">{item.rate}</td>
                      <td className="p-2 text-center">{item.amount}</td>
                      <td className="p-2 text-center">{item.VatCd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Addresses */}
          <div>
            <p className="text-xs uppercase text-muted mb-2 flex items-center gap-2">
              <MapPin size={14} /> Addresses
            </p>

            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Supplier Address"
                value={data.addresses?.supplierAddress?.addressLine1}
              />

              <Field
                label="Dispatch Address"
                value={data.addresses?.dispatchAddress?.addressLine1}
              />

              <Field
                label="Shipping Address"
                value={data.addresses?.shippingAddress?.addressLine1}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PurchaseInvoiceDetailsModal;