import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchReport,
  getProjectTypeOptions,
  type ReportColumn,
} from "../../../api/project/report/report.api";

import FilterBar from "./components/Filterbar";
import KpiCards from "./components/Kpicards";
import ProjectCompletionChart from "./components/Projectcompletionchart";
import TasksByProjectChart from "./components/Tasksbyprojectchart";
import ProjectsTable from "./components/Projectstable";
import AddColumnModal from "../../../components/report/AddColumnModal";
import { useCustomColumns } from "../../../hooks/report/useCustomColumns";

import { computeKpis, toApiFilters } from "./Utils";
import { useAuth } from "../../../context/AuthContext";
import type { ProjectSummaryRow, SelectOption, SummaryFilters } from "./Types";
import type {
  LinkSource,
  ReportFilter,
  ReportViewProps,
} from "../reportOptions";

const DEFAULT_VALUES: SummaryFilters = { status: "Open" };

const initialValues = (defs: ReportFilter[]): SummaryFilters =>
  Object.fromEntries(
    defs.flatMap((f) =>
      "key" in f ? [[f.key, DEFAULT_VALUES[f.key] ?? ""]] : [],
    ),
  );

interface Props extends ReportViewProps {
  onViewProject?: (projectName: string) => void;
}

const ProjectSummaryView: React.FC<Props> = ({
  report,
  leading,
  onViewProject,
}) => {
  const { user } = useAuth();
  const storageKey = `${user?.username ?? "guest"}:${report.key}`;

  const [values, setValues] = useState<SummaryFilters>(() =>
    initialValues(report.filters),
  );
  const [linkOptions, setLinkOptions] = useState<
    Partial<Record<LinkSource, SelectOption[]>>
  >({});
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [rows, setRows] = useState<ProjectSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addColOpen, setAddColOpen] = useState(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const visibleColumns = useMemo(
    () => columns.filter((c) => !c.hidden),
    [columns],
  );

const custom = useCustomColumns(visibleColumns, rows, storageKey);
  const tableRows = custom.data as ProjectSummaryRow[];

  const load = useCallback(
    async (v: SummaryFilters) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchReport(report.reportName, toApiFilters(v), {
          isTree: report.isTree,
        });
        setColumns(res?.columns ?? []);
        setRows((res?.data ?? []) as ProjectSummaryRow[]);
      } catch (err: any) {
        setRows([]);
        setError(
          err?.response?.data?.exception ||
            err?.message ||
            "Failed to fetch report.",
        );
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    },
    [report.reportName, report.isTree],
  );

  useEffect(() => {
    load(valuesRef.current);
  }, [load]);

  useEffect(() => {
    if (
      !report.filters.some(
        (f) => f.type === "link" && f.source === "project_type",
      )
    )
      return;
    getProjectTypeOptions()
      .then((options) =>
        setLinkOptions((p) => ({
          ...p,
          project_type: options.map((r) => ({
            value: r.name,
            label: r.title ? `${r.name}: ${r.title}` : r.name,
          })),
        })),
      )
      .catch(() => setError("Failed to load Project Type options."));
  }, [report.filters]);

  const handleReset = () => {
    const next = initialValues(report.filters);
    setValues(next);
    load(next);
  };

  const kpis = useMemo(() => computeKpis(rows), [rows]);
  const shownError = error || custom.error;

  return (
    <div className="custom-scrollbar h-full min-h-0 space-y-3 overflow-y-auto p-1">
      <FilterBar
        filters={report.filters}
        values={values}
        linkOptions={linkOptions}
        leading={leading}
        loading={loading}
        onChange={(key, value) => setValues((p) => ({ ...p, [key]: value }))}
        onApply={() => load(values)}
        onReset={handleReset}
      />

      {shownError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {shownError}
        </div>
      )}

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ProjectCompletionChart rows={rows} />
        <TasksByProjectChart rows={rows} />
      </div>

      <ProjectsTable
        rows={tableRows}
        loading={loading}
        isInitialLoad={isInitialLoad}
        onView={onViewProject}
        customDefs={custom.defs}
        onAddColumn={() => setAddColOpen(true)}
        addColumnDisabled={loading || custom.linkColumns.length === 0}
      />

      <AddColumnModal
        open={addColOpen}
        onClose={() => setAddColOpen(false)}
        linkColumns={custom.linkColumns}
        columns={custom.allColumns}
        existingKeys={custom.defs.map((d) => d.key)}
        onSubmit={custom.addDefs}
      />
    </div>
  );
};

export default ProjectSummaryView;