import React from "react";
import {
  Building2,
  Banknote,
  FileText,
  MapPin,
  Users,
  User,
  Search,
} from "lucide-react";
import Tooltip from "../Tooltip";
import TaxCategorySelect from "../selects/TaxCategorySelect";
import TermsAndCondition from "../TermsAndCondition";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import AddressBlock from "../ui/modal/AddressBlock";
import CustomerGroupSearchSelect from "../selects/customergroupSelect";
import { Card } from "../ui/modal/formComponent";
import {
  ModalInput,
  ModalSelect,
  NumericInput,
} from "../ui/modal/modalComponent";
import { PaymentInfoTab } from "../../components/procurement/supply/PaymentInfoTab";
import { fetchCurrencyOptions } from "../../utils/currencyOptions";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import {
  defaultSellingTerms,
  useCustomerForm,
} from "../../hooks/Usecustomerform";
import type { CustomerDetail } from "../../types/customer";
import type { StandardModalProps } from "../../types/modal";
import PhoneCodeSelect from "../common/PhoneCodeSelect";
import type { ActiveTab } from "../../hooks/Usecustomerform";
import { useCompanyStore } from "../../store/companyStore";
import { useCompanyDefaultsStore } from "../../store/Companydefaultsstore";
import { selectPrincipals } from "../../api/customerApi";
import { showApiError } from "../../utils/alert";

type CustomerModalProps = StandardModalProps<unknown, CustomerDetail>;

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
}) => {
  const resolvedModalId =
    modalId ||
    (isEditMode && initialData?.id
      ? `customer-edit-${initialData.id}-${Date.now()}`
      : `customer-create-${Date.now()}`);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const isZraEnabled = useCompanyStore((s) => s.isZraEnabled);
  const isRvatAgent = useCompanyDefaultsStore((s) => {
    const value = s.defaults?.is_rvat_agent;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return ["1", "true", "yes", "y"].includes(normalized);
    }
    return false;
  });
  const [isPrincipalModalOpen, setIsPrincipalModalOpen] = React.useState(false);
  const [principalOptions, setPrincipalOptions] = React.useState<any[]>([]);
  const [principalLoading, setPrincipalLoading] = React.useState(false);
  const [selectedPrincipalName, setSelectedPrincipalName] = React.useState("");

  React.useEffect(() => {
    useCompanyDefaultsStore.getState().fetchDefaults();
  }, []);

  const {
    form,
    setForm,
    errors,
    loading,
    activeTab,
    setActiveTab,
    primaryContact,
    billingAddress,
    shippingAddress,
    handleChange,
    handlePrimaryContactChange,
    updatePrimaryContact,
    handleAddressChange,
    setSameAsBilling,
    handleNext,
    handleSubmitInternal,
    reset,
    resetCurrentTab,
  } = useCustomerForm({ isOpen, isEditMode, initialData, onSubmit, onClose });

  const handleCloseWithWarning = () =>
    handleCloseWithConfirm(() => {
      resetDirty();
      reset();
      onClose();
    }, resolvedModalId);

  const tabs: ActiveTab[] = ["details", "bank", "address", "terms"];
  const currentTabIndex = tabs.indexOf(activeTab);

  const handleSubmitForm = async () => {
    const didSave = await handleSubmitInternal();
    if (didSave) resetDirty();
    return didSave;
  };

  const showPrincipalLookup = isZraEnabled && isRvatAgent;

  const handleOpenPrincipalLookup = async () => {
    if (!showPrincipalLookup) return;

    setPrincipalLoading(true);
    setIsPrincipalModalOpen(true);

    try {
      const res = await selectPrincipals();
      const list =
        res?.data?.taxpayerPrincipalList ??
        res?.taxpayerPrincipalList ??
        res?.message?.data?.taxpayerPrincipalList ??
        [];

      setPrincipalOptions(list);
    } catch (error) {
      setPrincipalOptions([]);
      showApiError(error);
    } finally {
      setPrincipalLoading(false);
    }
  };

  const handleSelectPrincipal = (principal: any) => {
    const fullName = principal?.principalNm || "";
    const email = principal?.principalEmail || "";
    const phone = principal?.principalTelNo || "";
    const address = principal?.principalAddress || "";
    const tpin = principal?.tpin || "";
    const tin = principal?.tin || "";
    const accountNo = principal?.accountNo || "";
    const principalId = principal?.id || ""; 
  
    setForm((prev) => ({
      ...prev,
      name: fullName || prev.name,
      tpin: tpin || prev.tpin,
      displayName: fullName || prev.displayName,
      registration_no: tin || prev.registration_no || "",
      accountNumber: accountNo || prev.accountNumber,
      principalId: principalId || prev.principalId,
      contacts: prev.contacts.map((contact) =>
        contact.isPrimary
          ? {
              ...contact,
              firstName: fullName || contact.firstName,
              email: email || contact.email,
              mobileNumber: phone.replace(/\D/g, "") || contact.mobileNumber,
              mobile: phone
                ? `${contact.mobileCode || ""}${phone.replace(/\D/g, "")}`
                : contact.mobile,
            }
          : contact,
      ),
      addresses: prev.addresses.map((addressEntry) =>
        addressEntry.type === "Billing"
          ? { ...addressEntry, line1: address || addressEntry.line1 }
          : addressEntry,
      ),
    }));

    setSelectedPrincipalName(fullName);
    setIsPrincipalModalOpen(false);
  };

  const footer = (
    <ModalFooter
      onCancel={handleCloseWithWarning}
      onReset={() => {
        resetDirty();
        resetCurrentTab();
      }}
      onSubmit={handleSubmitForm}
      onNext={activeTab === "terms" ? undefined : handleNext}
      currentTab={currentTabIndex}
      totalTabs={tabs.length}
      isSubmitting={loading}
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleCloseWithWarning}
      title={isEditMode ? "Edit Customer" : "Add Customer"}
      subtitle={
        isEditMode
          ? "Edit and Manage customer information"
          : "Fill in the details to add a new customer"
      }
      icon={isEditMode ? Building2 : Users}
      footer={footer}
      maxWidth="6xl"
      height="90vh"
    >
      <form
        id="customerForm"
        onChange={() => markDirty()}
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {(["details", "bank", "address", "terms"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${activeTab === tab
                    ? "text-primary border-b-[3px] border-primary"
                    : "text-muted border-b-[3px] border-transparent hover:text-main"
                  }`}
              >
                {tab === "details" && <User className="w-4 h-4" />}
                {tab === "bank" && <Banknote className="w-4 h-4" />}
                {tab === "terms" && <FileText className="w-4 h-4" />}
                {tab === "address" && <MapPin className="w-4 h-4" />}
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

        <div className="px-4 py-2 bg-app mt-5">
          {activeTab === "details" && (
            <Card
              title="Basic Information"
              subtitle="Essential customer details"
              icon={<User className="w-5 h-5 text-primary" />}
            >
            {showPrincipalLookup && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-4">
                <div className="md:col-span-3 flex items-center justify-between gap-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Search className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-main truncate">
                        {selectedPrincipalName
                          ? `Prefilled from ${selectedPrincipalName}`
                          : "Have a ZRA Principal?"}
                      </p>
                      <p className="text-[10px] text-muted">
                        {selectedPrincipalName
                          ? "Details imported — click to pick a different principal."
                          : "Auto-fill name, contact and address instantly from ZRA."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenPrincipalLookup}
                    className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary/90 transition-colors"
                  >
                    {selectedPrincipalName ? "Change" : "Import from ZRA"}
                  </button>
                </div>
              </div>
            )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5  mt-4">
                <Tooltip content={form.type || "Select Customer Type"}>
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
                </Tooltip>

                <Tooltip content={form.name || "Enter full name"}>
                  <ModalInput
                    label="Customer Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter full name"
                    error={errors.name}
                  />
                </Tooltip>
                <CustomerGroupSearchSelect
                  value={form.customerGroup}
                  onChange={(value) =>
                    handleChange({
                      target: { name: "customerGroup", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5  mt-4">
                <Tooltip
                  content={primaryContact?.firstName || "Primary contact"}
                >
                  <ModalInput
                    label="Contact Person First Name"
                    name="firstName"
                    value={primaryContact?.firstName ?? ""}
                    onChange={handlePrimaryContactChange}
                    required
                    placeholder="Primary contact"
                    error={errors.contactFirstName}
                  />
                </Tooltip>

                <Tooltip
                  content={
                    primaryContact?.lastName || "Primary contact last name"
                  }
                >
                  <ModalInput
                    label="Contact Person Last Name"
                    name="lastName"
                    value={primaryContact?.lastName ?? ""}
                    onChange={handlePrimaryContactChange}
                    placeholder="Primary contact last name"
                    error={errors.contactLastName}
                  />
                </Tooltip>

                <Tooltip content={form.displayName || "Select Display Name"}>
                  <ModalSelect
                    label="Display Name"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    required
                    options={[
                      { value: "", label: "Select Display Name" },
                      { value: form.name, label: form.name || "Customer Name" },
                      {
                        value: primaryContact?.firstName ?? "",
                        label: primaryContact?.firstName
                          ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
                          : "Contact Person",
                      },
                    ].filter((option) => option.value)}
                  />
                </Tooltip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5  mt-4">
                <Tooltip
                  content={form.customerTaxCategory || "Select Tax Category"}
                >
                  <TaxCategorySelect
                    label="Tax Category"
                    value={form.customerTaxCategory}
                    required
                    onChange={(value) =>
                      handleChange({
                        target: { name: "customerTaxCategory", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    error={errors.customerTaxCategory}
                  />
                </Tooltip>
                <Tooltip content={form.tpin || "Tax identification"}>
                  <ModalInput
                    label="TPIN"
                    name="tpin"
                    value={form.tpin}
                    onChange={handleChange}
                    placeholder="Tax identification"
                  />
                </Tooltip>
                <Tooltip content={form.currency || "Search currency..."}>
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
                </Tooltip>
              </div>

              <div className="col-span-4 grid grid-cols-4 gap-5 mt-4">
                <ModalInput
                  label="Email"
                  name="email"
                  type="email"
                  value={primaryContact?.email ?? ""}
                  onChange={handlePrimaryContactChange}
                  required
                  placeholder="email@example.com"
                  error={errors.contactEmail}
                />

                <div className="flex flex-col min-w-0">
                  <span className="block text-[10px] font-medium text-main mb-1">
                    Phone No <span className="text-danger">*</span>
                  </span>

                  <div className="flex">
                    {/* Country Code */}
                    <PhoneCodeSelect
                      value={primaryContact?.mobileCode ?? ""}
                      onChange={(code) =>
                        updatePrimaryContact("mobileCode", code)
                      }
                    />

                    {/* Actual Mobile Number */}
                    <input
                      name="mobileNumber"
                      value={primaryContact?.mobileNumber ?? ""}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        handlePrimaryContactChange({
                          ...e,
                          target: { ...e.target, name: "mobileNumber", value: digitsOnly },
                        });
                      }}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      inputMode="numeric"
                      placeholder="Enter number"
                      className="flex-1 py-1 px-2 border rounded text-[11px] text-main  bg-card border-[var(--border)] hover:border-primary/40"
                    />
                  </div>

                  {errors.contactMobile && (
                    <span className="text-[10px] text-danger mt-1">
                      {errors.contactMobile}
                    </span>
                  )}
                </div>

                <Tooltip
                  content={
                    form.registration_no ? String(form.registration_no) : ""
                  }
                >
                  <ModalInput
                    label="Registration No"
                    name="registration_no"
                    type="string"
                    value={form.registration_no ?? ""}
                    onChange={handleChange}
                    placeholder="Enter registration number"
                    className="no-spinner"
                  />
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4">
                <div className="flex flex-col text-sm group min-w-0 w-full">
                  <span className="block text-[10px] font-medium text-main mb-1">
                    Credit Limit
                  </span>
                  <Tooltip content={String(form.creditLimit ?? "") || "Enter credit limit"}>
                    <NumericInput
                      name="creditLimit"
                      value={
                        form.creditLimit === "" || form.creditLimit == null
                          ? null
                          : Number(form.creditLimit)
                      }
                      onChange={(value) =>
                        handleChange({
                          target: { name: "creditLimit", value: value ?? "" },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                      placeholder="Enter credit limit"
                      decimalScale={4}
                      className={`w-full ${errors.creditLimit ? "border-danger" : ""}`}
                    />
                  </Tooltip>
                  {errors.creditLimit && (
                    <span className="text-[10px] text-danger mt-1">{errors.creditLimit}</span>
                  )}
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-[11px] font-medium text-main cursor-pointer">
                    <input
                      type="checkbox"
                      name="bypassCreditLimit"
                      checked={!!form.bypassCreditLimit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bypassCreditLimit: e.target.checked,
                        }))
                      }
                    />
                    Bypass For Sales Order
                  </label>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-[11px] font-medium text-main cursor-pointer">
                    <input
                      type="checkbox"
                      name="strictCreditLimit"
                      checked={!!form.strictCreditLimit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          strictCreditLimit: e.target.checked,
                        }))
                      }
                    />
                    Enforce Strict Credit Limit
                  </label>
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
              partyId={initialData?.id ? String(initialData.id) : undefined}
              currency={form.currency}
            />
          )}

          {activeTab === "terms" && (
            <TermsAndCondition
              terms={form.terms?.selling || defaultSellingTerms}
              setTerms={(updated) =>
                setForm((prev) => ({
                  ...prev,
                  terms: { ...prev.terms, selling: updated },
                }))
              }
              type="selling"
            />
          )}

          {activeTab === "address" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AddressBlock
                type="billing"
                title="Billing Address"
                subtitle="Invoice and payment details"
                data={{
                  line1: billingAddress?.line1 ?? "",
                  line2: billingAddress?.line2 ?? "",
                  postalCode: billingAddress?.postalCode ?? "",
                  city: billingAddress?.city ?? "",
                  state: billingAddress?.state ?? "",
                  country: billingAddress?.country ?? "",
                }}
                errors={{
                  line1: errors.billingLine1,
                  postalCode: errors.billingPostalCode,
                  city: errors.billingCity,
                  state: errors.billingState,
                  country: errors.billingCountry,
                }}
                onChange={(e) => handleAddressChange("Billing", e)}
              />

              <Tooltip
                content={
                  shippingAddress?.line1 ||
                  shippingAddress?.city ||
                  shippingAddress?.country ||
                  "Shipping Address"
                }
              >
                <AddressBlock
                  type="shipping"
                  title="Shipping Address"
                  subtitle="Delivery location"
                  data={{
                    line1: shippingAddress?.line1 ?? "",
                    line2: shippingAddress?.line2 ?? "",
                    postalCode: shippingAddress?.postalCode ?? "",
                    city: shippingAddress?.city ?? "",
                    state: shippingAddress?.state ?? "",
                    country: shippingAddress?.country ?? "",
                  }}
                  sameAsBilling={form.sameAsBilling}
                  onSameAsBillingChange={setSameAsBilling}
                  onChange={(e) => handleAddressChange("Shipping", e)}
                />
              </Tooltip>
            </div>
          )}
        </div>
      </form>

      <MinimizableModal
        modalId={`${resolvedModalId}-principals`}
        isOpen={isPrincipalModalOpen}
        onClose={() => setIsPrincipalModalOpen(false)}
        title="Select Principal"
        subtitle="Choose a principal to prefill the customer form"
        icon={Users}
        maxWidth="lg"
        height="70vh"
      >
        <div className="p-4">
          {principalLoading ? (
            <div className="text-sm text-muted">Loading principals...</div>
          ) : principalOptions.length === 0 ? (
            <div className="text-sm text-muted">No principals found.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {principalOptions.map((principal) => (
                <button
                  key={principal.id ?? `${principal.tpin}-${principal.accountNo}`}
                  type="button"
                  onClick={() => handleSelectPrincipal(principal)}
                  className="w-full rounded-lg border border-[var(--border)] bg-card p-3 text-left hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="text-sm font-medium text-main">
                    {principal.principalNm || principal.tpin}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    {principal.principalEmail}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    {principal.principalAddress}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </MinimizableModal>
    </MinimizableModal>
  );
};

export default CustomerModal;
