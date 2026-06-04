import React from "react";
import { Button } from "../ui/modal/formComponent";
import { fireManagedSwal } from "../../utils/swalManager";


export interface ModalFooterProps {
  onCancel: () => void;
  onReset?: () => void;
  onSubmit?: () => Promise<boolean | void> | boolean | void;
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
  onSave?: () => Promise<boolean | void> | boolean | void;
  saving?: boolean;
  onPrevious?: () => void;
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
    if (result && typeof (result as Promise<any>).then === "function") {
      await result;
    }
  };
  const handleResetClick = async () => {
  const result = await fireManagedSwal({
    icon: "warning",
    title: "Reset Form?",
    text: "All entered data will be cleared. Do you want to continue?",
    showCancelButton: true,
    confirmButtonText: "Yes, Reset",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ef4444",
  });

  if (result.isConfirmed) {
    onReset?.();
  }
};

  return (
    <div className="flex w-full items-center justify-between gap-2">
      {/* Left side: Cancel */}
      <Button
        variant="secondary"
        type="button"
        onClick={onCancel}
        disabled={isSubmittingVal}
      >
        {cancelLabel}
      </Button>

      {/* Right side: Reset | Next | Submit */}
      <div className="flex items-center gap-2">
        {onReset && (
          <Button
  variant="danger"
  type="button"
  onClick={handleResetClick}
  disabled={resetDisabled || isSubmittingVal}
>
  {resetLabel}
</Button>
        )}

        {/* Next is only shown when NOT on last tab */}
        {!isLastTab && onNext && (
          <Button
            variant="secondary"
            type="button"
            onClick={handleNextClick}
            disabled={isSubmittingVal}
          >
            {nextLabel}
          </Button>
        )}

        {/* Submit button - always visible when onSubmit is provided */}
        {handleSubmit && (
          <Button
            variant="primary"
            type="button"
            onClick={async () => {
  if (isSubmittingVal || submitDisabled) return;
  await handleSubmit?.();
}}
            loading={isSubmittingVal}
            disabled={submitDisabled}
          >
            {isSubmittingVal ? "Saving..." : submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModalFooter;