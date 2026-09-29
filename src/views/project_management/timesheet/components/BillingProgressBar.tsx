const BillingProgressBar: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="flex items-center gap-2">
    <div
      className="flex-1 rounded-full h-1.5 min-w-[50px]"
      style={{ background: "var(--border)" }}
    >
      <div
        className="h-1.5 rounded-full bg-success"
        style={{ width: `${percent}%` }}
      />
    </div>
    <span className="font-mono text-[10px] text-muted w-7 text-right">
      {percent}%
    </span>
  </div>
);

export default BillingProgressBar;