import React, { useEffect, useState } from "react";

import { showApiError, showSuccess } from "../../utils/alert";

import {
  getAllItemGroups,
  deleteItemGroupById,
  getItemGroupById,
} from "../../api/itemCategoryApi";

import ItemsCategoryModal from "../../components/inventory/ItemsCategoryModal";
import DeleteModal from "../../components/actionModal/DeleteModal";

import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import { ItemGroupFilters } from "../../api/itemCategoryApi";
import type { Column } from "../../components/ui/Table/type";
import type { ItemGroupSummary, ItemGroup } from "../../types/itemCategory";

/* 
   COMPONENT
 */

const ItemsCategory: React.FC = () => {
  const [groups, setGroups] = useState<ItemGroupSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGroup, setEditGroup] = useState<ItemGroup | null>(null);
  const [filters, setFilters] = useState<ItemGroupFilters>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ItemGroupSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm || undefined,
      }));
      setPage(1);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* 
     FETCH
   */

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await getAllItemGroups(page, pageSize, filters);
      setGroups(res.data);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page, pageSize, filters]);

  /* 
     HANDLERS
   */

  const handleAdd = () => {
    setEditGroup(null);
    setShowModal(true);
  };

  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await getItemGroupById(id);
      setEditGroup(res.data);
      setShowModal(true);
    } catch {
      console.error("Unable to fetch item category");
    }
  };

  const handleDeleteClick = (group: ItemGroupSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      setDeleting(true);

      const res = await deleteItemGroupById(groupToDelete.id);

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      setGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      showSuccess(res.message || "Item category deleted");

      setDeleteModalOpen(false);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setDeleting(false);
      setGroupToDelete(null);
    }
  };

  const handleSaved = async () => {
    const wasEdit = !!editGroup;
    setShowModal(false);
    setEditGroup(null);
    await fetchGroups();
    showSuccess(wasEdit ? "Category updated" : "Category created");
  };

  /* 
     TABLE COLUMNS
   */

  const columns: Column<ItemGroupSummary>[] = [
    { key: "id", header: "ID", align: "left" },
    { key: "groupName", header: "Name", align: "left" },
    { key: "description", header: "Description", align: "left" },
    {
      key: "unitOfMeasurement",
      header: "UOM",
      align: "left",
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      align: "right",
      render: (g) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          ZMW {g.sellingPrice}
        </code>
      ),
    },
    { key: "salesAccount", header: "Sales Account", align: "left" },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (g) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleEdit(g.id, e)}
            iconOnly
          />
          <ActionMenu
            onEdit={(e) => handleEdit(g.id, e as any)}
            onDelete={(e) => handleDeleteClick(g, e as any)}
          />
        </ActionGroup>
      ),
    },
  ];

  /* 
     RENDER
   */

  return (
    <div className="p-8">
      <Table
        loading={loading || initialLoad}
        serverSide
        columns={columns}
        data={groups}
        showToolbar
        enableColumnSelector
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add Category"
        onAdd={handleAdd}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1); // reset page
        }}
        onPageChange={setPage}
        extraFilters={
          <div className="w-48">
            <FilterSelect
              value={filters.itemType || ""}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  itemType: e.target.value || undefined,
                }));
                setPage(1);
              }}
              options={[
                { value: "1", label: "Raw Material" },
                { value: "2", label: "Finished Product" },
                { value: "3", label: "Service" },
              ]}
            />
          </div>
        }
      />

      {/* CATEGORY MODAL */}
      <ItemsCategoryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditGroup(null);
        }}
        onSubmit={handleSaved}
        initialData={editGroup}
        isEditMode={!!editGroup}
      />

      {/* DELETE MODAL */}
      {deleteModalOpen && groupToDelete && (
        <DeleteModal
          entityName="Item Category"
          entityId={groupToDelete.id}
          entityDisplayName={groupToDelete.groupName}
          isLoading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setGroupToDelete(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default ItemsCategory;
