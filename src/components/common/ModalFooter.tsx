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
  nextDisabled?: boolean;
  onSave?: () => Promise<boolean> | boolean;
  saving?: boolean;
  showNext?: boolean;
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
  nextDisabled,
  onSave,
  saving,
  showNext: showNextProp,
}) => {
  const isLastTab = currentTab >= totalTabs - 1;
  const showNextButton = showNextProp !== false && (onNext !== undefined || !isLastTab);
  const isNextDisabled = isLastTab || !!nextDisabled || (saving ?? isSubmitting ?? false);
  const isSubmittingVal = saving ?? isSubmitting ?? false;
  const handleSubmit = onSubmit ?? onSave;

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
        {handleSubmit && (
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit}
            loading={isSubmittingVal}
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        )}
        {showNextButton && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              if (!isNextDisabled && onNext) onNext();
            }}
            disabled={isNextDisabled || !onNext}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModalFooter;
