export type AmbientSignalTone =
  | "stable"
  | "momentum"
  | "collaboration"
  | "attention";

export type AmbientSignal = {
  id: string;
  label: string;
  tone: AmbientSignalTone;
};

export const ambientSignals: AmbientSignal[] = [
  {
    id: "approval-health",
    label: "approval queue operating normally",
    tone: "stable",
  },

  {
    id: "response-velocity",
    label: "response velocity improving across workflows",
    tone: "momentum",
  },

  {
    id: "team-collaboration",
    label: "3 teammates currently collaborating",
    tone: "collaboration",
  },

  {
    id: "pending-reviews",
    label: "2 reviews awaiting acknowledgement",
    tone: "attention",
  },

  {
    id: "workload-balance",
    label: "workload pacing remains balanced",
    tone: "stable",
  },

  {
    id: "finance-activity",
    label: "finance approvals progressing steadily",
    tone: "momentum",
  },
];