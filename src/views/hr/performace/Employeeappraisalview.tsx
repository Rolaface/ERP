import { useState } from "react";
import AppraisalTable from "./Appraisalpage";
import { openAppraisalModal } from "../../../store/modalStore";

// ─── Appraisal Page ───────────────────────────────────────────────────────────
// This replaces the old mock Employeeappraisalview.tsx
// The table lists Appraisal Cycles via cycleApi.
// "Add Appraisal" opens the new AppraisalModal via modalStore.

const AppraisalPage = () => {
  return (
    <div className="h-full min-h-0">
      <AppraisalTable
        onAddAppraisal={() =>
          openAppraisalModal(undefined, false)
        }
      />
    </div>
  );
};

export default AppraisalPage;