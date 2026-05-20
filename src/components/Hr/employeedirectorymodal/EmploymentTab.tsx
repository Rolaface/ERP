import React, { useEffect } from "react";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import {
  getAllDepartments,
  getAllGrades,
  getAllDesignations,
  getAllEmploymentTypes,
  getallbranches,createBranch,checkBranchExists,getshift
} from "../../../api/utils/frappeUtilsApi";
import { getAllEmployees } from "../../../api/employeeapi";
import DatePickerInput from "../../calendar/DatePickerInput";

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
    formData.employment_type === "Contract" ||
    formData.employment_type === "Temporary" ||
    formData.employment_type === "Intern";

  useEffect(() => {
    if (!isContractBased && formData.contractEndDate) {
      handleInputChange("contractEndDate", "");
    }
  }, [formData.employeeType]);
  const fetchEmployeeOptions = async (q: string) => {
    const res = await getAllEmployees(1, 200);

    return (res.data || [])
      .filter((emp: any) =>
        `${emp.employee_name} ${emp.name}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
      .map((emp: any) => ({
        label: emp.employee_name,
        value: emp.name,
        meta: {
          employeeId: emp.name,
        },
      }));
  };
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

  const fetchbranchoption = async (q: string) => {
    const data = await getallbranches(q);

    return data;
  };
   const fetchshiftoption = async (q: string) => {
    const data = await getshift(q);

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
            placeholder="Search Department..."
            fetchOptions={fetchDepartmentOptions}
            onChange={(value) => handleInputChange("department", value)}
          />

          <SearchSelect2
            label="Grade"
            value={formData.grade}
            placeholder="Search Grade..."
            fetchOptions={fetchGradeOptions}
            onChange={(value) => handleInputChange("grade", value)}
          />

          <SearchSelect2
            label="Designation"
            value={formData.designation}
            placeholder="Search Designation..."
            fetchOptions={fetchDesignationOptions}
            onChange={(value) => handleInputChange("designation", value)}
          />
          <ModalInput
            label="Employee Number"
            name="employee_number"
            value={formData.employee_number}
            onChange={(e) =>
              handleInputChange("employee_number", e.target.value)
            }
          />

          <SearchSelect2
            label="Employee Type"
            value={formData.employment_type}
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

         <SearchSelect2
            label="Shift"
            value={formData.shift}
            placeholder="Search shift Type..."
            fetchOptions={fetchshiftoption}
            onChange={(value) => handleInputChange("shift", value)}
          />
        </div>
      </div>

      {/* Reporting & Dates */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Reporting & Dates
        </h4>
        <div className="grid grid-cols-3 gap-2.5">
          <SearchSelect2
            label="Reporting To"
            value={formData.reportingToLabel}
            placeholder="Search Employee..."
            fetchOptions={fetchEmployeeOptions}
            onChange={(value, option) => {
              handleInputChange("reports_to", value);

              handleInputChange("reportingToLabel", option?.label || "");
            }}
          />

          {/* <ModalInput
            label="Probation Period (months)"
            name="probationPeriod"
            type="number"
            value={formData.probationPeriod}
            onChange={(e) =>
              handleInputChange("probationPeriod", e.target.value)
            }
          /> */}

          <DatePickerInput
            label="Date of Joining"
            name="dateOfJoining"
            value={formData.dateOfJoining}
            onChange={handleInputChange}
          />

          <DatePickerInput
            label="Contract End Date"
            name="contractEndDate"
            value={formData.contractEndDate}
            onChange={handleInputChange}
            disabled={!isContractBased}
          />
        </div>
        {!isContractBased && (
          <p className="text-[10px] text-muted mt-1.5">
        
          </p>
        )}
      </div>

      {/* Work Location */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Work Location
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <SearchSelect2
  label="Branch"
  value={formData.branch}
  placeholder="Search branch..."
  fetchOptions={fetchbranchoption}
  allowCustomInput
  onChange={async (value, option) => {
    let finalBranch = value;

    const exists = await checkBranchExists(value);

    if (!exists && value?.trim()) {
      await createBranch(value);
    }

    handleInputChange("branch", finalBranch);
    handleInputChange(
      "branchLabel",
      option?.label || finalBranch,
    );
  }}
/>
        </div>
      </div>
    </div>
  );
};

export default EmploymentTab;
