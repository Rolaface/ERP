import React from "react";
import {
  FaFileAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";

import type { TimesheetStatus } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";

const CONFIG: Record<
  TimesheetStatus,
  {
    className: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  Draft: {
    className: "bg-draft",
    icon: <FaFileAlt size={9} />,
    label: "Draft",
  },

  Submitted: {
    className: "bg-info",
    icon: <FaPaperPlane size={9} />,
    label: "Approved",
  },

  Billed: {
    className: "bg-success",
    icon: <FaCheckCircle size={9} />,
    label: "Billed",
  },

  Cancelled: {
    className: "bg-danger",
    icon: <FaBan size={9} />,
    label: "Cancelled",
  },
};

const StatusBadge: React.FC<{ status: TimesheetStatus }> = ({ status }) => {
  const c = CONFIG[status] ?? CONFIG.Draft;

  return (
    <span className={`badge gap-1 ${c.className}`}>
      {c.icon} {c.label}
    </span>
  );
};

export default StatusBadge;