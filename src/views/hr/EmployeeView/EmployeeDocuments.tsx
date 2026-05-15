import React, { useEffect, useState } from "react";
import { useAuth }               from "../../../context/AuthContext";
import { getEmployeeDocuments }  from "../../../api/employeedocument";
import AppSkeleton               from "../../../components/ui/AppSkeleton";
import { DocumentsTab }          from "../EmployeeManagement/detailtab/documenttab";
import { ERP_BASE }              from "../../../config/api";

const EmployeeDocuments: React.FC = () => {
  const { user }                      = useAuth();
  const [documents, setDocuments]     = useState<any[]>([]);
  const [loading,   setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }
      try {
        const res = await getEmployeeDocuments(user.employeeId);
        setDocuments(res?.message?.data || []);
      } catch {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.employeeId]);

  if (loading) return <AppSkeleton />;

  return (
    <div className="p-4">
      <DocumentsTab
        documents={documents}
        onOpenUploadModal={() => {}}
        erpBase={ERP_BASE}
        hideUpload
      />
    </div>
  );
};

export default EmployeeDocuments;