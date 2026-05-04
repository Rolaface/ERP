import React from "react";
import { useCompanySelection } from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures } from "../../../config/employeeFeatures";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";

type PersonalInfoTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
  verifiedFields: Record<string, boolean>;
};

const GENDER_OPTIONS = [
  { label: "Male",   value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other",  value: "Other" },
];

const MARITAL_STATUS_OPTIONS = [
  { label: "Single",   value: "Single" },
  { label: "Married",  value: "Married" },
  { label: "Divorced", value: "Divorced" },
  { label: "Widowed",  value: "Widowed" },
];

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  handleInputChange,
  verifiedFields,
}) => {
  const { companyCode } = useCompanySelection();
  const features = getEmployeeFeatures(companyCode);

  const isVerified = (field: string) => verifiedFields[field] === true;

  return (
    <div className="max-w-4xl mx-auto space-y-3">

      {/* Identity & Statutory */}
      {features.showStatutoryFields && (
        <div className="bg-card p-3 rounded-lg border border-theme">
          <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
            Identity & Statutory Information
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <ModalInput
                label="NRC Number"
                name="nrcId"
                value={formData.nrcId}
                disabled={isVerified("nrcId")}
                onChange={(e) => handleInputChange("nrcId", e.target.value)}
                required={features.statutoryFieldsRequired}
                placeholder="123456/78/1"
              />
              {isVerified("nrcId") && (
                <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">✓ Verified from NAPSA</p>
              )}
            </div>

            <ModalInput
              label="Social Security (NAPSA)"
              name="socialSecurityNapsa"
              value={formData.socialSecurityNapsa}
              disabled={isVerified("socialSecurityNapsa")}
              onChange={(e) => handleInputChange("socialSecurityNapsa", e.target.value)}
              required={features.statutoryFieldsRequired}
            />

            <ModalInput
              label="NHIMA Number"
              name="nhimaHealthInsurance"
              value={formData.nhimaHealthInsurance}
              onChange={(e) => handleInputChange("nhimaHealthInsurance", e.target.value)}
              placeholder="91897177171"
            />

            <ModalInput
              label="TPIN"
              name="tpinId"
              value={formData.tpinId}
              onChange={(e) => handleInputChange("tpinId", e.target.value)}
              placeholder="10000000000"
            />
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Personal Information
        </h4>
        <div className="grid grid-cols-3 gap-2.5">
          <ModalInput
            label="First Name"
            name="firstName"
            value={formData.firstName}
            disabled={isVerified("firstName")}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            required
          />

          <ModalInput
            label="Middle Name"
            name="middleName"
            value={formData.middleName}
            onChange={(e) => handleInputChange("middleName", e.target.value)}
          />

          <ModalInput
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            disabled={isVerified("lastName")}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            required
          />

          <ModalInput
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            required
          />

          <ModalSelect
            label="Gender"
            name="gender"
            value={formData.gender}
            disabled={isVerified("gender")}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            options={GENDER_OPTIONS}
            required
          />

          <ModalSelect
            label="Marital Status"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
            options={MARITAL_STATUS_OPTIONS}
          />

          <ModalInput
            label="Nationality"
            name="nationality"
            value={formData.nationality}
            onChange={(e) => handleInputChange("nationality", e.target.value)}
            placeholder="e.g., Zambian"
          />
        </div>
      </div>

    </div>
  );
};

export default PersonalInfoTab;