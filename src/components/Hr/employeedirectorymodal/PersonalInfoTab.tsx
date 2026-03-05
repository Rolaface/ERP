import React from "react";
import { useCompanySelection } from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures } from "../../../config/employeeFeatures";
import HrDateInput from "../HrDateInput";

type PersonalInfoTabProps = {
  formData: {
    nrcId?: string;
    socialSecurityNapsa?: string;
    nhimaHealthInsurance?: string;
    tpinId?: string;
    firstName?: string;
    otherNames?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    maritalStatus?: string;
  };
  handleInputChange: (field: string, value: string | boolean) => void;
  verifiedFields: Record<string, boolean>;
};

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  handleInputChange,
  verifiedFields,
}) => {
  const [dobError, setDobError] = React.useState<string | null>(null);
  const { companyCode } = useCompanySelection();
  const features = getEmployeeFeatures(companyCode);

  const digitsOnly = (raw: string, maxLen: number): string =>
    String(raw ?? "")
      .replace(/\D/g, "")
      .slice(0, maxLen);

  const formatNrc = (raw: string): string => {
    const digits = String(raw ?? "")
      .replace(/\D/g, "")
      .slice(0, 9);
    const part1 = digits.slice(0, 6);
    const part2 = digits.slice(6, 8);
    const part3 = digits.slice(8, 9);

    let out = part1;
    if (part2) out += `/${part2}`;
    if (part3) out += `/${part3}`;
    return out;
  };

  const verifiedInputStyle = "bg-app text-main cursor-not-allowed border-theme";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* CONDITIONAL RENDERING - Only show for companies with statutory fields */}
      {features.showStatutoryFields && (
        <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
          <h4 className="text-xs font-semibold text-main uppercase tracking-wide mb-3">
            Identity & Statutory Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {/* NRC Field */}
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                NRC Number{" "}
                {features.statutoryFieldsRequired && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <input
                type="text"
                value={formData.nrcId}
                disabled={verifiedFields.nrcId}
                placeholder="e.g., 123456/78/9"
                onChange={(e) =>
                  handleInputChange("nrcId", formatNrc(e.target.value))
                }
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none
                  ${
                    verifiedFields.nrcId
                      ? verifiedInputStyle
                      : "border border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  }`}
              />
              {verifiedFields.nrcId && (
                <p className="text-[10px] text-success mt-1 font-medium">
                  ✓ Verified from NAPSA
                </p>
              )}
            </div>

            {/* SSN Field */}
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                SSN{" "}
                {features.statutoryFieldsRequired && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <input
                type="text"
                value={formData.socialSecurityNapsa}
                disabled={verifiedFields.socialSecurityNapsa}
                placeholder="Enter SSN"
                onChange={(e) =>
                  handleInputChange(
                    "socialSecurityNapsa",
                    digitsOnly(e.target.value, 9),
                  )
                }
                inputMode="numeric"
                maxLength={9}
                className={`w-full px-3 py-2 text-sm rounded-lg border
                  ${
                    verifiedFields.socialSecurityNapsa
                      ? verifiedInputStyle
                      : "border border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  }`}
              />
            </div>

            {/* NHIMA Field */}
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                NHIMA Number{" "}
                {features.statutoryFieldsRequired && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <input
                type="text"
                value={formData.nhimaHealthInsurance}
                onChange={(e) =>
                  handleInputChange("nhimaHealthInsurance", e.target.value)
                }
                placeholder="e.g., 91897177171"
                required={features.statutoryFieldsRequired}
                className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* TPIN Field */}
            <div>
              <label className="block text-xs text-main mb-1 font-medium">
                TPIN{" "}
                {features.statutoryFieldsRequired && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <input
                type="text"
                value={formData.tpinId}
                onChange={(e) =>
                  handleInputChange("tpinId", digitsOnly(e.target.value, 10))
                }
                placeholder="e.g., 10000000000"
                required={features.statutoryFieldsRequired}
                inputMode="numeric"
                maxLength={10}
                className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide mb-3">
          Personal Information
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              First Name <span className="text-danger">*</span>
            </label>
            <input
              value={formData.firstName}
              disabled={verifiedFields.firstName}
              placeholder="Enter first name"
              onChange={(e) =>
                handleInputChange(
                  "firstName",
                  String(e.target.value ?? "").toUpperCase(),
                )
              }
              className={`w-full px-3 py-2 text-sm rounded-lg border
    ${
      verifiedFields.firstName
        ? verifiedInputStyle
        : "border border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
    }`}
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Other Names
            </label>
            <input
              type="text"
              value={formData.otherNames}
              placeholder="Enter other names"
              onChange={(e) =>
                handleInputChange(
                  "otherNames",
                  String(e.target.value ?? "").toUpperCase(),
                )
              }
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Last Name <span className="text-danger">*</span>
            </label>
            <input
              value={formData.lastName}
              disabled={verifiedFields.lastName}
              placeholder="Enter last name"
              onChange={(e) =>
                handleInputChange(
                  "lastName",
                  String(e.target.value ?? "").toUpperCase(),
                )
              }
              className={`w-full px-3 py-2 text-sm rounded-lg border
    ${
      verifiedFields.lastName
        ? verifiedInputStyle
        : "border border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
    }`}
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Date of Birth <span className="text-danger">*</span>
            </label>
            <HrDateInput
              value={formData.dateOfBirth}
              onChange={(selectedDate) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const dob = new Date(selectedDate);
                if (dob >= today) {
                  setDobError("Date of birth cannot be today or a future date");
                  return;
                }

                setDobError(null);
                handleInputChange("dateOfBirth", selectedDate);
              }}
              placeholder="DD/MM/YYYY"
              inputClassName={`px-3 py-2 ${
                dobError
                  ? "border-danger focus:ring-2 focus:ring-danger/30"
                  : "border border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
              }`}
            />
            {dobError && (
              <p className="text-[10px] text-danger mt-1 font-medium">
                {dobError}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Gender <span className="text-danger">*</span>
            </label>
            <select
              value={formData.gender}
              disabled={verifiedFields.gender}
              aria-label="Gender"
              title="Gender"
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-lg border
    ${
      verifiedFields.gender
        ? verifiedInputStyle
        : "border border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
    }`}
            >
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Marital Status
            </label>
            <select
              value={formData.maritalStatus}
              aria-label="Marital Status"
              title="Marital Status"
              onChange={(e) =>
                handleInputChange("maritalStatus", e.target.value)
              }
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select</option>
              <option>Single</option>
              <option>Married</option>
              <option>Divorced</option>
              <option>Widowed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
