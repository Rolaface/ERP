import React from "react";
import {
  type SupplierFormData,
} from "../../../types/Supply/supplier";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { fetchCurrencyOptions } from "../../../utils/currencyOptions";
import TaxCategorySelect from "../../selects/TaxCategorySelect";
import { CreditDaysInput, ModalInput} from "../../ui/modal/modalComponent";
import DatePickerInput from "../../calendar/DatePickerInput";
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
  return (
    <section className="flex-1 overflow-y-auto p-4 space-y-6 bg-app">
      <div className="space-y-6">
        {/* Supplier Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Supplier Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <ModalInput
              label="Tax Id / TPIN"
              name="tpin"
              value={form.tpin}
              onChange={onChange}
              placeholder="Enter TPIN"
              error={errors.tpin}
              required
            />
            <ModalInput
              label="Supplier Name"
              name="supplierName"
              value={form.supplierName}
              onChange={onChange}
              required
              error={errors.supplierName}
            />
            <ModalInput
              label="Supplier Code"
              name="supplierCode"
              value={form.supplierCode}
              onChange={onChange}
              placeholder="Auto generated"
            />
            <TaxCategorySelect
              value={form.taxCategory}
              onChange={(val) =>
                onChange({
                  target: { name: "taxCategory", value: val },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              error={errors.taxCategory}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <SearchSelect2
            label="Currency"
            value={form.currency}
            onChange={(value) =>
              onChange({
                target: { name: "currency", value },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
            fetchOptions={fetchCurrencyOptions}
            placeholder="Search currency..."
            required
            error={errors.currency}
          />

          <ModalInput
            label="Opening Balance"
            name="openingBalance"
            type="number"
            value={form.openingBalance}
            onChange={onChange}
            error={errors.openingBalance}
            className="no-spinner"
          />

          <CreditDaysInput
            name="paymentTerms"
            value={form.paymentTerms}
            onChange={onChange}
            required
            error={errors.paymentTerms}
            className="no-spinner"
          />

          <DatePickerInput
            label="Date of Addition"
            name="dateOfAddition"
            value={form.dateOfAddition}
            onChange={(name, value) =>
              onChange({
                target: { name, value },
              } as any)
            }
            required
          // error={errors.dateOfAddition}
          />
        </div>

        {/* Contact Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Contact Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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
              <div className="flex gap-0">
                <input
                  name="phoneCode"
                  value={form.phoneCode}
                  onChange={onChange}
                  placeholder="+"
                  className={[
                    "w-[50px] py-1 px-2 border rounded text-[11px] text-main bg-card transition-all min-w-0",
                    errors.phoneNo
                      ? "border-danger focus:border-danger"
                      : "border-[var(--border)] hover:border-primary/40",
                  ].join(" ")}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = errors.phoneNo
                      ? "0 0 0 3px rgba(239, 68, 68, 0.18)"
                      : "0 0 0 3px rgba(37, 99, 235, 0.16)";
                  }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
                />
                <input
                  name="phoneNo"
                  type="tel"
                  value={form.phoneNo}
                  onChange={onChange}
                  placeholder="Enter mobile number"
                  className={[
                    "flex-1 py-1 px-2 border rounded text-[11px] text-main bg-card transition-all min-w-0",
                    errors.phoneNo
                      ? "border-danger focus:border-danger"
                      : "border-[var(--border)] hover:border-primary/40",
                  ].join(" ")}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = errors.phoneNo
                      ? "0 0 0 3px rgba(239, 68, 68, 0.18)"
                      : "0 0 0 3px rgba(37, 99, 235, 0.16)";
                  }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
                />
              </div>
              <div className="min-h-[14px] mt-1">
                {errors.phoneNo && (
                  <span className="text-[10px] text-danger">{errors.phoneNo}</span>
                )}
              </div>
            </div>

            {/* Alternate No */}
            <div className="flex flex-col min-w-0">
              <span className="block text-[10px] font-medium text-main mb-1">
                Alternate No
              </span>
              <div className="flex gap-0">
                <input
                  name="alternateCode"
                  value={form.alternateCode}
                  onChange={onChange}
                  placeholder="+"
                  className={[
                    "w-[50px] py-1 px-2 border rounded text-[11px] text-main bg-card transition-all min-w-0",
                    errors.alternateNo
                      ? "border-danger focus:border-danger"
                      : "border-[var(--border)] hover:border-primary/40",
                  ].join(" ")}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = errors.alternateNo
                      ? "0 0 0 3px rgba(239, 68, 68, 0.18)"
                      : "0 0 0 3px rgba(37, 99, 235, 0.16)";
                  }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
                />
                <input
                  name="alternateNo"
                  type="tel"
                  value={form.alternateNo}
                  onChange={onChange}
                  placeholder="Enter mobile number"
                  className={[
                    "flex-1 py-1 px-2 border rounded text-[11px] text-main bg-card transition-all min-w-0",
                    errors.alternateNo
                      ? "border-danger focus:border-danger"
                      : "border-[var(--border)] hover:border-primary/40",
                  ].join(" ")}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = errors.alternateNo
                      ? "0 0 0 3px rgba(239, 68, 68, 0.18)"
                      : "0 0 0 3px rgba(37, 99, 235, 0.16)";
                  }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
                />
              </div>
              {errors.alternateNo && (
                <span className="text-[10px] text-danger mt-1">{errors.alternateNo}</span>
              )}
            </div>
            <ModalInput
              label="Email Id"
              name="emailId"
              value={form.emailId}
              onChange={onChange}
              type="email"
              required
              error={errors.emailId}
            />
          </div>

        </div>
      </div>
    </section>
  );
};
