import React, { useRef, useState, forwardRef } from "react";
import { UploadCloud } from "lucide-react";

// --- Types ---
export interface QuotationItem {
  productName: string;
  description: string;
  quantity: number;
  listPrice: number;
  discount: number;
  tax: number;
}

export interface QuotationData {
  quotationId?: string;
  customerName: string;
  quotationDate: string;
  validUntil: string;
  currency: string;
  billingAddressLine1?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  items: QuotationItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  adjustment: number;
  grandTotal: number;
  paymentTerms?: string;
  notes?: string;
}

export interface QuotationTemplate2Props {
  data: QuotationData;
  companyLogoUrl?: string;
}

// --- Component ---
const QuotationTemplate2 = forwardRef<HTMLDivElement, QuotationTemplate2Props>(
  ({ data, companyLogoUrl }, ref) => {
    const [logo, setLogo] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [signatureText, setSignatureText] = useState<string>("");
    const [signatureMode, setSignatureMode] = useState<"upload" | "type">(
      "upload",
    );

    const getCurrencySymbol = () => {
      switch (data.currency) {
        case "ZMW":
          return "ZK";
        case "INR":
          return "";
        case "USD":
          return "$";
        default:
          return "";
      }
    };

    const symbol = getCurrencySymbol();

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => setLogo(ev.target?.result as string);
        reader.readAsDataURL(e.target.files[0]);
      }
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => setSignature(ev.target?.result as string);
        reader.readAsDataURL(e.target.files[0]);
      }
    };

    return (
      <div
        ref={ref}
        className="max-w-[260mm] mx-auto bg-white p-12"
        style={{ minHeight: "297mm" }}
      >
        {/* Modern Header */}
        <div
          className="text-white p-8 rounded-lg mb-8"
          style={{ background: "linear-gradient(to right, #2F3C7E, #2F3C7E)" }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Logo Upload */}
              <div
                className="w-16 h-16 bg-white rounded-lg flex items-center justify-center cursor-pointer transition"
                style={{ backgroundColor: "#FBEAEB" }}
                onClick={() => fileInputRef.current?.click()}
              >
                {logo || companyLogoUrl ? (
                  <img
                    src={logo || companyLogoUrl}
                    alt="Logo"
                    className="w-14 h-14 object-contain rounded-lg"
                  />
                ) : (
                  <UploadCloud
                    className="w-6 h-6"
                    style={{ color: "#2F3C7E" }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Rolaface Software Pvt Limited
                </h1>
                <p className="text-sm" style={{ color: "#FBEAEB" }}>
                  Software & Technology Solutions
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold">QUOTATION</h2>
              <p className="text-sm mt-1" style={{ color: "#FBEAEB" }}>
                #{data.quotationId || "QUO-001"}
              </p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3
              className="text-xs font-bold uppercase mb-2"
              style={{ color: "#1C1C1C" }}
            >
              Quote To
            </h3>
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#F2F2F2" }}
            >
              <p className="font-bold mb-2" style={{ color: "#1C1C1C" }}>
                {data.customerName}
              </p>
              <p className="text-sm" style={{ color: "#1C1C1C" }}>
                {data.billingAddressLine1}
              </p>
              <p className="text-sm" style={{ color: "#1C1C1C" }}>
                {data.billingCity}, {data.billingState}
              </p>
              <p className="text-sm" style={{ color: "#1C1C1C" }}>
                {data.billingPostalCode}
              </p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold" style={{ color: "#1C1C1C" }}>
                Quotation Date:
              </span>
              <span style={{ color: "#1C1C1C" }}>{data.quotationDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold" style={{ color: "#1C1C1C" }}>
                Valid Until:
              </span>
              <span style={{ color: "#1C1C1C" }}>{data.validUntil}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold" style={{ color: "#1C1C1C" }}>
                Payment Terms:
              </span>
              <span style={{ color: "#1C1C1C" }}>
                {data.paymentTerms || "Net 30"}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="text-white" style={{ backgroundColor: "#2F3C7E" }}>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const lineTotal =
                  item.quantity * item.listPrice - item.discount;
                return (
                  <tr
                    key={index}
                    className="border-b"
                    style={{ borderColor: "#F2F2F2" }}
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold" style={{ color: "#1C1C1C" }}>
                        {item.productName}
                      </p>
                      <p className="text-sm" style={{ color: "#1C1C1C" }}>
                        {item.description}
                      </p>
                    </td>
                    <td
                      className="px-4 py-4 text-center"
                      style={{ color: "#1C1C1C" }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      className="px-4 py-4 text-right"
                      style={{ color: "#1C1C1C" }}
                    >
                      {symbol}
                      {item.listPrice.toFixed(2)}
                    </td>
                    <td
                      className="px-4 py-4 text-right font-semibold"
                      style={{ color: "#1C1C1C" }}
                    >
                      {symbol}
                      {lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div
              className="p-6 rounded-lg space-y-3"
              style={{ backgroundColor: "#F2F2F2" }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "#1C1C1C" }}>Subtotal</span>
                <span className="font-semibold" style={{ color: "#1C1C1C" }}>
                  {symbol}
                  {data.subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#1C1C1C" }}>Tax</span>
                <span className="font-semibold" style={{ color: "#1C1C1C" }}>
                  {symbol}
                  {data.totalTax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#1C1C1C" }}>Discount</span>
                <span className="font-semibold" style={{ color: "#1C1C1C" }}>
                  -{symbol}
                  {data.totalDiscount.toFixed(2)}
                </span>
              </div>
              <div
                className="pt-3 flex justify-between"
                style={{ borderTop: "2px solid #2F3C7E" }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: "#1C1C1C" }}
                >
                  Total
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: "#2F3C7E" }}
                >
                  {symbol}
                  {data.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#1C1C1C" }}>
            Authorized Signature
          </h3>

          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSignatureMode("upload")}
              className={`px-4 py-2 rounded text-sm font-medium transition`}
              style={{
                backgroundColor:
                  signatureMode === "upload" ? "#2F3C7E" : "#F2F2F2",
                color: signatureMode === "upload" ? "white" : "#1C1C1C",
              }}
            >
              Upload Signature
            </button>
            <button
              onClick={() => setSignatureMode("type")}
              className={`px-4 py-2 rounded text-sm font-medium transition`}
              style={{
                backgroundColor:
                  signatureMode === "type" ? "#2F3C7E" : "#F2F2F2",
                color: signatureMode === "type" ? "white" : "#1C1C1C",
              }}
            >
              Type Signature
            </button>
          </div>

          {/* Upload Mode */}
          {signatureMode === "upload" && (
            <div className="flex justify-start">
              <div
                className="w-64 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition"
                style={{
                  borderColor: "#F2F2F2",
                  backgroundColor: "#FBEAEB",
                }}
                onClick={() => signatureInputRef.current?.click()}
              >
                {signature ? (
                  <img
                    src={signature}
                    alt="Signature"
                    className="h-28 object-contain max-w-full"
                  />
                ) : (
                  <div className="text-center">
                    <UploadCloud
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ color: "#2F3C7E" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#1C1C1C" }}
                    >
                      Click to upload signature
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={signatureInputRef}
                  onChange={handleSignatureChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Type Mode */}
          {signatureMode === "type" && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your signature here..."
                className="w-64 px-4 py-3 border-2 rounded-lg focus:outline-none text-sm"
                style={{
                  borderColor: "#F2F2F2",
                  color: "#1C1C1C",
                }}
              />
              {signatureText && (
                <div
                  className="w-64 h-32 border-2 rounded-lg bg-white flex items-center justify-center"
                  style={{ borderColor: "#F2F2F2" }}
                >
                  <p
                    className="text-4xl"
                    style={{
                      fontFamily: "Brush Script MT, cursive",
                      color: "#1C1C1C",
                    }}
                  >
                    {signatureText}
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs mt-3" style={{ color: "#1C1C1C" }}>
            Date: {data.quotationDate}
          </p>
        </div>

        {/* Notes */}
        {data.notes && (
          <div
            className="p-4 rounded-lg mb-8"
            style={{ backgroundColor: "#FBEAEB" }}
          >
            <h4 className="text-sm font-bold mb-2" style={{ color: "#1C1C1C" }}>
              Notes
            </h4>
            <p className="text-sm" style={{ color: "#1C1C1C" }}>
              {data.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-12 pt-6 border-t-2 text-center text-sm"
          style={{ borderColor: "#F2F2F2", color: "#1C1C1C" }}
        >
          <p>We look forward to working with you!</p>
        </div>
      </div>
    );
  },
);

QuotationTemplate2.displayName = "QuotationTemplate2";
export default QuotationTemplate2;
