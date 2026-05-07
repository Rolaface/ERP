import React, { useEffect, useMemo, useState } from "react";
import { FaInfoCircle, FaCalendarCheck } from "react-icons/fa";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getAllLeavePolicies } from "../../../api/utils/frappeUtilsApi";
import { getLeavePolicyById } from "../../../api/leaveConfigApi";
import { getAllEmployees } from "../../../api/employeeapi";

type LeaveSetupTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean | any) => void;
};

export const LeaveSetupTab: React.FC<LeaveSetupTabProps> = ({
  formData,
  handleInputChange,
}) => {
  const [policyDetails, setPolicyDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const selectedPolicy = useMemo(() => {
    if (!formData.leavePolicy) return null;
    return {
      value: formData.leavePolicy,
      label: formData.leavePolicyLabel || formData.leavePolicy,
    };
  }, [formData.leavePolicy, formData.leavePolicyLabel]);

  const fetchLeavePolicies = async (q: string) => {
    const list = await getAllLeavePolicies(q);
    return list || [];
  };

  const loadPolicyDetails = async (policyId: string) => {
    setLoading(true);
    try {
      const details = await getLeavePolicyById(policyId);
      setPolicyDetails(details);
    } catch (err) {
      console.error("Failed to fetch policy details", err);
      setPolicyDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyChange = async (value: string, option: { label: string; value: string }) => {
    if (!value) return;
    handleInputChange("leavePolicy", value);
    handleInputChange("leavePolicyLabel", option?.label || value);
    await loadPolicyDetails(value);
  };

  const fetchEmployees = async (q: string) => {
  const resp = await getAllEmployees(1, 200, "Active");

  const list = resp?.data || [];

  return list
    .filter((emp: any) =>
      `${emp.employee_name}`.toLowerCase().includes(q.toLowerCase())
    )
    .map((emp: any) => ({
      label: emp.employee_name,
      value: emp.name, // employee ID (HR-EMP-0001)
    }));
};

  // Load on mount if already set (edit mode)
  useEffect(() => {
    if (formData.leavePolicy) {
      loadPolicyDetails(formData.leavePolicy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: any[] = policyDetails?.leave_policy_details ?? [];
  const total = items.reduce((s: number, i: any) => s + (i.annual_allocation ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">

        {/* LEFT — selector */}
        <div className="bg-card p-3 rounded-lg border border-theme space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider">
              Leave Configuration
            </h4>
            <FaCalendarCheck className="w-3.5 h-3.5 text-muted" />
          </div>

          <SearchSelect2
            label="Leave Policy"
            value={selectedPolicy?.label || selectedPolicy?.value || ""}
            placeholder="Search leave policy..."
            fetchOptions={fetchLeavePolicies}
            onChange={(value, option) => handlePolicyChange(value, option)}
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
          <SearchSelect2
  label="Leave Approver"
  value={formData.leaveApproverLabel || formData.leaveApprover || ""}
  placeholder="Search employee..."
  fetchOptions={fetchEmployees}
  onChange={(value: string, option: any) => {
    handleInputChange("leaveApprover", value);        
    handleInputChange("leaveApproverLabel", option?.label); // UI
  }}
/>
        </div>
        

        {/* RIGHT — policy detail table */}
        <div className="bg-card p-3 rounded-lg border border-theme">

          {loading && (
            <p className="text-xs text-muted py-4 text-center">Loading…</p>
          )}

          {!loading && !policyDetails && (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] text-muted italic">
                Policy preview will appear here
              </p>
            </div>
          )}

          {!loading && policyDetails && (
            <div className="space-y-2">
              {/* Policy name */}
              <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider pb-1 border-b border-theme">
                {policyDetails.title ?? policyDetails.name}
              </h4>

              {/* Table */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 px-1 w-3/4">
                      Leave Type
                    </th>
                    <th className="text-right text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 px-1 w-1/4">
                      Days / Year
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-theme/30">
                      <td className="py-1.5 px-1 text-xs text-main capitalize">
                        {item.leave_type}
                      </td>
                      <td className="py-1.5 px-1 text-xs text-main text-right font-medium">
                        {item.annual_allocation}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-theme">
                    <td className="py-1.5 px-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
                      Total
                    </td>
                    <td className="py-1.5 px-1 text-xs font-semibold text-main text-right">
                      {total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LeaveSetupTab;