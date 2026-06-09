import React, { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import Tooltip from "../../components/Tooltip";
import { fireManagedSwal } from "../../utils/swalManager";
import { getAllTemplates, deleteTemplate } from "../../api/TaxTemplateApi";
import { useTaxTemplate } from "../../hooks/useTaxTemplate";
import { openTaxTemplateModal } from "../../store/modalStore";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";
import type {
  TaxCategoryFormData,
  TaxRow,
} from "../../types/tax/taxTemplate";
import { usePermission } from "../../hooks/permission/usePermission";


interface OutletContextType {
  openTaxTemplateCreate?: () => void;
  openTaxTemplateEdit?: (id: string, data: any) => void;
}

const TAX_TEMPLATE_MODULE = "Item Tax Template";

//  Types 

interface TaxTemplateSummary {
  name: string;
  title: string;
  company: string;
  disabled: number; // 0 | 1
  taxes: TaxRow[];
}

interface Props {
  onAdd?: () => void;
}

//  Component 

const TaxTemplate: React.FC<Props> = () => {
  const [templates, setTemplates] = useState<TaxTemplateSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (name: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const { createTaxTemplate, updateTaxTemplate, updateStatus } =
    useTaxTemplate();

  //  Modal Helpers 

  const openCreate = () => {
    openTaxTemplateModal(null, false, {
      callback: async (formData: TaxCategoryFormData) => {
        try {
          await createTaxTemplate(formData);
          await fetchTemplates();
        } catch (error) {
          showApiError(error);
          throw error;
        }
      },
    }, {
      title: "Add Tax Template",
      subtitle: "Create simple tax template",
    });
  };

  const openEdit = (row: TaxTemplateSummary) => {
    const separatorIdx = row.title.indexOf(" | ");
    const parsedCode = separatorIdx !== -1 ? row.title.slice(0, separatorIdx) : row.title;
    const parsedDesc = separatorIdx !== -1 ? row.title.slice(separatorIdx + 3) : "";

    const formData: TaxCategoryFormData = {
      name: row.name,
      title: row.title,
      title_code: parsedCode,
      title_desc: parsedDesc,
      disabled: row.disabled === 1,
      taxes: row.taxes.map((t) => ({
        tax_type: t.tax_type,
        tax_rate: t.tax_rate,
      })),
    };
    openTaxTemplateModal(formData, true, {
      callback: async (formData: TaxCategoryFormData) => {
        try {
          await updateTaxTemplate(formData);
          await fetchTemplates();
        } catch (error) {
          showApiError(error);
          throw error;
        }
      },
    }, {
      title: "Edit Tax Template",
      subtitle: "Update tax template",
    });
  };

  //  Fetch 

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllTemplates(page, pageSize, searchTerm || undefined);
      const list: TaxTemplateSummary[] = res?.data?.templates ?? [];
      const pagination = res?.data?.pagination;
      setTemplates(list);
      setTotalPages(pagination?.total_pages ?? 1);
      setTotalItems(pagination?.total ?? list.length);
    } catch (error) {
      console.error("Error loading tax templates:", error);
      showApiError(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  //  Handlers 

  const handleEdit = (row: TaxTemplateSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    openEdit(row);
  };

  //  Status Toggle: Enable / Disable 
  const handleToggleStatus = async (
    row: TaxTemplateSummary,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const newDisabled: 0 | 1 = row.disabled === 1 ? 0 : 1;

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: newDisabled === 1 ? "Disable Template?" : "Enable Template?",
      text: `"${row.title}" will be ${newDisabled === 1 ? "disabled" : "enabled"}.`,
      showCancelButton: true,
      confirmButtonColor: newDisabled === 1 ? "#ef4444" : "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: newDisabled === 1 ? "Yes, Disable" : "Yes, Enable",
    });

    if (!confirm.isConfirmed) return;

    try {
      await updateStatus(row.name, newDisabled);
      await fetchTemplates();
    } catch (_) {
      // error already shown in hook
    }
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete tax template "${name}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting...");
      await deleteTemplate(name);
      closeSwal();
      showSuccess("Tax template deleted successfully.");
      await fetchTemplates();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };



  const columns: Column<TaxTemplateSummary>[] = [
    {
      key: "expand",
      header: "",
      align: "center",
      render: (tc) => {
        const isExpanded = expandedRows.has(tc.name);
        if (tc.taxes.length === 0) return <span className="w-7 h-7 block" />;
        return (
          <div className="py-1.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-all duration-200">
              {isExpanded
                ? <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              }
            </span>
          </div>
        );
      },
    },
    {
      key: "title",
      header: "Code",
      align: "left",
      render: (tc) => {
        const separatorIdx = tc.title.indexOf(" | ");
        const code = separatorIdx !== -1 ? tc.title.slice(0, separatorIdx) : tc.title;
        return (
          <Tooltip content={tc.title}>
            <div className="py-1.5">
              <span className="cursor-pointer font-medium text-main text-xs">
                {code || "-"}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "title" as any,
      header: "Description",
      align: "left",
      render: (tc) => {
        const separatorIdx = tc.title.indexOf(" | ");
        const desc = separatorIdx !== -1 ? tc.title.slice(separatorIdx + 3) : "";
        return (
          <div className="py-1.5">
            <span className="text-xs text-muted break-words whitespace-normal">
              {desc || "-"}
            </span>
          </div>
        );
      },
    },
    {
      key: "taxes",
      header: "Tax Rates",
      align: "left",
      render: (tc) => {
        if (tc.taxes.length === 0) {
          return <span className="text-xs text-muted">None</span>;
        }
        return (
          <div className="py-1.5">
            <span className="text-xs text-muted">
              {tc.taxes.length} tax {tc.taxes.length === 1 ? "row" : "rows"}
            </span>
          </div>
        );
      },
    },
    {
      key: "disabled",
      header: "Status",
      align: "left",
      render: (tc) => (
        <div className="py-1.5">
          <code
            className={[
              "text-xs px-2 py-1 rounded",
              tc.disabled
                ? "bg-danger/10 text-danger"
                : "bg-success/10 text-success",
            ].join(" ")}
          >
            {tc.disabled ? "Disabled" : "Enabled"}
          </code>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (tc) => (
        <ActionGroup>

          {(can(TAX_TEMPLATE_MODULE, "write") ||
            can(TAX_TEMPLATE_MODULE, "delete")) && (
              <ActionMenu
                {...(can(TAX_TEMPLATE_MODULE, "write")
                  ? {
                    onEdit: (e) => handleEdit(tc, e as any),
                  }
                  : {})}
                {...(can(TAX_TEMPLATE_MODULE, "delete")
                  ? {
                    onDelete: (e) =>
                      handleDelete(tc.name, e as any),
                  }
                  : {})}
                customActions={
                  can(TAX_TEMPLATE_MODULE, "write")
                    ? [
                      {
  label: tc.disabled ? "Enable" : "Disable",
  icon: tc.disabled
    ? ACTION_ICONS.ENABLE
    : ACTION_ICONS.DISABLE,
  onClick: () =>
    handleToggleStatus(
      tc,
      { stopPropagation: () => {} } as React.MouseEvent
    ),
  danger: !tc.disabled,
}
                    ]
                    : []
                }
              />
            )}
        </ActionGroup>
      ),
    },
  ];

  //  Render 

  return (
    <>
      <Table
        columns={columns}
        data={templates}
        tableId="inventory-taxtemplates"
        showToolbar
        loading={loading || initialLoad}
        rowKey={(row) => row.name}
        onRowClick={(tc) => { if (tc.taxes.length > 0) toggleExpand(tc.name); }}
        expandedRowRender={(tc) => {
          if (!expandedRows.has(tc.name) || tc.taxes.length === 0) return null;
          return (
            <div className="px-6 py-3" style={{ background: "rgba(201,125,46,0.04)", borderTop: "1.5px solid rgba(201,125,46,0.15)" }}>
              {/* Header bar like stock's "BATCH DETAILS" */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,125,46,0.2)" }}>
                    <th className="text-left py-2 px-3 font-bold text-muted uppercase tracking-widest text-[10px] w-[60%]">
                      Tax Type
                    </th>
                    <th className="text-left py-2 px-3 font-bold text-muted uppercase tracking-widest text-[10px]">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tc.taxes.map((row, i) => (
                    <tr
                      key={i}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: i % 2 !== 0 ? "rgba(201,125,46,0.03)" : "transparent" }}
                    >
                      <td className="py-2 px-3 text-main font-medium text-xs">{row.tax_type}</td>
                      <td className="py-2 px-3 text-xs">
                        <span className="font-semibold" style={{ color: "var(--primary, #c97d2e)" }}>
                          {Number(row.tax_rate).toFixed(2)}
                        </span>
                        <span className="text-muted ml-0.5">%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        searchValue={searchTerm}
        onSearch={(val) => {
          setSearchTerm(val);
          setPage(1); // reset page on search
        }}
        enableAdd={can(TAX_TEMPLATE_MODULE, "create")}
        addLabel="Add Tax Template"
        onAdd={openCreate}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
      />
    </>
  );
};

export default TaxTemplate;