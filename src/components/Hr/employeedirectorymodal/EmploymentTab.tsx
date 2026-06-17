import React, { useEffect } from "react";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import {
  getAllDepartments,
  getAllGrades,
  getAllDesignations,
  getAllEmploymentTypes,
  getallbranches,
  createBranch,
  checkBranchExists,
  getshift,
  getEmployees,
} from "../../../api/utils/frappeUtilsApi";
import { resolveLabel } from "../../../api/utils/labelResolver";
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

const EmploymentTab: React.FC<EmploymentTabProps> = ({
  formData,
  handleInputChange,
  hrManagers,
}) => {
  const isContractBased =
    formData.employment_type === "Contract" ||
    formData.employment_type === "Temporary" ||
    formData.employment_type === "Intern";

  const isLeft = formData.employmentStatus === "Left";

  useEffect(() => {
    if (!isContractBased && formData.contractEndDate) {
      handleInputChange("contractEndDate", "");
    }
  }, [formData.employment_type]);

  const fetchReportingToOptions = async (q: string) => {
    const res = await getEmployees(q, { currentEmployee: formData.employee });
    return (res || []).map((emp: any) => ({
      label: emp.label,
      value: emp.value,
      meta: { description: emp.description },
    }));
  };

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.department, fetcher: getAllDepartments });
      handleInputChange("departmentLabel", label);
    };
    loadLabel();
  }, [formData.department]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.reports_to, fetcher: getEmployees });
      handleInputChange("reportingToLabel", label);
    };
    loadLabel();
  }, [formData.reports_to]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.branch, fetcher: getallbranches });
      handleInputChange("branchLabel", label);
    };
    loadLabel();
  }, [formData.branch]);

  const fetchDepartmentOptions = (q: string) => getAllDepartments(q);
  const fetchGradeOptions = (q: string) => getAllGrades(q);
  const fetchDesignationOptions = (q: string) => getAllDesignations(q);
  const fetchEmploymentTypeOptions = (q: string) => getAllEmploymentTypes(q);
  const fetchBranchOptions = (q: string) => getallbranches(q);
  const fetchShiftOptions = (q: string) => getshift(q);

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">

      {/* Employment Details */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Employment Details
        </h4>

        <div className="grid grid-cols-3 gap-2.5">
          <SearchSelect2
            label="Department"
            value={formData.departmentLabel || formData.department}
            placeholder="Search Department..."
            fetchOptions={fetchDepartmentOptions}
            onChange={(value, option) => {
              handleInputChange("department", value);
              handleInputChange("departmentLabel", option?.label || "");
            }}
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
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          <ModalInput
            label="Employee Number"
            name="employee_number"
            value={formData.employee_number}
            onChange={(e) => handleInputChange("employee_number", e.target.value)}
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
            onChange={(e) => handleInputChange("employmentStatus", e.target.value)}
            options={EMPLOYMENT_STATUS_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          <SearchSelect2
            label="Shift"
            value={formData.shift}
            placeholder="Search Shift Type..."
            fetchOptions={fetchShiftOptions}
            onChange={(value) => handleInputChange("shift", value)}
          />
          {isLeft && (
            <DatePickerInput
              label="Relieving Date"
              name="relievingDate"
              value={formData.relievingDate}
              onChange={handleInputChange}
            />
          )}
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
            value={formData.reportingToLabel || formData.reports_to}
            placeholder="Search Employee..."
            fetchOptions={fetchReportingToOptions}
            onChange={(value, option) => {
              handleInputChange("reports_to", value);
              handleInputChange("reportingToLabel", option?.label || "");
            }}
          />
          <DatePickerInput
            label="Date of Joining"
            name="dateOfJoining"
            value={formData.dateOfJoining}
            onChange={handleInputChange}
            required
          />
          <DatePickerInput
            label="Contract End Date"
            name="contractEndDate"
            value={formData.contractEndDate}
            onChange={handleInputChange}
            disabled={!isContractBased}
          />
        </div>
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
            placeholder="Search Branch..."
            fetchOptions={fetchBranchOptions}
            allowCustomInput
            onChange={async (value, option) => {
              const exists = await checkBranchExists(value);
              if (!exists && value?.trim()) {
                await createBranch(value);
              }
              handleInputChange("branch", value);
              handleInputChange("branchLabel", option?.label || value);
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default EmploymentTab;