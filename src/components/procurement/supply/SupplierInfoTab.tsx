import React from "react";
import {
  taxCategorySelectOptions,
  type SupplierFormData,
} from "../../../types/Supply/supplier";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";

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
              placeholder="maximum 10 digit"
              maxLength={10}
              required
              error={errors.tpin}
            />
            <ModalInput
              label="Supplier Name"
              name="supplierName"
              value={form.supplierName}
              onChange={onChange}
              placeholder="e.g. ABC Trading Ltd"
              required
              error={errors.supplierName}
            />
            <ModalInput
              label="Supplier Code"
              name="supplierCode"
              value={form.supplierCode}
              onChange={onChange}
              placeholder="e.g. SUP-001"
            />
            <ModalSelect
              label="Tax Category"
              name="taxCategory"
              value={form.taxCategory}
              onChange={onChange}
              options={[...taxCategorySelectOptions]}
              placeholder="Select tax category"
              required
              error={errors.taxCategory}
            />
          </div>
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
              placeholder="e.g. John Banda"
              required
              error={errors.contactPerson}
            />
            <ModalInput
              label="Phone No"
              name="phoneNo"
              value={form.phoneNo}
              onChange={onChange}
              type="tel"
              placeholder="e.g. 0978123456"
              maxLength={10}
              required
              error={errors.phoneNo}
            />

            <ModalInput
              label="Alternate No"
              name="alternateNo"
              value={form.alternateNo}
              onChange={onChange}
              type="tel"
              placeholder="e.g. 0966123456"
              maxLength={10}
              error={errors.alternateNo}
            />

            <ModalInput
              label="Email Id"
              name="emailId"
              value={form.emailId}
              onChange={onChange}
              type="email"
              placeholder="e.g. accounts@abctrading.com"
              required
              error={errors.emailId}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
