import React from "react";
import { type SupplierFormData } from "../../../types/Supply/supplier";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { fetchCurrencyOptions } from "../../../utils/currencyOptions";
import TaxCategorySelect from "../../selects/TaxCategorySelect";
import { CreditDaysInput, ModalInput } from "../../ui/modal/modalComponent";
import PhoneCodeSelect from "../../common/PhoneCodeSelect";
import Tooltip from "../../Tooltip";

interface SupplierInfoTabProps {
  form: SupplierFormData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  errors?: {
    tpin?: string;
    supplierName?: string;
    taxCategory?: string;
    contactPerson?: string;
    phoneNo?: string;
    alternateNo?: string;
    emailId?: string;
    currency?: string;
    paymentTerms?: string;
    dateOfAddition?: string;
    openingBalance?: string;
  };
}

export const SupplierInfoTab: React.FC<SupplierInfoTabProps> = ({
  form,
  onChange,
  errors = {},
}) => {
  const handleTaxCategoryChange = (val: string) => {
    onChange({
      target: { name: "taxCategory", value: val },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleCurrencyChange = (value: string) => {
    onChange({
      target: { name: "currency", value },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <section className="flex-1 overflow-y-auto p-4 space-y-6 bg-app">
      <div className="space-y-6">
        {/* Supplier Details Row - 5 fields: 3+3+3+2+1 = 12 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Supplier Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="col-span-3">
              <Tooltip
                content={form.supplierName || "Supplier name is required"}
              >
                <ModalInput
                  label="Supplier Name"
                  name="supplierName"
                  value={form.supplierName}
                  onChange={onChange}
                  required
                  error={errors.supplierName}
                />
              </Tooltip>
            </div>
            <div className="col-span-3">
              <Tooltip content={form.tpin || "Enter Tax Id / TPIN"}>
                <ModalInput
                  label="Tax Id / TPIN"
                  name="tpin"
                  value={form.tpin}
                  onChange={onChange}
                  placeholder="Enter TPIN"
                />
              </Tooltip>
            </div>

            <div className="col-span-2">
              <Tooltip
                content={
                  form.taxCategory
                    ? `Tax Category: ${form.taxCategory}`
                    : "Select a tax category"
                }
              >
                <TaxCategorySelect
                  label="Tax Category"
                  value={form.taxCategory}
                  onChange={handleTaxCategoryChange}
                />
              </Tooltip>
            </div>

            <div className="col-span-1.8">
              <Tooltip
                content={
                  form.currency
                    ? `Currency: ${form.currency}`
                    : "Select a currency"
                }
              >
                <SearchSelect2
                  label="Currency"
                  value={form.currency}
                  onChange={handleCurrencyChange}
                  fetchOptions={fetchCurrencyOptions}
                  placeholder="Search..."
                  required
                  error={errors.currency}
                />
              </Tooltip>
            </div>

            {/* <div className="col-span-1.5">
              <Tooltip content={form.paymentTerms ? `Payment Terms: ${form.paymentTerms}` : "Enter payment terms"}>
                <CreditDaysInput
                  name="paymentTerms"
                  value={form.paymentTerms}
                  onChange={onChange}
                  required
                  error={errors.paymentTerms}
                  className="no-spinner"
                />
              </Tooltip>
            </div> */}
          </div>
        </div>

        {/* Contact Details Row - 4 equal fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Contact Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModalInput
              label="Contact Person Name"
              name="contactPerson"
              value={form.contactPerson}
              onChange={onChange}
              required
              error={errors.contactPerson}
            />

            {/* Phone No */}
            <div className="flex flex-col min-w-0">
              <span className="block text-[10px] font-medium text-main mb-1">
                Phone No <span className="text-danger">*</span>
              </span>
              <div className="flex">
                <PhoneCodeSelect
                  value={form.phoneCode ?? ""}
                  onChange={(code) =>
                    onChange({ target: { name: "phoneCode", value: code } } as React.ChangeEvent<HTMLInputElement>)
                  }
                  error={errors.phoneNo}
                />
                <input
                  name="phoneNo"
                  type="tel"
                  value={form.phoneNo}
                  onChange={onChange}
                  placeholder="Enter phone number"
                  className={[
                    "flex-1 py-1 px-2 border-t border-b border-r rounded-r text-[11px] text-main bg-card transition-all min-w-0",
                    errors.phoneNo
                      ? "border-danger"
                      : "border-[var(--border)] hover:border-primary/40",
                  ].join(" ")}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = errors.phoneNo
                      ? "0 0 0 3px rgba(239,68,68,0.18)"
                      : "0 0 0 3px rgba(37,99,235,0.16)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
              </div>
              <div className="min-h-[14px] mt-1">
                {errors.phoneNo && (
                  <span className="text-[10px] text-danger">
                    {errors.phoneNo}
                  </span>
                )}
              </div>
            </div>


            {/* Alternate No */}
            <div className="flex flex-col min-w-0">
              <span className="block text-[10px] font-medium text-main mb-1">
                Alternate No
              </span>
              <div className="flex">
                <PhoneCodeSelect
                  value={form.alternateCode ?? ""}
                  onChange={(code) =>
                    onChange({ target: { name: "alternateCode", value: code } } as React.ChangeEvent<HTMLInputElement>)
                  }
                  error={errors.alternateNo}
                />
                <input
                  name="alternateNo"
                  type="tel"
                  value={form.alternateNo}
                  onChange={onChange}
                  placeholder="Enter alternate number"
                  className={[
                    "flex-1 py-1 px-2 border-t border-b border-r rounded-r text-[11px] text-main bg-card transition-all min-w-0",
                    errors.alternateNo
                      ? "border-danger"
                      : "border-[var(--border)] hover:border-primary/40",
                  ].join(" ")}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = errors.alternateNo
                      ? "0 0 0 3px rgba(239,68,68,0.18)"
                      : "0 0 0 3px rgba(37,99,235,0.16)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
              </div>
              <div className="min-h-[14px] mt-1">
                {errors.alternateNo && (
                  <span className="text-[10px] text-danger">
                    {errors.alternateNo}
                  </span>
                )}
              </div>
            </div>

            <Tooltip content={form.emailId || "Enter email address"}>
              <ModalInput
                label="Email Id"
                name="emailId"
                value={form.emailId}
                onChange={onChange}
                type="email"
                required
                error={errors.emailId}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </section>
  );
};
