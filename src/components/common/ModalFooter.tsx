import React from "react";
import { Button } from "../ui/modal/formComponent";

export interface ModalFooterProps {
  onCancel: () => void;
  onReset?: () => void;
  onSubmit?: () => Promise<boolean> | boolean;
  onNext?: () => void;
  currentTab?: number;
  totalTabs?: number;
  isSubmitting?: boolean;
  cancelLabel?: string;
  resetLabel?: string;
  submitLabel?: string;
  nextLabel?: string;
  submitDisabled?: boolean;
  resetDisabled?: boolean;
  onSave?: () => Promise<boolean> | boolean;
  saving?: boolean;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  onCancel,
  onReset,
  onSubmit,
  onNext,
  currentTab = 0,
  totalTabs = 1,
  isSubmitting,
  cancelLabel = "Cancel",
  resetLabel = "Reset",
  submitLabel = "Submit",
  nextLabel = "Next",
  submitDisabled,
  resetDisabled,
  onSave,
  saving,
}) => {
  const safeTotalTabs = Math.max(totalTabs, 1);
  const isLastTab = currentTab >= safeTotalTabs - 1;
  const isSubmittingVal = saving ?? isSubmitting ?? false;

  const handleSubmit = onSubmit ?? onSave;

  const handleNextClick = () => {
    if (isSubmittingVal) return;
    onNext?.();
  };

  const handleSaveClick = async () => {
    if (isSubmittingVal || submitDisabled) return;
    const result = handleSubmit?.();
    if (result && typeof result.then === "function") {
      await result;
    }
  };

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <Button
        variant="secondary"
        type="button"
        onClick={onCancel}
        disabled={isSubmittingVal}
      >
        {cancelLabel}
      </Button>

      <div className="flex items-center gap-2">
        {onReset && (
          <Button
            variant="danger"
            type="button"
            onClick={onReset}
            disabled={resetDisabled || isSubmittingVal}
          >
            {resetLabel}
          </Button>
        )}

        {!isLastTab && onNext && (
          <Button
            variant="secondary"
            type="button"
            onClick={handleNextClick}
          >
            {nextLabel}
          </Button>
        )}

        {isLastTab && handleSubmit && (
          <Button
            variant="primary"
            type="button"
            onClick={handleSaveClick}
            loading={isSubmittingVal}
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModalFooter;
