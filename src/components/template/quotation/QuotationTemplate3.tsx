import React, { useRef, useState, forwardRef } from "react";
import { UploadCloud } from "lucide-react";

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
  poNumber?: string;
  currency: string;

  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPostalCode?: string;

  billingAddressLine1?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;

  shippingAddressLine1?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;

  items: QuotationItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  adjustment: number;
  grandTotal: number;

  paymentTerms?: string;
  notes?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  termsAndConditions?: string;
}

export interface QuotationTemplate3Props {
  data: QuotationData;
  companyLogoUrl?: string;
}

const QuotationTemplate3 = forwardRef<HTMLDivElement, QuotationTemplate3Props>(
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
        className="w-full max-w-[300mm] mx-auto bg-white"
        style={{ minHeight: "297mm" }}
      >
        {/* Orange Header */}
        <div className="bg-[#D4AF37] text-white px-15 py-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {/* Logo Upload */}
              <div
                className="w-20 h-20 bg-white rounded flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {logo || companyLogoUrl ? (
                  <img
                    src={logo || companyLogoUrl}
                    alt="Logo"
                    className="w-18 h-18 object-contain"
                  />
                ) : (
                  <UploadCloud className="w-8 h-8 text-[#D4AF37]" />
                )}
              </div>
              <h1 className="text-5xl font-light tracking-wide">QUOTATION</h1>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleLogoChange}
            />
          </div>

          {/* Quotation Details */}
          <div className="grid grid-cols-2 gap-x-8 text-sm">
            <div></div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">QUOTATION #</span>
                <span>{data.quotationId || "QUO-001"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">QUOTATION DATE</span>
                <span>{data.quotationDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">P.O.#</span>
                <span>{data.poNumber || "2430/2019"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">VALID UNTIL</span>
                <span>{data.validUntil}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-15">
          {/* FROM, QUOTE TO, DELIVER TO, QUOTATION TOTAL */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* FROM */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
                FROM
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-800">
                  {data.companyName || "Rolaface Software Pvt Limited"}
                </p>
                <p className="text-gray-600">
                  {data.companyAddress || "77 Namrata Bldg"}
                </p>
                <p className="text-gray-600">
                  {data.companyCity || "Delhi"}, {data.companyState || "Delhi"}{" "}
                  {data.companyPostalCode || "400077"}
                </p>
              </div>
            </div>

            {/* QUOTE TO */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
                QUOTE TO
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-800">
                  {data.customerName}
                </p>
                <p className="text-gray-600">{data.billingAddressLine1}</p>
                <p className="text-gray-600">
                  {data.billingCity}, {data.billingState}{" "}
                  {data.billingPostalCode}
                </p>
              </div>
            </div>

            {/* DELIVER TO */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
                DELIVER TO
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-800">
                  {data.customerName}
                </p>
                <p className="text-gray-600">{data.shippingAddressLine1}</p>
                <p className="text-gray-600">
                  {data.shippingCity}, {data.shippingState}{" "}
                  {data.shippingPostalCode}
                </p>
              </div>
            </div>

            {/* QUOTATION TOTAL */}
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
                QUOTATION TOTAL
              </h3>
              <p className="text-3xl font-bold text-[#D4AF37]">
                {symbol}
                {data.grandTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-[#D4AF37] mb-6"></div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-3 text-left text-sm font-bold text-[#D4AF37] uppercase">
                    DESCRIPTION
                  </th>
                  <th className="py-3 text-right text-sm font-bold text-[#D4AF37] uppercase">
                    UNIT PRICE
                  </th>
                  <th className="py-3 text-center text-sm font-bold text-[#D4AF37] uppercase">
                    QTY
                  </th>
                  <th className="py-3 text-right text-sm font-bold text-[#D4AF37] uppercase">
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => {
                  const lineTotal =
                    item.quantity * item.listPrice - item.discount;
                  return (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 text-sm text-gray-800">
                        {item.description}
                      </td>
                      <td className="py-3 text-sm text-gray-800 text-right">
                        {item.listPrice.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 text-sm text-gray-800 text-center">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-sm text-gray-800 text-right">
                        {lineTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-[#D4AF37] font-bold uppercase">
                  SUBTOTAL
                </span>
                <span className="text-gray-800">
                  {data.subTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#D4AF37] font-bold uppercase">
                  GST {((data.totalTax / data.subTotal) * 100).toFixed(1)}%
                </span>
                <span className="text-gray-800">
                  {data.totalTax.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-3 mt-2">
                <span className="text-[#D4AF37] font-bold text-lg uppercase">
                  TOTAL
                </span>
                <span className="text-gray-800 font-bold text-lg">
                  {symbol}
                  {data.grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="flex justify-end mb-12">
            <div className="w-80">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Authorized Signature
              </h3>

              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setSignatureMode("upload")}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    signatureMode === "upload"
                      ? "bg-[#D4AF37] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setSignatureMode("type")}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    signatureMode === "type"
                      ? "bg-[#D4AF37] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Type
                </button>
              </div>

              {/* Upload Mode */}
              {signatureMode === "upload" && (
                <div
                  className="w-full h-24 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center cursor-pointer transition hover:border-orange-400"
                  onClick={() => signatureInputRef.current?.click()}
                >
                  {signature ? (
                    <img
                      src={signature}
                      alt="Signature"
                      className="h-20 object-contain max-w-full"
                    />
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-gray-500 text-xs">
                        Click to upload
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
              )}

              {/* Type Mode */}
              {signatureMode === "type" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="Type your signature..."
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-orange-500 focus:outline-none text-sm"
                  />
                  {signatureText && (
                    <div className="w-full h-24 border-2 border-gray-300 rounded bg-white flex items-center justify-center">
                      <p
                        className="text-3xl text-gray-800"
                        style={{ fontFamily: "Brush Script MT, cursive" }}
                      >
                        {signatureText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="border-t border-gray-300 pt-6 space-y-4 pb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">
                TERMS & CONDITIONS
              </h3>
              <p className="text-sm text-gray-700">
                {data.termsAndConditions ||
                  "This quotation is valid for 30 days from the date of issue."}
              </p>
            </div>

            {data.bankName && (
              <div className="text-sm">
                <p className="font-semibold text-gray-800">{data.bankName}</p>
                {data.accountNumber && (
                  <p className="text-gray-700">
                    Account Number: {data.accountNumber}
                  </p>
                )}
                {data.routingNumber && (
                  <p className="text-gray-700">
                    Routing Number: {data.routingNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Message */}
          <div className="text-center text-sm text-gray-600 mt-12">
            <p>We look forward to your acceptance!</p>
          </div>
        </div>
      </div>
    );
  },
);

QuotationTemplate3.displayName = "QuotationTemplate3";
export default QuotationTemplate3;
