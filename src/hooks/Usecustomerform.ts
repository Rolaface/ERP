import { useState, useEffect } from "react";
import {
  showApiError,
  showSuccess,
  closeSwal,
  showLoading,
  showValidationError,
} from "../utils/alert";
import { getCompanyById } from "../api/companySetupApi";
import { createCustomer, updateCustomerByCustomerCode } from "../api/customerApi";
import type { TermSection } from "../types/termsAndCondition";
import type { CustomerDetail } from "../types/customer";

const companyId = import.meta.env.VITE_COMPANY_ID;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactEntry {
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  email: string;
  mobileCode: string;
  mobile: string;
  phone: string;
  isPrimary: boolean;
  isBilling: boolean;
}

export interface AddressEntry {
  type: "Billing" | "Shipping";
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface CustomerFormState {
  id: string;
  name: string;
  type: "" | "Company" | "Individual";
  tpin: string;
  currency: string;
  onboardingBalance: number;
  displayName: string;
  customerGroup: string;
  accountNumber: string;
  status: "Active" | "Inactive";
  customerTaxCategory: string;
  contacts: ContactEntry[];
  addresses: AddressEntry[];
  sameAsBilling: boolean;
  terms: {
    selling: TermSection;
  };
}

export interface CustomerFormErrors {
  type?: string;
  name?: string;
  tpin?: string;
  currency?: string;
  displayName?: string;
  customerTaxCategory?: string;
  accountNumber?: string;
  contactEmail?: string;
  contactMobile?: string;
  contactFirstName?: string;
  contactLastName?: string;
  billingLine1?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
}

export type ActiveTab = "details" | "bank" | "address" | "terms";

// ─── Constants ────────────────────────────────────────────────────────────────

export const defaultSellingTerms: TermSection = {
  general: "",
  delivery: "",
  cancellation: "",
  warranty: "",
  liability: "",
  payment: {
    dueDates: "",
    lateCharges: "",
    taxes: "",
    notes: "",
    phases: [],
  },
};

export const defaultContact: ContactEntry = {
  firstName: "",
  lastName: "",
  designation: "",
  department: "",
  email: "",
  mobileCode: "",
  mobile: "",
  phone: "",
  isPrimary: true,
  isBilling: true,
};

export const defaultBillingAddress: AddressEntry = {
  type: "Billing",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isPrimary: true,
};

export const defaultShippingAddress: AddressEntry = {
  type: "Shipping",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isPrimary: false,
};

export const emptyForm: CustomerFormState = {
  id: "",
  name: "",
  type: "",
  tpin: "",
  currency: "",
  onboardingBalance: 0,
  displayName: "",
  customerGroup: "",
  accountNumber: "",
  status: "Active",
  customerTaxCategory: "",
  contacts: [{ ...defaultContact }],
  addresses: [{ ...defaultBillingAddress }, { ...defaultShippingAddress }],
  sameAsBilling: true,
  terms: { selling: defaultSellingTerms },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitMobile(mobile?: string): { code: string; number: string } {
  if (!mobile) return { code: "", number: "" };
  const countryCodes = ["+91", "+260", "+1", "+44"];
  const matchedCode = countryCodes.find((code) => mobile.startsWith(code));
  if (matchedCode) return { code: matchedCode, number: mobile.slice(matchedCode.length) };
  return { code: "", number: mobile };
}

export function mapApiResponseToFormState(
  data: CustomerDetail,
  companySellingTerms: TermSection | null,
): CustomerFormState {
  // ── Contacts ──────────────────────────────────────────────────────────────
  let contacts: ContactEntry[];
  if (data.contacts && data.contacts.length > 0) {
    contacts = data.contacts.map((c: any) => {
      const mob = splitMobile(c.mobile);
      return {
        firstName: c.firstName ?? "",
        lastName: c.lastName ?? "",
        designation: c.designation ?? "",
        department: c.department ?? "",
        email: c.email ?? "",
        mobileCode: mob.code,
        mobile: mob.number,
        phone: c.phone ?? "",
        isPrimary: c.isPrimary ?? false,
        isBilling: c.isBilling ?? false,
      };
    });
  } else {
    const mob = splitMobile(data.mobile);
    contacts = [{
      ...defaultContact,
      firstName: data.contactPerson ?? "",
      email: data.email ?? "",
      mobileCode: mob.code,
      mobile: mob.number,
      isPrimary: true,
      isBilling: true,
    }];
  }

  // ── Addresses ─────────────────────────────────────────────────────────────
  let addresses: AddressEntry[];
  if (data.addresses && data.addresses.length > 0) {
    addresses = data.addresses.map((a: any) => ({
      type: a.type ?? "Billing",
      line1: a.line1 ?? "",
      line2: a.line2 ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      postalCode: a.postalCode ?? "",
      country: a.country ?? "",
      isPrimary: a.isPrimary ?? false,
    }));
    if (!addresses.some((a) => a.type === "Billing")) addresses.unshift({ ...defaultBillingAddress });
    if (!addresses.some((a) => a.type === "Shipping")) addresses.push({ ...defaultShippingAddress });
  } else {
    addresses = [
      {
        type: "Billing",
        line1: data.billingAddressLine1 ?? "",
        line2: data.billingAddressLine2 ?? "",
        city: data.billingCity ?? "",
        state: data.billingState ?? "",
        postalCode: data.billingPostalCode ?? "",
        country: data.billingCountry ?? "",
        isPrimary: true,
      },
      {
        type: "Shipping",
        line1: data.shippingAddressLine1 ?? "",
        line2: data.shippingAddressLine2 ?? "",
        city: data.shippingCity ?? "",
        state: data.shippingState ?? "",
        postalCode: data.shippingPostalCode ?? "",
        country: data.shippingCountry ?? "",
        isPrimary: false,
      },
    ];
  }

  return {
    id: data.id ?? "",
    name: data.name ?? "",
    type: (data.type as CustomerFormState["type"]) ?? "",
    tpin: data.tpin ?? "",
    currency: data.currency ?? "",
    onboardingBalance: data.onboardingBalance ?? 0,
    displayName: data.displayName ?? "",
    customerGroup: data.customerGroup ?? "",
    accountNumber: data.accountNumber ?? "",
    status: (data.status as CustomerFormState["status"]) ?? "Active",
    customerTaxCategory: data.customerTaxCategory ?? "",
    contacts,
    addresses,
    sameAsBilling: false,
    terms: data.terms ?? { selling: companySellingTerms ?? defaultSellingTerms },
  };
}

/**
 * Single payload builder — same shape for both create (POST) and update (PATCH).
 * mobileCode + mobile are merged into a single mobile string per contact.
 * sameAsBilling copies billing → shipping before sending.
 */
export function buildPayload(form: CustomerFormState): Record<string, any> {
  const { sameAsBilling, id, ...rest } = form;

  const contacts = form.contacts.map(({ mobileCode, mobile, ...contact }) => ({
    ...contact,
    mobile: mobile ? `${mobileCode}${mobile}` : "",
  }));

  let addresses = [...form.addresses];
  if (sameAsBilling) {
    const billing = addresses.find((a) => a.type === "Billing");
    addresses = addresses.map((a) =>
      a.type === "Shipping" && billing
        ? { ...billing, type: "Shipping" as const, isPrimary: false }
        : a,
    );
  }

  return { ...rest, contacts, addresses };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseCustomerFormOptions {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: CustomerDetail | null;
  onSubmit?: (data: CustomerDetail) => void;
  onClose: () => void;
}

export function useCustomerForm({
  isOpen,
  isEditMode,
  initialData,
  onSubmit,
  onClose,
}: UseCustomerFormOptions) {
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");
  const [allowSubmit, setAllowSubmit] = useState(false);
  const [companySellingTerms, setCompanySellingTerms] = useState<TermSection | null>(null);

  useEffect(() => {
    if (!isOpen || !companyId || isEditMode) return;
    const loadCompanyTerms = async () => {
      try {
        const res = await getCompanyById(companyId);
        const sellingTerms = res?.data?.terms?.selling;
        if (!sellingTerms) return;
        setCompanySellingTerms(sellingTerms);
        setForm((prev) => ({ ...prev, terms: { ...prev.terms, selling: sellingTerms } }));
      } catch (err) {
        console.error("Failed to load company terms", err);
      }
    };
    loadCompanyTerms();
  }, [companyId, isOpen, isEditMode]);

  useEffect(() => {
    if (initialData) {
      setForm(mapApiResponseToFormState(initialData, companySellingTerms));
    } else {
      setForm({ ...emptyForm, terms: { selling: companySellingTerms ?? defaultSellingTerms }, sameAsBilling: true });
    }
    setActiveTab("details");
    setLoading(false);
    setAllowSubmit(false);
    setErrors({});
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!form.displayName) {
      const primary = form.contacts.find((c) => c.isPrimary);
      const derivedName = form.name || (primary ? `${primary.firstName} ${primary.lastName}`.trim() : "");
      if (derivedName) setForm((prev) => ({ ...prev, displayName: derivedName }));
    }
  }, [form.name, form.contacts]);

  useEffect(() => {
    if (!form.sameAsBilling) return;
    const billing = form.addresses.find((a) => a.type === "Billing");
    if (!billing) return;
    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a) =>
        a.type === "Shipping" ? { ...billing, type: "Shipping" as const, isPrimary: false } : a,
      ),
    }));
  }, [
    form.sameAsBilling,
    form.addresses.find?.((a) => a.type === "Billing")?.line1,
    form.addresses.find?.((a) => a.type === "Billing")?.line2,
    form.addresses.find?.((a) => a.type === "Billing")?.city,
    form.addresses.find?.((a) => a.type === "Billing")?.state,
    form.addresses.find?.((a) => a.type === "Billing")?.postalCode,
    form.addresses.find?.((a) => a.type === "Billing")?.country,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "onboardingBalance" ? Number(value) : value }));
    if (errors[name as keyof CustomerFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePrimaryContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.isPrimary ? { ...c, [name]: value } : c)),
    }));
    if (name === "email" && value) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setErrors((prev) => ({ ...prev, contactEmail: ok ? undefined : "Invalid email format" }));
    }
    const errKey = `contact${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof CustomerFormErrors;
    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: undefined }));
  };

  const handleAddressChange = (
    addressType: "Billing" | "Shipping",
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const fieldMap: Record<string, keyof AddressEntry> = {
      line1: "line1", line2: "line2", postalCode: "postalCode",
      city: "city", state: "state", country: "country",
    };
    const key = fieldMap[name] ?? (name as keyof AddressEntry);
    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a) => (a.type === addressType ? { ...a, [key]: value } : a)),
    }));
    if (addressType === "Billing") {
      const errKey = `billing${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof CustomerFormErrors;
      if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: undefined }));
    }
  };

  const setSameAsBilling = (checked: boolean) =>
    setForm((prev) => ({ ...prev, sameAsBilling: checked }));

  const validateDetailsTab = (): boolean => {
    const newErrors: CustomerFormErrors = {};
    const pc = form.contacts.find((c) => c.isPrimary);
    if (!form.type) newErrors.type = "Type is required";
    if (!form.name?.trim()) newErrors.name = "Customer name is required";
    if (!form.tpin?.trim()) newErrors.tpin = "TPIN is required";
    if (!form.customerTaxCategory) newErrors.customerTaxCategory = "Tax category is required";
    if (!form.currency) newErrors.currency = "Currency is required";
    if (!pc?.firstName?.trim()) newErrors.contactFirstName = "First name is required";
    if (!pc?.mobileCode || !pc?.mobile) newErrors.contactMobile = "Mobile number is required";
    if (!pc?.email?.trim()) newErrors.contactEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pc.email)) newErrors.contactEmail = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddressTab = (): boolean => {
    const newErrors: CustomerFormErrors = {};
    const billing = form.addresses.find((a) => a.type === "Billing");
    if (!billing?.line1?.trim()) newErrors.billingLine1 = "Billing address line 1 is required";
    if (!billing?.postalCode?.trim()) newErrors.billingPostalCode = "Postal code is required";
    if (!billing?.city?.trim()) newErrors.billingCity = "City is required";
    if (!billing?.state?.trim()) newErrors.billingState = "State is required";
    if (!billing?.country?.trim()) newErrors.billingCountry = "Country is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const tabs: ActiveTab[] = ["details", "bank", "address", "terms"];

  const handleNext = () => {
    if (activeTab === "details" && !validateDetailsTab()) {
      const pc = form.contacts.find((c) => c.isPrimary);
      const missing: string[] = [];
      if (!form.type) missing.push("Customer Type");
      if (!form.name) missing.push("Customer Name");
      if (!pc?.firstName) missing.push("Contact First Name");
      if (!form.tpin) missing.push("TPIN");
      if (!pc?.mobileCode || !pc?.mobile) missing.push("Mobile Number");
      if (!form.customerTaxCategory) missing.push("Tax Category");
      if (!form.currency) missing.push("Currency");
      if (!pc?.email) missing.push("Email");
      showValidationError(
        missing.length > 0
          ? `Please fill in required fields: ${missing.join(", ")}`
          : "Please fix validation errors in Details tab",
      );
      return;
    }
    if (activeTab === "address" && !validateAddressTab()) {
      const billing = form.addresses.find((a) => a.type === "Billing");
      const missing: string[] = [];
      if (!billing?.line1) missing.push("Address Line 1");
      if (!billing?.city) missing.push("City");
      if (!billing?.state) missing.push("State");
      if (!billing?.country) missing.push("Country");
      if (!billing?.postalCode) missing.push("Postal Code");
      showValidationError(
        missing.length > 0
          ? `Please fill in required fields: ${missing.join(", ")}`
          : "Please fix validation errors in Address tab",
      );
      return;
    }
    const idx = tabs.indexOf(activeTab);
    if (idx < tabs.length - 1) { setActiveTab(tabs[idx + 1]); setAllowSubmit(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode && activeTab !== "terms") { handleNext(); return; }
    if (!isEditMode && !allowSubmit) return;
    if (!isEditMode) {
      if (!validateDetailsTab()) { setActiveTab("details"); return; }
      if (!validateAddressTab()) { setActiveTab("address"); return; }
    }
    if (loading) return;
    setLoading(true);

    // Same payload shape for both create and update
    const payload = buildPayload(form);

    try {
      showLoading(isEditMode ? "Updating Customer..." : "Creating Customer...");

      if (isEditMode && initialData?.id) {
        await updateCustomerByCustomerCode(initialData.id, payload); // PATCH
      } else {
        await createCustomer(payload); // POST
      }

      closeSwal();
      showSuccess(isEditMode ? "Customer updated successfully!" : "Customer created successfully!");
      onSubmit?.(payload as unknown as CustomerDetail);
      handleClose();
    } catch (error) {
      console.error("Customer save error:", error);
      closeSwal();
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm({ ...emptyForm, terms: { selling: companySellingTerms ?? defaultSellingTerms }, sameAsBilling: true });
    setErrors({});
    setActiveTab("details");
    onClose();
  };

  const reset = () => {
    if (initialData) {
      setForm(mapApiResponseToFormState(initialData, companySellingTerms));
    } else {
      setForm({ ...emptyForm, terms: { selling: companySellingTerms ?? defaultSellingTerms }, sameAsBilling: true });
    }
    setErrors({});
    setActiveTab("details");
  };

  const primaryContact = form.contacts.find((c) => c.isPrimary) ?? form.contacts[0];
  const billingAddress = form.addresses.find((a) => a.type === "Billing") ?? form.addresses[0];
  const shippingAddress = form.addresses.find((a) => a.type === "Shipping") ?? form.addresses[1];

  return {
    form, setForm, errors, loading,
    activeTab, setActiveTab, allowSubmit, setAllowSubmit,
    primaryContact, billingAddress, shippingAddress, tabs,
    handleChange, handlePrimaryContactChange, handleAddressChange,
    setSameAsBilling, handleNext, handleSubmit, handleClose, reset,
  };
}