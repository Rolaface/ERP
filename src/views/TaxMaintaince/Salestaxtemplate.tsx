import React, { useCallback, useEffect, useState } from "react";
import { showApiError } from "../../utils/alert";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import Tooltip from "../../components/Tooltip";
import { fireManagedSwal } from "../../utils/swalManager";
import { openSalesTaxTemplateModal } from "../../store/modalStore";
import { getAllTemplates } from "../../api/salesTaxTemplateApi";
import { useSalesTaxTemplate } from "../../hooks/useSalesTemplate";
import { getSalesTemplateById } from "../../api/salesTaxTemplateApi";
import type {
  SalesTaxTemplateSummary,
  SalesTaxTemplateFormData,
} from "../../types/tax/salesTemplate";
import { usePermission } from "../../hooks/permission/usePermission";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";

const SALES_TAX_TEMPLATE_MODULE = "Sales Taxes and Charges Template";

const SalesTaxTemplate: React.FC = () => {
  const [templates, setTemplates] = useState<SalesTaxTemplateSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { can } = usePermission();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { createSalesTax, updateSalesTax, updateStatus, deleteSalesTax } =
    useSalesTaxTemplate();

  const toggleExpand = (name: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllTemplates(
        page,
        pageSize,
        searchTerm || undefined,
      );
      const list: SalesTaxTemplateSummary[] = res?.data?.templates ?? [];
      const pagination = res?.data?.pagination;
      setTemplates(list);
      setTotalPages(pagination?.total_pages ?? 1);
      setTotalItems(pagination?.total ?? list.length);
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    openSalesTaxTemplateModal(
      null,
      false,
      {
        callback: async (formData: SalesTaxTemplateFormData) => {
          await createSalesTax(formData);
          await fetchTemplates();
        },
      },
      {
        title: "Add Sales Tax Template",
        subtitle: "Configure charges and tax rates",
      },
    );
  };

  const openEdit = async (row: SalesTaxTemplateSummary) => {
    try {
      setLoading(true);

      const res = await getSalesTemplateById(row.name);
      const data = res?.data;

      const formData: SalesTaxTemplateFormData = {
        name: data?.name,
        title: data?.title || "",
        disabled: data?.disabled ?? 0,
        tax_category: data?.tax_category || "",
        taxes:
          Array.isArray(data?.taxes) && data.taxes.length > 0
            ? data.taxes.map((t: any) => ({
              name: t.name,
              charge_type: t.charge_type,
              account_head: t.account_head || "",
              account_head_display: t.account_head_name || "",
              rate: Number(t.rate) || 0,
              tax_amount: Number(t.tax_amount) || 0,
              description: t.description || "",
            }))
            : [
              {
                charge_type: "On Net Total",
                account_head: "",
                rate: 0,
                tax_amount: 0,
                description: "",
              },
            ],
      };

      openSalesTaxTemplateModal(
        formData,
        true,
        {
          callback: async (formData: SalesTaxTemplateFormData) => {
            await updateSalesTax(formData);
            await fetchTemplates();
          },
        },
        {
          title: "Edit Sales Tax Template",
          subtitle: "Update charges and tax rates",
        },
      );
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleEdit = (row: SalesTaxTemplateSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    openEdit(row);
  };

  const handleView = async (row: SalesTaxTemplateSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const res = await getSalesTemplateById(row.name);
      const data = res?.data;

      const formData: SalesTaxTemplateFormData = {
        name: data?.name,
        title: data?.title || "",
        disabled: data?.disabled ?? 0,
        tax_category: data?.tax_category || "",
        taxes:
          Array.isArray(data?.taxes) && data.taxes.length > 0
            ? data.taxes.map((t: any) => ({
              name: t.name,
              charge_type: t.charge_type,
              account_head: t.account_head || "",
              account_head_display: t.account_head_name || "",
              rate: Number(t.rate) || 0,
              tax_amount: Number(t.tax_amount) || 0,
              description: t.description || "",
            }))
            : [
              {
                charge_type: "On Net Total",
                account_head: "",
                rate: 0,
                tax_amount: 0,
                description: "",
              },
            ],
      };

      openSalesTaxTemplateModal(
        formData,
        false,
        { isViewMode: true },
        {
          title: "View Sales Tax Template",
          subtitle: "Read-only view of this sales tax template",
        },
      );
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (
    row: SalesTaxTemplateSummary,
    e: React.MouseEvent,
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

    await updateStatus(row.name, newDisabled); //
    await fetchTemplates();
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete sales tax template "${name}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    await deleteSalesTax(name);
    await fetchTemplates();
  };

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns: Column<SalesTaxTemplateSummary>[] = [
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
              {isExpanded ? (
                <svg
                  className="w-4 h-4 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M9 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </div>
        );
      },
    },
    {
      key: "title",
      header: "Title",
      align: "left",
      render: (tc) => (
        <Tooltip content={tc.title}>
          <div className="py-1.5">
            <span className="cursor-pointer font-medium text-main text-xs">
              {tc.title}
            </span>
          </div>
        </Tooltip>
      ),
    },
    {
      key: "tax_category",
      header: "Category",
      align: "left",
      render: (tc) => (
        <div className="py-1.5">
          <span className="text-xs text-muted">
            {tc.tax_category || <span className="italic text-muted/60">—</span>}
          </span>
        </div>
      ),
    },
    {
      key: "taxes",
      header: "Charges",
      align: "left",
      render: (tc) => {
        if (tc.taxes.length === 0)
          return <span className="text-xs text-muted">None</span>;
        return (
          <div className="py-1.5">
            <span className="text-xs text-muted">
              {tc.taxes.length} charge{tc.taxes.length === 1 ? "" : "s"}
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
          {/* View — always visible */}
          <ActionButton
            type="view"
            onClick={(e) => handleView(tc, e)}
            iconOnly
          />

          {/* Edit — write permission */}
          {can(SALES_TAX_TEMPLATE_MODULE, "write") && (
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(tc, e as React.MouseEvent)}
              iconOnly
            />
          )}

          {/* Delete + Disable/Enable — in menu */}
          {(can(SALES_TAX_TEMPLATE_MODULE, "write") ||
            can(SALES_TAX_TEMPLATE_MODULE, "delete")) && (
            <ActionMenu
              {...(can(SALES_TAX_TEMPLATE_MODULE, "delete")
                ? {
                    onDelete: (e) =>
                      handleDelete(tc.name, e as React.MouseEvent),
                  }
                : {})}
              customActions={
                can(SALES_TAX_TEMPLATE_MODULE, "write")
                  ? [
                      {
                        label: tc.disabled ? "Enable" : "Disable",
                        icon: tc.disabled
                          ? ACTION_ICONS.ENABLE
                          : ACTION_ICONS.DISABLE,
                        onClick: () =>
                          handleToggleStatus(tc, {
                            stopPropagation: () => {},
                          } as React.MouseEvent),
                        danger: !tc.disabled,
                      },
                    ]
                  : []
              }
            />
          )}
        </ActionGroup>
      ),
    },
  ];

  // ── Expanded row ─────────────────────────────────────────────────────────

  const renderExpanded = (tc: SalesTaxTemplateSummary) => {
    if (!expandedRows.has(tc.name) || tc.taxes.length === 0) return null;

    return (
      <div
        className="px-6 py-3"
        style={{
          background: "rgba(201,125,46,0.04)",
          borderTop: "1.5px solid rgba(201,125,46,0.15)",
        }}
      >
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(201,125,46,0.2)" }}>
              {[
                "Charge Type",
                "GL Account",
                "Rate",
                "Tax Amount",
                "Description",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-3 font-bold text-muted uppercase tracking-widest text-[10px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tc.taxes.map((row, i) => (
              <tr
                key={i}
                className="transition-colors"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                  background:
                    i % 2 !== 0 ? "rgba(201,125,46,0.03)" : "transparent",
                }}
              >
                <td className="py-2 px-3">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--border)]/40 text-muted font-medium">
                    {row.charge_type}
                  </span>
                </td>
                <td className="py-2 px-3 text-main font-medium text-xs">
                  {row.account_head_name}
                </td>
                <td className="py-2 px-3 text-xs">
                  {row.charge_type === "Actual" ? (
                    <span className="text-muted italic text-[10px]">N/A</span>
                  ) : (
                    <>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--primary, #c97d2e)" }}
                      >
                        {Number(row.rate).toFixed(2)}
                      </span>
                      <span className="text-muted ml-0.5">%</span>
                    </>
                  )}
                </td>
                <td className="py-2 px-3 text-xs">
                  {row.tax_amount > 0 ? (
                    <span className="font-semibold text-main">
                      {Number(row.tax_amount).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-xs text-muted">
                  {row.description || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Table
      columns={columns}
      data={templates}
      tableId="sales-taxtemplates"
      showToolbar
      loading={loading || initialLoad}
      rowKey={(row) => row.name}
      onRowClick={(tc) => {
        if (tc.taxes.length > 0) toggleExpand(tc.name);
      }}
      expandedRowRender={renderExpanded}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      pageSizeOptions={[10, 25, 50, 100]}
      searchValue={searchTerm}
      onSearch={(val) => {
        setSearchTerm(val);
        setPage(1);
      }}
      enableAdd={can(SALES_TAX_TEMPLATE_MODULE, "create")}
      addLabel="Add Sales Tax Template"
      onAdd={openCreate}
      enableColumnSelector
      currentPage={page}
      totalPages={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={setPage}
    />
  );
};

export default SalesTaxTemplate;
