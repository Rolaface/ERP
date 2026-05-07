import React, { useEffect } from "react";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import {
  getAllDepartments,
  getAllGrades,
  getAllDesignations,
  getAllEmploymentTypes,
} from "../../../api/utils/frappeUtilsApi";

type EmploymentTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
  departments: string[];
  Level: string[];
  managers: { name: string; employeeId: string }[];
  hrManagers: { name: string; employeeId: string }[];
};

const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Suspended", value: "Suspended" },
  { label: "Left", value: "Left" },
];

const SHIFT_OPTIONS = [
  { label: "Day", value: "Day" },
  { label: "Night", value: "Night" },
  { label: "Split", value: "Split" },
];

const EmploymentTab: React.FC<EmploymentTabProps> = ({
  formData,
  handleInputChange,

  hrManagers,
}) => {
  const isContractBased =
    formData.employeeType === "Contract" ||
    formData.employeeType === "Temporary" ||
    formData.employeeType === "Intern";

  useEffect(() => {
    if (!isContractBased && formData.contractEndDate) {
      handleInputChange("contractEndDate", "");
    }
  }, [formData.employeeType]);


  const hrManagerOptions = hrManagers.map((mgr) => ({
    label: mgr.name,
    value: mgr.employeeId,
  }));

  const fetchDepartmentOptions = async (q: string) => {
    const data = await getAllDepartments(q);

    return data;
  };
  const fetchGradeOptions = async (q: string) => {
    const data = await getAllGrades(q);

    return data;
  };
  const fetchDesignationOptions = async (q: string) => {
    const data = await getAllDesignations(q);

    return data;
  };
  const fetchEmploymentTypeOptions = async (q: string) => {
    const data = await getAllEmploymentTypes(q);

    return data;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {/* Employment Details */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Employment Details
        </h4>
        <div className="grid grid-cols-3 gap-2.5">
          <SearchSelect2
            label="Department"
            value={formData.department}
            required
            placeholder="Search Department..."
            fetchOptions={fetchDepartmentOptions}
            onChange={(value) => handleInputChange("department", value)}
          />

          <SearchSelect2
            label="Grade"
            value={formData.grade}
            required
            placeholder="Search Grade..."
            fetchOptions={fetchGradeOptions}
            onChange={(value) => handleInputChange("grade", value)}
          />

          <SearchSelect2
            label="Designation"
            value={formData.designation}
            required
            placeholder="Search Designation..."
            fetchOptions={fetchDesignationOptions}
            onChange={(value) => handleInputChange("designation", value)}
          />

          <SearchSelect2
            label="Employee Type"
            value={formData.employment_type}
            required
            placeholder="Search Employee Type..."
            fetchOptions={fetchEmploymentTypeOptions}
            onChange={(value) => handleInputChange("employment_type", value)}
          />

          <ModalSelect
            label="Employment Status"
            name="employmentStatus"
            value={formData.employmentStatus}
            onChange={(e) =>
              handleInputChange("employmentStatus", e.target.value)
            }
            options={EMPLOYMENT_STATUS_OPTIONS}
          />

          <ModalSelect
            label="Shift"
            name="shift"
            value={formData.shift}
            onChange={(e) => handleInputChange("shift", e.target.value)}
            options={SHIFT_OPTIONS}
          />
        </div>
      </div>

      {/* Reporting & Dates */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Reporting & Dates
        </h4>
        <div className="grid grid-cols-3 gap-2.5">
          <ModalSelect
            label="Reporting Manager"
            name="reportingManager"
            value={formData.reportingManager}
            onChange={(e) =>
              handleInputChange("reportingManager", e.target.value)
            }
            
            required
            placeholder="Select Manager"
          />

          <ModalSelect
            label="HR Manager"
            name="hrManager"
            value={formData.hrManager}
            onChange={(e) => handleInputChange("hrManager", e.target.value)}
            options={hrManagerOptions}
            required
            placeholder="Select HR Manager"
          />

          <ModalInput
            label="Probation Period (months)"
            name="probationPeriod"
            type="number"
            value={formData.probationPeriod}
            onChange={(e) =>
              handleInputChange("probationPeriod", e.target.value)
            }
          />

          <ModalInput
            label="Date of Joining"
            name="dateOfJoining"
            type="date"
            value={formData.dateOfJoining}
            onChange={(e) =>
              handleInputChange("dateOfJoining", e.target.value)
            }
            required
          />

          <ModalInput
            label="Contract End Date"
            name="contractEndDate"
            type="date"
            value={formData.contractEndDate}
            onChange={(e) =>
              handleInputChange("contractEndDate", e.target.value)
            }
            disabled={!isContractBased}
          />
        </div>
        {!isContractBased && (
          <p className="text-[10px] text-muted mt-1.5">
            Contract end date only applies to Contract, Temporary, or Intern
            employees.
          </p>
        )}
      </div>

      {/* Work Location */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Work Location
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <ModalInput
            label="Work Location"
            name="workLocation"
            value={formData.workLocation}
            onChange={(e) => handleInputChange("workLocation", e.target.value)}
            placeholder="e.g., Lusaka HQ"
          />
          <ModalInput
            label="Work Address"
            name="workAddress"
            value={formData.workAddress}
            onChange={(e) => handleInputChange("workAddress", e.target.value)}
            placeholder="Office address"
          />
        </div>
      </div>
    </div>
  );
};

export default EmploymentTab;
