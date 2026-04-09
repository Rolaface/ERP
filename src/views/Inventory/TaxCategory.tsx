import React, { useEffect, useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import { getAllTaxCategories } from "../../api/taxCategoryApi";
import {
  showApiError
} from "../../utils/alert";
import { openTaxCategoryModal } from "../../store/modalStore";

type TaxCategory = {
  id: string;
  title: string;
  status: string;
};

type EmptyRow = TaxCategory & { __isEmpty?: boolean };

const TaxCategory: React.FC = () => {
  const [data, setData] = useState<EmptyRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const openCreate = () => {
    openTaxCategoryModal(null, false, {
      callback: async () => {
        await fetchTaxCategories();
      },
    }, {
      title: "Add Tax Category",
      subtitle: "Create a new tax category",
    });
  };

  const fetchTaxCategories = async () => {
    try {
      setLoading(true);

      const res = await getAllTaxCategories(page, pageSize);
      
      console.log("TaxCategory API response:", res);

      const list = res?.data || [];
      const pagination = res?.pagination || {};

      const formatted = list.map((item: any) => ({
        id: item.name || `-`,
        title: item.title || "-",
        status: item.disabled ? "Inactive" : "Active",
      }));

      console.log("Formatted data length:", formatted.length, "pageSize:", pageSize);

      const filledData = [...formatted];
      while (filledData.length < pageSize) {
        filledData.push({
          id: "",
          title: "",
          status: "",
          __isEmpty: true,
        });
      }

      setData(filledData);
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

  const columns: Column<EmptyRow>[] = [
    {
      key: "id",
      header: "Name",
      align: "left",
      render: (row) => (row.__isEmpty ? <div className="invisible">-</div> : row.id),
    },
    {
      key: "title",
      header: "Title",
      align: "left",
      render: (row) => (row.__isEmpty ? <div className="invisible">-</div> : row.title),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (row) =>
        row.__isEmpty ? (
          <div className="invisible">-</div>
        ) : (
          <span
            className={`font-medium ${
              row.status === "Active" ? "text-success" : "text-danger"
            }`}
          >
            {row.status}
          </span>
        )
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
        onAdd={openCreate}
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
    </div>
  );
};

export default TaxCategory;