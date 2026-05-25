import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { MinimizableModal } from "../../../../components/common/MinimizableModal";
import type { SetupRow } from "../..../../../../../views/hr/performace/types";
import {
  ModalInput,
  ModalTextarea,
} from "../../../../components/ui//modal/modalComponent";
import {
  createKRA,
  updateKRA,
} from "../../../../api/Appraisalapi/appraisalApi";

import { showApiError, showSuccess } from "../../../../utils/alert";
interface Props {
  selectedKRA?: SetupRow | null;
  isViewMode?: boolean;
  onClose: () => void;
  onAdd: (row: SetupRow) => void;
}
export default function AddKRAModal({
  selectedKRA,
  isViewMode = false,
  onClose,
  onAdd,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

const handleSave = async () => {
  try {
    if (!title.trim()) return;

    if (selectedKRA) {
      await updateKRA(selectedKRA.id, {
        title: title.trim(),
        description,
      });

      showSuccess("KRA updated successfully");
    } else {
      await createKRA({
        name: title.trim(),
        title: title.trim(),
        description,
      });

      showSuccess("KRA created successfully");
    }

    onAdd({
      id: title.trim(),
      title: title.trim(),
      description,
    });

    onClose();
  } catch (err) {
    showApiError(err);
  }
};
  useEffect(() => {
    if (selectedKRA) {
      setTitle(selectedKRA.title || "");
      setDescription(selectedKRA.description || "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [selectedKRA]);
  return (
    <MinimizableModal
      modalId="add-kra-modal"
      isOpen
      onClose={onClose}
      title={isViewMode ? "View KRA" : selectedKRA ? "Edit KRA" : "New KRA"}
      subtitle={
        isViewMode
          ? "View Key Result Area details"
          : selectedKRA
            ? "Update Key Result Area"
            : "Add a new Key Result Area"
      }
      icon={Target}
      customWidth="500px"
      height="fit-content"
      footer={
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <button className="btn btn-outline" onClick={onClose}>
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
          label="Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter KRA name"
         disabled={isViewMode || !!selectedKRA}
          autoFocus={!isViewMode}
          required
        />

        <ModalTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          disabled={isViewMode}
          rows={4}
          className="h-[90px]"
        />
      </div>
    </MinimizableModal>
  );
}
