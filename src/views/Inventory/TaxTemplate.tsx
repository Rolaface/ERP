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
import type {
  TaxCategoryFormData,
  TaxRow,
} from "../../types/tax/taxTemplate";

interface OutletContextType {
  openTaxTemplateCreate?: () => void;
  openTaxTemplateEdit?: (id: string, data: any) => void;
}

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
    const formData: TaxCategoryFormData = {
      name: row.name,
      title: row.title,
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

  //  Columns 

  const columns: Column<TaxTemplateSummary>[] = [
    {
      key: "title",
      header: "Title",
      align: "left",
      render: (tc) => (
        <Tooltip content={tc.title}>
          <span className="cursor-pointer font-medium text-main text-xs">
            {tc.title}
          </span>
        </Tooltip>
      ),
    },
{
      key: "taxes",
      header: "Tax Rates",
      align: "left",
      render: (tc) => {
        const isExpanded = expandedRows.has(tc.name);
        if (tc.taxes.length === 0) {
          return <span className="text-xs text-muted">None</span>;
        }
        return (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleExpand(tc.name); }}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline focus:outline-none"
          >
            <span>{tc.taxes.length} tax {tc.taxes.length === 1 ? "row" : "rows"}</span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        );
      },
    },
    {
      key: "disabled",
      header: "Status",
      align: "left",
      render: (tc) => (
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
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (tc) => (
        <ActionGroup>
          <ActionButton type="view" onClick={() => {}} iconOnly />
           <ActionMenu
          onEdit={(e) => handleEdit(tc, e as any)}
          onDelete={(e) => handleDelete(tc.name, e as any)}
          customActions={[
            {
              label: tc.disabled ? "Enable" : "Disable",
              onClick: () =>
                handleToggleStatus(
                  tc,
                  { stopPropagation: () => {} } as React.MouseEvent
                ),
              danger: !tc.disabled, // Disable option = red, Enable = normal
            },
          ]}
        />
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
        showToolbar
        loading={loading || initialLoad}
        rowKey={(row) => row.name}
        expandedRowRender={(tc) => {
          if (!expandedRows.has(tc.name) || tc.taxes.length === 0) return null;
          return (
            <div className="px-4 py-3 bg-app border-t border-[var(--border)]/30">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]/40">
                    <th className="text-left py-1.5 px-2 font-semibold text-muted uppercase tracking-wide text-[10px] w-[50%]">
                      Tax Type
                    </th>
                    <th className="text-left py-1.5 px-2 font-semibold text-muted uppercase tracking-wide text-[10px]">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tc.taxes.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-[var(--border)]/20 ${i % 2 === 0 ? "" : "bg-row-hover/10"}`}
                    >
                      <td className="py-1.5 px-2 text-main font-medium">{row.tax_type}</td>
                      <td className="py-1.5 px-2 text-main">
                        <span className="inline-flex items-center gap-1">
                          {Number(row.tax_rate).toFixed(2)}
                          <span className="text-muted">%</span>
                        </span>
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
        enableAdd
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