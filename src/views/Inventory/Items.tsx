import React, { useEffect, useState } from "react";

import { showApiError, showSuccess } from "../../utils/alert";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import {
  getAllItems,
  getItemByItemCode,
  deleteItemByItemCode,
} from "../../api/itemApi";

import ItemModal from "../../components/inventory/ItemModal";
import DeleteModal from "../../components/actionModal/DeleteModal";
import { ItemFilters } from "../../api/itemApi";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

import type { Column } from "../../components/ui/Table/type";

import type { ItemSummary, Item } from "../../types/item";

const Items: React.FC = () => {
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<ItemFilters>({});

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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getAllItems(page, pageSize, filters);
      setItems(res.data);
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
    fetchItems();
  }, [page, pageSize, filters]);

  /*      HANDLERS
   */

  const handleAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleEdit = async (itemCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await getItemByItemCode(itemCode);
      setEditItem(res.data);
      setShowModal(true);
    } catch {
      console.error("Unable to fetch item details");
    }
  };

  const handleDeleteClick = (item: ItemSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);

      const res = await deleteItemByItemCode(itemToDelete.id);

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));

      showSuccess(res.message || "Item deleted successfully");

      setDeleteModalOpen(false);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleSaved = async (res: any) => {
    const wasEdit = !!editItem;

    setShowModal(false);
    setEditItem(null);

    await fetchItems();

    showSuccess(
      res?.message ||
        (wasEdit ? "Item updated successfully" : "Item created successfully"),
    );
  };

  /*      FILTER
   */

  // const filteredItems = items.filter((i) =>
  //   [
  //     i.id,
  //     i.itemName,
  //     i.itemGroup,
  //     i.taxCategory,
  //     i.preferredVendor,
  //     i.sellingPrice,
  //   ]
  //     .join(" ")
  //     .toLowerCase()
  //     .includes(searchTerm.toLowerCase()),
  // );

  /*      COLUMNS
   */

  const columns: Column<ItemSummary>[] = [
    { key: "id", header: "Item Code", align: "left" },
    { key: "itemName", header: "Name", align: "left" },
    { key: "itemGroup", header: "Category", align: "left" },
    { key: "taxCategory", header: "Tax Category", align: "left" },
    {
      key: "minStockLevel",
      header: "Min Stock",
      align: "right",
    },
    {
      key: "maxStockLevel",
      header: "Max Stock",
      align: "right",
    },
    { key: "preferredVendor", header: "Supplier", align: "left" },
    {
      key: "sellingPrice",
      header: "Price",
      align: "right",
      render: (i) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          ZMW {i.sellingPrice}
        </code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (i) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleEdit(i.id, e)}
            iconOnly
          />
          <ActionMenu
            onEdit={(e) => handleEdit(i.id, e as any)}
            onDelete={(e) => handleDeleteClick(i, e as any)}
          />
        </ActionGroup>
      ),
    },
  ];

  /*      RENDER
   */

  return (
    <div className="p-8">
      <Table
        loading={loading || initialLoad}
        serverSide
        columns={columns}
        data={items}
        enableColumnSelector
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add Item"
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
              value={filters.taxCategory || ""}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  taxCategory: e.target.value || undefined,
                }));
                setPage(1);
              }}
              options={[
                { label: "Export", value: "Export" },
                { label: "Non-Export", value: "Non-Export" },
                { label: "LPO", value: "LPO" },
              ]}
            />
          </div>
        }
      />

      {/* ITEM MODAL */}
      <ItemModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditItem(null);
        }}
        onSubmit={handleSaved}
        initialData={editItem}
        isEditMode={!!editItem}
      />

      {/* DELETE MODAL */}
      {deleteModalOpen && itemToDelete && (
        <DeleteModal
          entityName="Item"
          entityId={itemToDelete.id}
          entityDisplayName={itemToDelete.itemName}
          isLoading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default Items;
