import React, { useEffect, useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { MinimizableModal } from "../../components/common/ModalManagerContext";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import Tooltip from "../../components/Tooltip";
import { Button } from "../../components/ui/modal/formComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { createTaxCategory } from "../../api/taxCategoryApi";
import { getAllTaxCategories } from "../../api/taxCategoryApi";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showLoading,
  closeSwal,
} from "../../utils/alert";

type TaxCategory = {
  id: string;
  title: string;
  status: string;
};

const TaxCategory: React.FC = () => {
  const [data, setData] = useState<TaxCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [modalId] = useState(`tax-category-${Date.now()}`);

  const fetchTaxCategories = async () => {
    try {
      setLoading(true);

      const res = await getAllTaxCategories(page, pageSize);

      const list = res?.data || [];
      const pagination = res?.pagination || {};

      const formatted = list.map((item: any) => ({
        id: item.name || `-`,
        title: item.title || "-",
        status: item.disabled ? "Inactive" : "Active",
      }));

      setData([...formatted]);
      setTotalPages(pagination.total_pages || 1);
      setTotalItems(pagination.total_count || 0);
    } catch (err) {
      showApiError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxCategories();
  }, [page, pageSize]);
  const columns: Column<TaxCategory>[] = [
    {
      key: "id",
      header: "ID",
      align: "left",
    },
    {
      key: "title",
      header: "Title",
      align: "left",
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (row) => (
        <span
          className={`font-medium ${
            row.status === "Active" ? "text-success" : "text-danger"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        loading={loading}
        columns={columns}
        data={data}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add Tax Category"
        onAdd={() => {
          setShowModal(true);
        }}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      {showModal && (
        <MinimizableModal
          modalId={modalId}
          isOpen={showModal}
          onClose={() =>
            handleCloseWithConfirm(() => {
              resetDirty();
              setShowModal(false);
              setTitle("");
              setEnabled(true);
            }, modalId)
          }
          title="Add Tax Category"
          subtitle="Create a new tax category"
          maxWidth="md"
        >
          <form onChange={() => markDirty()} className="flex flex-col gap-4">
            <Tooltip content={title || "Enter tax category name"}>
              <ModalInput
                label="Tax Category Name"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter tax category name"
              />
            </Tooltip>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  setEnabled(e.target.checked);
                  markDirty();
                }}
              />
              <span className="text-main text-sm">Enabled</span>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  handleCloseWithConfirm(() => {
                    resetDirty();
                    setShowModal(false);
                    setTitle("");
                    setEnabled(true);
                  }, modalId)
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  if (!title.trim()) {
                    showValidationError("Tax Category name is required");
                    return;
                  }

                  try {
                    showLoading("Creating Tax Category...");

                    const payload = {
                      title: title.trim(),
                      disabled: enabled ? 0 : 1,
                    };

                    const res = await createTaxCategory(payload);

                    closeSwal();

                    showSuccess(
                      res?.message || "Tax Category created successfully",
                    );

                    resetDirty();
                    setShowModal(false);
                    setTitle("");
                    setEnabled(true);

                    fetchTaxCategories();
                  } catch (err) {
                    closeSwal();
                    showApiError(err);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </form>
        </MinimizableModal>
      )}
    </div>
  );
};

export default TaxCategory;
