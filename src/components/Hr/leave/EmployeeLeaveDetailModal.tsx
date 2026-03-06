import React, { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import Modal from "../../ui/modal/modal";
import { Card } from "../../ui/modal/formComponent";
import StatusBadge from "../../ui/Table/StatusBadge";
import { getLeaveById } from "../../../api/leaveApi";
import type { LeaveDetailResponse } from "../../../types/leave/leave";

interface Props {
  leaveId: string | null;
  onClose: () => void;
}

const EmployeeLeaveDetailModal: React.FC<Props> = ({ leaveId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LeaveDetailResponse["data"] | null>(null);

  useEffect(() => {
    if (!leaveId) return;

    const fetchLeave = async () => {
      try {
        setLoading(true);
        const res = await getLeaveById(leaveId);
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };

    fetchLeave();
  }, [leaveId]);

  return (
    <Modal
      isOpen={!!leaveId}
      onClose={onClose}
      title="Leave Request Details"
      subtitle="Complete leave information"
      icon={CalendarDays}
      maxWidth="md"
    >
      {loading && <p className="text-sm text-muted">Loading...</p>}

      {!loading && data && (
        <div className="space-y-4">
          {/* Employee Info */}
          <Card title="Employee Information">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Employee Name</span>
                <p className="font-semibold">{data.employee.employeeName}</p>
              </div>

              <div>
                <span className="text-muted">Employee ID</span>
                <p className="font-semibold">{data.employee.employeeId}</p>
              </div>

              <div className="col-span-2">
                <span className="text-muted">Department</span>
                <p className="font-semibold">{data.employee.department}</p>
              </div>
            </div>
          </Card>

          {/* Leave Info */}
          <Card title="Leave Details">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Type</span>
                <p className="font-semibold">{data.leaveType}</p>
              </div>

              <div>
                <span className="text-muted">Status</span>
                <div className="mt-1">
                  <StatusBadge status={data.status} />
                </div>
              </div>

              <div>
                <span className="text-muted">Period</span>
                <p>
                  {data.fromDate} → {data.toDate}
                </p>
              </div>

              <div>
                <span className="text-muted">Days</span>
                <p>{data.totalDays}</p>
              </div>

              <div>
                <span className="text-muted">Applied Date</span>
                <p>{data.appliedOn}</p>
              </div>

              <div className="col-span-2">
                <span className="text-muted">Reason</span>
                <p className="italic mt-1">"{data.leaveReason}"</p>
              </div>

              {data.rejectionReason && (
                <div className="col-span-2 text-red-600">
                  <span className="text-muted">Rejection Reason</span>
                  <p className="italic mt-1">"{data.rejectionReason}"</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default EmployeeLeaveDetailModal;
