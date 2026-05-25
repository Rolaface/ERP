import { openFeedbackModal } from "../../../store/modalStore";
import FeedbackTable from "./Feedbacktable";

// ─── Feedback Page ────────────────────────────────────────────────────────────
// Plugs into the Performance module (PerformanceModule.tsx) under a "Feedback" tab.
// "Add Feedback" opens FeedbackModal via modalStore.

const FeedbackPage = () => {
  return (
    <div className="h-full min-h-0">
      <FeedbackTable
        onAddFeedback={() => openFeedbackModal(undefined, false)}
      />
    </div>
  );
};

export default FeedbackPage;