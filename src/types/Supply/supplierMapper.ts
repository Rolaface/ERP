import { SupplierFormData, Supplier } from "../../types/Supply/supplier";
import { emptySupplierForm } from "./supplier";

// ─────────────────────────────────────────────────────────────────────────────
//  mapSupplierApi  —  API response (message.data)  →  Supplier (store shape)
//
//  KEY RULES:
//  • Keep contacts[] and addresses[] arrays intact — SupplierDetailView reads them
//  • Also flatten the primary contact into legacy flat fields (forms still use them)
//  • terms come as terms.Buying (capital B) from API — preserve that key
//  • supplierId  = d.id   (the API uses `id`, not `supplierId`)
//  • supplierName = d.name  (not `supplierName`)
//  • taxCategory  = d.supplierTaxCategory  (not `taxCategory`)
//  • createdAt    = d.createdAt  (not `dateOfAddition`)
// ─────────────────────────────────────────────────────────────────────────────

export const mapSupplierApi = (d: any): Supplier => {
  if (!d) return emptySupplierForm as Supplier;

  // Primary contact — prefer isPrimary flag, else first
  const contact =
    d.contacts?.find((c: any) => c.isPrimary) ?? d.contacts?.[0] ?? {};

  // Billing address — prefer type=Billing, else first
  const address =
    d.addresses?.find((a: any) => a.type === "Billing") ??
    d.addresses?.[0] ??
    {};

  return {
    // ── Identity (new API fields) ──────────────────────────────────────────
    id: d.id ?? "", // "SUP-2026-00008"
    supplierId: d.id ?? "", // keep both for legacy compat
    supplierName: d.name ?? "", // API sends `name`, not `supplierName`
    supplierCode: d.code ?? "",

    taxCategory: d.supplierTaxCategory ?? "", // API sends `supplierTaxCategory`
    tpin: d.tpin ?? "",
    currency: d.currency ?? "",
    type: d.type ?? "",
    supplierGroup: d.supplierGroup ?? "",
    status: d.status ?? "",

    // createdAt stored so SupplierDetailView can render it
    createdAt: d.createdAt ?? "",

    // ── Keep the full arrays (SupplierDetailView iterates these directly) ──
    contacts: Array.isArray(d.contacts) ? d.contacts : [],
    addresses: Array.isArray(d.addresses) ? d.addresses : [],

    // ── Flat contact fields (legacy — forms & dropdowns use these) ─────────
    contactPerson:
      contact.fullName ||
      `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() ||
      "",
    phoneNo: contact.mobile ?? contact.phone ?? "",
    alternateNo: "",
    emailId: contact.email ?? "",

    // ── Flat address fields (legacy — forms use these) ─────────────────────
    billingAddressLine1: address.line1 ?? "",
    billingAddressLine2: address.line2 ?? "",
    billingCity: address.city ?? "",
    province: address.state ?? "",
    billingPostalCode: address.postalCode ?? "",
    billingCountry: address.country ?? "",
    billingCounty: address.county ?? "", // county ≠ country
    district: address.county ?? "", // alias

    // ── Misc ───────────────────────────────────────────────────────────────
    openingBalance: 0,
    paymentTerms: "",
    dateOfAddition: d.createdAt ?? "",

    // ── Terms — API sends terms.Buying (capital B); keep BOTH keys so that
    //    SupplierDetailView (reads Buying) and forms (read buying) both work ─
    terms: {
      buying: d.terms?.buying ?? null,
      buying: d.terms?.buying ?? d.terms?.buying ?? { payment: { phases: [] } },
    },
  } as Supplier;
};

// ─────────────────────────────────────────────────────────────────────────────
//  mapSupplierToApi  —  form data  →  API request body (POST / PUT)
// ─────────────────────────────────────────────────────────────────────────────

export const mapSupplierToApi = (f: SupplierFormData, id?: string | number) => {
  return {
    ...(id ? { id } : {}),

    name: f.supplierName ?? "",
    type: f.type ?? "Company",
    tpin: f.tpin ?? "",
    currency: f.currency ?? "",
    supplierGroup: f.supplierGroup ?? "All Supplier Groups",
    status: f.status ?? "Active",
    supplierTaxCategory: f.taxCategory ?? "",

    contacts:
      f.contacts && f.contacts.length > 0
        ? f.contacts.map((c) => ({
            ...(c.id ? { id: c.id } : {}),
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            designation: c.designation || "",
            department: c.department || "",
            email: c.email || "",
            phone: c.phone || "",
            mobile: c.mobile || "",
            isPrimary: c.isPrimary ?? true,
            isBilling: c.isBilling ?? true,
          }))
        : [
            {
              firstName: f.contactPerson || "",
              lastName: "",
              email: f.emailId || "",
              mobile: `${f.phoneCode || ""}${f.phoneNo || ""}`,
              phone: "",
              isPrimary: true,
              isBilling: true,
            },
          ],

    addresses:
      f.addresses && f.addresses.length > 0
        ? f.addresses.map((a) => ({
            ...(a.id ? { id: a.id } : {}),
            type: a.type,
            line1: a.line1 || "",
            line2: a.line2 || "",
            city: a.city || "",
            state: a.state || "",
            county: a.county || "",
            postalCode: a.postalCode || "",
            country: a.country || "",
            isPrimary: a.isPrimary ?? false,
          }))
        : [
            {
              type: "Billing",
              line1: f.billingAddressLine1 || "",
              line2: f.billingAddressLine2 || "",
              city: f.billingCity || "",
              state: f.province || "",
              county: f.district || "",
              postalCode: f.billingPostalCode || "",
              country: f.billingCountry || "",
              isPrimary: true,
            },
          ],

    terms: {
      buying: f.terms?.buying ?? { payment: { phases: [] } },
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  mapSupplierToForm  —  Supplier (store)  →  SupplierFormData (edit form)
// ─────────────────────────────────────────────────────────────────────────────

export const mapSupplierToForm = (s?: Supplier | null): SupplierFormData => {
  if (!s) return emptySupplierForm;

  // Reconstruct flat contact fields from contacts[] if flat fields are missing
  const contacts = (s as any).contacts ?? [];
  const addresses = (s as any).addresses ?? [];
  const primary = contacts.find((c: any) => c.isPrimary) ?? contacts[0] ?? {};
  const billing =
    addresses.find((a: any) => a.type === "Billing") ?? addresses[0] ?? {};

  const contactPerson =
    s.contactPerson ||
    primary.fullName ||
    `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() ||
    "";

  const phoneNo = s.phoneNo || primary.mobile || primary.phone || "";
  const emailId = s.emailId || primary.email || "";

  return {
    ...emptySupplierForm,

    supplierName: s.supplierName ?? (s as any).name ?? "",
    supplierCode: s.supplierCode ?? "",
    tpin: s.tpin ?? "",
    taxCategory: s.taxCategory ?? (s as any).supplierTaxCategory ?? "",

    contactPerson,
    phoneCode: phoneNo.slice(0, 3),
    phoneNo: phoneNo.slice(3) || phoneNo,
    alternateCode: (s.alternateNo ?? "").slice(0, 3),
    alternateNo: (s.alternateNo ?? "").slice(3),
    emailId,

    currency: s.currency ?? "",
    paymentTerms: s.paymentTerms ?? "",
    type: s.type ?? "",
    supplierGroup: s.supplierGroup ?? "",
    status: s.status ?? "",
    dateOfAddition: s.dateOfAddition ?? (s as any).createdAt ?? "",

    openingBalance: Number(s.openingBalance ?? 0),

    // Keep arrays through for any component that needs them
    contacts: contacts.length ? contacts : (s.contacts ?? []),
    addresses: addresses.length ? addresses : (s.addresses ?? []),

    // Flat address fields
    billingAddressLine1: s.billingAddressLine1 ?? billing.line1 ?? "",
    billingAddressLine2: s.billingAddressLine2 ?? billing.line2 ?? "",
    billingCity: s.billingCity ?? billing.city ?? "",
    district: s.district ?? billing.county ?? "",
    province: s.province ?? billing.state ?? "",
    billingPostalCode: s.billingPostalCode ?? billing.postalCode ?? "",
    billingCountry: s.billingCountry ?? billing.country ?? "",
    billingCounty: s.billingCounty ?? billing.county ?? "",

    bankAccounts:
      (s as any).bankAccounts?.length > 0
        ? (s as any).bankAccounts.map((acc: any) => ({
            id: acc.id || crypto.randomUUID(),
            bankName: acc.bankName ?? "",
            accountNumber: acc.accountNumber ?? "",
            accountHolder: acc.accountHolder ?? "",
            sortCode: acc.sortCode ?? "",
            swiftCode: acc.swiftCode ?? "",
            branchAddress: acc.branchAddress ?? "",
            isDefault: acc.isDefault ?? false,
          }))
        : [
            {
              id: crypto.randomUUID(),
              bankName: (s as any).bankAccount ?? "",
              accountNumber: (s as any).accountNumber ?? "",
              accountHolder: (s as any).accountHolder ?? "",
              sortCode: (s as any).sortCode ?? "",
              swiftCode: (s as any).swiftCode ?? "",
              branchAddress: (s as any).branchAddress ?? "",
              isDefault: true,
            },
          ],

    terms: {
      buying:
        s.terms?.buying ??
        (s.terms as any)?.buying ??
        emptySupplierForm.terms?.buying,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  supplierApiToDropdown  —  lightweight shape for select dropdowns
// ─────────────────────────────────────────────────────────────────────────────

export const supplierApiToDropdown = (s: any) => ({
  // handles both old flat shape and new nested API shape
  id: s.id ?? s.supplierId,
  code: s.code ?? s.supplierCode,
  name: s.name ?? s.supplierName,
  email: s.emailId ?? s.contacts?.[0]?.email,
  phone: s.phoneNo ?? s.contacts?.[0]?.mobile,
  address: {
    line1: s.billingAddressLine1 ?? s.addresses?.[0]?.line1,
    line2: s.billingAddressLine2 ?? s.addresses?.[0]?.line2,
    city: s.billingCity ?? s.addresses?.[0]?.city,
    state: s.province ?? s.addresses?.[0]?.state,
    country: s.billingCountry ?? s.addresses?.[0]?.country,
    postalCode: s.billingPostalCode ?? s.addresses?.[0]?.postalCode,
  },
});
