import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchReport,
  getProjectTypeOptions,
} from "../../../api/project/report/report.api";

import FilterBar from "./components/Filterbar";
import KpiCards from "./components/Kpicards";
import ProjectCompletionChart from "./components/Projectcompletionchart";
import TasksByProjectChart from "./components/Tasksbyprojectchart";
import ProjectsTable from "./components/Projectstable";

import { computeKpis, toApiFilters } from "./Utils";
import type { ProjectSummaryRow, SelectOption, SummaryFilters } from "./Types";
import type {
  LinkSource,
  ReportFilter,
  ReportViewProps,
} from "../reportOptions";

// Filter key -> default value (baaki sab "All")
const DEFAULT_VALUES: SummaryFilters = { status: "Open" };

const initialValues = (defs: ReportFilter[]): SummaryFilters =>
  Object.fromEntries(
    defs.flatMap((f) => ("key" in f ? [[f.key, DEFAULT_VALUES[f.key] ?? ""]] : [])),
  );

interface Props extends ReportViewProps {
  onViewProject?: (projectName: string) => void;
}

const ProjectSummaryView: React.FC<Props> = ({ report, leading, onViewProject }) => {
  const [values, setValues] = useState<SummaryFilters>(() => initialValues(report.filters));
  const [linkOptions, setLinkOptions] = useState<
    Partial<Record<LinkSource, SelectOption[]>>
  >({});
  const [rows, setRows] = useState<ProjectSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (v: SummaryFilters) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchReport(report.reportName, toApiFilters(v), {
          isTree: report.isTree,
        });
        setRows((res?.data ?? []) as ProjectSummaryRow[]);
      } catch (err: any) {
        setRows([]);
        setError(
          err?.response?.data?.exception || err?.message || "Failed to fetch report.",
        );
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    },
    [report.reportName, report.isTree],
  );

  useEffect(() => {
    load(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // Link filters (abhi sirf project_type use hota hai Project Summary me)
  useEffect(() => {
    if (!report.filters.some((f) => f.type === "link" && f.source === "project_type")) return;
    getProjectTypeOptions()
      .then((rows) =>
        setLinkOptions((p) => ({
          ...p,
          project_type: rows.map((r) => ({
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

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </div>
      )}

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ProjectCompletionChart rows={rows} />
        <TasksByProjectChart rows={rows} />
      </div>

      <ProjectsTable
        rows={rows}
        loading={loading}
        isInitialLoad={isInitialLoad}
        onView={onViewProject}
      />
    </div>
  );
};

export default ProjectSummaryView;