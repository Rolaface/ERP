import { PurchaseOrderFormData, emptyPOForm } from "./purchaseOrder";
import type { AddressBlock } from "./purchaseOrder";

export const mapUIToCreatePO = (form: PurchaseOrderFormData) => {
  console.log("MAPPING PO TO BACKEND - Form items:", form.items);

  const validItems = form.items.filter((it) => {
    const hasCode = it.itemCode && it.itemCode.trim() !== "";
    const hasQty = it.quantity && Number(it.quantity) > 0;
    const hasRate = it.rate && Number(it.rate) > 0;

    return hasCode && hasQty && hasRate; // Only include complete items
  });

  const items = validItems.map((it, idx) => {
    // Force number conversion
    const quantity = Number(it.quantity);
    const rate = Number(it.rate);
    const vatRate = Number(it.vatRate || 0);

    return {
      itemCode: it.itemCode,
      itemName: it.itemName || "",
      quantity: quantity,
      rate: rate,
      uom: it.uom,
      vatCd: it.vatCd,
      vatRate: vatRate,
      requiredBy: it.requiredBy || form.date,
      packingUnit: Number(it.packingUnit || 0),
      packingSize: Number(it.packingSize || 0),
      packing: it.packing || "",
      ...(it.warehouse && { warehouse: it.warehouse }),
    };
  });
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
    supplierId: form.supplierId,
    contactPerson: form.supplierContact,
    currency: form.currency,
    status: form.status,
    taxCategory: form.taxCategory,
    referenceNumber: form.referenceNumber,
    ...(form.costCenter && { costCenter: form.costCenter }),
    ...(form.project && { project: form.project }),
    ...(form.shippingRule && { shippingRule: form.shippingRule }),
    ...(form.incoterm && { incoterm: form.incoterm }),
    ...(form.paymentTermsTemplate && {
      paymentTermsTemplate: form.paymentTermsTemplate,
    }),
    ...(form.taxesChargesTemplate && {
      taxesChargesTemplate: form.taxesChargesTemplate,
    }),

    supplier_address: form.addresses?.supplierAddress?.id || "",
    shipping_address: form.addresses?.shippingAddress?.id || "",
    dispatch_address: form.addresses?.dispatchAddress?.id || "",
    billing_address: form.addresses?.companyBillingAddress?.id || "",
    set_warehouse: form.warehouse || "",

    terms: {
      buying: form.terms?.buying || {},
    },

    items: items,

    ...(taxes.length > 0 && { taxes }),
    ...(payments.length > 0 && { payments }),

    metadata: {},
  };

  return payload;
};
export const mapApiToUI = (apiResponse: any): PurchaseOrderFormData => {
  const api = apiResponse.data || apiResponse;
const items = (api.items || []).map((item: any) => {
  const qty = Number(item.qty || item.quantity || 0);
  const rate = Number(item.rate || item.price || 0);
  const selectedTax =
    item.taxInfo?.find(
      (t: any) =>
        t.taxCategory?.toLowerCase() ===
        api.taxCategory?.toLowerCase()
    ) || item.taxInfo?.[0];

  const vatRate = Number(selectedTax?.totalTaxRate || 0);
  const vatCd = selectedTax?.taxName || "";

  return {
    itemCode: item.item_code || item.itemCode || "",
    itemName: item.item_name || item.itemName || "",

    quantity: qty,
    rate: rate,

    uom: item.uom,

    vatRate: vatRate,   
    vatCd: vatCd,       

    requiredBy: item.requiredBy || api.deliveryDate || "",
    warehouse: item.warehouse || "",

    packingUnit: Number(item.packingUnit || 0),
    packingSize: Number(item.packingSize || 0),
    packing: `(${item.packingUnit || 0}) x (${item.packingSize || 0})`,
  };
});

  // Tax rows
  const taxRows = (api.taxes || [])
    .filter((tax: any) => tax.type && tax.accountHead)
    .map((tax: any) => ({
      type: tax.type || "On Net Total",
      accountHead: tax.accountHead || "",
      taxRate: Number(tax.taxRate || 0),
      amount: Number(tax.taxableAmount || 0),
    }));

  // Addresses
const addresses = {
  supplierAddress: {
    id: api.supplierAddress || "",
    addressTitle: "Supplier Main Address",
    addressType: "Billing" as const,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
    email: "",
  },

  dispatchAddress: {
    id: api.dispatchAddress || "",
    addressTitle: "Warehouse Dispatch",
    addressType: "Shipping" as const,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  },

  shippingAddress: {
    id: api.shippingAddress || "",
    addressTitle: "Customer Delivery Address",
    addressType: "Shipping" as const,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  },

  companyBillingAddress: {
    id: api.billingAddress || "",
    addressTitle: "Company HQ Billing",
    addressType: "Billing" as const,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  },
};

  // TermS

  const buyingTerms = api.terms?.terms?.buying || api.terms?.buying;

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

  const mappedForm: PurchaseOrderFormData = {
    ...emptyPOForm,

    poNumber: api.poId || "",
    date: api.poDate || "",
    taxCategory: api.taxCategory || "",
    referenceNumber: api.referenceNumber || "",
    supplier: api.supplierName || "",
    supplierId: api.supplierId || "",
    supplierCode: api.supplierCode || "",
    supplierEmail: api.emailId || api.email || "",
    supplierPhone: api.phone || "",
    supplierContact: api.contactPerson || "",        
    supplierContactDisplay: api.contactDisplay || "",

    currency: api.currency || "",
    status: api.status || "",
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
