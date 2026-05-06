import React, { useState, useMemo, useCallback,useEffect } from "react";
import { submitAsset, cancelAsset } from "../../api/assetapi";

import Table from "../../components/ui/Table/Table";
import { DateRangeFilter } from "../../components/ui/modal/DateRangeFilter";
import type { Column } from "../../components/ui/Table/type";
import { getAssets } from "../../api/assetapi";
import {  openFixedAssetModal } from "../../store/modalStore";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { deleteAsset } from "../../api/assetapi";
import { showApiError } from "../../utils/alert";
import Swal from "sweetalert2";




type Asset = {
  id: string;
  name: string;
  category: string;
  location: string;
  purchaseDate: string;
  value: number;
};

const AssetRegister: React.FC = () => {
const [assets, setAssets] = useState<Asset[]>([]);
const [loading, setLoading] = useState(false);
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [totalPages, setTotalPages] = useState(1);
const [totalItems, setTotalItems] = useState(0);
  

const extractBackendError = (err: any): string => {
  try {
    // 1. frappe _server_messages (best case)
    if (err?.response?.data?._server_messages) {
      const msgs = JSON.parse(err.response.data._server_messages);
      const parsed = JSON.parse(msgs[0]);
      return parsed.message;
    }

    // 2. frappe exc (YOUR CASE)
    if (err?.response?.data?.exc) {
      const excArr = JSON.parse(err.response.data.exc); // array
      const raw = excArr[0];

      const match = raw.match(/ValidationError:\s(.+)/);
      if (match) return match[1];
    }

    // 3. exception fallback
    if (err?.response?.data?.exception) {
      const match = err.response.data.exception.match(/ValidationError:\s(.+)/);
      if (match) return match[1];
    }

    // 4. message fallback
    if (err?.response?.data?.message) {
      return err.response.data.message;
    }

    return "Something went wrong";
  } catch {
    return "Something went wrong";
  }
};

  const [filters, setFilters] = useState({
    from_date: "",
    to_date: "",
  });

  const [sortBy, setSortBy] = useState<keyof Asset | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
const refreshKey = useDataRefreshStore(
  (state) => state.refreshFlags[REFRESH_KEYS.FIXED_ASSET_LIST]
);


  // ─── Add Asset ───
  const handleAddAsset = (asset: Omit<Asset, "id">) => {
    setAssets((prev) => [
      ...prev,
      { id: Date.now().toString(), ...asset, value: Number(asset.value) },
    ]);
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };


const handleSubmitAsset = async (id: string) => {
  try {
    await submitAsset(id);

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Asset submitted successfully",
    });

    fetchAssets();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Operation Failed",
    text: extractBackendError(err),
    });
  }
};
const handleCancelAsset = async (id: string) => {
  try {
    await cancelAsset(id);

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Asset cancelled successfully",
    });

    fetchAssets();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Operation Failed",
     text: extractBackendError(err),
    });
  }
};


  // ─── FILTER ───
  const filteredData = useMemo(() => {
    return assets.filter((a) => {
      

      const matchesDate =
        (!filters.from_date ||
          new Date(a.purchaseDate) >= new Date(filters.from_date)) &&
        (!filters.to_date ||
          new Date(a.purchaseDate) <= new Date(filters.to_date));

      return  matchesDate;
    });
  }, [assets, filters]);

  // ─── SORT ───
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);



  const paginatedData = useMemo(() => {
    return sortedData.slice(
      (page - 1) * pageSize,
      page * pageSize
    );
  }, [sortedData, page, pageSize]);

  // ─── SORT HANDLER ───
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey as keyof Asset);
    setSortOrder(order);
    setPage(1);
  };

  const fetchAssets = useCallback(async () => {
  try {
    setLoading(true);

    const data = await getAssets({
      fields: [
        "name",
        "asset_category",
        "location",
        "available_for_use_date",
        "net_purchase_amount",
      ],
      page,
      page_size: pageSize,
   
    });

    setAssets(
      data.map((item: any) => ({
        id: item.name,
        name: item.name,
        category: item.asset_category,
        location: item.location,
        purchaseDate: item.available_for_use_date,
        value: item.net_purchase_amount || 0,
      }))
    );

    setTotalPages(1); // ERP basic API
    setTotalItems(data.length);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [page, pageSize,]);
useEffect(() => {
  fetchAssets();
}, [fetchAssets, refreshKey ]);


const handleView = (row: Asset) => {
  openFixedAssetModal(
    { assetName: row.id },
    true,
  );
};

const handleEdit = (row: Asset, e: React.MouseEvent) => {
  e.stopPropagation();

  openFixedAssetModal(
    { assetName: row.id },
    true,
    
  );
};

const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
  e.stopPropagation();

  try {
    await deleteAsset(id);
    fetchAssets();
  } catch (err) {
    
    Swal.fire({
  icon: "error",
  title: "Operation Failed",
 text: extractBackendError(err),
}); 
  }
};
const formatDate = (date: string | Date) => {
  if (!date) return "";

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
  }

  // Date object — use local methods
  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

  const columns: Column<Asset>[] = [
    {
      key: "name",
      header: "Asset Name",
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
    },
    {
      key: "location",
      header: "Location",
    },
    {
      key: "purchaseDate",
      header: "Purchase Date",
      sortable: true,
      render: (row) => formatDate(row.purchaseDate),
    },
    {
      key: "value",
      header: "Value",
      sortable: true,
      render: (row) => `₹ ${row.value.toLocaleString()}`,
    },
    {
      key: "actions",
      header: "Actions",
render: (row) => (
  <ActionGroup>
   
    <ActionButton
      type="view"
      onClick={() => handleView(row)}
      iconOnly
    />

    {/*  EDIT */}
    <ActionButton
      type="edit"
      onClick={(e) => handleEdit(row, e as any)}
      iconOnly
      title="Edit Asset"
    />

    {/* ⋮ MENU */}
    <ActionMenu
      onDelete={(e) => handleDeleteAsset(row.id, e as any)}
      customActions={[
        {
          label: "Submit for Approval",
        onClick: () => handleSubmitAsset(row.id),
        },

          {
          label: "Cancel Submission",
          onClick: () => handleCancelAsset(row.id),
        },  
        {
          label: "View Details",
          onClick: () => handleView(row),
        },
      ]}
    />
  </ActionGroup>
),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={paginatedData}
        rowKey={(row) => row.id}
        tableId="fixed-assets"

        loading={loading}
        isFetching={false}

        showToolbar
       
        onSearch={(q) => {
        
          setPage(1);
        }}

        enableAdd
        addLabel="Add Asset"
        onAdd={() => openFixedAssetModal(null, false, {
                
               })}

        enableColumnSelector
        enableExport

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

        extraFilters={
          <DateRangeFilter
            from={filters.from_date}
            to={filters.to_date}
            onChange={(range) => {
              setFilters((prev) => ({ ...prev, ...range }));
              setPage(1);
            }}
          />
        }
      />

 
    </div>
  );
};

export default AssetRegister;