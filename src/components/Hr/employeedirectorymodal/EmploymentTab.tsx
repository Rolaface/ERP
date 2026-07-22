import React, { useEffect, useRef, useState } from "react";
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
import {
  getNextEmployeeNumber,
  checkEmployeeNumberAvailability,
} from "../../../api/Employee/employeeNumberApi";
import { resolveLabel } from "../../../api/utils/labelResolver";
import DatePickerInput from "../../calendar/DatePickerInput";

type EmploymentTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
  departments: string[];
  Level: string[];
  managers: { name: string; employeeId: string }[];
  hrManagers: { name: string; employeeId: string }[];
  isEditMode?: boolean;
  employeeId?: string; 
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
  isEditMode = false,
  employeeId,
}) => {
  const isContractBased =
    formData.employment_type === "Contract" ||
    formData.employment_type === "Temporary" ||
    formData.employment_type === "Intern";

  const isLeft = formData.employmentStatus === "Left";

  // ── Employee Number: suggestion + live availability ───────────────────
  const [employeeNumberStatus, setEmployeeNumberStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");

  const [employeeNumberMessage, setEmployeeNumberMessage] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPrefilledRef = useRef(false);


  const originalEmployeeNumberRef = useRef<string | null>(null);
  const hasCapturedOriginalRef = useRef(false);

  useEffect(() => {
    if (isEditMode && !hasCapturedOriginalRef.current) {
      originalEmployeeNumberRef.current = formData.employee_number ?? "";
      hasCapturedOriginalRef.current = true;
    }

  }, [isEditMode]);
  useEffect(() => {
    if (isEditMode) return;
    if (hasPrefilledRef.current) return;
    if (formData.employee_number) {
      hasPrefilledRef.current = true;
      return;
    }

    hasPrefilledRef.current = true;
    (async () => {
      try {
        const res = await getNextEmployeeNumber();
        const suggested =
          res?.data?.data?.employee_number ??
          res?.message?.data?.employee_number;
        if (suggested) {
          handleInputChange("employee_number", suggested);
        }
      } catch {
       
      }
    })();
    
  }, [isEditMode]);


  useEffect(() => {
    const value = formData.employee_number?.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value) {
      setEmployeeNumberStatus("idle");
      setEmployeeNumberMessage("");
      return;
    }

    // Edit mode + value unchanged from what this employee started with →
    // skip the check entirely, don't show any indicator.
    if (
      isEditMode &&
      hasCapturedOriginalRef.current &&
      value === originalEmployeeNumberRef.current
    ) {
      setEmployeeNumberStatus("idle");
      setEmployeeNumberMessage("");
      return;
    }

    setEmployeeNumberStatus("checking");
    setEmployeeNumberMessage("");

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await checkEmployeeNumberAvailability(
          value,
          isEditMode ? employeeId : undefined,
        );

        const body = res?.data ?? res?.message ?? res;
        const inner = body?.data ?? body;
        const isFail = body?.status === "fail" || body?.status_code >= 400;

        if (isFail) {
          setEmployeeNumberStatus("taken");
          setEmployeeNumberMessage(
            typeof body?.message === "string"
              ? body.message
              : "This Employee Number is already in use.",
          );
          return;
        }

        if (inner?.is_available) {
          setEmployeeNumberStatus("available");
          setEmployeeNumberMessage("");
        } else {
          setEmployeeNumberStatus("taken");
          setEmployeeNumberMessage("This Employee Number is already in use.");
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const serverData = err?.response?.data;

        if (status === 409) {
          setEmployeeNumberStatus("taken");
          setEmployeeNumberMessage(
            typeof serverData?.message === "string"
              ? serverData.message
              : "This Employee Number is already in use.",
          );
        } else if (status === 400) {
          setEmployeeNumberStatus("error");
          setEmployeeNumberMessage(
            typeof serverData?.message === "string"
              ? serverData.message
              : "Invalid Employee Number.",
          );
        } else {
          setEmployeeNumberStatus("idle");
          setEmployeeNumberMessage("");
        }
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.employee_number]);

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
      const label = await resolveLabel({
        value: formData.department,
        fetcher: getAllDepartments,
      });
      handleInputChange("departmentLabel", label);
    };
    loadLabel();
  }, [formData.department]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: formData.reports_to,
        fetcher: getEmployees,
      });
      handleInputChange("reportingToLabel", label);
    };
    loadLabel();
  }, [formData.reports_to]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: formData.branch,
        fetcher: getallbranches,
      });
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
          <div className="flex flex-col gap-1">
            <ModalInput
              label="Employee Number"
              name="employee_number"
              value={formData.employee_number}
              onChange={(e) =>
                handleInputChange("employee_number", e.target.value)
              }
            />
            {employeeNumberStatus === "checking" && (
              <span className="text-[10px] text-muted">
                Checking availability…
              </span>
            )}
            {employeeNumberStatus === "available" && (
              <span className="text-[10px] text-green-600">Available</span>
            )}
            {(employeeNumberStatus === "taken" ||
              employeeNumberStatus === "error") && (
              <span className="text-[10px] text-red-600">
                {typeof employeeNumberMessage === "string"
                  ? employeeNumberMessage
                  : "This Employee Number is already in use."}
              </span>
            )}
          </div>
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
