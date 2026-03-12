import React, { useRef, useState, forwardRef } from "react";
import { UploadCloud } from "lucide-react";

// --- Types ---
export interface InvoiceItem {
  productName: string;
  description: string;
  quantity: number;
  listPrice: number;
  discount: number;
  tax: number;
  
}

export interface InvoiceData {
  invoiceId?: string;
  customerName: string;
  subject?: string;
  dateOfInvoice: string;
  dueDate: string;
  estimateNo?: string;
  customerNumber?: string;
  currency: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  billToContact?: string;
  billToCompany?: string;
  billToAddress?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  poNumber?: string;
  poDate?: string;
  letterOfCredit?: string;
  modeOfTransportation?: string;
  transportationTerms?: string;
  numberOfPackages?: string;
  declaredValue?: string;
  estimatedWeight?: string;
  carrier?: string;
  paymentTerms?: string;
  phone?: string;
  billToEmail?: string;
  website?: string;
  paymentMethod?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;

  items: InvoiceItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  adjustment: number;
  grandTotal: number;
  termsAndConditions?: string;
  notes?: string;
}

export interface InvoiceDefaultTemplateProps {
  data: InvoiceData;
  companyLogoUrl?: string;
}

// --- Component ---
const InvoiceDefaultTemplate = forwardRef<
  HTMLDivElement,
  InvoiceDefaultTemplateProps
>(({ data, companyLogoUrl }, ref) => {
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature state
  const [signature, setSignature] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [signatureText, setSignatureText] = useState<string>("");
  const [signatureMode, setSignatureMode] = useState<"upload" | "type">(
    "upload",
  );

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

  // Currency symbol helper
  const getSymbol = () => {
    switch (data.currency) {
      case "INR":
        return "₹";
      case "USD":
        return "$";
      default:
        return "";
    }
  };
  const symbol = getSymbol();

  // Layout
  return (
    <div
      ref={ref}
      className="max-w-[790px] min-h-[1120px] mx-auto bg-white shadow border p-0 font-sans text-[15px] relative"
      style={{ fontFamily: "Inter, Arial, sans-serif" }}
    >
      {/* HEADER: Blue block */}
      <div
        className="flex justify-between items-start px-8 pt-7 pb-3"
        style={{
          background: "#183A75",
          color: "white",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
      >
        <div>
          <div className="text-4xl font-bold mb-6 tracking-tight">Invoice</div>
          {/* Logo Upload */}
          <div
            className="w-36 h-20 flex justify-center items-center border-2 border-dashed border-white bg-white bg-opacity-10 rounded-md cursor-pointer mb-3"
            onClick={() => fileInputRef.current?.click()}
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            {logo || companyLogoUrl ? (
              <img
                src={logo || companyLogoUrl}
                alt="Logo"
                className="h-14 max-w-full object-contain rounded-md"
              />
            ) : (
              <span className="text-[16px] text-[#183A75] font-mediium bg-white px-3 py-2 rounded shadow">
                Your Company Logo
              </span>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleLogoChange}
            />
          </div>
        </div>
        {/* Business Details */}
        <div
          className="text-[16px] text-right leading-tight mt-2"
          style={{ minWidth: 240 }}
        >
          <div className="font-bold text-[18px] mb-2">Business Name</div>
          {[
            data.billingAddressLine1,
            data.billingAddressLine2,
            data.billingCity,
            data.billingState,
            data.billingPostalCode,
          ]
            .filter(Boolean)
            .map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          <div className="mt-2">{data.phone || "+91 (999)-999-9999"}</div>
          <div>{data.billToEmail || "Email Address"}</div>
          <div>{data.website || "Website"}</div>
        </div>
      </div>

      {/* INVOICE DETAILS & BILL TO */}
      <div className="flex flex-row px-8 py-6 border-b">
        <div className="flex-1 space-y-2">
          <div className="font-bold">INVOICE DETAILS:</div>
          <div>
            Invoice #{" "}
            <span className="font-bold text-slate-700">
              {data.invoiceId || "0000"}
            </span>
          </div>
          <div>
            Date of Issue{" "}
            <span className="font-bold text-slate-700">
              {data.dateOfInvoice || "MM/DD/YYYY"}
            </span>
          </div>
          <div>
            Due Date{" "}
            <span className="font-bold text-slate-700">
              {data.dueDate || "MM/DD/YYYY"}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-bold">BILL TO:</div>
          <div className="font-bold uppercase">
            {data.billToContact || "CUSTOMER NAME"}
          </div>
          {[
            data.billToAddress,
            data.billToCompany,
            data.billingCity,
            data.billingState,
            data.billingPostalCode,
          ]
            .filter(Boolean)
            .map((line, i) => (
              <div key={i} className="text-slate-600">
                {line}
              </div>
            ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="px-8 pt-6">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-b">
              <th className="text-left font-bold pb-2">ITEM/SERVICE</th>
              <th className="text-left font-bold pb-2">DESCRIPTION</th>
              <th className="text-center font-bold pb-2">QTY/HRS</th>
              <th className="text-right font-bold pb-2">RATE</th>
              <th className="text-right font-bold pb-2">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr className="border-b last:border-b-0" key={idx}>
                <td className="font-bold py-1">{item.productName || "—"}</td>
                <td className="text-gray-600 py-1">{item.description || ""}</td>
                <td className="text-center py-1">{item.quantity || 0}</td>
                <td className="text-right py-1">
                  {symbol}
                  {item.listPrice?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  }) || "0.00"}
                </td>
                <td className="text-right py-1">
                  {symbol}
                  {(
                    item.quantity * item.listPrice - item.discount + item.tax ||
                    0
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TERMS & AMOUNTS */}
      <div className="px-8 py-6 flex gap-6">
        <div className="flex-1">
          <div className="font-bold mb-1 mt-2">TERMS</div>
          <div className="text-gray-600 mb-4 text-sm">
            {data.termsAndConditions || "Text Here"}
          </div>
          <div className="font-bold mt-5 mb-1">CONDITIONS/INSTRUCTIONS</div>
          <div className="text-gray-600 text-sm">
            {data.notes || "Text Here"}
          </div>
        </div>
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span>Subtotal</span>
            <span>
              {symbol}
              {data.subTotal?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>Discount</span>
            <span>
              -{symbol}
              {data.totalDiscount?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>TaxRate</span>
            <span>5%</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Tax</span>
            <span>
              {symbol}
              {data.totalTax?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
          <div className="flex justify-between border-t pt-3 font-bold text-lg">
            <span>TOTAL</span>
            <span>
              {symbol}
              {data.grandTotal?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              }) || "0.00"}
            </span>
          </div>
        </div>
      </div>

      {/* Authorized Signature from Screenshot 2 */}
      <div className="px-8 pb-9 pt-2">
        <div className="font-bold mb-2">Authorized Signature</div>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setSignatureMode("upload")}
            className={`px-3 py-1 rounded text-xs font-medium transition ${signatureMode === "upload" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Upload
          </button>
          <button
            onClick={() => setSignatureMode("type")}
            className={`px-3 py-1 rounded text-xs font-medium transition ${signatureMode === "type" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Type
          </button>
        </div>
        {/* Upload Signature Box */}
        {signatureMode === "upload" && (
          <div
            className="w-[200px] h-24 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center cursor-pointer transition hover:border-blue-400 mb-2"
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
                <span className="text-gray-500 text-xs">Click to upload</span>
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
        {/* Type Signature Box */}
        {signatureMode === "type" && (
          <div className="space-y-2">
            <input
              type="text"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              placeholder="Type your signature..."
              className="w-[200px] px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm"
            />
            {signatureText && (
              <div className="w-[180px] h-24  border-gray-300 rounded bg-white flex items-center justify-center mb-2">
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
        <div className="text-center text-sm text-gray-600 mt-2"></div>
      </div>
    </div>
  );
});

InvoiceDefaultTemplate.displayName = "InvoiceDefaultTemplate";
export default InvoiceDefaultTemplate;
