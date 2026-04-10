import { SupplierFormData, Supplier } from "../../types/Supply/supplier";
import { emptySupplierForm } from "./supplier";

export const mapSupplierApi = (d: any): Supplier => {
  const contact = d.contacts?.[0] || {};

  return {
    supplierId: d.id,
    supplierName: d.name || "",
    supplierCode: d.code || "",
    taxCategory: d.supplierTaxCategory || "",
    tpin: d.tpin || "",
    currency: d.currency || "",

    phoneNo: contact.phone || "",
    alternateNo: "",
    emailId: contact.email || "",
    contactPerson:
      contact.fullName ||
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),

    billingAddressLine1: "",
    billingAddressLine2: "",
    district: "",
    province: "",
    billingCity: "",
    billingCountry: "",
    billingPostalCode: "",

    openingBalance: 0,
    paymentTerms: "",
    dateOfAddition: "",
    status: d.status?.toLowerCase(),

    terms: {
      buying: d?.terms?.buying || { payment: { phases: [] } }
    },
  };
};

export const mapSupplierToApi = (
  f: SupplierFormData,
  supplierId?: string | number,
) => {
  const names = f.contactPerson?.split(" ") || [];

  return {
    ...(supplierId ? { supplierId } : {}),

    name: f.supplierName,
    type: "Company",
    tpin: f.tpin,
    currency: f.currency,
    supplierGroup: "All Supplier Groups",
    status: "Active",
    supplierTaxCategory: f.taxCategory,

    contacts: [
      {
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        designation: "",
        department: "",
        email: f.emailId,
        phone: `${f.phoneCode || ""}${f.phoneNo || ""}`,
        mobile: `${f.phoneCode || ""}${f.phoneNo || ""}`,
        isPrimary: true,
        isBilling: true,
      },
    ],

    addresses: [
      {
        type: "Billing",
        line1: f.billingAddressLine1,
        line2: f.billingAddressLine2 || "",
        city: f.billingCity,
        state: f.province,
        postalCode: f.billingPostalCode,
        country: f.billingCountry,
        isPrimary: true,
      },
    ],

    terms: {
      buying: f.terms?.buying,
    },
  };
};

export const mapSupplierToForm = (s?: Supplier | null): SupplierFormData => {
  if (!s) return emptySupplierForm;

  return {
    ...emptySupplierForm,

    supplierName: s.supplierName ?? "",
    supplierCode: s.supplierCode ?? "",
    tpin: s.tpin ?? "",
    taxCategory: s.taxCategory ?? "",

    contactPerson: s.contactPerson ?? "",
    phoneCode: s.phoneNo?.slice(0, 3) ?? "",
    phoneNo: s.phoneNo?.slice(3) ?? "",
    alternateCode: s.alternateNo?.slice(0, 3) ?? "",
    alternateNo: s.alternateNo?.slice(3) ?? "",
    emailId: s.emailId ?? "",

    currency: s.currency ?? "",
    paymentTerms: s.paymentTerms ?? "",
    dateOfAddition: s.dateOfAddition ?? "",

    openingBalance: Number(s.openingBalance ?? 0),
    bankAccounts:
      (s as any).bankAccounts?.length > 0
        ? (s as any).bankAccounts.map((acc: any) => ({
            id: crypto.randomUUID(),
            bankName: acc.bankName || "",
            accountNumber: acc.accountNumber || "",
            accountHolder: acc.accountHolder || "",
            sortCode: acc.sortCode || "",
            swiftCode: acc.swiftCode || "",
            branchAddress: acc.branchAddress || "",
            isDefault: acc.isDefault || false,
          }))
        : [
            {
              id: crypto.randomUUID(),
              bankName: (s as any).bankAccount || "",
              accountNumber: (s as any).accountNumber || "",
              accountHolder: (s as any).accountHolder || "",
              sortCode: (s as any).sortCode || "",
              swiftCode: (s as any).swiftCode || "",
              branchAddress: (s as any).branchAddress || "",
              isDefault: true,
            },
          ],

    billingAddressLine1: s.billingAddressLine1 ?? "",
    billingAddressLine2: s.billingAddressLine2 ?? "",
    billingCity: s.billingCity ?? "",
    district: s.district ?? "",
    province: s.province ?? "",
    billingPostalCode: s.billingPostalCode ?? "",
    billingCountry: s.billingCountry ?? "",
    terms: {
      buying: s?.terms?.buying || emptySupplierForm.terms?.buying,
    },
  };
};

export const supplierApiToDropdown = (s: any) => ({
  id: s.supplierId,
  code: s.supplierCode,
  name: s.supplierName,
  email: s.emailId,
  phone: s.phoneNo,
  address: {
    line1: s.billingAddressLine1,
    line2: s.billingAddressLine2,
    city: s.billingCity,
    state: s.province,
    country: s.billingCountry,
    postalCode: s.billingPostalCode,
  },
});
