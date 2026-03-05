import React, { useEffect, useState } from "react";
import Modal from "../../../components/ui/modal/modal";
import { Package, MapPin, CreditCard, FileText } from "lucide-react";
import { getPurchaseOrderById } from "../../../api/procurement/PurchaseOrderApi";

type Props = {
  open: boolean;
  poId: string | null;
  onClose: () => void;
  onViewPdf?: (poId: string) => void;
};

const Field = ({ label, value }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase text-muted">{label}</span>
    <div className="px-3 py-2 rounded border border-theme bg-card text-sm">
      {value || "—"}
    </div>
  </div>
);

const PurchaseOrderDetailsModal: React.FC<Props> = ({
  open,
  poId,
  onClose,
  onViewPdf,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !poId) return;

    const fetchPO = async () => {
      try {
        setLoading(true);
        const res = await getPurchaseOrderById(poId);

        if (res?.status === "success") {
          setData(res.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPO();
  }, [open, poId]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Purchase Order ${data?.poId || ""}`}
      icon={Package}
      maxWidth="6xl"
      height="80vh"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={() => data?.poId && onViewPdf?.(data.poId)}
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
            <Field label="PO Number" value={data.poId} />
            <Field label="Supplier" value={data.supplierName} />
            <Field label="Status" value={data.status} />
            <Field label="PO Date" value={data.poDate} />
            <Field label="Required By" value={data.requiredBy} />
            <Field label="Currency" value={data.currency} />
          </div>

          {/* Financial */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Subtotal" value={`INR ${data.summary?.subTotal}`} />
            <Field label="Tax Total" value={`INR ${data.summary?.taxTotal}`} />
            <Field label="Grand Total" value={`INR ${data.summary?.grandTotal}`} />
          </div>

          {/* Items */}
          <div>
            <p className="text-xs uppercase text-muted mb-2">Items</p>

            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-row-hover">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Rate</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">UOM</th>
                  </tr>
                </thead>

                <tbody>
                  {data.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{item.item_name}</td>
                      <td className="p-2 text-center">{item.qty}</td>
                      <td className="p-2 text-center">{item.rate}</td>
                      <td className="p-2 text-center">{item.amount}</td>
                      <td className="p-2 text-center">{item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Addresses */}
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

          {/* Payment Terms */}
          <div>
            <p className="text-xs uppercase text-muted mb-2">Payment Terms</p>

            {data.terms?.terms?.buying?.payment?.phases?.map(
              (phase: any, i: number) => (
                <div
                  key={i}
                  className="border rounded p-3 mb-2 bg-card"
                >
                  <p className="font-semibold">{phase.name}</p>
                  <p className="text-xs text-muted">
                    {phase.percentage}% — {phase.condition}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PurchaseOrderDetailsModal;