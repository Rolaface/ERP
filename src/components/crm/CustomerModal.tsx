import React, { useState, useEffect } from "react";
import Modal from "../ui/modal/modal";
import {
  showApiError,
  showSuccess,
  closeSwal,
  showLoading,
  showValidationError,
} from "../../utils/alert";
import { getCompanyById } from "../../api/companySetupApi";
const companyId = import.meta.env.VITE_COMPANY_ID;
import { Card, Button } from "../ui/modal/formComponent";
import { fetchCurrencyOptions } from "../../utils/currencyOptions";
import TermsAndCondition from "../TermsAndCondition";
import type { TermSection } from "../../types/termsAndCondition";
import { User, Building2, MapPin, FileText, DollarSign } from "lucide-react";
import { PaymentInfoTab } from "../../components/procurement/supply/PaymentInfoTab";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import {
  createCustomer,
  updateCustomerByCustomerCode,
} from "../../api/customerApi";
import AddressBlock from "../ui/modal/AddressBlock";
import type { CustomerDetail } from "../../types/customer";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
const defaultSellingTerms: TermSection = {
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

const emptyForm: CustomerDetail & { sameAsBilling: boolean } = {
  id: "",
  name: "",
  type: "",
  tpin: "",
  currency: "",
  onboardingBalance: 0,
  mobileCode: "",
  mobile: "",
  contactPerson: "",
  displayName: "",
  email: "",
  customerGroup: "",
  accountNumber: "",
  status: "Active",
  customerTaxCategory: "",
  billingAddressLine1: "",
  billingAddressLine2: "",
  billingPostalCode: "",
  billingCity: "",
  billingState: "",
  billingCountry: "",

  shippingAddressLine1: "",
  shippingAddressLine2: "",
  shippingPostalCode: "",
  shippingCity: "",
  shippingState: "",
  shippingCountry: "",

  terms: {
    selling: defaultSellingTerms,
  },
  sameAsBilling: true,
};


const customerTaxCategoryOptions = ["Export", "Non-Export", "LPO"];

const CustomerModal: React.FC<{
  isOpen: boolean;

  onClose: () => void;
  onSubmit?: (data: CustomerDetail) => void;
  initialData?: CustomerDetail | null;
  isEditMode?: boolean;
}> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false }) => {
  const [form, setForm] = useState<CustomerDetail & { sameAsBilling: boolean }>(
    emptyForm,
  );
  const [errors, setErrors] = useState<{
    type?: string;
    name?: string;
    tpin?: string;
    mobile?: string;
    email?: string;
    customerGroup?: string;
    currency?: string;
    displayName?: string;
    contactPerson?: string;
    customerTaxCategory?: string;
    accountNumber?: string;
    billingAddressLine1?: string;
    billingPostalCode?: string;
    billingCity?: string;
    billingState?: string;
    billingCountry?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "address" | "terms" | "bank"
  >("details");
  const [allowSubmit, setAllowSubmit] = useState(false);
  const [companySellingTerms, setCompanySellingTerms] =
    useState<TermSection | null>(null);

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
          terms: {
            ...prev.terms,
            selling: sellingTerms,
          },
        }));
      } catch (err) {
        console.error("Failed to load company terms", err);
      }
    };

    loadCompanyTerms();
  }, [companyId, isOpen, isEditMode]);

  useEffect(() => {
    if (initialData) {
      const splitMobile = (mobile?: string) => {
        if (!mobile) return { code: "", number: "" };

        const countryCodes = ["+91", "+260", "+1", "+44"]; // add as needed

        const matchedCode = countryCodes.find((code) =>
          mobile.startsWith(code),
        );

        if (matchedCode) {
          return {
            code: matchedCode,
            number: mobile.slice(matchedCode.length),
          };
        }

        return {
          code: "",
          number: mobile,
        };
      };

      const mobile = splitMobile(initialData.mobile);

      setForm({
        ...initialData,
        terms: initialData.terms ?? {
          selling: companySellingTerms ?? defaultSellingTerms,
        },
        mobileCode: mobile.code,
        mobile: mobile.number,
        sameAsBilling: !isEditMode,
      });
    } else {
      setForm(emptyForm);
    }

    setActiveTab("details");
    setLoading(false);
    setAllowSubmit(false);
    setErrors({});
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!form.displayName) {
      if (form.name) {
        setForm((prev) => ({ ...prev, displayName: form.name }));
      } else if (form.contactPerson) {
        setForm((prev) => ({ ...prev, displayName: form.contactPerson }));
      }
    }
  }, [form.name, form.contactPerson]);

  useEffect(() => {
    if (form.sameAsBilling) {
      setForm((prev) => ({
        ...prev,
        shippingAddressLine1: prev.billingAddressLine1,
        shippingAddressLine2: prev.billingAddressLine2,
        shippingPostalCode: prev.billingPostalCode,
        shippingCity: prev.billingCity,
        shippingState: prev.billingState,
        shippingCountry: prev.billingCountry,
      }));
    }
  }, [
    form.sameAsBilling,
    form.billingAddressLine1,
    form.billingAddressLine2,
    form.billingPostalCode,
    form.billingCity,
    form.billingState,
    form.billingCountry,
  ]);



  // for next button
  const tabs: Array<"details" | "bank" | "address" | "terms"> = [
    "details",
    "bank",
    "address",
    "terms",
  ];
  const validateDetailsTab = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate Type
    if (!form.type || form.type === "") {
      newErrors.type = "Type is required";
    }

    // Validate Customer Name
    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Customer name is required";
    }

    // Validate Contact Person
    if (!form.contactPerson || form.contactPerson.trim() === "") {
      newErrors.contactPerson = "Contact person is required";
    }

    // Validate TPIN
    if (!form.tpin || form.tpin.trim() === "") {
      newErrors.tpin = "TPIN is required";
    }

    if (!form.mobileCode || !form.mobile) {
      newErrors.mobile = "Mobile number is required";
    }
    

    // Validate Tax Category
    if (!form.customerTaxCategory || form.customerTaxCategory === "") {
      newErrors.customerTaxCategory = "Tax category is required";
    }

    // Validate Currency
    if (!form.currency || form.currency === "") {
      newErrors.currency = "Currency is required";
    }

    // Validate Email
    if (!form.email || form.email.trim() === "") {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddressTab = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate Billing Address Line 1 (required)
    if (!form.billingAddressLine1 || form.billingAddressLine1.trim() === "") {
      newErrors.billingAddressLine1 = "Billing address line 1 is required";
    }

    // Line 2 is optional - no validation

    // Validate Postal Code (required)
    if (!form.billingPostalCode || form.billingPostalCode.trim() === "") {
      newErrors.billingPostalCode = "Postal code is required";
    }

    // Validate City (required)
    if (!form.billingCity || form.billingCity.trim() === "") {
      newErrors.billingCity = "City is required";
    }

    // Validate State (required)
    if (!form.billingState || form.billingState.trim() === "") {
      newErrors.billingState = "State is required";
    }

    // Validate Country (required)
    if (!form.billingCountry || form.billingCountry.trim() === "") {
      newErrors.billingCountry = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeTab === "details") {
      const isValid = validateDetailsTab();

      if (!isValid) {
        const emptyFields = [];

        if (!form.type) emptyFields.push("Customer Type");
        if (!form.name) emptyFields.push("Customer Name");
        if (!form.contactPerson) emptyFields.push("Contact Person");
        if (!form.tpin) emptyFields.push("TPIN");
        if (!form.mobileCode || !form.mobile) emptyFields.push("Mobile Number");
        if (!form.customerTaxCategory) emptyFields.push("Tax Category");
        if (!form.currency) emptyFields.push("Currency");
        if (!form.email) emptyFields.push("Email");

        const message =
          emptyFields.length > 0
            ? `Please fill in required fields: ${emptyFields.join(", ")}`
            : "Please fix validation errors in Details tab";

        showValidationError(message);
        return;
      }
    }

    if (activeTab === "address") {
      const isValid = validateAddressTab();

      if (!isValid) {
        const emptyFields = [];

        if (!form.billingAddressLine1) emptyFields.push("Address Line 1");
        if (!form.billingCity) emptyFields.push("City");
        if (!form.billingState) emptyFields.push("State");
        if (!form.billingCountry) emptyFields.push("Country");
        if (!form.billingPostalCode) emptyFields.push("Postal Code");

        const message =
          emptyFields.length > 0
            ? `Please fill in required fields: ${emptyFields.join(", ")}`
            : "Please fix validation errors in Address tab";

        showValidationError(message);
        return;
      }
    }

    const currentIndex = tabs.indexOf(activeTab);

    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
      setAllowSubmit(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
     if (name === "bankAccounts") {
    setForm((prev) => ({ ...prev, bankAccounts: value as any }));
    return;
  }

    setForm((prev) => ({
      ...prev,
      [name]: name === "onboardingBalance" ? Number(value) : value,
    }));

    // Clear errors when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // 🔹 Email validation
    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          email: "Invalid email format",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For new customers, only allow submission from the Terms tab (last tab)
    if (!isEditMode && activeTab !== "terms") {
      handleNext();
      return;
    }

    // Prevent auto-submission when just navigating to terms tab
    if (!isEditMode && !allowSubmit) {
      return;
    }

    // Validate all tabs before submission
    if (!isEditMode) {
      if (!validateDetailsTab()) {
        setActiveTab("details"); // Go back to details tab if validation fails
        return;
      }
      if (!validateAddressTab()) {
        setActiveTab("address"); // Go back to address tab if validation fails
        return;
      }
    }

    if (loading) return; // prevent double submit

    setLoading(true);

    const formattedForm = {
      ...form,
      mobile: (() => {
        const raw = `${form.mobile || ""}`.replace(/^\+?\d{1,4}/, "");
        return `${form.mobileCode || ""}${raw}`;
      })(),
    };

    const { sameAsBilling, mobileCode, ...cleanForm } = formattedForm;

    const payload: CustomerDetail = {
      ...cleanForm,
    };

    try {
      //  Loading
      showLoading(isEditMode ? "Updating Customer..." : "Creating Customer...");

      if (isEditMode && initialData?.id) {
        await updateCustomerByCustomerCode(initialData.id, payload);
      } else {
        await createCustomer(payload);
      }

      //  Success
      closeSwal();

      showSuccess(
        isEditMode
          ? "Customer updated successfully!"
          : "Customer created successfully!",
      );

      onSubmit?.(payload);
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

    setForm({
      ...emptyForm,
      terms: {
        selling: companySellingTerms ?? defaultSellingTerms,
      },
      sameAsBilling: true,
    });

    setErrors({});
    setActiveTab("details");
    onClose();
  };
  const reset = () => {
    if (initialData) {
      setForm({
        ...initialData,
        terms: initialData.terms ?? {
          selling: companySellingTerms ?? defaultSellingTerms,
        },
        sameAsBilling: false,
      });
    } else {
      setForm({
        ...emptyForm,
        terms: {
          selling: companySellingTerms ?? defaultSellingTerms,
        },
        sameAsBilling: true,
      });
    }

    setErrors({});
    setActiveTab("details");
  };
  // Footer content
  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>

        <Button
          variant="primary"
          loading={loading}
          type={!isEditMode && activeTab !== "terms" ? "button" : "submit"}
          form={
            !isEditMode && activeTab !== "terms" ? undefined : "customerForm"
          }
          onClick={
            !isEditMode && activeTab !== "terms"
              ? handleNext
              : () => setAllowSubmit(true)
          }
        >
          {isEditMode
            ? "Update Customer"
            : activeTab === "terms"
              ? "Submit"
              : "Next"}
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Customer" : "Add New Customer"}
      subtitle={
        isEditMode
          ? "Update customer information"
          : "Fill in the details to create a new customer"
      }
      icon={isEditMode ? Building2 : User}
      footer={footer}
      maxWidth="6xl"
      height="81vh"
    >
      <form
        id="customerForm"
        onSubmit={handleSubmit}
        className="h-full flex flex-col"
      >
        {/* Tabs - Sticky Header */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {(["details", "bank", "address", "terms"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2
          ${
            activeTab === tab
              ? "text-primary border-b-[3px] border-primary"
              : "text-muted border-b-[3px] border-transparent hover:text-main"
          }`}
              >
                {/* ICONS KEPT FROM LOGIC 1 */}
                {tab === "details" && <User className="w-4 h-4" />}
                {tab === "bank" && <DollarSign className="w-4 h-4" />}
                {tab === "terms" && <FileText className="w-4 h-4" />}
                {tab === "address" && <MapPin className="w-4 h-4" />}

                {/* LABELS */}
                {tab === "details"
                  ? "Details"
                  : tab === "bank"
                    ? "Bank Details"
                    : tab === "address"
                      ? "Address"
                      : "Terms"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className=" px-4 py-2 bg-app mt-5">
          {activeTab === "details" && (
            <Card
              title="Basic Information"
              subtitle="Essential customer details"
              icon={<User className="w-5 h-5 text-primary" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <ModalSelect
                  label="Type"
                  name="type"
                  value={form.type || ""}
                  onChange={handleChange}
                  required
                  error={errors.type}
                  placeholder="Select Customer Type"
                >
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                </ModalSelect>
                <ModalInput
                  label="Customer Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  error={errors.name}
                />

                <ModalInput
                  label="Contact Person Name"
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  required
                  placeholder="Primary contact"
                  error={errors.contactPerson}
                />

                <ModalSelect
                  label="Display Name"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  required
                  options={[
                    { value: "", label: "Select Display Name" },
                    {
                      value: form.name,
                      label: form.name || "Customer Name",
                    },
                    {
                      value: form.contactPerson,
                      label: form.contactPerson || "Contact Person",
                    },
                  ].filter((o) => o.value)} 
                />

                <ModalInput
                  label="TPIN"
                  name="tpin"
                  value={form.tpin}
                  onChange={handleChange}
                  required
                  error={errors.tpin}
                  placeholder="Tax identification"
                />

                <ModalSelect
                  label="Tax Category"
                  name="customerTaxCategory"
                  value={form.customerTaxCategory}
                  onChange={handleChange}
                  required
                  error={errors.customerTaxCategory}
                  options={[
                    { value: "Export", label: "Export" },
                    { value: "Non-Export", label: "Non-Export" },
                    { value: "LPO", label: "LPO" },
                  ]}
                />

               <SearchSelect2
  label="Currency"
  value={form.currency}
  onChange={(value) =>
    handleChange({
      target: { name: "currency", value },
    } as React.ChangeEvent<HTMLSelectElement>)
  }
  fetchOptions={fetchCurrencyOptions}
  placeholder="Search currency..."
  required
  error={errors.currency}
/>

                <ModalInput
                  label="Onboard Balance"
                  name="onboardingBalance"
                  type="number"
                  value={form.onboardingBalance}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="no-spinner"
                />

                {/* Email + Mobile - span full width as a separate row */}
                <div className="col-span-4 grid grid-cols-4 gap-5">
                  <ModalInput
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="email@example.com"
                    error={errors.email}
                  />

                  {/* Mobile with code - matches ModalInput styling exactly */}
                  <div className="flex flex-col min-w-0">
                    <span className="block text-[10px] font-medium text-main mb-1">
                      Mobile <span className="text-danger">*</span>
                    </span>
                    <div className="flex gap-0">
                      <input
                        name="mobileCode"
                        value={form.mobileCode}
                        onChange={handleChange}
                        placeholder="+"
                        className={[
                          "w-[50px] py-1 px-2 border rounded text-[11px] text-main bg-card transition-all min-w-0",
                          errors.mobile
                            ? "border-danger focus:border-danger"
                            : "border-[var(--border)] hover:border-primary/40",
                        ].join(" ")}
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = errors.mobile
                            ? "0 0 0 3px rgba(239, 68, 68, 0.18)"
                            : "0 0 0 3px rgba(37, 99, 235, 0.16)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = "";
                        }}
                      />
                      <input
                        name="mobile"
                        type="tel"
                        value={form.mobile}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                        className={[
                          "flex-1 py-1 px-2 border rounded text-[11px] text-main bg-card transition-all min-w-0",
                          errors.mobile
                            ? "border-danger focus:border-danger"
                            : "border-[var(--border)] hover:border-primary/40",
                        ].join(" ")}
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = errors.mobile
                            ? "0 0 0 3px rgba(239, 68, 68, 0.18)"
                            : "0 0 0 3px rgba(37, 99, 235, 0.16)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = "";
                        }}
                      />
                    </div>
                    {errors.mobile && (
                      <span className="text-[10px] text-danger mt-1">
                        {errors.mobile}
                      </span>
                    )}
 
                    
                    
                  </div>
                              <ModalInput
  label="Customer Group"
  name="customerGroup"
  value={form.customerGroup}
  onChange={handleChange}
  placeholder="Enter customer group"
/>
                </div>
              </div>
            </Card>
          )}
          {activeTab === "bank" && (
            <PaymentInfoTab
              form={form as any}
              onChange={handleChange}
              errors={{ bankAccount: errors.accountNumber }}
              isEditMode={isEditMode}
              partyType="Customer"
              partyName={form.name || initialData?.name || ""}
              currency={form.currency}
            />
          )}

          {activeTab === "terms" && (
            <TermsAndCondition
             terms={form.terms?.selling || defaultSellingTerms}
              setTerms={(updated) =>
                setForm((p) => ({
                  ...p,
                  terms: { ...p.terms, selling: updated },
                }))
              }
              type="selling"
            />
          )}

          {activeTab === "address" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Billing Address */}
              <AddressBlock
                type="billing"
                title="Billing Address"
                subtitle="Invoice and payment details"
                data={{
                  line1: form.billingAddressLine1 ?? "",
                  line2: form.billingAddressLine2 ?? "",
                  postalCode: form.billingPostalCode ?? "",
                  city: form.billingCity ?? "",
                  state: form.billingState ?? "",
                  country: form.billingCountry ?? "",
                }}
                errors={{
                  line1: errors.billingAddressLine1,
                  postalCode: errors.billingPostalCode,
                  city: errors.billingCity,
                  state: errors.billingState,
                  country: errors.billingCountry,
                }}
                onChange={(e) => {
                  const { name, value } = e.target;

                  const map: Record<string, keyof typeof form> = {
                    line1: "billingAddressLine1",
                    line2: "billingAddressLine2",
                    postalCode: "billingPostalCode",
                    city: "billingCity",
                    state: "billingState",
                    country: "billingCountry",
                  };

                  setForm((prev) => ({
                    ...prev,
                    [map[name]]: value,
                  }));

                  // Clear error when user types
                  if (errors[map[name] as keyof typeof errors]) {
                    setErrors((prev) => ({
                      ...prev,
                      [map[name]]: undefined,
                    }));
                  }
                }}
              />

              {/* Shipping Address */}
              <AddressBlock
                type="shipping"
                title="Shipping Address"
                subtitle="Delivery location"
                data={{
                  line1: form.shippingAddressLine1 ?? "",
                  line2: form.shippingAddressLine2 ?? "",
                  postalCode: form.shippingPostalCode ?? "",
                  city: form.shippingCity ?? "",
                  state: form.shippingState ?? "",
                  country: form.shippingCountry ?? "",
                }}
                sameAsBilling={form.sameAsBilling}
                onSameAsBillingChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    sameAsBilling: checked,
                  }))
                }
                onChange={(e) => {
                  const { name, value } = e.target;

                  const map: Record<string, keyof typeof form> = {
                    line1: "shippingAddressLine1",
                    line2: "shippingAddressLine2",
                    postalCode: "shippingPostalCode",
                    city: "shippingCity",
                    state: "shippingState",
                    country: "shippingCountry",
                  };

                  setForm((prev) => ({
                    ...prev,
                    [map[name]]: value,
                  }));
                }}
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
export default CustomerModal;
  