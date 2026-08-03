import React, { useState } from "react";
import { Search, Filter, Calendar, Columns, RefreshCw, Download } from "lucide-react";
import Table from "../../components/ui/Table/Table";
import ActionButton, { ActionGroup, ActionMenu } from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";

import ProcessImportModal from "../../components/inventory/ImportedItems/ImportItemsModal";
import DeclarationDetailsDrawer from "../../components/inventory/ImportedItems/DeclarationDetailsDrawer";
import { useImportedDeclarations } from "../../hooks/inventory/useImportedDeclarations";
import type { ImportedDeclarationItemRaw } from "../../types/inventory/ImportedItem.types";

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "3": { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", dot: "bg-[#22c55e]" },
  "4": { bg: "bg-[#fef2f2]", text: "text-[#dc2626]", dot: "bg-[#ef4444]" },
};
const DEFAULT_STATUS_STYLE = { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };

const formatDate = (raw: string) => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (raw: string) => {
  const d = new Date(raw.replace(" ", "T"));
  if (isNaN(d.getTime())) return raw;
  const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
};

const ImportedItem: React.FC = () => {
  const { declarations, isLoading, refresh } = useImportedDeclarations();
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<ImportedDeclarationItemRaw | null>(null);

  const handleViewDrawer = (item: ImportedDeclarationItemRaw) => {
    setSelectedDeclaration(item);
    setIsDrawerOpen(true);
  };

  const columns: Column<ImportedDeclarationItemRaw>[] = [
    {
      key: "declaration_no",
      header: "DECLARATION NO",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span
            className="block font-medium text-[#2563eb] hover:underline cursor-pointer"
            onClick={() => handleViewDrawer(i)}
          >
            {i.declaration_no}
          </span>
        </div>
      ),
    },
    {
      key: "declaration_date",
      header: "DECLARATION DATE",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{formatDate(i.declaration_date)}</span>
        </div>
      ),
    },
    {
      key: "item_name",
      header: "ITEM NAME",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.item_name}</span>
        </div>
      ),
    },
    {
      key: "supplier_name",
      header: "SUPPLIER NAME",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.supplier_name ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "ITEM QUANTITY",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">
            {i.quantity} {i.quantity_unit}
          </span>
        </div>
      ),
    },
    {
      key: "invoice_amount",
      header: "INVOICE AMOUNT",
      align: "right",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">
            {i.currency} {i.invoice_amount.toFixed(2)}
          </span>
        </div>
      ),
    },
   {
  key: "checker",
  header: "CHECKER",
  align: "left",
  render: (i) => (
    <div className="py-1.5 max-w-[180px]">
      <span className="block text-gray-700 whitespace-normal break-words">
        {i.checker}
      </span>
    </div>
  ),
},
    {
      key: "checked_at",
      header: "CHECKED AT",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{formatDateTime(i.checked_at)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      render: (i) => {
        const style = STATUS_STYLE[i.status_code] ?? DEFAULT_STATUS_STYLE;
        return (
          <div className="py-1.5 flex justify-center">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${style.bg} ${style.text} flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
              {i.status}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "ACTIONS",
      align: "center",
      render: (i) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            title="View Declaration Details"
            onClick={(e?: React.MouseEvent) => {
              e?.stopPropagation();
              handleViewDrawer(i);
            }}
          />
          <ActionMenu />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0 bg-white p-3 rounded-lg border border-theme shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-theme rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-card text-main"
            />
          </div>

          <div className="relative w-40">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select className="w-full pl-9 pr-3 py-2 text-sm border border-theme rounded-md appearance-none bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Status</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>

          <div className="relative w-40">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Date Range"
              className="w-full pl-9 pr-3 py-2 text-sm border border-theme rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-card text-main"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 border border-theme rounded-md text-sm font-medium text-main bg-card hover:bg-app transition-colors">
            <Columns size={16} /> COLUMNS (9)
          </button>
          <button
            onClick={() => setIsProcessModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-md text-sm font-medium hover:bg-[#1d4ed8] shadow-sm transition-colors"
          >
            <RefreshCw size={16} /> Process Declarations
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-theme rounded-md text-sm font-medium text-main bg-card hover:bg-app transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col min-h-0 bg-card rounded-lg">
        <Table
          loading={isLoading}
          columns={columns}
          data={declarations}
          showToolbar={false}
          enableAdd={false}
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(declarations.length / pageSize))}
          pageSize={pageSize}
          totalItems={declarations.length}
          pageSizeOptions={[20, 50, 100]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onPageChange={setPage}
          onRowDoubleClick={handleViewDrawer}
        />
      </div>

      {isProcessModalOpen && (
        <ProcessImportModal
          isOpen={isProcessModalOpen}
          onClose={() => {
            setIsProcessModalOpen(false);
            refresh();
          }}
        />
      )}

      {isDrawerOpen && selectedDeclaration && (
        <DeclarationDetailsDrawer declaration={selectedDeclaration} onClose={() => setIsDrawerOpen(false)} />
      )}
    </div>
  );
};

export default ImportedItem;