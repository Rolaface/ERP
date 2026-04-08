import React, { useEffect, useState } from "react";
import {
  showLoading,
  showApiError,
  showSuccess,
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaxRateRow {
  id: string;
  tax: string;
  taxRate: number;
}

export interface TaxCategorySummary {
  id: string;
  title: string;
  company: string;
  disabled: boolean;
  taxRates: TaxRateRow[];
}

interface Props {
  onAdd?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const TaxTemplate: React.FC<Props> = ({ onAdd }) => {
  const [taxCategories, setTaxCategories] = useState<TaxCategorySummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Modal State ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaxCategorySummary | null>(null);

  const openCreate = () => {
    setSelectedItem(null);
    setIsEditMode(false);
    setModalOpen(true);
    onAdd?.();
  };

  const openEdit = (data: TaxCategorySummary) => {
    setSelectedItem(data);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchTaxCategories = async () => {
    try {
      setLoading(true);

      // Replace with your actual API call:
      // const response = await getAllTaxTemplates(page, pageSize);
      // setTaxCategories(response?.message?.data || []);
      // setTotalPages(response?.message?.pagination?.total_pages || 1);
      // setTotalItems(response?.message?.pagination?.total || 0);

      setTaxCategories([]);
      setTotalPages(1);
      setTotalItems(0);
    } catch (error) {
      console.error("Error loading tax templates:", error);
      showApiError(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchTaxCategories();
  }, [page, pageSize]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showLoading("Loading tax template...");
      // const response = await getTaxTemplateById(id);
      // const data = response?.data ?? response?.message?.data ?? response;
      const data = taxCategories.find((tc) => tc.id === id);
      closeSwal();
      if (data) openEdit(data);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete tax template ${id}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting...");
      // await deleteTaxTemplateById(id);
      closeSwal();
      setTaxCategories((prev) => prev.filter((tc) => tc.id !== id));
      showSuccess("Tax template deleted successfully.");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleSubmit = async (data: TaxCategorySummary) => {
    try {
      if (isEditMode && selectedItem) {
        // await updateTaxTemplate(selectedItem.id, data);
        setTaxCategories((prev) =>
          prev.map((tc) => (tc.id === selectedItem.id ? { ...tc, ...data } : tc))
        );
        showSuccess("Tax template updated successfully.");
      } else {
        // const response = await createTaxTemplate(data);
        const newItem: TaxCategorySummary = {
          ...data,
          id: `TC-${String(taxCategories.length + 1).padStart(3, "0")}`,
        };
        setTaxCategories((prev) => [...prev, newItem]);
        showSuccess("Tax template created successfully.");
      }
      await fetchTaxCategories();
    } catch (error) {
      showApiError(error);
      throw error; // re-throw so modal stays open on error
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<TaxCategorySummary>[] = [
    {
      key: "id",
      header: "ID",
      align: "left",
      render: (tc) => (
        <Tooltip content={tc.id}>
          <span className="cursor-pointer">{tc.id}</span>
        </Tooltip>
      ),
    },
    {
      key: "title",
      header: "Title",
      align: "left",
      render: (tc) => (
        <Tooltip content={tc.title}>
          <span className="cursor-pointer font-medium text-main">{tc.title}</span>
        </Tooltip>
      ),
    },
    {
      key: "taxRates",
      header: "Tax Rates",
      align: "left",
      render: (tc) => {
        const summary =
          tc.taxRates.length === 0
            ? "None"
            : tc.taxRates
                .map((r) => `${r.tax} (${r.taxRate.toFixed(3)}%)`)
                .join(", ");
        return (
          <Tooltip content={summary}>
            <span className="text-xs text-muted">{summary}</span>
          </Tooltip>
        );
      },
    },
    {
      key: "disabled",
      header: "Status",
      align: "left",
      render: (tc) => (
        <Tooltip content={tc.disabled ? "Disabled" : "Active"}>
          <code
            className={[
              "text-xs px-2 py-1 rounded",
              tc.disabled
                ? "bg-danger/10 text-danger"
                : "bg-success/10 text-success",
            ].join(" ")}
          >
            {tc.disabled ? "Disabled" : "Active"}
          </code>
        </Tooltip>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (tc) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => {
              /* open detail view if needed */
            }}
            iconOnly
          />
          <ActionMenu
            onEdit={(e) => handleEdit(tc.id, e as any)}
            onDelete={(e) => handleDelete(tc.id, e as any)}
          />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Table
        columns={columns}
        data={taxCategories}
        showToolbar
        loading={loading || initialLoad}
        onPageSizeChange={(size) => setPageSize(size)}
        pageSizeOptions={[10, 25, 50, 100]}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
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
        onSubmit={handleSubmit as any}
        initialData={selectedItem}
        isEditMode={isEditMode}
      />
    </>
  );
};

export default TaxTemplate;