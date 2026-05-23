import React, { useState, useMemo, useEffect } from "react";

import Table from "../../components/ui/Table/Table";
import { DateRangeFilter } from "../../components/ui/modal/DateRangeFilter";
import type { Column } from "../../components/ui/Table/type";

import type { AssetMovementRecord, AssetMovementForm } from "../../types/Assetmovement.types";
import { STATUS_CLASS_MAP } from "../../types/Assetmovement.types";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import { openAssetMovementModal } from "../../store/modalStore";
import {
  getAssetMovements,
  createAssetMovement,
  deleteAssetMovement,
} from "../../api/assetMovementapi";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { usePermission } from "../../hooks/permission/usePermission";

/* ─────────────────────────────────────────────
   ASSET MOVEMENT LIST PAGE
───────────────────────────────────────────── */
const ASSET_MOVEMENT_MODULE = "Asset Movement";

const AssetMovement: React.FC = () => {
  /* ── state ── */
  const [records, setRecords] = useState<AssetMovementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ from_date: "", to_date: "" });
  const [sortBy, setSortBy] = useState<keyof AssetMovementRecord | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { can } = usePermission();


  /* ── delete ── */
  const handleDelete = async (id: string) => {
    try {
      await deleteAssetMovement(id);
      fetchMovements();
    } catch (err) {
      console.error("DELETE ERROR", err);
    }
  };

  /* ── filter ── */
  const filteredData = useMemo(() => {
    return records.filter((r) => {
      const txDate = new Date(r.transactionDate);
      const matchesDate =
        (!filters.from_date || txDate >= new Date(filters.from_date)) &&
        (!filters.to_date || txDate <= new Date(filters.to_date));

      return matchesDate;
    });
  }, [records, searchTerm, filters]);

  /* ── sort ── */
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      const vA = a[sortBy] as string;
      const vB = b[sortBy] as string;
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);

  /* ── pagination ── */
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize],
  );

  /* ── sort handler ── */
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey as keyof AssetMovementRecord);
    setSortOrder(order);
    setPage(1);
  };


  const fetchMovements = async () => {
    try {
      setLoading(true);

      const data = await getAssetMovements({
        fields: [
          "name",
          "company",
          "purpose",
          "transaction_date",
          "docstatus",
        ],
         search: searchTerm,
      });

      const mapped = data.map((item: any) => ({
        id: item.name,
        company: item.company,
        purpose: item.purpose,
        transactionDate: item.transaction_date,
        status:
          item.docstatus === 0
            ? "Draft"
            : item.docstatus === 1
              ? "Submitted"
              : "Cancelled",
      }));

      setRecords(mapped);
    } catch (err) {
      console.error("FETCH MOVEMENT ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshKey = useDataRefreshStore(
    (state) => state.refreshFlags[REFRESH_KEYS.ASSET_MOVEMENT_LIST]
  );
  useEffect(() => {
    fetchMovements();
  }, [refreshKey, searchTerm]);
  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    if (typeof date === "string") {
      const datePart = date.split("T")[0].split(" ")[0]; // handles both "T" and space separator
      const [year, month, day] = datePart.split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }

    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };
  /* ── columns ── */
  const columns: Column<AssetMovementRecord>[] = [
    {
      key: "id",
      header: "Movement ID",
      render: (row) => (
        <div className="py-1.5">
          <span className="font-mono text-xs" style={{ color: "var(--primary)" }}>
            #{row.id.slice(-6)}
          </span>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
    },
    {
      key: "purpose",
      header: "Purpose",
      render: (row) => (
        <div className="py-1.5">
          <span className="badge">
            {row.purpose || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "transactionDate",
      header: "Transaction Date",
      render: (row) => (
        <div className="py-1.5">
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            {formatDate(row.transactionDate)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="py-1.5">
          <span
            className={`badge ${STATUS_CLASS_MAP[row.status]}`}
            style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11 }}
          >
            {row.status}
          </span>
        </div>
      ),
    },
    {
      key: "actions" as keyof AssetMovementRecord,
      header: "Actions",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => console.log("view", row.id)}
            iconOnly
          />

          {can(ASSET_MOVEMENT_MODULE, "write") && (
            <ActionButton
              type="edit"
              onClick={() => console.log("edit", row.id)}
              iconOnly
            />
          )}

          <ActionMenu
            {...(can(ASSET_MOVEMENT_MODULE, "delete")
              ? {
                onDelete: () => handleDelete(row.id),
              }
              : {})}
          />
        </ActionGroup>
      ),
    },
  ];

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={paginatedData}
        rowKey={(row) => row.id}
        tableId="asset-movement"
        loading={loading}
        isFetching={loading}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(ASSET_MOVEMENT_MODULE, "create")}
        addLabel="New Movement"
        onAdd={() => openAssetMovementModal({ mode: "create" })}

        enableColumnSelector
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
        sortBy={sortBy ?? ""}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        // extraFilters={
        //   <DateRangeFilter
        //     from={filters.from_date}
        //     to={filters.to_date}
        //     onChange={(range) => {
        //       setFilters((prev) => ({ ...prev, ...range }));
        //       setPage(1);
        //     }}
        //   />
        // }
      />


    </div>
  );
};

export default AssetMovement;