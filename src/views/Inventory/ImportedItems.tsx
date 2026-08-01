import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Calendar, Columns, RefreshCw, Download } from "lucide-react";
import Table from "../../components/ui/Table/Table";
import ActionButton, { ActionGroup, ActionMenu } from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";

import ProcessImportModal from "../../components/inventory/ImportedItems/ImportItemsModal";
import DeclarationDetailsDrawer from "../../components/inventory/ImportedItems/DeclarationDetailsDrawer";

// ─── Types & Dummy Data ───────────────────────────────────────────────────────

interface DeclarationSummary {
  id: string;
  declDate: string;
  postedDate: string;
  supplier: string;
  items: number;
  status: string;
}

const DUMMY_DECLARATIONS: DeclarationSummary[] = [
  { id: "C3460-2019-TZDL", declDate: "20 Nov 2023", postedDate: "30 Nov 2023, 10:45", supplier: "ODERICH CONSERVA QUALIDADE BRASIL", items: 3, status: "Approved" },
  { id: "C3459-2019-TZDL", declDate: "19 Nov 2023", postedDate: "30 Nov 2023, 09:12", supplier: "ABC TRADERS LTD", items: 5, status: "Rejected" },
  { id: "C3458-2019-TZDL", declDate: "18 Nov 2023", postedDate: "29 Nov 2023, 16:20", supplier: "GLOBAL SUPPLIES ZM", items: 4, status: "Approved" },
  { id: "C3456-2019-TZDL", declDate: "16 Nov 2023", postedDate: "29 Nov 2023, 11:08", supplier: "AFRICA MERCHANTS LTD", items: 2, status: "Rejected" },
  { id: "C3454-2019-TZDL", declDate: "14 Nov 2023", postedDate: "28 Nov 2023, 15:30", supplier: "BN METRO Ltd", items: 6, status: "Approved" },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const ImportedItem: React.FC = () => {
  /* ── Table / list state ── */
  const [declarations, setDeclarations] = useState<DeclarationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  /* ── Modal / Drawer state ── */
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationSummary | null>(null);

  /* ── Fetch Data ── */
  useEffect(() => {
    setLoading(true);
    // Simulate API delay
    const t = setTimeout(() => {
      setDeclarations(DUMMY_DECLARATIONS);
      setTotalItems(DUMMY_DECLARATIONS.length);
      setTotalPages(1);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [page, pageSize]);

  /* ── Handlers ── */
  const handleViewDrawer = useCallback((summary: DeclarationSummary) => {
    setSelectedDeclaration(summary);
    setIsDrawerOpen(true);
  }, []);

  /* ── Columns Configuration ── */
  const columns: Column<DeclarationSummary>[] = [
    {
      key: "id",
      header: "DECLARATION NO",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span 
            className="block font-medium text-[#2563eb] hover:underline cursor-pointer" 
            onClick={() => handleViewDrawer(i)}
          >
            {i.id}
          </span>
        </div>
      ),
    },
    {
      key: "declDate",
      header: "DECLARATION DATE",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.declDate}</span>
        </div>
      ),
    },
    {
      key: "postedDate",
      header: "POSTED DATE",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.postedDate}</span>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "SUPPLIER",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.supplier}</span>
        </div>
      ),
    },
    {
      key: "items",
      header: "ITEMS",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block text-gray-700">{i.items}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      render: (i) => (
        <div className="py-1.5 flex justify-center">
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#fffbeb] text-[#d97706] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
            {i.status}
          </span>
        </div>
      ),
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full">
      
      {/* ── Custom Filter & Action Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0 bg-white p-3 rounded-lg border border-theme shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
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
          
          {/* Status Filter */}
          <div className="relative w-40">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select className="w-full pl-9 pr-3 py-2 text-sm border border-theme rounded-md appearance-none bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Status</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Approved</option>
            </select>
          </div>

          {/* Date Range */}
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
            <Columns size={16} /> COLUMNS (7)
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

      {/* ── Main Table Area ── */}
      <div className="flex flex-1 flex-col min-h-0 bg-card rounded-lg">
        {/* We set showToolbar to false because we built the custom one above */}
        <Table
          loading={loading}
          columns={columns}
          data={declarations}
          showToolbar={false}
          enableAdd={false}
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[20, 50, 100]}
          onPageSizeChange={(size) => { 
            setPageSize(size); 
            setPage(1); 
          }}
          onPageChange={setPage}
          onRowDoubleClick={handleViewDrawer}
        />
      </div>

      {/* ── Modals & Drawers ── */}
      {isProcessModalOpen && (
        <ProcessImportModal 
          isOpen={isProcessModalOpen}
          onClose={() => setIsProcessModalOpen(false)} 
        />
      )}

      {isDrawerOpen && selectedDeclaration && (
        <DeclarationDetailsDrawer 
          declaration={selectedDeclaration} 
          onClose={() => setIsDrawerOpen(false)} 
        />
      )}
    </div>
  );
};

export default ImportedItem;