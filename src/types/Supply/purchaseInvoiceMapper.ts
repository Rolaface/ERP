import {
  PurchaseInvoiceFormData,
  emptyPOForm,
  TaxRow,
} from "./purchaseInvoice";
import type { AddressBlock } from "./purchaseInvoice";

/**
 * UI → Backend API (Create/Update)
 * FINAL VERSION - Based on Invoice pattern analysis
 */
export const mapUIToCreatePI = (form: PurchaseInvoiceFormData) => {
  // Filter and map items - CRITICAL: Filter empty items FIRST
  const validItems = form.items.filter((it) => {
    const hasCode = it.itemCode && it.itemCode.trim() !== "";
    const hasQty = it.quantity && Number(it.quantity) > 0;
    const hasRate = it.rate && Number(it.rate) > 0;

    return hasCode && hasQty && hasRate; // Only include complete items
  });

  const items = validItems.map((it, _idx) => {
    // Force number conversion
    const quantity = Number(it.quantity);
    const rate = Number(it.rate);
    const vatRate = Number(it.vatRate || 0);

    return {
      itemCode: it.itemCode,
      itemName: it.itemName || "",
      quantity: quantity,
      rate: rate,
      uom: it.uom || "Unit",
      vatCd: it.vatCd || "A",
      vatRate: vatRate,
    };
  });

  // Tax rows - only valid ones
  const taxes = form.taxRows
    .filter(
      (t) =>
        t.type &&
        t.type.trim() !== "" &&
        t.accountHead &&
        t.accountHead.trim() !== "",
    )
    .map((t) => ({
      type: t.type,
      accountHead: t.accountHead,
      taxRate: Number(t.taxRate || 0),
      taxableAmount: Number(t.amount || 0),
    }));

  // Payment rows
  const payments = form.paymentRows
    .filter((p) => p.paymentTerm && p.paymentTerm.trim() !== "")
    .map((p) => ({
      paymentTerm: p.paymentTerm,
      description: p.description,
      dueDate: p.dueDate,
      invoicePortion: Number(p.invoicePortion || 0),
      paymentAmount: Number(p.paymentAmount || 0),
    }));

  const payload: any = {
    rcptTyCd: "Local",
    requiredBy: form.requiredBy,
    supplierId: form.supplierId,
    currency: form.currency,

    taxCategory: "Non-Export",

    spplrInvcNo: form.supplierInvoiceNumber,
    paymentType: form.paymentType,
    transactionProgress: form.transactionProgress,

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

    addresses: form.addresses,

    ...(form.terms?.buying && {
      terms: {
        selling: form.terms.buying,
      },
    }),

    items,

    ...(taxes.length > 0 && { taxes }),
    ...(payments.length > 0 && { payments }),

    metadata: {
      remarks: "Created from UI",
    },
  };

  return payload;
};

/**
 * Backend API → UI Form
 */
export const mapApiToUI = (apiResponse: any): PurchaseInvoiceFormData => {
  const api = apiResponse.data || apiResponse;

  // Map items - handle both field name variations
  const items = (api.items || []).map((item: any) => {
    const qty = Number(item.qty || item.quantity || 0);
    const rate = Number(item.rate || item.price || 0); // Try both rate and price
    const vatRate = Number(item.vatRate || item.taxPerct || 0);

    return {
      itemCode: item.item_code || item.itemCode || "",
      itemName: item.item_name || item.itemName || "",
      quantity: qty,
      rate: rate,
      uom: item.uom || "Unit",
      vatCd: item.vatCd || item.VatCd || "A",
      vatRate: vatRate,
      requiredBy: item.requiredBy || "",
    };
  });

  let taxRows: TaxRow[] = [];

  if (Array.isArray(api.taxes) && api.taxes.length > 0) {
    taxRows = api.taxes
      .filter((tax: any) => tax.type && tax.accountHead)
      .map((tax: any) => ({
        type: tax.type || "On Net Total",
        accountHead: tax.accountHead || "",
        taxRate: Number(tax.taxRate || 0),
        amount: Number(tax.taxableAmount || 0),
      }));
  } else if (api.tax) {
    taxRows = [
      {
        type: api.tax.type || "On Net Total",
        accountHead: api.tax.accountHead || "Tax",
        taxRate: parseFloat(api.tax.taxRate || "0"),
        amount: Number(api.tax.taxableAmount || 0),
      },
    ];
  }

  // Addresses
  const addresses = {
    supplierAddress: {
      addressTitle: "Supplier Main Address",
      addressType: "Billing" as const,
      addressLine1: api.addresses?.supplierAddress?.addressLine1 || "",
      addressLine2: api.addresses?.supplierAddress?.addressLine2 || "",
      city: api.addresses?.supplierAddress?.city || "",
      state: api.addresses?.supplierAddress?.state || "",
      country: api.addresses?.supplierAddress?.country || "",
      postalCode: api.addresses?.supplierAddress?.postalCode || "",
      phone: api.addresses?.supplierAddress?.phone || "",
      email: api.addresses?.supplierAddress?.email || "",
    },

    dispatchAddress: {
      addressTitle: "Warehouse Dispatch",
      addressType: "Shipping" as const,
      addressLine1: api.addresses?.dispatchAddress?.addressLine1 || "",
      addressLine2: api.addresses?.dispatchAddress?.addressLine2 || "",
      city: api.addresses?.dispatchAddress?.city || "",
      state: api.addresses?.dispatchAddress?.state || "",
      country: api.addresses?.dispatchAddress?.country || "",
      postalCode: api.addresses?.dispatchAddress?.postalCode || "",
    },

    shippingAddress: {
      addressTitle: "Customer Delivery Address",
      addressType: "Shipping" as const,
      addressLine1: api.addresses?.shippingAddress?.addressLine1 || "",
      addressLine2: api.addresses?.shippingAddress?.addressLine2 || "",
      city: api.addresses?.shippingAddress?.city || "",
      state: api.addresses?.shippingAddress?.state || "",
      country: api.addresses?.shippingAddress?.country || "",
      postalCode: api.addresses?.shippingAddress?.postalCode || "",
    },

    companyBillingAddress: {
      addressTitle: "Company HQ Billing",
      addressType: "Billing" as const,
      addressLine1: api.addresses?.companyBillingAddress?.addressLine1 || "",
      addressLine2: api.addresses?.companyBillingAddress?.addressLine2 || "",
      city: api.addresses?.companyBillingAddress?.city || "",
      state: api.addresses?.companyBillingAddress?.state || "",
      country: api.addresses?.companyBillingAddress?.country || "",
      postalCode: api.addresses?.companyBillingAddress?.postalCode || "",
    },
  };

  // Terms
  const buyingTerms =
    api.terms?.terms?.buying || api.terms?.buying || api.terms?.selling;

  const paymentPhases = buyingTerms?.payment?.phases || [];
  const paymentRows = paymentPhases.map((phase: any) => ({
    paymentTerm: phase.name || "",
    description: phase.condition || "",
    dueDate: "",
    invoicePortion: Number(phase.percentage || 0),
    paymentAmount: (api.grandTotal * Number(phase.percentage || 0)) / 100,
  }));

  // Totals
  const totalQuantity = items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0,
  );
  const subTotal = items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.rate,
    0,
  );
  const itemTaxTotal = items.reduce((sum: number, item: any) => {
    const base = item.quantity * item.rate;
    return sum + (base * (item.vatRate || 0)) / 100;
  }, 0);
  const taxRowTotal = taxRows.reduce((sum: number, tax: any) => {
    return sum + (tax.amount * tax.taxRate) / 100;
  }, 0);

  const grandTotal = api.grandTotal || subTotal + itemTaxTotal + taxRowTotal;
  const roundedTotal = Math.round(grandTotal);
  const roundingAdjustment = Number((roundedTotal - grandTotal).toFixed(2));

  const mappedForm: PurchaseInvoiceFormData = {
    ...emptyPOForm,

    poNumber: api.poId || "",
    date: api.poDate || "",
    requiredBy: api.requiredBy || api.deliveryDate || "",
    taxCategory: api.taxCategory || "",

    supplier: api.supplierName || "",
    supplierId: api.supplierId || "",
    supplierCode: api.supplierCode || "",
    supplierEmail: api.emailId || api.email || "",
    supplierPhone: api.phone || "",
    supplierContact: api.contactPerson || "",

    currency: api.currency || "ZMW",
    status: api.status || "Draft",

    costCenter: api.costCenter || "",
    project: api.project || "",

    destnCountryCd: api.destnCountryCd || api.exportToCountry || "",
    shippingRule: api.shippingRule || "",
    incoterm: api.incoterm || "",
    placeOfSupply: api.placeOfSupply || "",
    taxesChargesTemplate: api.taxesChargesTemplate || "",
    paymentTermsTemplate: api.paymentTermsTemplate || "",

    terms: buyingTerms ? { buying: buyingTerms } : undefined,

    addresses: addresses,
    items: items.length > 0 ? items : [{ ...emptyPOForm.items[0] }],
    taxRows: taxRows.length > 0 ? taxRows : [],
    paymentRows: paymentRows.length > 0 ? paymentRows : [],

    totalQuantity: totalQuantity,
    grandTotal: grandTotal,
    roundingAdjustment: roundingAdjustment,
    roundedTotal: roundedTotal,

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

export const mapSupplierToAddress = (
  supplier: any,
  prev: AddressBlock,
): AddressBlock => ({
  ...prev,
  addressLine1: supplier?.billingAddressLine1 ?? "",
  addressLine2: supplier?.billingAddressLine2 ?? "",
  city: supplier?.billingCity ?? "",
  state: supplier?.province ?? "",
  country: supplier?.billingCountry ?? "",
  postalCode: supplier?.billingPostalCode ?? "",
  phone: supplier?.phoneNo ?? "",
  email: supplier?.emailId ?? "",
});
