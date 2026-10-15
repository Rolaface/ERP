import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  X,
  Search,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  ListTodo,
  Clock,
  Megaphone,
  CalendarDays,
  Users,
  Layers,
  Pencil,
  Activity,
  Banknote,
  Plus,
  Tag,
} from "lucide-react";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import { usePermission } from "../../../hooks/permission/usePermission";
import {
  getAllProjects,
  getProjectById,
} from "../../../api/project/projectapi/project.api";
import PmListTable from "./projecttabe";
import { UPDATE_LIST } from "./pmLists.config";


interface ProjectDetail {
  name: string;
  project_name?: string | null;
  customer?: string | null;
  project_type?: string | null;
  priority?: string | null;
  status: string;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  percent_complete?: number | null;
  [key: string]: any;
}

interface SidebarProject {
  value: string;
  label: string;
  description: string;
}

interface Props {
  projectId: string;
  onBack: () => void;
  onProjectSelect: (id: string) => void;
    onEdit?: (id: string) => void;
    renderTasks?: (projectId: string) => React.ReactNode;
  renderTimesheets?: (projectId: string) => React.ReactNode;
    onAddTask?: (projectId: string) => void;
  onAddTimesheet?: (projectId: string) => void;
  onAddUpdate?: (projectId: string) => void;
  onAddMember?: (projectId: string) => void;
}


const SIDEBAR_PAGE_SIZE = 10;

const fmtDate = (raw?: string | null): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const daysFromToday = (raw?: string | null): number | null => {
  if (!raw) return null;
  const due = new Date(raw);
  if (isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
};

const dueMessage = (days: number | null, status: string) => {
  if (status === "Completed") return { text: "Completed", tone: "text-emerald-600" };
  if (status === "Cancelled") return { text: "Cancelled", tone: "text-muted" };
  if (days === null) return { text: "No due date set", tone: "text-muted" };
  if (days < 0)
    return {
      text: `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`,
      tone: "text-red-500",
    };
  if (days === 0) return { text: "Due today", tone: "text-amber-600" };
  return {
    text: `${days} day${days === 1 ? "" : "s"} left`,
    tone: days <= 7 ? "text-amber-600" : "text-main",
  };
};

/** first non-empty value among the given keys (snake_case or camelCase) */
const pick = (o: Record<string, any>, ...keys: string[]) => {
  for (const k of keys) {
    if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  }
  return undefined;
};

/** Accepts snake_case or camelCase and never returns a project without a name */
const normalizeProject = (raw: any, fallbackId: string): ProjectDetail | null => {
  const src = Array.isArray(raw) ? raw[0] : raw;
  if (!src || typeof src !== "object") return null;
  return {
    ...src,
    name: pick(src, "name", "project_id", "projectId", "id") ?? fallbackId,
    project_name: pick(src, "project_name", "projectName", "title"),
    customer: pick(src, "customer", "customer_name", "customerName"),
    project_type: pick(src, "project_type", "projectType"),
    priority: pick(src, "priority"),
    status: pick(src, "status") ?? "Open",
    expected_start_date: pick(src, "expected_start_date", "expectedStartDate", "start_date"),
    expected_end_date: pick(src, "expected_end_date", "expectedEndDate", "end_date"),
    percent_complete: pick(src, "percent_complete", "percentComplete"),
  };
};

const ID_KEYS = ["name", "project_id", "projectId", "id"];
const NAME_KEYS = ["project_name", "projectName"];

/** Walk the whole response and return the object that is the project */
const findProjectObject = (root: any, id: string): Record<string, any> | null => {
  const walk = (match: (o: Record<string, any>) => boolean) => {
    const queue: any[] = [root];
    const seen = new Set<any>();
    while (queue.length) {
      const cur = queue.shift();
      if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
      seen.add(cur);
      if (!Array.isArray(cur) && match(cur)) return cur;
      queue.push(...(Array.isArray(cur) ? cur : Object.values(cur)));
    }
    return null;
  };
  return (
    walk((o) => ID_KEYS.some((k) => o[k] === id)) ??
    walk((o) => NAME_KEYS.some((k) => k in o))
  );
};

/** Full project document by id */
const fetchProject = async (name: string): Promise<ProjectDetail | null> => {
  const res: any = await getProjectById(name);
  const raw = findProjectObject(res, name) ?? res?.message?.data ?? res?.data ?? res;
  return normalizeProject(raw, name);
};

/* Fields already shown in the cards above; everything else goes in "More Details" */
const KNOWN_KEYS = new Set([
  "name",
  "project_name",
  "customer",
  "project_type",
  "priority",
  "status",
  "expected_start_date",
  "expected_end_date",
  "percent_complete",
  "projectName",
  "projectType",
  "customerName",
  "expectedStartDate",
  "expectedEndDate",
  "percentComplete",
  "project_id",
  "projectId",
  "id",
  "title",
  "customer_name",
  "start_date",
  "end_date",
  "users",
  "company",
  "is_active",
  "percent_complete_method",
  "naming_series",
  "collect_progress",
  "frequency",
  "day_to_send",
  "estimated_costing",
  "actual_time",
  "total_costing_amount",
  "total_expense_claim",
  "total_purchase_cost",
  "total_sales_amount",
  "total_billable_amount",
  "total_billed_amount",
  "total_consumed_material_cost",
  "gross_margin",
  "per_gross_margin",
  "doctype",
  "docstatus",
  "idx",
  "owner",
  "creation",
  "modified",
  "modified_by",
]);

const labelOf = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmtNum = (v: any): string =>
  v === undefined || v === null || v === ""
    ? "—"
    : Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });

const extraRows = (p: Record<string, any>) =>
  Object.entries(p)
    .filter(
      ([k, v]) =>
        !KNOWN_KEYS.has(k) &&
        v !== null &&
        v !== "" &&
        ["string", "number", "boolean"].includes(typeof v),
    )
    .map(([k, v]) => ({ label: labelOf(k), value: String(v) }));

const ALL_TABS = [
  { id: "overview", label: "Overview", icon: <Globe />, module: null },
  { id: "team", label: "Team", icon: <Users />, module: "Project" },
  { id: "tasks", label: "Tasks", icon: <ListTodo />, module: "Task" },
  { id: "timesheets", label: "Timesheets", icon: <Clock />, module: "Timesheet" },
  { id: "updates", label: "Updates", icon: <Megaphone />, module: "Project Update" },
] as const;

type TabId = (typeof ALL_TABS)[number]["id"];


const SidebarSearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div className="px-3 py-2.5 border-b border-theme shrink-0">
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
      <input
        type="text"
        placeholder="Quick find..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-app border border-theme rounded-lg focus:ring-1 focus:ring-primary outline-none transition-all"
      />
    </div>
  </div>
);

const SidebarList: React.FC<{
  items: SidebarProject[];
  loading: boolean;
  activeId: string;
  onSelect: (id: string) => void;
}> = ({ items, loading, activeId, onSelect }) => (
  <div className="overflow-y-auto px-2 py-1.5 h-full no-scrollbar">
    {loading ? (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    ) : items.length === 0 ? (
      <p className="text-[10px] text-muted text-center py-6">No projects found</p>
    ) : (
      items.map((p) => {
        const active = p.value === activeId;
        return (
          <button
            key={p.value}
            onClick={() => onSelect(p.value)}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 border mb-0.5 ${
              active
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-transparent border-transparent hover:bg-row-hover"
            }`}
          >
            <div
              className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {p.label.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-bold text-[11px] truncate leading-tight ${
                  active ? "text-white" : "text-main"
                }`}
              >
                {p.label}
              </p>
              <p
                className={`text-[9px] font-mono truncate ${
                  active ? "text-white/60" : "text-muted"
                }`}
              >
                {p.value}
                {p.description ? ` · ${p.description}` : ""}
              </p>
            </div>
          </button>
        );
      })
    )}
  </div>
);


const ProjectDetailView: React.FC<Props> = ({
  projectId,
  onBack,
  onProjectSelect,
  onEdit,
  renderTasks,
  renderTimesheets,
  onAddTask,
  onAddTimesheet,
  onAddUpdate,
  onAddMember,
}) => {
  const { can } = usePermission();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawer, setMobileDrawer] = useState(false);

  const [sidebarItems, setSidebarItems] = useState<SidebarProject[]>([]);
  const [sidebarTotal, setSidebarTotal] = useState(0);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => !t.module || can(t.module, "read")),
    [can],
  );

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setActiveTab("overview");
    fetchProject(projectId)
      .then((p) => !cancelled && setProject(p))
      .catch((err) => console.error("Failed to fetch project:", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const fetchSidebar = useCallback(async (search: string) => {
    setSidebarLoading(true);
    try {
      const list = ((await getAllProjects(search || undefined)) ??
        []) as ProjectDetail[];
      setSidebarTotal(list.length);
      setSidebarItems(
        list.slice(0, SIDEBAR_PAGE_SIZE).map((p) => ({
          value: p.name,
          label: p.project_name || p.name,
          description: p.customer ?? "",
        })),
      );
    } catch (err) {
      console.error("Sidebar fetch failed:", err);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSidebar("");
  }, [fetchSidebar]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchSidebar(val), 350);
  };

  const selectProject = (id: string) => {
    onProjectSelect(id);
    setMobileDrawer(false);
  };

  const updatesConfig = useMemo(
    () => ({
      ...UPDATE_LIST,
      baseFilters: [["project", "=", projectId]] as Array<[string, string, unknown]>,
    }),
    [projectId],
  );

    const percentRaw = Math.min(100, Math.max(0, Number(project?.percent_complete ?? 0)));
  const percentLabel = `${Math.round(percentRaw * 10) / 10}%`;
  const days = daysFromToday(project?.expected_end_date);
  const due = dueMessage(days, project?.status ?? "");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-sm text-muted">
        Project not found
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-lg border border-theme text-xs font-bold text-main hover:bg-row-hover"
        >
          Back to projects
        </button>
      </div>
    );
  }

  const title = String(project.project_name || project.name || projectId || "?");
  const extras = extraRows(project);
  const team: any[] = Array.isArray(project.users) ? project.users : [];

  const detailRows = [
    { label: "Project No", value: project.name, mono: true },
    { label: "Project Name", value: project.project_name },
    { label: "Customer", value: project.customer },
    { label: "Type", value: project.project_type },
    { label: "Priority", value: project.priority },
    { label: "Company", value: project.company },
    { label: "Active", value: project.is_active },
    { label: "Progress Method", value: project.percent_complete_method },
  ];

  const costRows = [
    { label: "Estimated Costing", value: fmtNum(project.estimated_costing) },
    { label: "Actual Time (hrs)", value: fmtNum(project.actual_time) },
    { label: "Total Costing", value: fmtNum(project.total_costing_amount) },
    { label: "Billable", value: fmtNum(project.total_billable_amount) },
    { label: "Billed", value: fmtNum(project.total_billed_amount) },
    { label: "Gross Margin", value: fmtNum(project.gross_margin) },
  ];

  return (
    <div className="flex flex-col bg-app text-main overflow-hidden flex-1 min-h-0 h-full">
            <header className="bg-card px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-theme shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <button
            onClick={() => setMobileDrawer(true)}
            aria-label="Open project list"
            className="lg:hidden p-1.5 hover:bg-row-hover rounded-lg border border-theme transition-all shrink-0"
          >
            <Menu size={15} className="text-muted" />
          </button>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden lg:flex p-1.5 hover:bg-row-hover rounded-lg border border-theme transition-all shrink-0"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={15} className="text-muted" />
            ) : (
              <PanelLeftOpen size={15} className="text-muted" />
            )}
          </button>
          <button
            onClick={onBack}
            title="Back to projects"
            aria-label="Back to projects"
            className="p-1.5 hover:bg-row-hover rounded-lg border border-theme transition-all shrink-0"
          >
            <X size={15} className="text-muted" />
          </button>

          <div className="flex items-center gap-2 min-w-0 ml-0.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 flex items-center justify-center font-black text-[12px] sm:text-[13px] text-primary shrink-0 border border-primary/20">
              {title.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <h2 className="text-[12px] sm:text-[13px] font-black tracking-tight leading-none truncate max-w-[140px] sm:max-w-xs md:max-w-none">
                {title}
              </h2>
              <span className="hidden sm:inline text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-theme uppercase shrink-0">
                {project.name}
              </span>
              <span className="hidden sm:inline-flex shrink-0">
                <StatusBadge status={project.status} />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {project.expected_end_date && (
            <span className="hidden md:flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
              <CalendarDays size={11} />
              Due {fmtDate(project.expected_end_date)}
            </span>
          )}
          {onEdit && can("Project", "write") && (
            <button
              onClick={() => onEdit(project.name)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-theme text-[11px] font-bold text-main hover:bg-row-hover transition-all"
            >
              <Pencil size={12} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>
      </header>

            <div className="flex-1 flex overflow-hidden min-h-0 h-0 relative">
        {mobileDrawer && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileDrawer(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-theme z-50 flex flex-col lg:hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                  Projects
                  <span className="ml-1.5 text-primary font-black">{sidebarTotal}</span>
                </span>
                <button
                  onClick={() => setMobileDrawer(false)}
                  aria-label="Close"
                  className="p-1 rounded-lg hover:bg-row-hover transition-all"
                >
                  <X size={14} className="text-muted" />
                </button>
              </div>
              <SidebarSearchInput value={searchTerm} onChange={handleSearchChange} />
              <div className="flex-1 min-h-0 overflow-hidden">
                <SidebarList
                  items={sidebarItems}
                  loading={sidebarLoading}
                  activeId={projectId}
                  onSelect={selectProject}
                />
              </div>
            </div>
          </>
        )}

        <aside
          className={`hidden lg:flex flex-col bg-card border-r border-theme transition-all duration-300 shrink-0 overflow-hidden h-full ${
            sidebarOpen ? "w-56 xl:w-64" : "w-0 border-0"
          }`}
        >
          {sidebarOpen && (
            <>
              <div className="px-4 py-3 border-b border-theme shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted">
                  All Projects
                  <span className="ml-1.5 text-primary font-black">{sidebarTotal}</span>
                </p>
              </div>
              <SidebarSearchInput value={searchTerm} onChange={handleSearchChange} />
              <div className="flex-1 min-h-0 overflow-hidden">
                <SidebarList
                  items={sidebarItems}
                  loading={sidebarLoading}
                  activeId={projectId}
                  onSelect={selectProject}
                />
              </div>
            </>
          )}
        </aside>

                <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                    <div className="bg-card border-b border-theme px-2 sm:px-4 shrink-0 z-10">
            <div className="flex overflow-x-auto no-scrollbar">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 sm:px-4 py-3 sm:py-3.5 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-main"
                  }`}
                >
                  {React.cloneElement(tab.icon as React.ReactElement, { size: 12 })}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

                    <div className="flex-1 min-h-0 overflow-auto">
                        {activeTab === "overview" && (
              <div className="p-3 sm:p-4 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch">
                                    <section className="lg:col-span-2 bg-card rounded-2xl border border-theme p-4 sm:p-5 flex flex-col justify-between gap-5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest">
                        <Activity size={12} className="text-primary" />
                        Status & Completion
                      </h4>
                      <StatusBadge status={project.status} />
                    </div>

                    <div>
                      <div className="flex items-end justify-between gap-3">
                        <p className="font-mono text-4xl font-black tabular-nums text-main leading-none">
                          {percentLabel}
                        </p>
                        <p className={`text-xs font-bold ${due.tone}`}>{due.text}</p>
                      </div>
                      <div
                        className="mt-3 h-2 w-full rounded-full overflow-hidden"
                        style={{ background: "var(--border)" }}
                        role="progressbar"
                        aria-valuenow={Math.round(percentRaw)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Project completion"
                      >
                        <div
                          className="h-2 rounded-full bg-success transition-all"
                          style={{ width: `${percentRaw}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-muted font-semibold">
                        <span>Start: {fmtDate(project.expected_start_date)}</span>
                        <span>Due: {fmtDate(project.expected_end_date)}</span>
                      </div>
                    </div>
                  </section>

                                    <section className="lg:col-span-3 bg-card rounded-2xl border border-theme overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-theme shrink-0">
                      <Tag size={12} className="text-primary" />
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">
                        Project Details
                      </h4>
                    </div>
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-px flex-1"
                      style={{ background: "var(--border)" }}
                    >
                      {detailRows.map((r) => (
                        <div key={r.label} className="bg-card">
                          <DataRow label={r.label} value={r.value} mono={r.mono} />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                                <section className="bg-card rounded-2xl border border-theme overflow-hidden">
                  <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-theme">
                    <Banknote size={12} className="text-primary" />
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">
                      Costing & Billing
                    </h4>
                  </div>
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px"
                    style={{ background: "var(--border)" }}
                  >
                    {costRows.map((r) => (
                      <div key={r.label} className="bg-card px-4 py-3">
                        <p className="text-[9px] font-black text-muted uppercase tracking-wider leading-tight">
                          {r.label}
                        </p>
                        <p className="mt-1 font-mono text-sm font-bold tabular-nums text-main">
                          {r.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {extras.length > 0 && (
                  <section className="bg-card rounded-2xl border border-theme overflow-hidden">
                    <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-theme">
                      <Layers size={12} className="text-primary" />
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">
                        More Details
                      </h4>
                    </div>
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-px"
                      style={{ background: "var(--border)" }}
                    >
                      {extras.map((r) => (
                        <div key={r.label} className="bg-card">
                          <DataRow label={r.label} value={r.value} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

                        {activeTab === "team" && (
              <div className="p-3 sm:p-4 space-y-3">
                <TabToolbar
                  title="Team"
                  count={team.length}
                  addLabel="Add member"
                  canAdd={can("Project", "write")}
                  onAdd={() => onAddMember?.(project.name)}
                />
                {team.length === 0 ? (
                  <EmptyTab text="No team members added yet." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {team.map((u, i) => (
                      <div
                        key={u.name ?? i}
                        className="bg-card rounded-xl border border-theme p-3.5 flex items-center gap-3 hover:shadow-sm transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/10 flex items-center justify-center text-[13px] font-black shrink-0">
                          {String(u.full_name || u.user || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-main truncate">
                            {u.full_name || u.user}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {u.email || u.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

                        {activeTab === "tasks" && (
              <div className="p-3 sm:p-4 space-y-3 w-full min-w-0">
                <TabToolbar
                  title="Tasks"
                  addLabel="Add task"
                  canAdd={can("Task", "create")}
                  onAdd={() => onAddTask?.(project.name)}
                />
                {renderTasks ? (
                  renderTasks(project.name)
                ) : (
                  <EmptyTab text="Tasks for this project will appear here." />
                )}
              </div>
            )}

                        {activeTab === "timesheets" && (
              <div className="p-3 sm:p-4 space-y-3 w-full min-w-0">
                <TabToolbar
                  title="Timesheets"
                  addLabel="Add timesheet"
                  canAdd={can("Timesheet", "create")}
                  onAdd={() => onAddTimesheet?.(project.name)}
                />
                {renderTimesheets ? (
                  renderTimesheets(project.name)
                ) : (
                  <EmptyTab text="Timesheets for this project will appear here." />
                )}
              </div>
            )}

                        {activeTab === "updates" && (
              <div className="p-3 sm:p-4 space-y-3 w-full min-w-0">
                <TabToolbar
                  title="Updates"
                  addLabel="Add update"
                  canAdd={can("Project Update", "create")}
                  onAdd={() => onAddUpdate?.(project.name)}
                />
                <PmListTable
                  key={project.name}
                  config={updatesConfig}
                  enableAdd={false}
                  height="calc(100vh - 320px)"
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

/* ───────────────────────── sub-components ───────────────────────── */

const TabToolbar = ({
  title,
  count,
  addLabel,
  canAdd,
  onAdd,
}: {
  title: string;
  count?: number;
  addLabel: string;
  canAdd: boolean;
  onAdd: () => void;
}) => (
  <div className="flex items-center justify-between gap-2">
    <h3 className="text-xs font-black text-main">
      {title}
      {count !== undefined && (
        <span className="ml-1.5 font-semibold text-muted">{count}</span>
      )}
    </h3>
    {canAdd && (
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Plus size={13} />
        {addLabel}
      </button>
    )}
  </div>
);

const DataRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 hover:bg-row-hover/60 transition-colors">
    <span className="text-[9px] font-black text-muted uppercase tracking-widest whitespace-nowrap">
      {label}
    </span>
    <span
      className={`text-xs font-semibold text-main text-right min-w-0 truncate ${
        mono ? "font-mono" : ""
      }`}
      title={value ? String(value) : undefined}
    >
      {value || "—"}
    </span>
  </div>
);

const EmptyTab = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
    <p className="text-[11px] text-muted italic">{text}</p>
  </div>
);

export default ProjectDetailView;