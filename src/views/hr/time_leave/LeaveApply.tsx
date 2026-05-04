import React, { useState } from "react";
import { Plus } from "lucide-react";
import LeaveApplyModal from "../../../components/Hr/hrsetupmodals/LeaveApplyModal";

export default function LeaveApply() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editLeaveId, setEditLeaveId] = useState<string | null>(null);

  // Use this to open an empty form for a new leave request
  const handleOpenNewLeave = () => {
    setEditLeaveId(null);
    setIsModalOpen(true);
  };

  // Example: Use this to open the modal in edit mode from a table row
  const handleEditLeave = (id: string) => {
    setEditLeaveId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-sm text-gray-500">Manage and track your leave applications</p>
        </div>
        
        <button
          onClick={handleOpenNewLeave}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Apply for Leave
        </button>
      </div>

      {/* Rest of your page content goes here (e.g., Leave History Table, Stats, Cards) */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center min-h-[400px] text-gray-400">
        Leave history data grid or widgets would go here...
      </div>

      {/* The floating Portal Modal */}
      <LeaveApplyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editLeaveId={editLeaveId} 
      />
    </div>
  );
}