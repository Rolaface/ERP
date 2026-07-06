import React, { useEffect, useState } from "react";

import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import DatePickerInput from "../../calendar/DatePickerInput";
import { getAllGenders } from "../../../api/employeeapi";
import { showApiError } from "../../../utils/alert";
import { parseFrappeError } from "../../../views/hr/tabs/leave-config/hooks/parseFrappeError";

type PersonalInfoTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
  verifiedFields: Record<string, boolean>;
};

const MARITAL_STATUS_OPTIONS = [
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Divorced", value: "Divorced" },
  { label: "Widowed", value: "Widowed" },
];

const blood_group_option = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  handleInputChange,
  verifiedFields,
}) => {
  const [genderOptions, setGenderOptions] = useState<any[]>([]);
  


  const fetchGenderOptions = async () => {
    try {
      const response = await getAllGenders();
      const rawData = response?.data || [];
      const formattedOptions = rawData.map((item: { name: string }) => ({
        label: item.name,
        value: item.name,
      }));
      setGenderOptions(formattedOptions);
    } catch (error) {
      showApiError(parseFrappeError(error) || "Failed to fetch Gender API");
    }
  };

  useEffect(() => {
    fetchGenderOptions();
  }, []);

  const isVerified = (field: string) => verifiedFields[field] === true;

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">

   

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
          />
          <DatePickerInput
            label="Date of Birth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
          <ModalSelect
            label="Blood Group"
            name="blood_group"
            value={formData.blood_group || ""}
            onChange={(e) => handleInputChange("blood_group", e.target.value)}
            options={blood_group_option}
          />
          <ModalSelect
            label="Gender"
            name="gender"
            value={formData.gender}
            disabled={isVerified("gender")}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            options={genderOptions || []}
            required
          />
          <ModalSelect
            label="Marital Status"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
            options={MARITAL_STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Statutory Information */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Statutory Information
        </h4>
        <div className="grid grid-cols-4 gap-2.5">
          <ModalInput
            label="National Identification Number"
            name="nationalidentificationnumber"
            value={formData.nationalidentificationnumber || ""}
            onChange={(e) => handleInputChange("nationalidentificationnumber", e.target.value)}
          />
          <ModalInput
            label="Tax Identification Number"
            name="taxidentificationnumber"
            value={formData.taxidentificationnumber || ""}
            onChange={(e) => handleInputChange("taxidentificationnumber", e.target.value)}
          />
          <ModalInput
            label="Universal Account Number"
            name="universalaccountnumber"
            value={formData.universalaccountnumber || ""}
            onChange={(e) => handleInputChange("universalaccountnumber", e.target.value)}
          />
          <ModalInput
            label="Health Insurance Number"
            name="healthInsuranceNo"
            value={formData.healthInsuranceNo || ""}
            onChange={(e) => handleInputChange("healthInsuranceNo", e.target.value)}
            placeholder="e.g. HL-234234234"
          />
        </div>
      </div>

    </div>
  );
};

export default PersonalInfoTab;