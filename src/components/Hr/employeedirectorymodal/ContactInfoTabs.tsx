import React from "react";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";

type ContactInfoTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
};

const PROVINCE_OPTIONS = [
  { label: "Central Province",       value: "Central Province" },
  { label: "Copperbelt Province",    value: "Copperbelt Province" },
  { label: "Eastern Province",       value: "Eastern Province" },
  { label: "Luapula Province",       value: "Luapula Province" },
  { label: "Lusaka Province",        value: "Lusaka Province" },
  { label: "Muchinga Province",      value: "Muchinga Province" },
  { label: "Northern Province",      value: "Northern Province" },
  { label: "North-Western Province", value: "North-Western Province" },
  { label: "Southern Province",      value: "Southern Province" },
  { label: "Western Province",       value: "Western Province" },
];

const ContactInfoTab: React.FC<ContactInfoTabProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-3">

      {/* Contact Information */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Contact Information
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <ModalInput
            label="Personal Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
          />
          <ModalSelect
          label="Preferred Contact Email"
          name="preferredContactMethod"
          value={formData.preferredContactMethod}
          onChange={(e) => handleInputChange("preferredContactMethod", e.target.value)}
          options={[
            { label: "Company Email", value: "Company Email" },
            { label: "Personal Email", value: "Personal Email" },
            { label: "User ID ", value: "User ID" },
          ]}
          />
          <ModalInput
            label="Company Email"
            name="CompanyEmail"
            type="email"
            value={formData.CompanyEmail}
            onChange={(e) => handleInputChange("CompanyEmail", e.target.value)}
            placeholder="@company.co.zm"
            required
          />
          <ModalInput
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            placeholder="+260971234567"
            required
          />
          <ModalInput
            label="Alternate Phone"
            name="alternatePhone"
            type="tel"
            value={formData.alternatePhone}
            onChange={(e) => handleInputChange("alternatePhone", e.target.value)}
          />
        </div>
      </div>

      {/* Address */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Address
        </h4>
        <div className="space-y-2.5">
          <ModalInput
            label="Street Address"
            name="street"
            value={formData.street}
            onChange={(e) => handleInputChange("street", e.target.value)}
            placeholder="Plot number, street name"
          />
          <div className="grid grid-cols-3 gap-2.5">
            <ModalInput
              label="City"
              name="city"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
            />
            <ModalInput
              label="Province"
              name="province"
              value={formData.province}
              onChange={(e) => handleInputChange("province", e.target.value)}
              placeholder="Enter province"
            />
            <ModalInput
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Emergency Contact
        </h4>
        <div className="grid grid-cols-3 gap-2.5">
          <ModalInput
            label="Name"
            name="emergencyContactName"
            value={formData.emergencyContactName}
            onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
            required
          />
          <ModalInput
            label="Phone"
            name="emergencyContactPhone"
            type="tel"
            value={formData.emergencyContactPhone}
            onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
            placeholder="+260"
            required
          />
          <ModalInput
            label="Relationship"
            name="emergencyContactRelationship"
            value={formData.emergencyContactRelationship}
            onChange={(e) => handleInputChange("emergencyContactRelationship", e.target.value)}
            placeholder="e.g., Spouse, Parent"
          />
        </div>
      </div>

    </div>
  );
};

export default ContactInfoTab;