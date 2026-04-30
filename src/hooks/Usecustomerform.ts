import { useState, useEffect, useRef } from "react";
import {
  showApiError,
  showSuccess,
  closeSwal,
  showLoading,
  showValidationError,
} from "../utils/alert";
import { getCompanyById } from "../api/companySetupApi";
import {
  createCustomer,
  updateCustomerByCustomerCode,
} from "../api/customerApi";
import type { TermSection } from "../types/termsAndCondition";
import type { CustomerDetail } from "../types/customer";
import type { ModalSubmitHandler } from "../types/modal";
import { REFRESH_KEYS, useDataRefreshStore } from "../store/dataRefreshStore";

const companyId = import.meta.env.VITE_COMPANY_ID;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactEntry {
  id?: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  email: string;
  mobileCode: string;
  mobileNumber: string;
  mobile: string;
  phone: string;
  isPrimary: boolean;
  isBilling: boolean;
}

export interface AddressEntry {
  id?: string;
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
  id?: string;
  name: string;
  type: "" | "Company" | "Individual";
  tpin: string;
  currency: string;
  onboardingBalance?: number;
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
  mobileNumber: "",
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
  onboardingBalance: undefined,
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

  const clean = mobile.replace(/\s/g, "");

  if (!clean.startsWith("+")) {
    return { code: "", number: clean };
  }

  // Same logic as mapSupplierToForm: slice(0, 3) = "+" + 2 digit code
  const code = clean.slice(0, 3);   // e.g. "+91"
  const number = clean.slice(3);    // e.g. "3534656"

  return { code, number };
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
        id: c.id,
        firstName: c.firstName ?? "",
        lastName: c.lastName ?? "",
        designation: c.designation ?? "",
        department: c.department ?? "",
        taxCategory: c.taxCategory ?? "",
        email: c.email ?? "",
        mobileCode: mob.code,
        mobileNumber: mob.number,
        mobile: c.mobile ?? `${mob.code}${mob.number}`,
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
      mobileNumber: mob.number,
      mobile: mob.code + mob.number,
      isPrimary: true,
      isBilling: true,
    }];
  }

  // ── Addresses ─────────────────────────────────────────────────────────────
  let addresses: AddressEntry[];
  if (data.addresses && data.addresses.length > 0) {
    addresses = data.addresses.map((a: any) => ({
      id: a.id,
      type: a.type === "Shipping" ? "Shipping" : "Billing",
      line1: a.line1 ?? "",
      line2: a.line2 ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      postalCode: a.postalCode ?? "",
      country: a.country ?? "",
      isPrimary: a.isPrimary ?? false,
    }));
    if (!addresses.some((a) => a.type === "Billing"))
      addresses.unshift({ ...defaultBillingAddress });
    if (!addresses.some((a) => a.type === "Shipping"))
      addresses.push({ ...defaultShippingAddress });
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
    displayName: data.displayName ?? data.name ?? "",
    customerGroup: data.customerGroup ?? "",
    accountNumber: data.accountNumber ?? "",
    status: (data.status as CustomerFormState["status"]) ?? "Active",
    customerTaxCategory: data.customerTaxCategory ?? "",
    contacts,
    addresses,
    sameAsBilling: false,
    terms: data.terms ?? {
      selling: companySellingTerms ?? defaultSellingTerms,
    },
  };
}

/**
 * Same payload shape for both POST (create) and PATCH (update).
 */
export function buildPayload(form: CustomerFormState): Record<string, any> {
  const { sameAsBilling, id, ...rest } = form;
  const contacts = form.contacts.map(
    ({ mobileCode, mobileNumber, id, ...contact }) => ({
      ...(id ? { id } : {}),
      ...contact,
      mobile: mobileNumber ? `${mobileCode}${mobileNumber}` : "",
    }),
  );

  let addresses = form.addresses.map((addr) => ({
    ...(addr.id ? { id: addr.id } : {}),
    type: addr.type,
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    isPrimary: addr.isPrimary,
  }));
  if (sameAsBilling) {
    const billing = addresses.find((a) => a.type === "Billing");

    addresses = addresses.map((a) =>
      a.type === "Shipping" && billing
        ? {
          ...a,
          line1: billing.line1,
          line2: billing.line2,
          city: billing.city,
          state: billing.state,
          postalCode: billing.postalCode,
          country: billing.country,
          isPrimary: false,
        }
        : a
    );
  }

  return { ...rest, contacts, addresses };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseCustomerFormOptions {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: CustomerDetail | null;
  onSubmit?: ModalSubmitHandler;
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
  const [companySellingTerms, setCompanySellingTerms] =
    useState<TermSection | null>(null);
  const submitRef = useRef(false);

  // ── Load company terms (create mode only) ─────────────────────────────────
  useEffect(() => {
    if (!isOpen || !companyId || isEditMode) return;
    const loadCompanyTerms = async () => {
      try {
        const res = await getCompanyById(companyId);
        const sellingTerms = res?.data?.terms?.selling;
        if (!sellingTerms) return;
        setCompanySellingTerms(sellingTerms);
        setForm((prev) => ({
          ...prev,
          terms: { ...prev.terms, selling: sellingTerms },
        }));
      } catch (err) {
        console.error("Failed to load company terms", err);
      }
    };
    loadCompanyTerms();
  }, [companyId, isOpen, isEditMode]);

  // ── Populate form from initialData ────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      const mapped = mapApiResponseToFormState(
        initialData,
        companySellingTerms,
      );
      const newId = initialData?.id || mapped.id || form.id;
      setForm({
        ...mapped,
        id: newId,
      });
    } else {
      setForm({
        ...emptyForm,
        terms: { selling: companySellingTerms ?? defaultSellingTerms },
        sameAsBilling: true,
      });
    }
    setActiveTab("details");
    setLoading(false);
    setAllowSubmit(false);
    setErrors({});
  }, [initialData, isOpen]);

  // ── Auto-fill displayName ─────────────────────────────────────────────────
  useEffect(() => {
    if (!form.displayName) {
      const primary = form.contacts.find((c) => c.isPrimary);
      const derivedName =
        form.name ||
        (primary ? `${primary.firstName} ${primary.lastName}`.trim() : "");
      if (derivedName)
        setForm((prev) => ({ ...prev, displayName: derivedName }));
    }
  }, [form.name, form.contacts]);

  // ── Sync shipping ← billing when sameAsBilling ────────────────────────────
  useEffect(() => {
    if (!form.sameAsBilling || isEditMode) return;

    const billing = form.addresses.find((a) => a.type === "Billing");
    if (!billing) return;

    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a) =>
        a.type === "Shipping"
          ? {
            ...a,
            line1: billing.line1,
            line2: billing.line2,
            city: billing.city,
            state: billing.state,
            postalCode: billing.postalCode,
            country: billing.country,
            isPrimary: false,
          }
          : a
      ),
    }));
  }, [
    form.sameAsBilling,
    form.addresses.find((a) => a.type === "Billing")?.line1,
    form.addresses.find((a) => a.type === "Billing")?.line2,
    form.addresses.find((a) => a.type === "Billing")?.city,
    form.addresses.find((a) => a.type === "Billing")?.state,
    form.addresses.find((a) => a.type === "Billing")?.postalCode,
    form.addresses.find((a) => a.type === "Billing")?.country,
  ]);

  // ─── Field handlers ───────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "onboardingBalance" ? Number(value) : value,
    }));
    if (errors[name as keyof CustomerFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePrimaryContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    updatePrimaryContact(name, value);
  };

  const updatePrimaryContact = (name: string, value: string) => {
    if (name === "mobileCode") {
      let val = value;

      if (!val.startsWith("+")) {
        val = "+" + val.replace(/\D/g, "");
      }

      val = "+" + val.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) =>
          c.isPrimary ? { ...c, mobileCode: val } : c
        ),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) =>
        c.isPrimary ? { ...c, [name]: value } : c
      ),
    }));
  };

  const handleAddressChange = (
    addressType: "Billing" | "Shipping",
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const fieldMap: Record<string, keyof AddressEntry> = {
      line1: "line1",
      line2: "line2",
      postalCode: "postalCode",
      city: "city",
      state: "state",
      country: "country",
    };
    const key = fieldMap[name] ?? (name as keyof AddressEntry);
    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a) =>
        a.type === addressType ? { ...a, [key]: value } : a,
      ),
    }));
    if (addressType === "Billing") {
      const errKey =
        `billing${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof CustomerFormErrors;
      if (errors[errKey])
        setErrors((prev) => ({ ...prev, [errKey]: undefined }));
    }
  };

  const setSameAsBilling = (checked: boolean) =>
    setForm((prev) => ({ ...prev, sameAsBilling: checked }));

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateDetailsTab = (): boolean => {
    const newErrors: CustomerFormErrors = {};
    const pc = form.contacts.find((c) => c.isPrimary);
    if (!form.type) newErrors.type = "Type is required";
    if (!form.name?.trim()) newErrors.name = "Customer name is required";
    if (!form.tpin?.trim()) newErrors.tpin = "TPIN is required";
    if (!form.customerTaxCategory)
      newErrors.customerTaxCategory = "Tax category is required";
    if (!form.currency) newErrors.currency = "Currency is required";
    if (!pc?.firstName?.trim())
      newErrors.contactFirstName = "First name is required";
    if (!pc?.mobileCode || !pc?.mobileNumber)
      newErrors.contactMobile = "Mobile number is required";
    if (!pc?.email?.trim()) newErrors.contactEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pc.email))
      newErrors.contactEmail = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddressTab = (): boolean => {
    const newErrors: CustomerFormErrors = {};
    const billing = form.addresses.find((a) => a.type === "Billing");
    if (!billing?.line1?.trim())
      newErrors.billingLine1 = "Billing address line 1 is required";
    if (!billing?.postalCode?.trim())
      newErrors.billingPostalCode = "Postal code is required";
    if (!billing?.city?.trim()) newErrors.billingCity = "City is required";
    if (!billing?.state?.trim()) newErrors.billingState = "State is required";
    if (!billing?.country?.trim())
      newErrors.billingCountry = "Country is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getValidationMessageForTab = (tab: ActiveTab): string => {
    if (tab === "details") {
      const pc = form.contacts.find((c) => c.isPrimary);
      const missing: string[] = [];
      if (!form.type) missing.push("Customer Type");
      if (!form.name) missing.push("Customer Name");
      if (!pc?.firstName) missing.push("Contact First Name");
      if (!form.tpin) missing.push("TPIN");
      if (!pc?.mobileCode || !pc?.mobileNumber) missing.push("Mobile Number");
      if (!form.customerTaxCategory) missing.push("Tax Category");
      if (!form.currency) missing.push("Currency");
      if (!pc?.email) missing.push("Email");
      return missing.length > 0
        ? `Please fill in required fields: ${missing.join(", ")}`
        : "Please fix validation errors in Details tab";
    }

    if (tab === "address") {
      const billing = form.addresses.find((a) => a.type === "Billing");
      const missing: string[] = [];
      if (!billing?.line1) missing.push("Address Line 1");
      if (!billing?.city) missing.push("City");
      if (!billing?.state) missing.push("State");
      if (!billing?.country) missing.push("Country");
      if (!billing?.postalCode) missing.push("Postal Code");
      return missing.length > 0
        ? `Please fill in required fields: ${missing.join(", ")}`
        : "Please fix validation errors in Address tab";
    }

    return "";
  };

  const validateTab = (tab: ActiveTab): boolean => {
    if (tab === "details") return validateDetailsTab();
    if (tab === "address") return validateAddressTab();
    setErrors({});
    return true;
  };

  const validateCurrentTab = (): boolean => {
    const isValid = validateTab(activeTab);
    if (!isValid) showValidationError(getValidationMessageForTab(activeTab));
    return isValid;
  };

  const validateAllTabs = (): boolean => {
    if (!validateDetailsTab()) {
      setActiveTab("details");
      showValidationError(getValidationMessageForTab("details"));
      return false;
    }

    if (!validateAddressTab()) {
      setActiveTab("address");
      showValidationError(getValidationMessageForTab("address"));
      return false;
    }

    return true;
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const tabs: ActiveTab[] = ["details", "bank", "address", "terms"];

  const handleNext = () => {
    if (!validateCurrentTab()) return;
    const idx = tabs.indexOf(activeTab);
    if (idx < tabs.length - 1) {
      setActiveTab(tabs[idx + 1]);
      setAllowSubmit(false);
    }
  };

  function getPatchPayload(original: any, updated: any) {
    const diff: any = {};
    Object.keys(updated).forEach((key) => {
      const originalValue = original[key];
      const updatedValue = updated[key];
      if (Array.isArray(updatedValue)) {
        if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
          diff[key] = updatedValue;
        }
      } else if (typeof updatedValue === "object" && updatedValue !== null) {
        if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
          diff[key] = updatedValue;
        }
      } else {
        if (originalValue !== updatedValue) {
          diff[key] = updatedValue;
        }
      }
    });
    return diff;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = (_e: React.FormEvent) => {
    _e.preventDefault();
  };

  const handleSubmitInternal = async () => {
    if (submitRef.current || loading) return false;

    if (!validateAllTabs()) return false;

    submitRef.current = true;
    setLoading(true);

    try {
      const payload = buildPayload(form);

      if (isEditMode) {
        const idToUse = form.id || initialData?.id;

        if (!idToUse) {
          showApiError(new Error("Customer ID is missing. Cannot update."));
          return false;
        }

        showLoading("Updating Customer...");

        const originalForm = mapApiResponseToFormState(initialData!, null);
        const originalPayload = buildPayload(originalForm);
        const patchPayload = {
          ...payload,
        };

        if (Object.keys(patchPayload).length === 0) {
          closeSwal();
          showSuccess("No changes detected");
          return false;
        }

        await updateCustomerByCustomerCode(idToUse, patchPayload);

        closeSwal();
        showSuccess("Customer updated successfully!");
        useDataRefreshStore
          .getState()
          .triggerRefresh(REFRESH_KEYS.CUSTOMER_LIST);
        const canClose = await onSubmit?.(payload);
        if (canClose === false) return false;
        handleClose();
      } else {
        showLoading("Creating Customer...");

        const res = await createCustomer(payload);

        closeSwal();

        // Backend response shape:
        // { message: { status_code, status, message, data: { customerId } } }
        const apiMessage =
          res?.message?.message ?? "Customer created successfully.";
        const customerId = res?.message?.data?.customerId ?? "";

        const createdCustomer = {
          id: customerId,
          name: form.name || form.displayName || customerId,
          ...payload,
        };

        showSuccess(
          customerId ? `${apiMessage}\nCustomer ID: ${customerId}` : apiMessage,
        );

        useDataRefreshStore
          .getState()
          .triggerRefresh(REFRESH_KEYS.CUSTOMER_LIST);

        const canClose = await onSubmit?.(createdCustomer);
        if (canClose === false) return false;
        handleClose();
      }

      return true;
    } catch (error) {
      closeSwal();
      showApiError(error);
      return false;
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  };

  // ─── Close / Reset ────────────────────────────────────────────────────────

  const handleClose = () => {
    if (loading) return;
    setForm({
      ...emptyForm,
      terms: { selling: companySellingTerms ?? defaultSellingTerms },
      sameAsBilling: true,
    });
    setErrors({});
    setActiveTab("details");
    onClose();
  };

  const reset = () => {
    if (initialData) {
      const mapped = mapApiResponseToFormState(
        initialData,
        companySellingTerms,
      );
      const newId = initialData?.id || mapped.id || form.id;
      setForm({ ...mapped, id: newId });
    } else {
      setForm({
        ...emptyForm,
        terms: { selling: companySellingTerms ?? defaultSellingTerms },
        sameAsBilling: true,
      });
    }
    setErrors({});
    setActiveTab("details");
  };

  const resetCurrentTab = () => {
    const base = initialData
      ? mapApiResponseToFormState(initialData, companySellingTerms)
      : {
        ...emptyForm,
        terms: { selling: companySellingTerms ?? defaultSellingTerms },
        sameAsBilling: true,
      };

    setErrors({});

    if (activeTab === "details") {
      setForm((prev) => ({
        ...prev,
        name: base.name,
        type: base.type,
        tpin: base.tpin,
        currency: base.currency,
        onboardingBalance: base.onboardingBalance,
        displayName: base.displayName,
        customerGroup: base.customerGroup,
        customerTaxCategory: base.customerTaxCategory,
        contacts: base.contacts,
      }));
      return;
    }

    if (activeTab === "bank") {
      setForm((prev) => ({
        ...prev,
        accountNumber: base.accountNumber,
      }));
      return;
    }

    if (activeTab === "address") {
      setForm((prev) => ({
        ...prev,
        addresses: base.addresses,
        sameAsBilling: base.sameAsBilling,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      terms: base.terms,
    }));
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const primaryContact =
    form.contacts.find((c) => c.isPrimary) ?? form.contacts[0];
  const billingAddress =
    form.addresses.find((a) => a.type === "Billing") ?? form.addresses[0];
  const shippingAddress =
    form.addresses.find((a) => a.type === "Shipping") ?? form.addresses[1];

  return {
    form,
    setForm,
    errors,
    loading,
    activeTab,
    setActiveTab,
    allowSubmit,
    setAllowSubmit,
    primaryContact,
    billingAddress,
    shippingAddress,
    tabs,
    handleChange,
    updatePrimaryContact,
    handlePrimaryContactChange,
    handleAddressChange,
    setSameAsBilling,
    handleNext,
    handleSubmit,
    handleSubmitInternal,
    handleClose,
    reset,
    validateCurrentTab,
    validateAllTabs,
    resetCurrentTab,
  };
}
