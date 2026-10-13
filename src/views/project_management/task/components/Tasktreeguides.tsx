import React from "react";

interface TaskTreeGuidesProps {
  guides: boolean[];
  isLast: boolean;
}

const COLUMN = "relative -my-2 w-5 shrink-0 self-stretch";

const TaskTreeGuides: React.FC<TaskTreeGuidesProps> = ({ guides, isLast }) => (
  <>
    {guides.map((continues, index) => (
      <span key={index} aria-hidden className={COLUMN}>
        {continues && (
          <span className="absolute inset-y-0 left-1/2 border-l border-theme" />
        )}
      </span>
    ))}
    <span aria-hidden className={COLUMN}>
      <span
        className={`absolute left-1/2 top-0 border-l border-theme ${
          isLast ? "h-1/2" : "h-full"
        }`}
      />
      <span className="absolute left-1/2 top-1/2 w-1/2 border-t border-theme" />
    </span>
  </>
);

export default TaskTreeGuides;