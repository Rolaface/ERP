import { SupplierFormData, Supplier } from "../../types/Supply/supplier";
import { emptySupplierForm } from "./supplier";

export const mapSupplierApi = (d: any): Supplier => ({
  supplierId: d.supplierId,
  supplierName: d.supplierName,
  supplierCode: d.supplierCode,
  taxCategory: d.taxCategory,
  tpin: d.tpin,
  currency: d.currency,
  phoneNo: d.mobile_no || d.phoneNo,
  alternateNo: d.alternateNo || "",
  emailId: d.emailId,
  contactPerson: d.contactPerson || "",
  billingAddressLine1: d.billingAddressLine1,
  billingAddressLine2: d.billingAddressLine2,
  district: d.district,
  province: d.province,
  billingCity: d.billingCity || d.city || "",
  billingCountry: d.billingCountry || d.country || "",
  billingPostalCode: d.billingPostalCode || d.postalCode || "",
  bankAccount: d.bankAccount || "",
  accountNumber: d.accountNumber,
  accountHolder: d.accountHolder,
  sortCode: d.sortCode,
  swiftCode: d.swiftCode,
  branchAddress: d.branchAddress,
  openingBalance: Number(d.openingBalance || 0),
  paymentTerms: d.paymentTerms || "",
  dateOfAddition: d.dateOfAddition,
  status: d.status?.toLowerCase(),
});

export const mapSupplierToApi = (
  f: SupplierFormData,
  supplierId?: string | number,
) => ({
  ...(supplierId ? { supplierId } : {}),

  supplierName: f.supplierName,
  supplierCode: f.supplierCode,
  tpin: f.tpin,
  currency: f.currency,
  taxCategory: f.taxCategory,
  contactPerson: f.contactPerson,
  phoneNo: f.phoneNo,
  alternateNo: f.alternateNo,
  emailId: f.emailId,

  bankAccount: f.bankAccount,
  accountNumber: f.accountNumber,
  accountHolder: f.accountHolder,
  sortCode: f.sortCode,
  swiftCode: f.swiftCode,
  branchAddress: f.branchAddress,

  billingAddressLine1: f.billingAddressLine1,
  billingAddressLine2: f.billingAddressLine2,
  billingCity: f.billingCity,
  district: f.district,
  province: f.province,
  billingCountry: f.billingCountry,
  billingPostalCode: f.billingPostalCode,

  openingBalance: Number(f.openingBalance || 0),
  paymentTerms: f.paymentTerms || "",
  dateOfAddition: f.dateOfAddition,
});

export const mapSupplierToForm = (s?: Supplier | null): SupplierFormData => {
  if (!s) return emptySupplierForm;

  return {
    ...emptySupplierForm,

    supplierName: s.supplierName ?? "",
    supplierCode: s.supplierCode ?? "",
    tpin: s.tpin ?? "",

    contactPerson: s.contactPerson ?? "",
    phoneNo: s.phoneNo ?? "",
    alternateNo: s.alternateNo ?? "",
    emailId: s.emailId ?? "",

    currency: s.currency ?? "ZMW",
    paymentTerms: s.paymentTerms ?? "",
    dateOfAddition: s.dateOfAddition ?? "",

    openingBalance: Number(s.openingBalance ?? 0),

    bankAccount: s.bankAccount ?? "",
    accountNumber: s.accountNumber ?? "",
    accountHolder: s.accountHolder ?? "",
    sortCode: s.sortCode ?? "",
    swiftCode: s.swiftCode ?? "",
    branchAddress: s.branchAddress ?? "",

    billingAddressLine1: s.billingAddressLine1 ?? "",
    billingAddressLine2: s.billingAddressLine2 ?? "",
    billingCity: s.billingCity ?? "",
    district: s.district ?? "",
    province: s.province ?? "",
    billingPostalCode: s.billingPostalCode ?? "",
    billingCountry: s.billingCountry ?? "",
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
