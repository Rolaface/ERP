import React, { useCallback, useEffect, useState } from "react";
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
import TaxTemplateModal from "../../components/inventory/TaxTemplateModal";
import { getAllTemplates, deleteTemplate } from "../../api/TaxTemplateApi";
import { useTaxTemplate } from "../../hooks/useTaxTemplate";
import type {
  TaxCategoryFormData,
  TaxRow,
} from "../../types/tax/taxTemplate";

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

const TaxTemplate: React.FC<Props> = ({ onAdd }) => {
  const [templates, setTemplates] = useState<TaxTemplateSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<TaxCategoryFormData | null>(null);

  const { createTaxTemplate, updateTaxTemplate, updateStatus } =
    useTaxTemplate();

  //  Modal Helpers 

  const openCreate = () => {
    setSelectedItem(null);
    setIsEditMode(false);
    setModalOpen(true);
    onAdd?.();
  };

  const openEdit = (row: TaxTemplateSummary) => {
    setSelectedItem({
      name: row.name,
      title: row.title,
      disabled: row.disabled === 1,
      taxes: row.taxes.map((t) => ({
        tax_type: t.tax_type,
        tax_rate: t.tax_rate,
      })),
    });
    setIsEditMode(true);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
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

  const handleSubmit = async (formData: TaxCategoryFormData) => {
    try {
      if (isEditMode) {
        await updateTaxTemplate(formData);
      } else {
        await createTaxTemplate(formData);
      }
      await fetchTemplates();
    } catch (error) {
      showApiError(error);
      throw error;
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
        const summary =
          tc.taxes.length === 0
            ? "None"
            : tc.taxes
                .map(
                  (r) => `${r.tax_type} (${Number(r.tax_rate).toFixed(2)}%)`
                )
                .join(", ");
        return (
          <Tooltip content={summary}>
            <span className="text-xs text-muted truncate max-w-[200px] block">
              {summary}
            </span>
          </Tooltip>
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

      <TaxTemplateModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={selectedItem}
        isEditMode={isEditMode}
      />
    </>
  );
};

export default TaxTemplate;