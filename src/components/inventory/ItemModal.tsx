import React, { useCallback } from "react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { DynamicField } from "../DynamicField";
import { useItemForm } from "../../hooks/Useitemform";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { YesNoCheckbox } from "../ui/modal/modalComponent";
import TaxCategorySelect from "../selects/TaxCategorySelect";
import Tooltip from "../Tooltip";
import { ToolCase } from "lucide-react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getAllTemplates } from "../../api/TaxTemplateApi";
// ─── Compact shared primitives ────────────────────────────────────────────────

/** Tiny label text with optional required asterisk */
const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({
  label,
  required,
}) => (
  <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
    {label}
    {required && <span className="ml-0.5 text-danger">*</span>}
  </span>
);

/** Compact text / number input */
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, className = "", ...props }, ref) => (
  <label className="flex flex-col gap-0.5 w-full">
    <FieldLabel label={label} required={props.required} />
    <input
      ref={ref}
      className={[
        "h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5",
        "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
        "placeholder:text-muted/40",
        props.disabled ? "bg-app text-muted cursor-not-allowed opacity-60" : "",
        className,
      ].join(" ")}
      {...props}
    />
  </label>
));
Input.displayName = "Input";

/**
 * Wraps any DynamicField (or custom search-input component) and forces it to
 * match the compact h-8 design system used everywhere else in this form.
 * Works by targeting the first input/select/textarea child via CSS.
 */
const DynamicFieldWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`dynamic-field-wrap ${className}`}
    style={
      {
        // Force every input / select rendered by DynamicField to be compact
      }
    }
  >
    <style>{`

.dynamic-field-wrap label > span:first-child {
  font-size: 11px !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  color: rgb(107 114 128) !important;
}
      .dynamic-field-wrap input,
      .dynamic-field-wrap select,
      .dynamic-field-wrap textarea {
        height: 32px !important;
        min-height: 32px !important;
        max-height: 32px !important;
        font-size: 0.875rem !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        padding-left: 10px !important;
        border-radius: 6px !important;
        box-sizing: border-box !important;
      }
      .dynamic-field-wrap textarea {
        max-height: 64px !important;
        resize: none !important;
      }

      .dynamic-field-wrap input,
.dynamic-field-wrap select {
  width: 100% !important;
}
    `}</style>
    {children}
  </div>
);

/** Compact native select */
const CompactSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}> = ({ label, name, value, onChange, children, required, disabled }) => (
  <label className="flex flex-col gap-0.5 w-full">
    <FieldLabel label={label} required={required} />
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={[
        "h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5 pr-7",
        "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
        "appearance-none",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      {children}
    </select>
  </label>
);

/**
 * Toggle field rendered as two pill buttons (ON / OFF).
 * Much more visible than a tiny switch. Still sends the correct
 * string value (onValue / offValue) to the payload via hidden input.
 */
const ToggleField: React.FC<{
  label: string;
  name: string;
  value: string | boolean;
  onValue?: string;
  offValue?: string;
  onLabel?: string;
  offLabel?: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
}> = ({
  label,
  name,
  value,
  onValue = "Y",
  offValue = "N",
  onLabel,
  offLabel,
  onChange,
  required,
}) => {
    const isOn =
      value === onValue ||
      value === true ||
      value === "true" ||
      value === "Taxable";

    return (
      <div className="flex flex-col gap-0.5">
        <FieldLabel label={label} required={required} />
        {/* Pill toggle — same h-8 height as all other inputs */}
        <div className="flex h-8 rounded-md border border-theme overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => !isOn && onChange(name, onValue)}
            className={[
              "px-3 text-sm font-semibold transition-colors select-none",
              isOn
                ? "bg-primary text-white"
                : "bg-card text-muted hover:bg-primary/10 hover:text-primary",
            ].join(" ")}
          >
            {onLabel ?? onValue}
          </button>
          <div className="w-px bg-theme shrink-0" />
          <button
            type="button"
            onClick={() => isOn && onChange(name, offValue)}
            className={[
              "px-3 text-sm font-semibold transition-colors select-none",
              !isOn
                ? "bg-primary text-white"
                : "bg-card text-muted hover:bg-primary/10 hover:text-primary",
            ].join(" ")}
          >
            {offLabel ?? offValue}
          </button>
        </div>
        <input type="hidden" name={name} value={isOn ? onValue : offValue} />
      </div>
    );
  };

/** Simple checkbox with label */
const CheckboxField: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
  <label
    htmlFor={id}
    className="flex items-center gap-2 cursor-pointer group select-none"
  >
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={[
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
          checked
            ? "bg-primary border-primary"
            : "border-theme bg-card group-hover:border-primary/60",
        ].join(" ")}
      >
        {checked && (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </div>
    <span className="text-[11px] font-medium text-main whitespace-nowrap">
      {label}
    </span>
  </label>
);

/** Tab button */
const TabButton: React.FC<{
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, active, disabled = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      "py-2.5 px-1 bg-transparent border-none text-sm font-semibold cursor-pointer transition-all tracking-wide",
      active
        ? "text-primary border-b-2 border-primary"
        : "text-muted border-b-2 border-transparent hover:text-main",
      disabled ? "opacity-40 cursor-not-allowed" : "",
    ].join(" ")}
  >
    {label}
  </button>
);

/** Section heading */
const SectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-3 mb-3 mt-5 first:mt-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
      {title}
    </span>
    <div className="flex-1 h-px bg-theme" />
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const ItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (res: any) => void;
  initialData?: Record<string, any> | null;
  isEditMode?: boolean;
  modalId?: string;
}> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false, modalId }) => {
  const resolvedModalId = modalId || (isEditMode && initialData?.id
    ? `item-edit-${initialData.id}-${Date.now()}`
    : `item-create-${Date.now()}`);
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const {
    form,
    setForm,
    autoPopulateTax,
    loading,
    activeTab,
    setActiveTab,
    isServiceItem,
    showBatchExpiry,
    fieldConfigs,
    taxConfigs,
    handleForm,
    handleDynamicFieldChange,
    handleCategoryChange,
    reset,
    handleClose,
    handleSubmit,
    itemGroups,
    loadingItemGroups,
    suppliers,
    loadingSuppliers,
  } = useItemForm({ isOpen, isEditMode, initialData, onSubmit, onClose });

  if (!isOpen) return null;

  /** Wrapper that bridges ToggleField → handleDynamicFieldChange */
  const handleToggleChange = (name: string, value: string) => {
    handleDynamicFieldChange(name, value);
  };

  /** Wrapper for handleForm-style fields that need direct string injection */
  const handleSelectChange = (name: string, value: string) => {
    const syntheticEvent = {
      target: { name, value },
    } as React.ChangeEvent<HTMLSelectElement>;
    handleForm(syntheticEvent);
  };


  const fetchTaxTemplateOptions = useCallback(async (search: string) => {
    try {
      const res = await getAllTemplates(1, 20, search || undefined);
      const list: { name: string; title: string }[] = res?.data?.templates ?? [];
      return list.map((t) => ({
        label: t.title,
        value: t.name,
      }));
    } catch {
      return [];
    }
  }, []);


  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(handleClose, resolvedModalId)}
      title={isEditMode ? "Edit Item" : "Add Item"}
      subtitle="Create and manage item details"
      icon={ToolCase}
      customWidth="68vw"
      height="60vh"
    >
      <form
        onChange={() => markDirty()}
        onSubmit={(e) => {
          const wrappedSubmit = async () => {
            resetDirty();
            await handleSubmit(e);
          };
          wrappedSubmit();
        }}
        noValidate
        className="h-full flex flex-col"
      >
        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="bg-app border-b border-theme px-6 shrink-0">
          <div className="flex gap-6">
            <TabButton
              label="Item Details"
              active={activeTab === "details"}
              onClick={() => setActiveTab("details")}
            />
            <TabButton
              label="Tax Details"
              active={activeTab === "taxDetails"}
              onClick={() => setActiveTab("taxDetails")}
            />
            <TabButton
              label="Inventory Details"
              active={activeTab === "inventoryDetails"}
              disabled={isServiceItem}
              onClick={() => !isServiceItem && setActiveTab("inventoryDetails")}
            />
          </div>
        </div>

        {/* ── Tab content  */}
        <section className="flex-1 overflow-y-auto bg-app">
          <div className="p-5 max-w-full">
            {/*  ITEM DETAILS TAB  */}
            {activeTab === "details" && (
              <>
                {/* 4-col grid for item fields */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4 items-end">
                  {fieldConfigs.map((fieldConfig) => {
                    /* HSN Code */
                    if (fieldConfig.fieldName === "itemClassCode") {
                      return (
                        <Tooltip key="itemClassCode" content={`HSN: ${form.itemClassCode || "N/A"}`}>
                          <Input
                            key="itemClassCode"
                            label="HSN Code"
                            name="itemClassCode"
                            value={form.itemClassCode || ""}
                            onChange={handleForm}
                            required
                            placeholder="e.g. 84713010"
                            className="w-[140px]"
                          />
                        </Tooltip>
                      );
                    }

                    /* Packing Unit + UOM (spans a wider slot) */
                    if (fieldConfig.fieldName === "unitOfMeasureCd") {
                      return (
                        <div
                          key="uom-svc-ins-sku"
                          className="col-span-3 grid grid-cols-[120px_140px_160px_180px_80px_80px_90px] gap-3 items-end"
                        >
                          {/* Packing */}

                          <DynamicFieldWrapper className="w-[120px]">
                            <div className="flex flex-col gap-0.5">
                              <FieldLabel label="Packing Unit" />
                              <div className="flex items-center gap-1 h-8">
                                <Tooltip content={`Unit: ${form.packingUnit || "N/A"}`}>
                                  <input
                                    type="number"
                                    name="packingUnit"
                                    value={form.packingUnit || ""}
                                    onChange={handleForm}
                                    className="w-15 h-8 rounded-md border border-theme bg-card text-main  text-sm px-1
                                focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary no-spinner"
                                  />
                                </Tooltip>
                                <span className="text-muted text-sm font-bold">
                                  ×
                                </span>
                                <Tooltip content={`Size: ${form.packingSize || "N/A"}`}>
                                  <input

                                    type="number"
                                    name="packingSize"
                                    value={form.packingSize || ""}
                                    onChange={handleForm}
                                    className="w-15 h-8 rounded-md border border-theme bg-card text-main text-sm px-1
                                  focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary no-spinner"
                                  />
                                </Tooltip>
                              </div>
                            </div>
                          </DynamicFieldWrapper>

                          {/* UOM */}
                          <DynamicFieldWrapper className="max-w-[130px]">
                            <Tooltip content={`UOM: ${form.unitOfMeasureCd || "N/A"}`}>
                              <DynamicField
                                config={fieldConfig}
                                value={form[fieldConfig.fieldName]}
                                onChange={handleDynamicFieldChange}
                                filterValue={form.itemTypeCode}
                              />
                            </Tooltip>
                          </DynamicFieldWrapper>

                          {/* SKU */}
                          <DynamicFieldWrapper className="w-[160px] shrink-0">
                            <Tooltip content={`SKU: ${form.sku || "N/A"}`}>
                              <DynamicField
                                config={{
                                  ...fieldConfigs.find(
                                    (f) => f.fieldName === "sku",
                                  )!,
                                  required: false,
                                }}
                                value={form.sku}
                                onChange={handleDynamicFieldChange}
                                filterValue={form.itemTypeCode}
                              />
                            </Tooltip>
                          </DynamicFieldWrapper>

                          {/* Country of Origin */}
                          <DynamicFieldWrapper className="w-[180px] shrink-0">
                            <Tooltip content={`Country of Origin: ${form.originNationCode || "N/A"}`}>

                              <DynamicField
                                config={
                                  fieldConfigs.find(
                                    (f) => f.fieldName === "originNationCode",
                                  )!
                                }
                                value={form.originNationCode}
                                onChange={handleDynamicFieldChange}
                              />
                            </Tooltip>
                          </DynamicFieldWrapper>

                          <div className="w-[80px] shrink-0">
                            <YesNoCheckbox
                              label="Svc Charge"
                              name="svcCharge"
                              value={form.svcCharge || "N"}
                              onChange={handleToggleChange}
                            />
                          </div>

                          <div className="w-[80px] shrink-0">
                            <YesNoCheckbox
                              label="Insurance"
                              name="ins"
                              value={form.ins || "N"}
                              onChange={handleToggleChange}
                            />
                          </div>

                          <div className="w-full min-w-[80px]">
                            <YesNoCheckbox
                              label="Taxable"
                              name="taxPreference"
                              value={
                                form.taxPreference === "Taxable" ? "Y" : "N"
                              }
                              onChange={(name, val) =>
                                handleDynamicFieldChange(
                                  name,
                                  val === "Y" ? "Taxable" : "Non-Taxable",
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    }

                    /* SKIP default rendering */
                    if (fieldConfig.fieldName === "sku") return null;
                    if (fieldConfig.fieldName === "ins") return null;
                    if (fieldConfig.fieldName === "svcCharge") return null;
                    if (fieldConfig.fieldName === "sellingPrice") return null;
                    if (fieldConfig.fieldName === "buyingPrice") return null;
                    if (fieldConfig.fieldName === "dimensionWidth") return null;
                    if (fieldConfig.fieldName === "originNationCode")
                      return null;
                    if (fieldConfig.fieldName === "description") {
                      return (
                        <DynamicFieldWrapper key="description">
                          <Tooltip content={`Description: ${form.description || "N/A"}`}>
                            <DynamicField
                              config={{
                                ...fieldConfig,
                                required: true
                              }}
                              value={form[fieldConfig.fieldName]}
                              onChange={handleDynamicFieldChange}
                              filterValue={form.itemTypeCode}
                            />
                          </Tooltip>
                        </DynamicFieldWrapper>
                      );
                    }
                    /* Item Group */
                    if (fieldConfig.fieldName === "itemGroup") {
                      return (
                        <Tooltip content={`Item Group: ${form.itemGroup || "N/A"}`}>
                          <CompactSelect
                            key="itemGroup"
                            label="Item Category"
                            name="itemGroup"
                            value={form.itemGroup || ""}
                            onChange={handleForm}
                            disabled={loadingItemGroups || !form.itemTypeCode}
                            required
                          >


                            {loadingItemGroups ? (
                              <option>Searching…</option>
                            ) : !form.itemTypeCode ? (
                              <option value="">Select Item Type first</option>
                            ) : (
                              <>
                                <option value="">Select Category</option>
                                {itemGroups.map((group) => (
                                  <option key={group.id} value={group.groupName}>
                                    {group.groupName}
                                  </option>
                                ))}
                              </>
                            )}
                          </CompactSelect>
                        </Tooltip>
                      );
                    }

                    /* Default */
                    return (
                      <Tooltip key={fieldConfig.fieldName} content={`Value: ${form[fieldConfig.fieldName] || "N/A"}`}>
                        <DynamicFieldWrapper key={fieldConfig.fieldName}>
                          <DynamicField
                            config={fieldConfig}
                            value={form[fieldConfig.fieldName]}
                            onChange={handleDynamicFieldChange}
                            filterValue={form.itemTypeCode}
                          />
                        </DynamicFieldWrapper>
                      </Tooltip>

                    );
                  })}
                </div>

                {/* ── Sales & Purchase  */}
                <SectionHeading title="Sales & Purchase" />

                <div className="flex flex-wrap gap-4 items-end">
                  <div className="max-w-[120px]">
                    <Tooltip content={`Selling Price: ${form.sellingPrice || "N/A"}`}>
                      <Input
                        label="Selling Price"
                        name="sellingPrice"
                        type="number"
                        value={form.sellingPrice || ""}
                        onChange={handleForm}
                        className="no-spinner"
                      />
                    </Tooltip>
                  </div>

                  <div className="max-w-[150px]">
                    <Tooltip content={`Sales Account: ${form.salesAccount || "N/A"}`}>
                      <Input
                        label="Sales Account"
                        name="salesAccount"
                        value={form.salesAccount || ""}
                        onChange={handleForm}
                        placeholder="e.g. 4000-Sales"
                      />
                    </Tooltip>
                  </div>

                  <div className="max-w-[120px]">
                    <Tooltip content={`Buying Price: ${form.buyingPrice || "N/A"}`}>
                      <Input
                        label="Buying Price"
                        name="buyingPrice"
                        type="number"
                        value={form.buyingPrice || ""}
                        onChange={handleForm}
                        placeholder="0.00"
                        className="no-spinner"
                      />
                    </Tooltip>
                  </div>

                  <div className="max-w-[150px]">
                    <Tooltip content={`Purchase Account: ${form.purchaseAccount || "N/A"}`}>
                      <Input
                        label="Purchase Account"
                        name="purchaseAccount"
                        value={form.purchaseAccount || ""}
                        onChange={handleForm}
                        placeholder="e.g. 5000-COGS"
                      />
                    </Tooltip>
                  </div>

                  <div className="max-w-[210px]">
                    <Tooltip content={`Preferred Vendor: ${form.preferredVendor || "N/A"}`}>
                      <CompactSelect
                        label="Preferred Vendor"
                        name="preferredVendor"
                        value={form.preferredVendor || ""}
                        onChange={handleForm}
                        disabled={loadingSuppliers}
                      >
                        {loadingSuppliers ? (
                          <option>Loading suppliers...</option>
                        ) : (
                          <>
                            <option value="">Select Supplier</option>
                            {suppliers.map((supplier) => (
                              <option key={supplier.value} value={supplier.value}>
                                {supplier.label}
                              </option>
                            ))}
                          </>
                        )}
                      </CompactSelect>
                    </Tooltip>

                  </div>
                </div>
              </>
            )}


            {/*  TAX DETAILS TAB  */}
            {activeTab === "taxDetails" && (
              <>
                <div className="flex flex-wrap items-end gap-4 mb-1">
                  <div className="w-[160px]">
                    <Tooltip content={`Tax Category: ${form.taxCategory || "N/A"}`}>
                      <TaxCategorySelect
                        value={form.taxCategory}
                        onChange={(val) =>
                          handleForm({
                            target: { name: "taxCategory", value: val },
                          } as React.ChangeEvent<HTMLSelectElement>)
                        }
                        required
                      />
                    </Tooltip>
                    {form.taxCategory && (
                      <p className="mt-1.5 text-sm text-muted">
                        {taxConfigs[form.taxCategory]?.taxDescription}
                      </p>
                    )}
                  </div>

                  <div className="w-[200px]">
                    <SearchSelect2
                      label="Tax Template"
                      value={form.taxTemplate || ""}
                      onChange={(val) =>
                        handleForm({
                          target: { name: "taxTemplate", value: val },
                        } as React.ChangeEvent<HTMLSelectElement>)
                      }
                      fetchOptions={fetchTaxTemplateOptions}
                      placeholder="Search template..."
                    />
                  </div>
                </div>

                <SectionHeading
                  title={
                    form.taxCategory
                      ? `${form.taxCategory} Tax Details`
                      : "Tax Details"
                  }
                />
                <div className="flex flex-wrap items-end gap-3">
                  <div className="max-w-[140px]">
                    <Tooltip content={`Tax Type: ${form.taxType || "N/A"}`}>
                      <Input
                        label="Tax Type"
                        name="taxType"
                        value={form.taxType || ""}
                        onChange={handleForm}
                        placeholder="e.g. VAT"
                        disabled={autoPopulateTax}
                      />
                    </Tooltip>
                  </div>

                  <div className="max-w-[140px]">
                    <Tooltip content={`Tax Code: ${form.taxCode || "N/A"}`}>

                      <Input
                        label="Tax Code"
                        name="taxCode"
                        value={form.taxCode || ""}
                        onChange={handleForm}
                        placeholder="V001"
                        disabled={autoPopulateTax}
                      />
                    </Tooltip>
                  </div>

                  <div className="max-w-[140px]">
                    <Tooltip content={`Tax Name: ${form.taxName || "N/A"}`}>
                      <Input
                        label="Tax Name"
                        name="taxName"
                        value={form.taxName || ""}
                        onChange={handleForm}
                        placeholder="Standard VAT"
                        readOnly={autoPopulateTax}
                      />
                    </Tooltip>

                  </div>
                  <div className="w-[110px] flex flex-col gap-0.5">
                    <FieldLabel label="Tax (%)" />
                    <div className="relative">
                      <input
                        type="number"
                        name="taxPerct"
                        value={form.taxPerct || ""}
                        onChange={handleForm}
                        className={[
                          "h-8 w-full rounded-md border border-theme text-sm px-2.5 pr-7",
                          "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary no-spinner",
                          autoPopulateTax
                            ? "bg-app text-muted cursor-not-allowed opacity-60"
                            : "bg-card text-main",
                        ].join(" ")}
                        disabled={autoPopulateTax}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted font-semibold">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="w-[210px]">
                    <Tooltip content={`Tax Description: ${form.taxDescription || "N/A"}`}>
                      <Input
                        label="Description"
                        name="taxDescription"
                        value={form.taxDescription || ""}
                        onChange={handleForm}
                        placeholder="12% VAT on Non-Export"
                        disabled={autoPopulateTax}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* Summary card */}
                <div className="mt-4 bg-card border border-theme rounded-lg p-3 w-fit min-w-[420px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                    Current Configuration
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                    {[
                      { label: "Category", value: form.taxCategory },
                      { label: "Template", value: form.taxTemplate },
                      { label: "Type", value: form.taxType },
                      { label: "Code", value: form.taxCode },
                      {
                        label: "Rate",
                        value: form.taxPerct ? `${form.taxPerct}%` : null,
                      },
                    ].map(({ label, value }) => (
                      <span key={label}>
                        <span className="font-semibold text-main">
                          {label}:
                        </span>{" "}
                        <span>{value || "—"}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/*  INVENTORY DETAILS TAB  */}
            {activeTab === "inventoryDetails" && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4 items-end">
                  <Tooltip content={`Brand: ${form.brand || "N/A"}`}>
                    <Input
                      label="Brand"
                      name="brand"
                      value={form.brand || ""}
                      onChange={handleForm}
                      disabled={isServiceItem}
                      placeholder="Brand name"

                    />
                  </Tooltip>

                  {/* Dimensions */}
                  <div className="flex flex-col gap-0.5 min-w-[150px]">
                    <FieldLabel label="Dimensions (L × W × H)" />
                    <div className="flex items-center gap-1 h-8">
                      {[
                        "dimensionLength",
                        "dimensionWidth",
                        "dimensionHeight",
                      ].map((dim, i) => (
                        <React.Fragment key={dim}>
                          {i > 0 && (
                            <span className="text-muted text-sm font-bold">
                              ×
                            </span>
                          )}
                          <input
                            type="number"
                            name={dim}
                            value={form[dim] || ""}
                            onChange={handleForm}
                            placeholder={["L", "W", "H"][i]}
                            min="0"
                            className="w-10 h-8 rounded-md border border-theme bg-card text-main text-center text-sm px-1
                              focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary no-spinner"
                          />
                        </React.Fragment>
                      ))}
                      <select
                        name="dimensionUnit"
                        value={form.dimensionUnit || "cm"}
                        onChange={handleForm}
                        className="h-8 w-12 rounded-md border border-theme bg-card text-main text-sm px-1
                          focus:outline-none focus:ring-1 focus:ring-primary "
                      >
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="flex flex-col gap-0.5 min-w-[170px]">
                    <span className="ml-9">
                      <FieldLabel label="Weight" />
                    </span>
                    <div className="flex items-center gap-1 h-8 w-full">
                      <input
                        type="number"
                        name="weight"
                        value={form.weight || ""}
                        onChange={handleForm}
                        className="w-16 ml-9 h-8 rounded-md border border-theme bg-card text-main text-sm px-2.5
                          focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary no-spinner"
                      />
                      <select
                        name="weightUnit"
                        value={form.weightUnit || "kg"}
                        onChange={handleForm}
                        className="h-8 w-14 rounded-md border border-theme bg-card text-main text-sm px-1
                          focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="gm">gm</option>
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="oz">oz</option>
                      </select>
                    </div>
                  </div>
                  <Tooltip content={`Valuation Method: ${form.valuationMethod || "N/A"}`}>
                    <CompactSelect
                      label="Valuation Method"
                      name="valuationMethod"
                      value={form.valuationMethod || ""}
                      onChange={handleForm}
                    >
                      <option value="">Select…</option>
                      <option value="FIFO">FIFO</option>
                      <option value="WAC">WAC</option>
                    </CompactSelect>
                  </Tooltip>
                </div>

                {/* Track Inventory */}
                <SectionHeading title="Inventory Tracking" />
                <div className="flex items-end gap-5 flex-wrap mt-[-6px]">
                  <CheckboxField
                    id="has_batch_no"
                    label="Has Batch Number"
                    checked={form.has_batch_no || false}
                    onChange={(checked) =>
                      setForm((prev) => ({ ...prev, has_batch_no: checked }))
                    }
                  />

                  <CheckboxField
                    id="has_expiry_date"
                    label="Has Expiry Date"
                    checked={form.has_expiry_date || false}
                    onChange={(checked) =>
                      setForm((prev) => ({ ...prev, has_expiry_date: checked }))
                    }
                  />

                  <CheckboxField
                    id="trackInventory"
                    label="Track Inventory"
                    checked={form.trackInventory || false}
                    onChange={(checked) =>
                      setForm((prev) => ({ ...prev, trackInventory: checked }))
                    }
                  />

                  <div className="w-[180px]">
                    <CompactSelect
                      label="Tracking Method"
                      name="trackingMethod"
                      value={form.trackingMethod || ""}
                      onChange={handleForm}
                      disabled={!form.trackInventory}
                    >
                      <option value="">Select method…</option>
                      <option value="none">Normal</option>
                      <option value="batch">Batch</option>
                      <option value="serial">Serial</option>
                      <option value="imei">IMEI</option>
                    </CompactSelect>
                  </div>
                </div>

                {/* Stock Levels */}
                <SectionHeading title="Stock Level Tracking" />

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-lg">
                  <Tooltip content={`Min Stock Level: ${form.minStockLevel || "N/A"}`}>
                    <Input
                      label="Min Stock Level"
                      name="minStockLevel"
                      value={form.minStockLevel || ""}
                      onChange={handleForm}
                      placeholder="0"
                    />
                  </Tooltip>
                  <Tooltip content={`Max Stock Level: ${form.maxStockLevel || "N/A"}`}>
                    <Input
                      label="Max Stock Level"
                      name="maxStockLevel"
                      value={form.maxStockLevel || ""}
                      onChange={handleForm}
                      placeholder="0"
                    />
                  </Tooltip>
                  <Tooltip content={`Re-order Level: ${form.reorderLevel || "N/A"}`}>
                    <Input
                      label="Re-order Level"
                      name="reorderLevel"
                      value={form.reorderLevel || ""}
                      onChange={handleForm}
                      placeholder="0"
                    />
                  </Tooltip>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 border-t border-theme px-5 py-3 bg-app shrink-0">
          <Button variant="secondary" type="button" onClick={() => handleCloseWithConfirm(handleClose, resolvedModalId)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={() => {
              resetDirty();
              reset();
            }}
          >
            Reset
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {activeTab === "inventoryDetails" ||
              (activeTab === "taxDetails" && isServiceItem)
              ? "Submit"
              : "Next →"}
          </Button>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ItemModal;
