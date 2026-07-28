import { useState } from "react";
import { Search, Download, Upload, History, Inbox, Loader2 } from "lucide-react";
import { AppPage, AppPageHeader, AppPageBody } from "../../components/ui/app-shell";
import MultiSelectFilter from "../../components/ui/modal/MultiSelectFilter";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import { useImportData } from "../../hooks/import Data/Useimportdata";
import { CATEGORY_OPTIONS } from "./Importmodules.config";
import type { ImportModuleConfig } from "../../types/importdata/importdata_type";
import { openImportDataModal } from "../../components/feature/import-data/importData.modal";

export default function ImportData() {
  const {
    modules,
    query,
    setQuery,
    selectedCategories,
    setSelectedCategories,
    downloadTemplate,
    importFile,
    pendingTemplateKey,
    pendingImportKey,
  } = useImportData();

  const handleImportClick = (module: ImportModuleConfig, subTypeKey?: string) => {
    const subType = module.subTypes?.find((st) => st.key === subTypeKey);
    openImportDataModal({
      title: `Import ${subType ? subType.label : module.title}`,
      subtitle: module.description,
      onImport: async (file: File) => {
        await importFile(module.key, file, subTypeKey);
      },
      onDownloadTemplate: () => downloadTemplate(module.key, subTypeKey),
    });
  };

  return (
    <AppPage>
      <AppPageHeader
        title="Import Data"
        description="Bring in records from a spreadsheet using the module templates below."
        icon={<Upload size={16} />}
        actions={
          <button className="btn btn-outline">
            <History size={16} className="mr-2" />
            View history
          </button>
        }
      />

      <AppPageBody className="gap-lg pt-4">
        <div className="mt-1 mb-4 flex flex-wrap items-center gap-2">
          <div className="input-wrapper max-w-sm flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules..."
              className="input-base h-9 pl-9 text-sm"
            />
          </div>

          <MultiSelectFilter
            options={CATEGORY_OPTIONS}
            values={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="Category"
            panelTitle="Filter by Category"
          />
        </div>

        {modules.length === 0 ? (
          <div className="card flex flex-col items-center gap-sm py-16 text-center">
            <Inbox size={28} className="text-muted" />
            <p className="text-body text-main font-medium">No modules match your search</p>
            <p className="text-body text-muted text-sm">
              Try a different keyword or clear the category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.key}
                module={module}
                pendingTemplateKey={pendingTemplateKey}
                pendingImportKey={pendingImportKey}
                onDownloadTemplate={(subTypeKey) => downloadTemplate(module.key, subTypeKey)}
                onImportClick={(subTypeKey) => handleImportClick(module, subTypeKey)}
              />
            ))}
          </div>
        )}
      </AppPageBody>
    </AppPage>
  );
}

const statusStyle = {
  active: { label: "Active", color: "var(--success)" },
  soon: { label: "Coming soon", color: "var(--muted)" },
} as const;

function ModuleCard({
  module,
  pendingTemplateKey,
  pendingImportKey,
  onDownloadTemplate,
  onImportClick,
}: {
  module: ImportModuleConfig;
  pendingTemplateKey: string | null;
  pendingImportKey: string | null;
  onDownloadTemplate: (subTypeKey?: string) => void;
  onImportClick: (subTypeKey?: string) => void;
}) {
  const Icon = module.icon;
  const isActive = module.status === "active";
  const status = statusStyle[module.status];
  const hasSubTypes = !!module.subTypes?.length;

  // Default to the first sub-type so the select always has a valid value.
  const [subTypeKey, setSubTypeKey] = useState<string | undefined>(module.subTypes?.[0]?.key);

  const pendingKey = subTypeKey && hasSubTypes ? `${module.key}:${subTypeKey}` : module.key;
  const downloading = pendingTemplateKey === pendingKey;
  const importing = pendingImportKey === pendingKey;

  return (
    <div
      className={`card card-interactive flex h-full flex-col gap-2.5 p-3 ${
        isActive ? "" : "opacity-70"
      }`}
      aria-disabled={!isActive}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
        >
          <Icon size={16} style={{ color: "var(--primary)" }} />
        </div>

        <span
          className="badge shrink-0 whitespace-nowrap text-[11px] px-2 py-0.5"
          style={{
            background: `color-mix(in srgb, ${status.color} 15%, transparent)`,
            color: status.color,
          }}
        >
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold leading-tight text-main">{module.title}</h3>
        <p className="text-muted mt-1 text-xs leading-snug line-clamp-2">
          {module.description}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {hasSubTypes && (
          <FilterSelect
            value={subTypeKey}
            onChange={(e) => setSubTypeKey(e.target.value)}
            disabled={!isActive}
            options={module.subTypes!.map((st) => ({ label: st.label, value: st.key }))}
            hideAllOption
            className="w-full !h-8"
          />
        )}

        <div className="flex gap-1.5">
          <button
            className="btn btn-outline flex-1 justify-center !py-1.5 !text-xs"
            disabled={!isActive || downloading}
            onClick={() => onDownloadTemplate(subTypeKey)}
          >
            {downloading ? (
              <Loader2 size={13} className="mr-1.5 animate-spin" />
            ) : (
              <Download size={13} className="mr-1.5" />
            )}
            Template
          </button>
          <button
            className="btn btn-primary flex-1 justify-center !py-1.5 !text-xs"
            disabled={!isActive || importing}
            style={!isActive ? { background: "var(--muted)", boxShadow: "none" } : undefined}
            onClick={() => onImportClick(subTypeKey)}
          >
            {importing ? (
              <Loader2 size={13} className="mr-1.5 animate-spin" />
            ) : (
              <Upload size={13} className="mr-1.5" />
            )}
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}