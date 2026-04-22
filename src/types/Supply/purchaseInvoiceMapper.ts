import {
  PurchaseInvoiceFormData,
  emptyPOForm,
  TaxRow,
} from "./purchaseInvoice";
import type { AddressBlock } from "./purchaseInvoice";



const num = (v: any) => Number(v || 0);

const str = (v: any) => (v ? String(v).trim() : "");


const resolveAddressId = (flat: any, nested: any): string =>
  str(flat) || str(nested?.id) || "";

/** Build an empty AddressBlock skeleton with an id */
const skeletonAddress = (
  id: string,
  title: string,
  type: "Billing" | "Shipping",
  source?: any,
): AddressBlock => ({
  id,
  addressTitle: title,
  addressType: type,
  addressLine1: str(source?.addressLine1),
  addressLine2: str(source?.addressLine2),
  city: str(source?.city),
  state: str(source?.state),
  country: str(source?.country),
  postalCode: str(source?.postalCode),
  phone: str(source?.phone),
  email: str(source?.email),
});


// UI → API  (Create / Update payload)


export const mapUIToCreatePI = (form: PurchaseInvoiceFormData) => {
  const items = form.items
    .filter(
      (it) =>
        it.itemCode?.trim() &&
        Number(it.quantity) > 0 &&
        Number(it.rate) > 0,
    )
    .map((it) => ({
      itemCode: it.itemCode,
      itemName: str(it.itemName),
      quantity: num(it.quantity),
      rate: num(it.rate),
      uom: str(it.uom),
      vatCd: str(it.vatCd),
      vatRate: num(it.vatRate),
      description: str(it.description),
      packing: str(it.packing),
      batchNo: str(it.batchNo),
      mfgDate: str(it.mfgDate),
      expDate: str(it.expDate),
      discount: num(it.discount),
      warehouse: form.updateStock ? str(it.warehouse) : null,
    }));

  // ── Taxes ──────────────────────────────────
  const taxes = form.taxRows
    .filter((t) => t.type?.trim() && t.accountHead?.trim())
    .map((t) => ({
      type: t.type,
      accountHead: t.accountHead,
      taxRate: num(t.taxRate),
      taxableAmount: num(t.amount),
    }));

  // ── Payments ───────────────────────────────
  const payments = form.paymentRows
    .filter((p) => p.paymentTerm?.trim())
    .map((p) => ({
      paymentTerm: p.paymentTerm,
      description: p.description,
      dueDate: p.dueDate,
      invoicePortion: num(p.invoicePortion),
      paymentAmount: num(p.paymentAmount),
    }));

  // ── Payload ────────────────────────────────
  const payload: Record<string, any> = {
    rcptTyCd: "Local",

    supplierId: form.supplierId,
    supplierName: form.supplier,
    supplierCode: form.supplierCode,
    supplierContact: form.supplierContact,

    updateStock: form.updateStock ?? true,
    poDate: form.date,

    currency: form.currency,
    status: form.status,
    taxCategory: form.taxCategory,

    spplrInvcNo: form.supplierInvoiceNumber,
    spplrInvcDt: form.supplierInvoiceDate,
    paymentType: form.paymentType,


    supplier_address: form.addresses?.supplierAddress?.id || "",
    shipping_address: form.addresses?.shippingAddress?.id || "",
    dispatch_address: form.addresses?.dispatchAddress?.id || "",
    billing_address: form.addresses?.companyBillingAddress?.id || "",

    terms: {
      buying: form.terms?.buying || {},
    },

    items,
    metadata: {},


    lpoNumber: form.poNumber || "",
    ...(form.updateStock && form.warehouse && { warehouse: form.warehouse }),
    ...(form.costCenter && { costCenter: form.costCenter }),
    ...(form.project && { project: form.project }),
    ...(form.shippingRule && { shippingRule: form.shippingRule }),
    ...(form.incoterm && { incoterm: form.incoterm }),
    ...(form.placeOfSupply && { placeOfSupply: form.placeOfSupply }),
    ...(form.paymentTermsTemplate && {
      paymentTermsTemplate: form.paymentTermsTemplate,
    }),
    ...(form.taxesChargesTemplate && {
      taxesChargesTemplate: form.taxesChargesTemplate,
    }),
    ...(taxes.length > 0 && { taxes }),
    ...(payments.length > 0 && { payments }),
  };

  return payload;
};


// API → UI  (Load / Edit)


export const mapApiToUI = (apiResponse: any): PurchaseInvoiceFormData => {
  const api = apiResponse?.data || apiResponse;

  // ── Items ──────────────────────────────────
  const items = (api.items || []).map((item: any) => {

    const selectedTax =
      (item.taxInfo || []).find(
        (t: any) =>
          t.taxCategory?.toLowerCase?.() ===
          (api.taxCategory || "").toLowerCase()
      ) || (item.taxInfo || [])[0] || null;
      const taxTypes = (item.taxInfo || [])
  .flatMap((tax: any) => tax.taxRates || [])
  .map((r: any) => r.tax_type)
  .filter((t: string) => t && t.trim() !== "");
    return {
      itemCode: str(item.item_code || item.itemCode),
      itemName: str(item.item_name || item.itemName),
      quantity: num(item.qty || item.quantity),
      rate: num(item.rate || item.price),
      uom: str(item.uom),
      vatCd: str(
        item.vatCd ||
        item.taxName ||
        selectedTax?.taxName ||
        ""
      ),
      taxTypes: taxTypes,

      vatRate: num(
        item.vatRate ||
        item.taxRate ||
        selectedTax?.totalTaxRate ||
        selectedTax?.taxRates?.[0]?.tax_rate ||
        0
      ),
      description: str(item.description),
      packing: str(item.packing),
      batchNo: str(item.batchNo || ""),
      mfgDate: str(item.mfgDate || ""),
      expDate: str(item.expDate || ""),
      discount: num(item.discount),
      warehouse: str(item.warehouse),
      packingUnit: num(item.packingUnit),
      packingSize: num(item.packingSize),
      requiresBatch: Boolean(item.has_batch_no),
      requiredBy: str(item.requiredBy),
    };
  });

  // ── Tax rows ───────────────────────────────
  let taxRows: TaxRow[] = [];

  if (Array.isArray(api.taxes) && api.taxes.length > 0) {
    taxRows = api.taxes
      .filter((t: any) => t.type && t.accountHead)
      .map((t: any) => ({
        type: str(t.type) || "On Net Total",
        accountHead: str(t.accountHead),
        taxRate: num(t.taxRate),
        amount: num(t.taxableAmount),
      }));
  } else if (api.tax) {
    taxRows = [
      {
        type: str(api.tax.type) || "On Net Total",
        accountHead: str(api.tax.accountHead) || "Tax",
        taxRate: num(api.tax.taxRate),
        amount: num(api.tax.taxableAmount),
      },
    ];
  }


  const addresses = {
    supplierAddress: skeletonAddress(
      resolveAddressId(api.supplier_address || api.supplierAddress, api.addresses?.supplierAddress),
      "Supplier Main Address",
      "Billing",
      api.addresses?.supplierAddress,
    ),

    dispatchAddress: skeletonAddress(
      resolveAddressId(api.dispatch_address || api.dispatchAddress, api.addresses?.dispatchAddress),
      "Warehouse Dispatch",
      "Shipping",
      api.addresses?.dispatchAddress,
    ),

    shippingAddress: skeletonAddress(
      resolveAddressId(api.shipping_address || api.shippingAddress, api.addresses?.shippingAddress),
      "Customer Delivery Address",
      "Shipping",
      api.addresses?.shippingAddress,
    ),

    companyBillingAddress: skeletonAddress(
      resolveAddressId(
        api.billing_address || api.billingAddress,
        api.addresses?.companyBillingAddress,
      ),
      "Company HQ Billing",
      "Billing",
      api.addresses?.companyBillingAddress,
    ),
  };

  // ── Terms & Payment rows ───────────────────
  const buyingTerms =
    api.terms?.terms?.buying ||
    api.terms?.buying ||
    api.terms?.Buying ||
    api.terms?.selling;

  const paymentRows = (buyingTerms?.payment?.phases || []).map(
    (phase: any) => ({
      paymentTerm: str(phase.name),
      description: str(phase.condition),
      dueDate: "",
      invoicePortion: num(phase.percentage),
      paymentAmount: (num(api.grandTotal) * num(phase.percentage)) / 100,
    }),
  );

  // ── Totals ─────────────────────────────────
  const totalQuantity = items.reduce(
    (s: number, i: any) => s + i.quantity,
    0,
  );
  const subTotal = items.reduce(
    (s: number, i: any) => s + i.quantity * i.rate,
    0,
  );
  const itemTaxTotal = items.reduce(
    (s: number, i: any) => s + (i.quantity * i.rate * i.vatRate) / 100,
    0,
  );
  const taxRowTotal = taxRows.reduce(
    (s: number, t: any) => s + (t.amount * t.taxRate) / 100,
    0,
  );

  const grandTotal = num(api.grandTotal) || subTotal + itemTaxTotal + taxRowTotal;
  const roundedTotal = Math.round(grandTotal);
  const roundingAdjustment = Number((roundedTotal - grandTotal).toFixed(2));

  const advanceAmount = (api.advances_payments || []).reduce(
    (s: number, p: any) => s + num(p.allocated_amount),
    0,
  );

  // ── Mapped form ────────────────────────────
  const mappedForm: PurchaseInvoiceFormData = {
    ...emptyPOForm,

    poNumber: str(api.lpoNumber || api.poId || ""),
    date: str(api.piDate),
    taxCategory: str(api.taxCategory),
    updateStock: api.updateStock ?? true,

    supplier: str(api.supplierName),
    supplierId: str(api.supplierId),
    supplierCode: str(api.supplierCode),
    supplierEmail: str(api.emailId || api.email),
    supplierPhone: str(api.phone),
    supplierContact: str(api.contactPerson),
    supplierContactDisplay: str(api.contactDisplay || api.contactPerson),
    currency: str(api.currency),
    status: str(api.status),
    costCenter: str(api.costCenter),
    project: str(api.project),

    destnCountryCd: str(api.destnCountryCd || api.exportToCountry),
    shippingRule: str(api.shippingRule),
    incoterm: str(api.incoterm),
    placeOfSupply: str(api.placeOfSupply),
    taxesChargesTemplate: str(api.taxesChargesTemplate),
    paymentTermsTemplate: str(api.paymentTermsTemplate),

    supplierInvoiceNumber: str(api.spplrInvcNo),
    supplierInvoiceDate: str(api.spplrInvcDt),
    paymentType: str(api.paymentType),


    warehouse: str(api.warehouse),

    terms: buyingTerms ? { buying: buyingTerms } : undefined,
    addresses,

    items: items.length > 0 ? items : [{ ...emptyPOForm.items[0] }],
    taxRows,
    paymentRows,

    totalQuantity,
    subTotal,
    grandTotal,
    advanceAmount,
    roundingAdjustment,
    roundedTotal,
    templateName: "",
    templateType: "",
    subject: "",
    messageHtml: "",
    sendAttachedFiles: false,
    sendPrint: false,
    itemTerms: [],
    acceptedTerms: {},
  };

  return mappedForm;
};


// Supplier API → AddressBlock


export const mapSupplierToAddress = (
  supplier: any,
  prev: AddressBlock,
): AddressBlock => {
  const addr =
    supplier.addresses?.find((a: any) => a.isPrimary) ||
    supplier.addresses?.[0];

  if (!addr) return prev;

  const primaryContact =
    supplier.contacts?.find((c: any) => c.isPrimary) ||
    supplier.contacts?.[0];

  return {
    id: str(addr.id),
    addressTitle: str(supplier.name) || prev.addressTitle,
    addressType: addr.type === "Shipping" ? "Shipping" : "Billing",
    addressLine1: str(addr.line1),
    addressLine2: str(addr.line2),
    city: str(addr.city),
    state: str(addr.state || addr.county),
    country: str(addr.country),
    postalCode: str(addr.postalCode),
    phone: str(primaryContact?.mobile || primaryContact?.phone),
    email: str(primaryContact?.email),
  };
};