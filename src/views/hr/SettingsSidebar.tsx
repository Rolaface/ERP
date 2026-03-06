type Props = {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
};

export default function SettingsSidebar({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="w-64 bg-card border-r border-[var(--border)]">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-main">HR Settings</h2>
        <p className="text-xs text-muted mt-1">Company Configuration</p>
      </div>

      <nav className="p-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors mb-1 ${
              activeTab === tab
                ? "bg-row-hover text-primary font-semibold"
                : "text-muted hover:bg-row-hover hover:text-main"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
