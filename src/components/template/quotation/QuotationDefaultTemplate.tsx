import React, { useRef, useState, forwardRef } from "react";
import { UploadCloud } from "lucide-react";
import type {
  QuotationItem,
  QuotationTemplate1Props,
} from "../quotation/QuotationTemplate1";
// --- Same Types as Before ---

const QuotationDefaultTemplate = forwardRef<
  HTMLDivElement,
  QuotationTemplate1Props
>(({ data, companyLogoUrl }, ref) => {
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature section
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

  const symbol =
    data.currency === "INR"
      ? ""
      : data.currency === "USD"
        ? "$"
        : data.currency === "ZMW"
          ? "ZK"
          : "";

  return (
    <div
      ref={ref}
      className="bg-white p-0 max-w-[870px] min-h-[1150px] border mx-auto shadow"
      style={{ fontFamily: "Inter, Arial, sans-serif" }}
    >
      {/* Header Row */}
      <div
        className="flex justify-between items-start pt-8 pb-2 px-10 border-b"
        style={{ minHeight: 95 }}
      >
        <div>
          <div className="text-[32px] font-extrabold leading-none">
            Quotation
          </div>
          <div className="mt-2 font-semibold text-lg">
            Quotation#{" "}
            <span className="font-normal">{data.quotationId || "004"}</span>
          </div>
          <div className="text-sm mt-1">
            Quotation Date{" "}
            <span className="font-semibold">{data.quotationDate}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div
            className="w-40 h-14 cursor-pointer border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-100 mb-2"
            onClick={() => fileInputRef.current?.click()}
          >
            {logo || companyLogoUrl ? (
              <img
                src={logo || companyLogoUrl}
                alt="Logo"
                className="h-14 object-contain"
              />
            ) : (
              <UploadCloud className="w-9 h-9 text-gray-400" />
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
      </div>

      {/* Quotation Info / Addresses */}
      <div className="flex gap-5 mt-5 px-10">
        <div className="flex-1 bg-gray-50 rounded px-4 py-3 text-sm">
          <div className="text-blue-900 font-semibold mb-1">Quotation by</div>
          <div className="font-bold">{data.customerName || "Foobar Labs"}</div>
          <div>{data.billingAddressLine1}</div>
          {data.billingAddressLine2 && <div>{data.billingAddressLine2}</div>}
          <div>
            {data.billingCity}, {data.billingState}, {data.billingCountry} -{" "}
            {data.billingPostalCode}
          </div>
          {data.bankName && (
            <div className="mt-1 font-medium">PAN: {data.bankName}</div>
          )}
        </div>
        <div className="flex-1 bg-gray-50 rounded px-4 py-3 text-sm">
          <div className="text-blue-900 font-semibold mb-1">Quotation to</div>
          <div className="font-bold">{data.subject || "Studio Den"}</div>
          <div>{data.shippingAddressLine1}</div>
          {data.shippingAddressLine2 && <div>{data.shippingAddressLine2}</div>}
          <div>
            {data.shippingCity}, {data.shippingState}, {data.shippingCountry} -{" "}
            {data.shippingPostalCode}
          </div>
          {data.accountNumber && (
            <div className="mt-1 font-medium">PAN: {data.accountNumber}</div>
          )}
        </div>
      </div>

      {/* Place of Supply / Country */}
      <div className="flex justify-between mt-1 px-10 mb-1 text-sm">
        <div>
          <span className="text-gray-500">Place of Supply</span>{" "}
          <span className="font-bold">{data.billingState || "Karnataka"}</span>
        </div>
        <div>
          <span className="text-gray-500">Country of Supply</span>{" "}
          <span className="font-bold">{data.billingCountry || "India"}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-10 mt-2">
        <table className="w-full border-separate border-spacing-0 text-base shadow-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th
                className="px-3 py-2 border-r border-white font-semibold text-left"
                style={{ width: 100 }}
              >
                #
              </th>
              <th className="px-3 py-2 border-r border-white font-semibold text-left">
                Item / Item description
              </th>
              <th
                className="px-3 py-2 border-r border-white font-semibold text-center"
                style={{ width: 80 }}
              >
                Qty.
              </th>
              <th
                className="px-3 py-2 border-r border-white font-semibold text-right"
                style={{ width: 120 }}
              >
                Rate
              </th>
              <th
                className="px-3 py-2 font-semibold text-right"
                style={{ width: 125 }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: QuotationItem, idx: number) => (
              <tr
                key={idx}
                className="bg-white even:bg-gray-50 border-b border-gray-200"
              >
                <td className="px-3 py-2 text-left border-r border-gray-200">
                  {idx + 1}.
                </td>
                <td className="px-3 py-2 text-left border-r border-gray-200">
                  <span className="font-medium">{item.productName}</span>
                  <span className="ml-2 text-gray-500">{item.description}</span>
                </td>
                <td className="px-3 py-2 text-center border-r border-gray-200">
                  {item.quantity}
                </td>
                <td className="px-3 py-2 text-right border-r border-gray-200">
                  {symbol}
                  {item.listPrice.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2 text-right">
                  {symbol}
                  {(
                    item.quantity * item.listPrice -
                    item.discount
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Terms/Conditions + Totals */}
      <div className="flex mt-7 px-10 gap-7 items-start">
        {/* Terms / Notes */}
        <div className="flex-1 text-sm">
          <div className="font-bold mb-2">Terms and Conditions</div>
          <ul className="text-gray-700 mb-4 pl-4 list-disc">
            {(data.termsAndConditions
              ? data.termsAndConditions.split("\n")
              : [
                  "Please pay within 15 days from the date of invoice. Overdue interest @ 14% will be charged on delayed payments.",
                  "Please quote invoice number when remitting funds.",
                ]
            ).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <div className="font-bold mb-2">Additional Notes</div>
          <div className="mb-4">
            {data.notes ||
              "It is a long established fact ... as opposed to using 'Content here, content here'."}
          </div>

          {/* Contact Info */}
          <div>
            For any enquiries, email us on{" "}
            <span className="font-semibold">info@foobar.com</span> or call us on{" "}
            <span className="font-bold">+91 98765 43210</span>
          </div>
        </div>

        {/* Amounts */}
        <div className="w-80">
          <div className="flex justify-between py-1 text-base">
            <span>Sub Total</span>
            <span className="font-medium">
              {symbol}
              {data.subTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between py-1 text-base">
            <span>Discount({data.totalDiscount ? "5%" : "0%"})</span>
            <span className="font-medium text-red-600">
              -{symbol}
              {data.totalDiscount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between text-2xl py-3 border-t font-bold mt-2">
            <span>Total</span>
            <span>
              {symbol}
              {data.grandTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="italic text-xs text-gray-500 pt-3 font-medium">
            Invoice Total (in words)
            <br />
            <span className="not-italic font-normal text-black text-base">
              {/* Display grandTotal in words or any helper if available */}
              Ninety Thousand Nine Hundred Fifty Rupees Only
            </span>
          </div>
        </div>
      </div>

      {/* Signature Row */}
      <div className="flex mt-6 px-10 items-end justify-between pt-10">
        <div></div>
        {/* Signature Section */}
        <div className="w-64">
          <div className="text-right font-bold mb-1">Authorized Signature</div>
          {/* Upload/Type Toggle */}
          <div className="flex gap-2 mb-1 justify-end">
            <button
              onClick={() => setSignatureMode("upload")}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                signatureMode === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => setSignatureMode("type")}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                signatureMode === "type"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Type
            </button>
          </div>
          {/* Signature Upload Box */}
          {signatureMode === "upload" && (
            <div
              className="w-full h-20 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center cursor-pointer transition hover:border-blue-400 mb-2"
              onClick={() => signatureInputRef.current?.click()}
            >
              {signature ? (
                <img
                  src={signature}
                  alt="Signature"
                  className="h-16 object-contain max-w-full"
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
          {/* Signature Type Box */}
          {signatureMode === "type" && (
            <div className="space-y-2">
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your signature..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm"
              />
              {signatureText && (
                <div className="w-full h-16 border-2 border-gray-300 rounded bg-white flex items-center justify-center mb-2">
                  <p
                    className="text-2xl text-gray-800"
                    style={{ fontFamily: "Brush Script MT, cursive" }}
                  >
                    {signatureText}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="text-right text-sm text-gray-600 mt-1 pr-1">
            <p className="font-semibold">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
});

QuotationDefaultTemplate.displayName = "QuotationDefaultTemplate";
export default QuotationDefaultTemplate;
