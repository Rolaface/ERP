import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { MinimizableModal } from "../../../../components/common/MinimizableModal";
import { useUnsavedChanges } from "../../../../hooks/useUnsavedChanges";
import { ModalInput } from "../../../../components/ui/modal/modalComponent";
import { createFeedback, updateFeedback } from "../../../../api/Appraisalapi/feedbackApi";
import { showApiError, showSuccess } from "../../../../utils/alert";

export interface FeedbackRow {
  id: string;
  criteria?: string;
  creation?: string;
}

interface Props {
  modalId: string;
  selectedFeedback?: FeedbackRow | null;
  isViewMode?: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export default function AddFeedbackModal({
  modalId,
  selectedFeedback,
  isViewMode = false,
  onClose,
  onAdd,
}: Props) {
  const [criteria, setCriteria] = useState("");
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  useEffect(() => {
    if (selectedFeedback) {
      setCriteria(selectedFeedback.criteria || "");
    } else {
      setCriteria("");
    }
  }, [selectedFeedback]);

  const handleSave = async () => {
    try {
      if (!criteria.trim()) return;

      if (selectedFeedback) {
        await updateFeedback(selectedFeedback.id, { criteria: criteria.trim() });
        showSuccess("Feedback criteria updated successfully");
      } else {
        await createFeedback({ criteria: criteria.trim() });
        showSuccess("Feedback criteria created successfully");
      }

      resetDirty();
      onAdd();
      onClose();
    } catch (err) {
      showApiError(err);
    }
  };

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={
        isViewMode
          ? "View Feedback Criteria"
          : selectedFeedback
            ? "Edit Feedback Criteria"
            : "New Feedback Criteria"
      }
      subtitle={
        isViewMode
          ? "View employee feedback criteria"
          : selectedFeedback
            ? "Update employee feedback criteria"
            : "Add employee feedback criteria"
      }
      icon={MessageCircle}
      customWidth="500px"
      height="fit-content"
      footer={
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", width: "100%" }}>
          <button
            className="btn btn-outline"
            onClick={() => handleCloseWithConfirm(onClose, modalId)}
          >
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <ModalInput
          label="Criteria"
          value={criteria}
          onChange={(e) => {
            setCriteria(e.target.value);
            markDirty();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Enter feedback criteria"
          disabled={isViewMode || !!selectedFeedback}
          autoFocus={!isViewMode}
          required
        />
      </div>
    </MinimizableModal>
  );
}