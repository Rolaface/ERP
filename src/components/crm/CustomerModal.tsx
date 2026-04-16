import React from "react";
import { Building2, DollarSign, FileText, MapPin, User } from "lucide-react";
import Tooltip from "../Tooltip";
import TaxCategorySelect from "../selects/TaxCategorySelect";
import TermsAndCondition from "../TermsAndCondition";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import AddressBlock from "../ui/modal/AddressBlock";
import CustomerGroupSearchSelect from "../selects/customergroupSelect";
import { Card } from "../ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
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
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                  activeTab === tab
                    ? "text-primary border-b-[3px] border-primary"
                    : "text-muted border-b-[3px] border-transparent hover:text-main"
                }`}
              >
                {tab === "details" && <User className="w-4 h-4" />}
                {tab === "bank" && <DollarSign className="w-4 h-4" />}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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

                <Tooltip content={form.tpin || "Tax identification"}>
                  <ModalInput
                    label="TPIN"
                    name="tpin"
                    value={form.tpin}
                    onChange={handleChange}
                    required
                    error={errors.tpin}
                    placeholder="Tax identification"
                  />
                </Tooltip>

                <Tooltip
                  content={form.customerTaxCategory || "Select Tax Category"}
                >
                  <TaxCategorySelect
                    label="Tax Category"
                    value={form.customerTaxCategory}
                    onChange={(value) =>
                      handleChange({
                        target: { name: "customerTaxCategory", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    error={errors.customerTaxCategory}
                    required
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

                <Tooltip content={String(form.onboardingBalance || "0.00")}>
                  <ModalInput
                    label="Onboard Balance"
                    name="onboardingBalance"
                    type="number"
                    value={form.onboardingBalance}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="no-spinner"
                  />
                </Tooltip>

                <div className="col-span-4 grid grid-cols-4 gap-5">
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
                      Mobile <span className="text-danger">*</span>
                    </span>
                    <div className="flex">
                      <input
                        name="mobileCode"
                        value={primaryContact?.mobileCode ?? ""}
                        onChange={handlePrimaryContactChange}
                        placeholder="+"
                        className={[
                          "w-[50px] py-1 px-2 border rounded-l text-[11px] text-main bg-card transition-all",
                          errors.contactMobile
                            ? "border-danger"
                            : "border-[var(--border)] hover:border-primary/40",
                        ].join(" ")}
                      />
                      <input
                        name="mobileCode"
                        value={primaryContact?.mobileCode || "+"}
                        onChange={handlePrimaryContactChange}
                        onBlur={(e) => {
                          if (!e.target.value.startsWith("+")) {
                            handlePrimaryContactChange({
                              target: {
                                name: "mobileCode",
                                value: "+" + e.target.value,
                              },
                            });
                          }
                        }}
                        maxLength={5}
                        className="w-[60px] py-1 px-2 border rounded-l text-[11px]"
                      />
                    </div>
                    {errors.contactMobile && (
                      <span className="text-[10px] text-danger mt-1">
                        {errors.contactMobile}
                      </span>
                    )}
                  </div>

                  <CustomerGroupSearchSelect
                    value={form.customerGroup}
                    onChange={(value) =>
                      handleChange({
                        target: { name: "customerGroup", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
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
    </MinimizableModal>
  );
};

export default CustomerModal;
