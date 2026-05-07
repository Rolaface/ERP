import React, { useEffect, useMemo } from "react";
import { FaInfoCircle, FaCalendarCheck } from "react-icons/fa";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getAllLeavePolicies } from "../../../api/utils/frappeUtilsApi";

type LeaveSetupTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean | any) => void;
};

export const LeaveSetupTab: React.FC<LeaveSetupTabProps> = ({
  formData,
  handleInputChange,
}) => {

  
  const selectedPolicy = useMemo(() => {
    if (!formData.leavePolicy) return null;

    return {
      value: formData.leavePolicy,
      label: formData.leavePolicyLabel || formData.leavePolicy,
    };
  }, [formData.leavePolicy, formData.leavePolicyLabel]);

  
  const fetchLeavePolicies = async (q: string) => {
    const list = await getAllLeavePolicies(q);
    return list || []; // already {label,value}
  };

 
  const handlePolicyChange = (val: any) => {
    if (!val) return;

    handleInputChange("leavePolicy", val.value);        // backend
    handleInputChange("leavePolicyLabel", val.label);   // UI
  };

 
  useEffect(() => {
    if (formData.leavePolicy && !formData.leavePolicyLabel) {
      (async () => {
        const list = await getAllLeavePolicies("");
        const found = list.find((p: any) => p.value === formData.leavePolicy);

        if (found) {
          handleInputChange("leavePolicyLabel", found.label);
        }
      })();
    }
  }, [formData.leavePolicy]);

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">

        {/* LEFT */}
        <div className="bg-card p-3 rounded-lg border border-theme space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider">
              Leave Configuration
            </h4>
            <FaCalendarCheck className="w-3.5 h-3.5 text-muted" />
          </div>

          <SearchSelect2
            label="Leave Policy"
           value={selectedPolicy?.value || ""} 
            placeholder="Search leave policy..."
            fetchOptions={fetchLeavePolicies}
            onChange={handlePolicyChange}
          />

          <p className="text-[10px] text-muted flex items-center gap-1">
            <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
            Managed in HR Settings → Leave Policy
          </p>

          {!formData.leavePolicy && (
            <div className="mt-2 p-3 rounded border border-dashed border-theme text-center">
              <FaCalendarCheck className="w-5 h-5 text-muted mx-auto mb-1" />
              <p className="text-[10px] text-muted">
                Select a policy to preview entitlements
              </p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="bg-card p-3 rounded-lg border border-dashed border-theme flex items-center justify-center">
          <p className="text-[10px] text-muted italic">
            Policy preview will appear here
          </p>
        </div>

      </div>
    </div>
  );
};

export default LeaveSetupTab;