/* eslint-disable @typescript-eslint/no-misused-promises */

import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { getAllImportItems } from "../../api/importApi";
import { getCountryList } from "../../api/lookupApi";

import ViewImportModal from "../../components/inventory/ViewImportModal";
import DeleteModal from "../../components/actionModal/DeleteModal";

import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

import type { Column } from "../../components/ui/Table/type";

interface ImportItemSummary {
  id: string;
  itemName: string;
  quantity: string;
  originCountryCode: string;
  exportCountryCode: string;
  invoiceAmount: number;
  invoiceCurrency: string;
  invoiceExchangeRate: number;
}

const Items: React.FC = () => {
  const [items, setItems] = useState<ImportItemSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [countryNameByCode, setCountryNameByCode] = useState<
    Record<string, string>
  >({});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ImportItemSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const apiData = await getAllImportItems();
      // Map API data to ImportItemSummary[]
      const mapped = Array.isArray(apiData)
        ? apiData.map((entry: any) => ({
            id: entry.id || "",
            itemName: entry.itemName || entry.item_name || "",
            quantity: entry.quantity || "0",
            originCountryCode:
              entry.originCountryCode || entry.origin_country_code || "",
            exportCountryCode:
              entry.exportCountryCode || entry.export_country_code || "",
            invoiceAmount: entry.invoiceAmount || entry.invoice_amount || 0,
            invoiceCurrency:
              entry.invoiceCurrency || entry.invoice_currency || "",
            invoiceExchangeRate:
              entry.invoiceExchangeRate || entry.invoice_exchange_rate || 0,
          }))
        : [];
      setItems(mapped);
      // Calculate pagination
      setTotalItems(mapped.length);
      setTotalPages(Math.ceil(mapped.length / pageSize));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load import items");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await getCountryList();
        const map: Record<string, string> = {};
        (list ?? []).forEach((c: any) => {
          const code = String(c?.code ?? "").trim();
          const name = String(c?.name ?? "").trim();
          if (code) map[code] = name;
        });
        setCountryNameByCode(map);
      } catch {
        setCountryNameByCode({});
      }
    })();
  }, []);

  /*      HANDLERS
   */

  const handleView = (importId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedImportId(importId);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (item: ImportItemSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      // TODO: Implement delete import item API
      // await deleteImportItem(itemToDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      toast.success("Import item deleted successfully");
      setDeleteModalOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to delete import item",
        {
          duration: 6000,
        },
      );
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  // const handleSaved = async () => {
  //   const wasEdit = !!editItem;
  //   setShowModal(false);
  //   setEditItem(null);
  //   await fetchItems();
  //   toast.success(wasEdit ? "Item updated" : "Item created");
  // };

  /*      FILTER
   */

  const filteredItems = items.filter((i) =>
    [
      i.id,
      i.itemName,
      i.quantity,
      i.originCountryCode,
      i.exportCountryCode,
      i.invoiceAmount,
      i.invoiceCurrency,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  /*      COLUMNS
   */

  const columns: Column<ImportItemSummary>[] = [
    { key: "id", header: "ID", align: "left" },
    { key: "itemName", header: "Item Name", align: "left" },
    { key: "quantity", header: "Quantity", align: "left" },
    {
      key: "originCountryCode",
      header: "Origin Country",
      align: "left",
      render: (i) =>
        countryNameByCode[String(i.originCountryCode ?? "")] ||
        i.originCountryCode,
    },
    {
      key: "exportCountryCode",
      header: "Export Country",
      align: "left",
      render: (i) =>
        countryNameByCode[String(i.exportCountryCode ?? "")] ||
        i.exportCountryCode,
    },
    {
      key: "invoiceAmount",
      header: "Invoice Amount",
      align: "right",
      render: (i) => `${i.invoiceAmount.toFixed(2)}`,
    },
    { key: "invoiceCurrency", header: "Currency", align: "left" },
    {
      key: "invoiceExchangeRate",
      header: "Exchange Rate",
      align: "right",
      render: (i) => `${i.invoiceExchangeRate.toFixed(2)}`,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (i) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e?: React.MouseEvent) => handleView(i.id, e)}
          />
          <ActionMenu
            onDelete={(e?: React.MouseEvent) => handleDeleteClick(i, e)}
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
        columns={columns}
        data={filteredItems}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
      />

      {/* VIEW MODAL */}
      {viewModalOpen && (
        <ViewImportModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedImportId(null);
          }}
          importId={selectedImportId}
          onSuccess={fetchItems}
        />
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && itemToDelete && (
        <DeleteModal
          entityName="Import Item"
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
