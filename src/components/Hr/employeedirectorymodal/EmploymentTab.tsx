import React, { useEffect, useState } from "react";
import HrDateInput from "../HrDateInput";

type EmploymentTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
  departments: string[];
  Level: string[];
  managers: { name: string; employeeId: string }[];
  hrManagers: { name: string; employeeId: string }[];
};

type DepartmentFieldProps = {
  value: string;
  options: string[];
  onChange: (val: string) => void;
};

const DepartmentField: React.FC<DepartmentFieldProps> = ({
  value,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [isOther, setIsOther] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const isKnown = options.includes(value);

  useEffect(() => {
    if (value !== "" && !isKnown) {
      setIsOther(true);
      setIsEditing(false);
    }
  }, [isKnown, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (dept: string) => {
    if (dept === "__other__") {
      setIsOther(true);
      setIsEditing(true);
      onChange("");
    } else {
      setIsOther(false);
      setIsEditing(false);
      onChange(dept);
    }
    setOpen(false);
  };

  const handleInputBlur = () => {
    if (value.trim() !== "") {
      setIsEditing(false);
    }
  };

  const handleButtonClick = () => {
    if (isOther && value !== "") {
      setIsEditing(true);
    }
    setOpen((prev) => !prev);
  };

  const displayLabel = isKnown
    ? value
    : isOther && value
      ? value
      : "Select a department";

  return (
    <div ref={ref}>
      <label className="block text-xs text-main mb-1 font-medium">
        Department * <span className="text-danger">*</span>
      </label>

      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
      >
        <span
          className={
            displayLabel === "Select a department" ? "text-muted" : "text-main"
          }
        >
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="relative z-50">
          <ul
            className="absolute top-1 left-0 w-full bg-card border border-theme rounded-lg shadow-lg overflow-y-auto"
            style={{ maxHeight: "185px" }}
          >
            {options.map((dept) => (
              <li
                key={dept}
                onClick={() => handleSelect(dept)}
                className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-primary/10 hover:text-primary transition
                  ${
                    value === dept && isKnown
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-main"
                  }`}
              >
                {dept}
              </li>
            ))}

            <li
              onClick={() => handleSelect("__other__")}
              className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-app border-t border-theme transition
                ${isOther ? "text-primary font-medium" : "text-muted"}`}
            >
              Not listed (enter manually)
            </li>
          </ul>
        </div>
      )}

      {isOther && isEditing && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(String(e.target.value ?? "").toUpperCase())}
          onBlur={handleInputBlur}
          placeholder="Type department name here..."
          autoFocus
          className="w-full mt-2 px-3 py-2 text-sm border border-primary bg-card text-main rounded-lg focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );
};

const EmploymentTab: React.FC<EmploymentTabProps> = ({
  formData,
  handleInputChange,
  departments,
  Level,
  managers,
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

  const initRows = (raw: string): string[] => {
    if (!raw) return [""];
    const parts = raw.split("\n");
    return parts.length > 0 ? parts : [""];
  };

  const [addressRows, setAddressRows] = useState<string[]>(() =>
    initRows(formData.workAddress ?? ""),
  );
  const [locationRows, setLocationRows] = useState<string[]>(() =>
    initRows(formData.workLocation ?? ""),
  );

  const rowCount = Math.max(addressRows.length, locationRows.length);

  // sync to formData whenever rows change
  const syncAddress = (rows: string[]) => {
    handleInputChange("workAddress", rows.join("\n"));
  };
  const syncLocation = (rows: string[]) => {
    handleInputChange("workLocation", rows.join("\n"));
  };

  const handleAddressChange = (index: number, value: string) => {
    const updated = [...addressRows];
    updated[index] = value;
    setAddressRows(updated);
    syncAddress(updated);
  };

  const handleLocationChange = (index: number, value: string) => {
    const updated = [...locationRows];
    updated[index] = value;
    setLocationRows(updated);
    syncLocation(updated);
  };

  const addRow = () => {
    const newAddr = [...addressRows, ""];
    const newLoc = [...locationRows, ""];
    setAddressRows(newAddr);
    setLocationRows(newLoc);
    syncAddress(newAddr);
    syncLocation(newLoc);
  };

  const removeRow = (index: number) => {
    const newAddr = addressRows.filter((_, i) => i !== index);
    const newLoc = locationRows.filter((_, i) => i !== index);
    const safeAddr = newAddr.length ? newAddr : [""];
    const safeLoc = newLoc.length ? newLoc : [""];
    setAddressRows(safeAddr);
    setLocationRows(safeLoc);
    syncAddress(safeAddr);
    syncLocation(safeLoc);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Employment Details
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <DepartmentField
            value={String(formData.department ?? "")}
            options={departments}
            onChange={(val) => handleInputChange("department", val)}
          />
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Level <span className="text-danger">*</span>
            </label>
            <select
              value={formData.level}
              onChange={(e) => handleInputChange("level", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main  rounded-lg  focus:outline-none focus:border-primary  focus:ring-primary/20"
            >
              <option value="">Select level</option>
              {Level.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Job Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) =>
                handleInputChange(
                  "jobTitle",
                  String(e.target.value ?? "").toUpperCase(),
                )
              }
              placeholder="e.g., Software Developer"
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main  rounded-lg  focus:outline-none focus:border-primary  focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Reporting Manager <span className="text-danger">*</span>
            </label>
            <select
              value={formData.reportingManager}
              onChange={(e) =>
                handleInputChange("reportingManager", e.target.value)
              }
              required
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main  rounded-lg
  focus:outline-none focus:border-primary  focus:ring-primary/20"
            >
              <option value="">Select reporting manager</option>
              {managers.map((mgr) => (
                <option key={mgr.employeeId} value={mgr.employeeId}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              HR Manager <span className="text-danger">*</span>
            </label>
            <select
              value={formData.hrManager}
              onChange={(e) => handleInputChange("hrManager", e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main  rounded-lg
      focus:outline-none focus:border-primary  focus:ring-primary/20"
            >
              <option value="">Select HR manager</option>
              {hrManagers.map((mgr) => (
                <option key={mgr.employeeId} value={mgr.employeeId}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Employee Type * <span className="text-danger">*</span>
            </label>
            <select
              value={formData.employeeType}
              onChange={(e) =>
                handleInputChange("employeeType", e.target.value)
              }
              className="w-full px-2 py-2 text-sm border border-theme bg-card text-main  rounded-lg  focus:outline-none focus:border-primary  focus:ring-primary/20"
            >
              <option>Permanent</option>
              <option>Contract</option>
              <option>Temporary</option>
              <option>Intern</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Employment Status
            </label>
            <select
              value={formData.employmentStatus}
              onChange={(e) =>
                handleInputChange("employmentStatus", e.target.value)
              }
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main  rounded-lg  focus:outline-none focus:border-primary  focus:ring-primary/20"
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
              <option>Terminated</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Engagement Date *<span className="text-danger">*</span>
            </label>
            <HrDateInput
              value={formData.engagementDate}
              onChange={(v) => handleInputChange("engagementDate", v)}
              placeholder="DD/MM/YYYY"
              inputClassName="px-3 py-2 border border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Contract End Date
              {isContractBased && <span className="text-danger"> *</span>}
            </label>
            <HrDateInput
              value={formData.contractEndDate}
              onChange={(v) => handleInputChange("contractEndDate", v)}
              disabled={!isContractBased}
              placeholder="DD/MM/YYYY"
              inputClassName={`px-3 py-2 ${
                isContractBased
                  ? "border-theme bg-card text-main focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  : "bg-app text-muted cursor-not-allowed border-theme opacity-70"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-main mb-1 font-medium">
              Probation Period (months)
            </label>
            <input
              type="number"
              value={formData.probationPeriod}
              onChange={(e) =>
                handleInputChange("probationPeriod", e.target.value)
              }
              placeholder="e.g., 3"
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main  rounded-lg focus:outline-none focus:border-primary  focus:ring-primary/20"
            />
          </div>

          {/* ── Work Address & Work Location — paired side-by-side rows ── */}
          <div className="col-span-2 space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-2 gap-4 px-7">
              <label className="block text-xs text-main font-medium">
                Work Address
              </label>
              <label className="block text-xs text-main font-medium">
                Work Location
              </label>
            </div>

            {/* Paired rows */}
            {Array.from({ length: rowCount }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                {/* Row number */}
                <span className="text-xs text-muted w-5 shrink-0 text-right">
                  {index + 1}.
                </span>

                {/* Address input */}
                <input
                  type="text"
                  value={addressRows[index] ?? ""}
                  onChange={(e) =>
                    handleAddressChange(
                      index,
                      String(e.target.value ?? "").toUpperCase(),
                    )
                  }
                  placeholder="Office Address"
                  className="flex-1 px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-primary/20"
                />

                {/* Location input */}
                <input
                  type="text"
                  value={locationRows[index] ?? ""}
                  onChange={(e) =>
                    handleLocationChange(
                      index,
                      String(e.target.value ?? "").toUpperCase(),
                    )
                  }
                  placeholder="Office Location"
                  className="flex-1 px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:border-primary focus:ring-primary/20"
                />

                {/* Remove row button */}
                {rowCount > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="shrink-0 text-danger hover:opacity-75 text-lg leading-none w-5"
                    title="Remove row"
                  >
                    &times;
                  </button>
                ) : (
                  <span className="w-5 shrink-0" />
                )}
              </div>
            ))}

            {/* Add More button */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={addRow}
                className="text-xs text-primary border border-primary/40 hover:bg-primary/10 px-4 py-1.5 rounded-md transition-colors"
              >
                + Add More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmploymentTab;
