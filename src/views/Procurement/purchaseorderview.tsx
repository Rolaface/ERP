import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FileText,
  Download,
  Printer,
  Mail,
  MoreVertical,
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Share2,
  Eye,
  Truck,
} from "lucide-react";

// Backend API Response Structure
interface PurchaseOrderData {
  poId: string;
  poDate: string;
  requiredBy: string;
  status:
    | "Draft"
    | "Submitted"
    | "Approved"
    | "Partially Received"
    | "Completed"
    | "Cancelled";
  supplierName: string;
  currency: string;
  grandTotal: number;

  addresses: {
    supplierAddress: {
      addressTitle: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      phone?: string;
      email?: string;
    };
    dispatchAddress?: {
      addressTitle: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    shippingAddress: {
      addressTitle: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };

  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
  }>;

  taxes?: Array<{
    type: string;
    accountHead: string;
    taxRate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;

  terms?: {
    terms: {
      selling: {
        general?: string;
        delivery?: string;
        cancellation?: string;
        warranty?: string;
        liability?: string;
        payment?: {
          notes?: string;
          phases?: Array<{
            name: string;
            condition: string;
            percentage: string;
          }>;
        };
      };
    };
  };

  costCenter?: string;
  project?: string;
  taxCategory?: string;
  incoterm?: string;
  placeOfSupply?: string;

  metadata?: {
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    remarks?: string;
  };
}

interface PurchaseOrderViewProps {
  poData: PurchaseOrderData;
  onClose?: () => void;
  onEdit?: () => void;
}

const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({
  poData,
  onClose,
  onEdit,
}) => {
  const po = poData;
  const [showActions, setShowActions] = useState(false);
  if (!po) return null;

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "ZMW":
        return "ZMW";
      case "USD":
        return "$";
      case "INR":
        return "₹";
      default:
        return currency;
    }
  };

  const getStatusConfig = (status: PurchaseOrderData["status"]) => {
    switch (status) {
      case "Approved":
        return { className: "text-success bg-success", icon: CheckCircle2 };
      case "Submitted":
        return { className: "text-info bg-info", icon: Eye };
      case "Completed":
        return { className: "text-success bg-success", icon: CheckCircle2 };
      case "Partially Received":
        return { className: "text-warning bg-warning", icon: Clock };
      case "Draft":
        return { className: "text-muted bg-card", icon: FileText };
      case "Cancelled":
        return { className: "text-danger bg-danger", icon: X };
      default:
        return { className: "text-muted bg-card", icon: FileText };
    }
  };

  const formatCurrency = (amount: number) => {
    return `${getCurrencySymbol(po.currency)} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    console.warn("Download PDF");
    toast.success("PDF download feature coming soon!");
  };

  const handleSendEmail = () => {
    console.warn("Send Email");
    toast.success("Email feature coming soon!");
  };

  const statusConfig = getStatusConfig(po.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative bg-card shadow-2xl my-8"
          style={{
            width: "210mm",
            minHeight: "297mm",
            borderRadius: "8px",
            borderColor: "var(--border)",
            borderWidth: "1px",
          }}
        >
          {/* Action Bar - Fixed at top, not part of A4 print */}
          <div
            className="bg-card border-theme px-6 py-3 flex items-center justify-between print:hidden"
            style={{
              borderBottomWidth: "1px",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-app rounded-lg transition-colors"
                title="Close"
              >
                <ArrowLeft className="w-5 h-5 text-muted" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-primary">{po.poId}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 ${statusConfig.className}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {po.status}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-app rounded-lg transition-colors"
                  title="More actions"
                >
                  <MoreVertical className="w-5 h-5 text-muted" />
                </button>

                <AnimatePresence>
                  {showActions && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowActions(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-card border-theme rounded-lg shadow-xl overflow-hidden z-20"
                        style={{ borderWidth: "1px" }}
                      >
                        {[
                          {
                            icon: Download,
                            label: "Download PDF",
                            action: handleDownloadPDF,
                          },
                          {
                            icon: Printer,
                            label: "Print",
                            action: handlePrint,
                          },
                          {
                            icon: Mail,
                            label: "Send Email",
                            action: handleSendEmail,
                          },
                          {
                            icon: Share2,
                            label: "Share",
                            action: () =>
                              toast.success("Share feature coming soon!"),
                          },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              item.action();
                              setShowActions(false);
                            }}
                            className="w-full px-4 py-2.5 text-left row-hover transition-colors flex items-center gap-3 text-sm"
                          >
                            <item.icon className="w-4 h-4 text-muted" />
                            <span className="text-main">{item.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* A4 Document Content */}
          <div className="p-8" style={{ fontSize: "11px" }}>
            {/* Document Header */}
            <div
              className="border-theme pb-4 mb-4"
              style={{ borderBottomWidth: "2px" }}
            >
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-muted mb-0.5">PO Date</p>
                  <p className="text-main font-semibold">
                    {formatDate(po.poDate)}
                  </p>
                </div>
                <div>
                  <p className="text-muted mb-0.5">Required By</p>
                  <p className="text-main font-semibold">
                    {formatDate(po.requiredBy)}
                  </p>
                </div>
                <div>
                  <p className="text-muted mb-0.5">Currency</p>
                  <p className="text-main font-semibold">{po.currency}</p>
                </div>
                <div>
                  <p className="text-muted mb-0.5">Total Amount</p>
                  <p
                    className="text-primary font-bold"
                    style={{ fontSize: "13px" }}
                  >
                    {formatCurrency(po.grandTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Parties Section */}
            <div
              className={`grid gap-4 mb-4 ${po.addresses?.dispatchAddress ? "grid-cols-3" : "grid-cols-2"}`}
            >
              {/* Supplier */}
              {po.addresses?.supplierAddress && (
                <div
                  className="border-theme rounded p-3"
                  style={{ borderWidth: "1px" }}
                >
                  <div
                    className="flex items-center gap-2 mb-2 pb-2 border-theme"
                    style={{ borderBottomWidth: "1px" }}
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <h3 className="font-bold text-main text-xs">SUPPLIER</h3>
                  </div>
                  <div className="space-y-1">
                    <p
                      className="font-bold text-main"
                      style={{ fontSize: "12px" }}
                    >
                      {po.supplierName}
                    </p>
                    {po.addresses.supplierAddress.addressLine1 && (
                      <p className="text-muted leading-tight">
                        {po.addresses.supplierAddress.addressLine1}
                      </p>
                    )}
                    {po.addresses.supplierAddress.addressLine2 && (
                      <p className="text-muted leading-tight">
                        {po.addresses.supplierAddress.addressLine2}
                      </p>
                    )}
                    {po.addresses.supplierAddress.city &&
                      po.addresses.supplierAddress.state && (
                        <p className="text-muted leading-tight">
                          {po.addresses.supplierAddress.city},{" "}
                          {po.addresses.supplierAddress.state}{" "}
                          {po.addresses.supplierAddress.postalCode}
                        </p>
                      )}
                    {po.addresses.supplierAddress.country && (
                      <p className="text-muted leading-tight">
                        {po.addresses.supplierAddress.country}
                      </p>
                    )}
                    {po.addresses.supplierAddress.phone && (
                      <p className="text-muted leading-tight mt-1.5">
                        Tel: {po.addresses.supplierAddress.phone}
                      </p>
                    )}
                    {po.addresses.supplierAddress.email && (
                      <p className="text-muted leading-tight">
                        Email: {po.addresses.supplierAddress.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Dispatch Address */}
              {po.addresses?.dispatchAddress && (
                <div
                  className="border-theme rounded p-3"
                  style={{ borderWidth: "1px" }}
                >
                  <div
                    className="flex items-center gap-2 mb-2 pb-2 border-theme"
                    style={{ borderBottomWidth: "1px" }}
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <h3 className="font-bold text-main text-xs">
                      DISPATCH FROM
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {po.addresses.dispatchAddress.addressTitle && (
                      <p
                        className="font-bold text-main"
                        style={{ fontSize: "12px" }}
                      >
                        {po.addresses.dispatchAddress.addressTitle}
                      </p>
                    )}
                    {po.addresses.dispatchAddress.addressLine1 && (
                      <p className="text-muted leading-tight">
                        {po.addresses.dispatchAddress.addressLine1}
                      </p>
                    )}
                    {po.addresses.dispatchAddress.addressLine2 && (
                      <p className="text-muted leading-tight">
                        {po.addresses.dispatchAddress.addressLine2}
                      </p>
                    )}
                    {po.addresses.dispatchAddress.city &&
                      po.addresses.dispatchAddress.state && (
                        <p className="text-muted leading-tight">
                          {po.addresses.dispatchAddress.city},{" "}
                          {po.addresses.dispatchAddress.state}{" "}
                          {po.addresses.dispatchAddress.postalCode}
                        </p>
                      )}
                    {po.addresses.dispatchAddress.country && (
                      <p className="text-muted leading-tight">
                        {po.addresses.dispatchAddress.country}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {po.addresses?.shippingAddress && (
                <div
                  className="border-theme rounded p-3"
                  style={{ borderWidth: "1px" }}
                >
                  <div
                    className="flex items-center gap-2 mb-2 pb-2 border-theme"
                    style={{ borderBottomWidth: "1px" }}
                  >
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <h3 className="font-bold text-main text-xs">SHIP TO</h3>
                  </div>
                  <div className="space-y-1">
                    {po.addresses.shippingAddress.addressTitle && (
                      <p
                        className="font-bold text-main"
                        style={{ fontSize: "12px" }}
                      >
                        {po.addresses.shippingAddress.addressTitle}
                      </p>
                    )}
                    {po.addresses.shippingAddress.addressLine1 && (
                      <p className="text-muted leading-tight">
                        {po.addresses.shippingAddress.addressLine1}
                      </p>
                    )}
                    {po.addresses.shippingAddress.addressLine2 && (
                      <p className="text-muted leading-tight">
                        {po.addresses.shippingAddress.addressLine2}
                      </p>
                    )}
                    {po.addresses.shippingAddress.city &&
                      po.addresses.shippingAddress.state && (
                        <p className="text-muted leading-tight">
                          {po.addresses.shippingAddress.city},{" "}
                          {po.addresses.shippingAddress.state}{" "}
                          {po.addresses.shippingAddress.postalCode}
                        </p>
                      )}
                    {po.addresses.shippingAddress.country && (
                      <p className="text-muted leading-tight">
                        {po.addresses.shippingAddress.country}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            {(po.project ||
              po.costCenter ||
              po.taxCategory ||
              po.incoterm ||
              po.placeOfSupply) && (
              <div
                className="border-theme rounded p-3 mb-4"
                style={{ borderWidth: "1px" }}
              >
                <div className="grid grid-cols-5 gap-4 text-xs">
                  {po.project && (
                    <div>
                      <p className="text-muted mb-0.5">Project</p>
                      <p className="text-main font-semibold">{po.project}</p>
                    </div>
                  )}
                  {po.costCenter && (
                    <div>
                      <p className="text-muted mb-0.5">Cost Center</p>
                      <p className="text-main font-semibold">{po.costCenter}</p>
                    </div>
                  )}
                  {po.taxCategory && (
                    <div>
                      <p className="text-muted mb-0.5">Tax Category</p>
                      <p className="text-main font-semibold">
                        {po.taxCategory}
                      </p>
                    </div>
                  )}
                  {po.incoterm && (
                    <div>
                      <p className="text-muted mb-0.5">Incoterm</p>
                      <p className="text-main font-semibold">{po.incoterm}</p>
                    </div>
                  )}
                  {po.placeOfSupply && (
                    <div>
                      <p className="text-muted mb-0.5">Place of Supply</p>
                      <p className="text-main font-semibold">
                        {po.placeOfSupply}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div
              className="border-theme rounded overflow-hidden mb-4"
              style={{ borderWidth: "1px" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-head">
                    <th
                      className="text-left px-3 py-2 font-bold"
                      style={{ width: "40px" }}
                    >
                      #
                    </th>
                    <th
                      className="text-left px-3 py-2 font-bold"
                      style={{ width: "100px" }}
                    >
                      Item Code
                    </th>
                    <th className="text-left px-3 py-2 font-bold">
                      Description
                    </th>
                    <th
                      className="text-right px-3 py-2 font-bold"
                      style={{ width: "60px" }}
                    >
                      Qty
                    </th>
                    <th
                      className="text-center px-3 py-2 font-bold"
                      style={{ width: "50px" }}
                    >
                      UOM
                    </th>
                    <th
                      className="text-right px-3 py-2 font-bold"
                      style={{ width: "90px" }}
                    >
                      Rate
                    </th>
                    <th
                      className="text-right px-3 py-2 font-bold"
                      style={{ width: "110px" }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-theme row-hover"
                      style={{ borderTopWidth: idx > 0 ? "1px" : "0" }}
                    >
                      <td className="px-3 py-2 text-muted">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-main font-semibold">
                        {item.item_code}
                      </td>
                      <td className="px-3 py-2 text-main">{item.item_name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-main">
                        {item.qty}
                      </td>
                      <td className="px-3 py-2 text-center text-muted">
                        {item.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-main">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-primary">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & Taxes */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Taxes */}
              {po.taxes && po.taxes.length > 0 && (
                <div
                  className="border-theme rounded p-3"
                  style={{ borderWidth: "1px" }}
                >
                  <h3 className="font-bold text-main text-xs mb-2">
                    TAX DETAILS
                  </h3>
                  <div className="space-y-2 text-xs">
                    {po.taxes.map((tax, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between pb-2 border-theme"
                        style={{
                          borderBottomWidth:
                            idx < po.taxes!.length - 1 ? "1px" : "0",
                        }}
                      >
                        <div>
                          <p className="font-semibold text-main">
                            {tax.accountHead}
                          </p>
                          <p className="text-muted text-[10px]">
                            {tax.taxRate}% on{" "}
                            {formatCurrency(tax.taxableAmount)}
                          </p>
                        </div>
                        <p className="font-bold text-primary">
                          {formatCurrency(tax.taxAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div
                className="border-theme rounded p-3"
                style={{
                  borderWidth: "1px",
                  background:
                    "color-mix(in srgb, var(--primary) 5%, transparent)",
                }}
              >
                <h3 className="font-bold text-main text-xs mb-3">SUMMARY</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-mono text-main">
                      {formatCurrency(
                        po.items.reduce((sum, item) => sum + item.amount, 0),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Tax Total</span>
                    <span className="font-mono text-main">
                      {formatCurrency(
                        po.taxes?.reduce(
                          (sum, tax) => sum + tax.taxAmount,
                          0,
                        ) || 0,
                      )}
                    </span>
                  </div>
                  <div
                    className="pt-2 border-theme"
                    style={{ borderTopWidth: "2px" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        GRAND TOTAL
                      </span>
                      <span
                        className="font-bold text-primary"
                        style={{ fontSize: "15px" }}
                      >
                        {formatCurrency(po.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            {po.terms?.terms?.selling?.payment?.phases &&
              po.terms.terms.selling.payment.phases.length > 0 && (
                <div
                  className="border-theme rounded p-3 mb-4"
                  style={{ borderWidth: "1px" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    <h3 className="font-bold text-main text-xs">
                      PAYMENT TERMS
                    </h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    {po.terms.terms.selling.payment.phases.map((phase, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-2 rounded"
                        style={{ background: "var(--row-hover)" }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded">
                              {phase.percentage}%
                            </span>
                            <p className="font-semibold text-main">
                              {phase.name}
                            </p>
                          </div>
                          <p className="text-muted text-[10px]">
                            {phase.condition}
                          </p>
                        </div>
                        <p className="font-bold text-primary ml-3">
                          {formatCurrency(
                            (po.grandTotal * parseFloat(phase.percentage)) /
                              100,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Terms and Remarks */}
            {(po.terms?.terms?.selling || po.metadata?.remarks) && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {po.terms?.terms?.selling && (
                  <div
                    className="border-theme rounded p-3 text-xs"
                    style={{ borderWidth: "1px" }}
                  >
                    <h3 className="font-bold text-main mb-2">
                      TERMS & CONDITIONS
                    </h3>
                    <div
                      className="text-muted leading-relaxed space-y-1"
                      style={{ fontSize: "10px" }}
                    >
                      {po.terms.terms.selling.general && (
                        <p>
                          <strong>General:</strong>{" "}
                          {po.terms.terms.selling.general}
                        </p>
                      )}
                      {po.terms.terms.selling.delivery && (
                        <p>
                          <strong>Delivery:</strong>{" "}
                          {po.terms.terms.selling.delivery}
                        </p>
                      )}
                      {po.terms.terms.selling.cancellation && (
                        <p>
                          <strong>Cancellation:</strong>{" "}
                          {po.terms.terms.selling.cancellation}
                        </p>
                      )}
                      {po.terms.terms.selling.warranty && (
                        <p>
                          <strong>Warranty:</strong>{" "}
                          {po.terms.terms.selling.warranty}
                        </p>
                      )}
                      {po.terms.terms.selling.liability && (
                        <p>
                          <strong>Liability:</strong>{" "}
                          {po.terms.terms.selling.liability}
                        </p>
                      )}
                      {po.terms.terms.selling.payment?.notes && (
                        <p>
                          <strong>Payment Notes:</strong>{" "}
                          {po.terms.terms.selling.payment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {po.metadata?.remarks && (
                  <div
                    className="border-theme rounded p-3 text-xs"
                    style={{ borderWidth: "1px" }}
                  >
                    <h3 className="font-bold text-main mb-2">REMARKS</h3>
                    <p
                      className="text-muted leading-relaxed"
                      style={{ fontSize: "10px" }}
                    >
                      {po.metadata.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer - Metadata */}
            {po.metadata && (
              <div
                className="border-theme rounded p-3 text-xs"
                style={{ borderWidth: "1px", borderStyle: "dashed" }}
              >
                <div className="grid grid-cols-3 gap-4">
                  {po.metadata.createdBy && (
                    <div>
                      <p className="text-muted text-[10px] mb-0.5">
                        Created By
                      </p>
                      <p className="text-main font-semibold">
                        {po.metadata.createdBy}
                      </p>
                    </div>
                  )}
                  {po.metadata.createdAt && (
                    <div>
                      <p className="text-muted text-[10px] mb-0.5">
                        Created At
                      </p>
                      <p className="text-main font-semibold">
                        {new Date(po.metadata.createdAt).toLocaleString(
                          "en-GB",
                        )}
                      </p>
                    </div>
                  )}
                  {po.metadata.updatedAt && (
                    <div>
                      <p className="text-muted text-[10px] mb-0.5">
                        Last Updated
                      </p>
                      <p className="text-main font-semibold">
                        {new Date(po.metadata.updatedAt).toLocaleString(
                          "en-GB",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar - Print hidden */}
          <div
            className="bg-card border-theme px-6 py-3 flex items-center justify-between print:hidden"
            style={{
              borderTopWidth: "1px",
              borderBottomLeftRadius: "8px",
              borderBottomRightRadius: "8px",
            }}
          >
            <p className="text-xs text-muted">
              Viewed on {new Date().toLocaleDateString("en-GB")} at{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all text-main"
              style={{ background: "var(--row-hover)" }}
            >
              Close
            </button>
          </div>
        </motion.div>

        {/* Print Styles */}
        <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [style*="width: 210mm"] { 
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm !important;
            height: auto !important;
            visibility: visible;
          }
          [style*="width: 210mm"] * { visibility: visible; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );
};

export default PurchaseOrderView;
