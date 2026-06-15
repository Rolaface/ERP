import React from "react";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import PhoneCodeSelect from "../../common/PhoneCodeSelect";

type ContactInfoTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
};

const ContactInfoTab: React.FC<ContactInfoTabProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="w-full flex flex-col gap-2 min-w-0">

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
              { label: "User ID", value: "User ID" },
            ]}
            required
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
          {/* Phone Number */}
          <div className="flex flex-col min-w-0">
            <span className="block text-[10px] font-medium text-main mb-1">
              Phone Number
            </span>
            <div className="flex">
              <PhoneCodeSelect
                value={formData.phoneCode}
                onChange={(code) => {
                  handleInputChange("phoneCode", code);
                  handleInputChange(
                    "phoneNumber",
                    `${code || ""}${formData.phoneNo || ""}`,
                  );
                }}
              />
              <input
                name="phoneNo"
                type="tel"
                value={formData.phoneNo}
                onChange={(e) => {
                  handleInputChange("phoneNo", e.target.value);
                  handleInputChange(
                    "phoneNumber",
                    `${formData.phoneCode || ""}${e.target.value || ""}`,
                  );
                }}
                placeholder="Enter phone number"
                className="flex-1 py-1 px-2 border-t border-b border-r rounded-r text-[11px] text-main bg-card transition-all min-w-0 border-[var(--border)] hover:border-primary/40"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.16)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Address
        </h4>
        <div className="flex flex-col gap-2.5">
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
          />

          {/* Emergency Phone */}
          <div className="flex flex-col min-w-0">
            <span className="block text-[10px] font-medium text-main mb-1">
              Phone
            </span>
            <div className="flex">
              <PhoneCodeSelect
                value={formData.emergencyContactCode}
                onChange={(code) => {
                  handleInputChange("emergencyContactCode", code);
                  handleInputChange(
                    "emergencyContactPhone",
                    `${code || ""}${formData.emergencyContactNo || ""}`,
                  );
                }}
              />
              <input
                name="emergencyContactNo"
                type="tel"
                value={formData.emergencyContactNo}
                onChange={(e) => {
                  handleInputChange("emergencyContactNo", e.target.value);
                  handleInputChange(
                    "emergencyContactPhone",
                    `${formData.emergencyContactCode || ""}${e.target.value || ""}`,
                  );
                }}
                placeholder="Enter phone number"
                className="flex-1 py-1 px-2 border-t border-b border-r rounded-r text-[11px] text-main bg-card transition-all min-w-0 border-[var(--border)] hover:border-primary/40"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.16)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>
          </div>

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