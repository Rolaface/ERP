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
  bankAccounts:
    d.bankAccounts?.length > 0
      ? d.bankAccounts
      : [
          {
            bankName: d.bankAccount || "",
            accountNumber: d.accountNumber || "",
            accountHolder: d.accountHolder || "",
            sortCode: d.sortCode || "",
            swiftCode: d.swiftCode || "",
            branchAddress: d.branchAddress || "",
            isDefault: true,
          },
        ],
  openingBalance: Number(d.openingBalance || 0),
  paymentTerms: d.paymentTerms || "",
  dateOfAddition: d.dateOfAddition,
  status: d.status?.toLowerCase(),
    terms: {
    buying: d?.terms?.buying || { payment: { phases: [] } }
  },
});



export const mapSupplierToApi = (
  f: SupplierFormData,
  supplierId?: string | number
) => ({
  ...(supplierId ? { supplierId } : {}),

  supplierName: f.supplierName,
  supplierCode: f.supplierCode?.toUpperCase(),
  tpin: f.tpin,
  currency: f.currency,
  taxCategory: f.taxCategory,
  contactPerson: f.contactPerson,
  phoneNo: f.phoneNo,
  alternateNo: f.alternateNo,
  emailId: f.emailId,
   bankAccounts: (f.bankAccounts || []).map(acc => ({
    bankName: acc.bankName,
    accountNumber: acc.accountNumber,
    accountHolder: acc.accountHolder,
    sortCode: acc.sortCode,
    swiftCode: acc.swiftCode,
    branchAddress: acc.branchAddress,
    isDefault: acc.isDefault || false,
  })),

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
    terms: {
    buying: f.terms?.buying
  }
});



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
    buying: s?.terms?.buying || emptySupplierForm.terms?.buying
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
  }
});