import React, { useEffect, useMemo, useState } from "react";
import { FaInfoCircle, FaCalendarCheck } from "react-icons/fa";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getAllLeavePolicies } from "../../../api/utils/frappeUtilsApi";
import { getLeavePolicyById } from "../../../api/leaveConfigApi";
import { getalluser } from "../../../api/utils/frappeUtilsApi";
import { resolveLabel } from "../../../api/utils/labelResolver";

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

  const handlePolicyChange = async (
    value: string,
    option: { label: string; value: string },
  ) => {
    if (!value) return;
    handleInputChange("leavePolicy", value);
    handleInputChange("leavePolicyLabel", option?.label || value);
    await loadPolicyDetails(value);
  };

  // load policy details on mount when editing
  useEffect(() => {
    if (formData.leavePolicy) {
      loadPolicyDetails(formData.leavePolicy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: any[] = policyDetails?.leave_policy_details ?? [];
  const total = items.reduce(
    (s: number, i: any) => s + (i.annual_allocation ?? 0),
    0,
  );

  // resolve labels for approver fields in edit mode
  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.leavePolicy, fetcher: getAllLeavePolicies });
      handleInputChange("leavePolicyLabel", label);
    };
    loadLabel();
  }, [formData.leavePolicy]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.leaveApprover, fetcher: getalluser });
      handleInputChange("leaveApproverLabel", label);
    };
    loadLabel();
  }, [formData.leaveApprover]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.expenseApprover, fetcher: getalluser });
      handleInputChange("expenseApproverLabel", label);
    };
    loadLabel();
  }, [formData.expenseApprover]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.shiftRequestApprover, fetcher: getalluser });
      handleInputChange("shiftRequestApproverLabel", label);
    };
    loadLabel();
  }, [formData.shiftRequestApprover]);

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">

      {/* Row 1: Policy selector + preview table side by side */}
      <div className="grid grid-cols-2 gap-2">

        {/* LEFT — policy selector only */}
        <div className="bg-card p-3 rounded-lg border border-theme flex flex-col gap-2.5">
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
            <div className="p-3 rounded border border-dashed border-theme text-center">
              <FaCalendarCheck className="w-5 h-5 text-muted mx-auto mb-1" />
              <p className="text-[10px] text-muted">
                Select a policy to preview entitlements
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — policy detail preview table */}
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
              <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider pb-1 border-b border-theme">
                {policyDetails.title ?? policyDetails.name}
              </h4>
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

      {/* Row 2: Approvers — full width, 3 columns */}
      <div className="bg-card p-3 rounded-lg border border-theme">
        <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5">
          Approvers
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <SearchSelect2
            label="Leave Approver"
            value={formData.leaveApproverLabel || formData.leaveApprover || ""}
            placeholder="Search ..."
            fetchOptions={getalluser}
            onChange={(value: string, option: any) => {
              handleInputChange("leaveApprover", value);
              handleInputChange("leaveApproverLabel", option?.label);
            }}
          />
          <SearchSelect2
            label="Expense Approver"
            value={formData.expenseApproverLabel || formData.expenseApprover || ""}
            placeholder="Search ..."
            fetchOptions={getalluser}
            onChange={(value: string, option: any) => {
              handleInputChange("expenseApprover", value);
              handleInputChange("expenseApproverLabel", option?.label);
            }}
          />
          <SearchSelect2
            label="Shift Request Approver"
            value={formData.shiftRequestApproverLabel || formData.shiftRequestApprover || ""}
            placeholder="Search ..."
            fetchOptions={getalluser}
            onChange={(value: string, option: any) => {
              handleInputChange("shiftRequestApprover", value);
              handleInputChange("shiftRequestApproverLabel", option?.label);
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default LeaveSetupTab;