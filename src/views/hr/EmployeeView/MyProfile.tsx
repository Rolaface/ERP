import React, { useEffect, useState } from "react";
import { useAuth }         from "../../../context/AuthContext";
import { getEmployeeById } from "../../../api/employeeapi";
import { showApiError, showLoading, closeSwal } from "../../../utils/alert";
import AppSkeleton         from "../../../components/ui/AppSkeleton";
import EmployeeDetailView  from "../EmployeeManagement/mployeeDetailView";

interface MyProfileProps {
  isPureEmployee?: boolean;
}

const MyProfile: React.FC<MyProfileProps> = ({ isPureEmployee = false }) => {
  const { user }                = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }
      try {
        showLoading("Loading your profile...");
        const res  = await getEmployeeById(user.employeeId);
        const data = res?.message?.data ?? res?.data ?? res;
        setEmployee(data);
        closeSwal();
      } catch (err) {
        closeSwal();
        showApiError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.employeeId]);

  if (loading) return <AppSkeleton />;

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">
        Profile not found.
      </div>
    );
  }

  const refreshProfile = async () => {
    if (!user?.employeeId) return;
    const res = await getEmployeeById(user.employeeId);
    setEmployee(res?.message?.data ?? res?.data ?? res);
  };

  return (
    <EmployeeDetailView
      employee={employee}
      onBack={undefined}
      onDocumentUploaded={refreshProfile}
      hideFinancialTabs={true}
    />
  );
};

export default MyProfile;