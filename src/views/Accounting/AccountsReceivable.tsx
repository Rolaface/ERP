import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEdit,
  FaTrash,
  FaEye,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

import { getAllReceivables } from "../../api/Accounting/AccountApi";

type ReceivableRecord = {
  posting_date: string;
  customer: string;
  party_type: string;
  receivable_account: string;
  voucher_type: string;
  voucher_no: string;
  due_date: string | null;
  po_no: string | null;
  cost_center: string | null;
  currency: string;
  amounts: {
    invoiced: number;
    paid: number;
    credit_note: number;
    outstanding: number;
  };
  age: number;
};

type KPIs = {
  total_outstanding: number;
  total_invoiced: number;
  total_paid: number;
  total_customers: number;
  overdue_amount: number;
  ageing_summary: {
    "0_30": number;
    "31_60": number;
    "61_90": number;
    "91_120": number;
    "121_above": number;
  };
};

type Receivable = {
  id: string;
  customer: string;
  voucherType: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  due: string;
  status: string;
  days: number;
  overdue: boolean;
  actions?: string;
};

const AccountsReceivable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response: any = await getAllReceivables({
          page: 1,
          page_size: 100,
        });

        if (response?.message?.data) {
          const payload = response.message.data;
          const backendKpis = payload.kpis;

          const backendData = payload.rows || payload.data || [];

          setKpis(backendKpis);

          const mappedReceivables: Receivable[] = backendData.map(
            (row: ReceivableRecord) => {
              const today = new Date();
              let daysLeft = 0;
              let dueDisplay = "N/A";

              if (row.due_date) {
                const dueDate = new Date(row.due_date);
                const timeDiff = dueDate.getTime() - today.getTime();
                daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                dueDisplay = row.due_date;
              } else {
                daysLeft = -(row.age || 0);
                dueDisplay = `Posted: ${row.posting_date}`;
              }

              let status = "Pending";
              if (row.amounts.outstanding <= 0) status = "Paid";
              else if (daysLeft < 0) status = "Overdue";

              return {
                id: row.voucher_no || "N/A",
                customer: row.customer,
                voucherType: row.voucher_type || "-",
                invoicedAmount: row.amounts?.invoiced || 0,
                paidAmount: row.amounts?.paid || 0,
                outstandingAmount: row.amounts?.outstanding || 0,
                due: dueDisplay,
                status,
                days: daysLeft,
                overdue: daysLeft < 0,
              };
            },
          );

          setReceivables(mappedReceivables);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      label: "Total Outstanding",
      value: `₹${(kpis?.total_outstanding || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      label: "Overdue Amount",
      value: `₹${(kpis?.overdue_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      label: "Total Customers",
      value: `${kpis?.total_customers || 0}`,
    },
    {
      label: "Total Invoiced",
      value: `₹${(kpis?.total_invoiced || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
  ];

  const filteredReceivables = receivables.filter((rec) => {
    const matchesSearch =
      rec.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || rec.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const ageingLabels = [
    { label: "0-30 Days", key: "0_30" },
    { label: "31-60 Days", key: "31_60" },
    { label: "61-90 Days", key: "61_90" },
    { label: "91-120 Days", key: "91_120" },
    { label: "121+ Days", key: "121_above" },
  ];

  const columns: Column<Receivable>[] = [
    {
      key: "id",
      header: "Voucher No",
      render: (row) => (
        <span className="font-mono text-primary text-xs font-semibold">
          {row.id}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
    },
    {
      key: "voucherType",
      header: "Type",
      render: (row) => <span className="text-xs">{row.voucherType}</span>,
    },
    {
      key: "invoicedAmount",
      header: "Invoiced",
      render: (row) =>
        `₹${row.invoicedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      key: "paidAmount",
      header: "Paid",
      render: (row) =>
        `₹${row.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      key: "outstandingAmount",
      header: "Outstanding",
      render: (row) => (
        <span className="font-semibold text-main">
          {`₹${row.outstandingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        </span>
      ),
    },
    {
      key: "due",
      header: "Due/Posted Date",
    },
    {
      key: "days",
      header: "Aging",
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.overdue ? (
            <FaExclamationTriangle className="text-danger text-xs" />
          ) : (
            <FaClock className="text-muted text-xs" />
          )}
          <span
            className={`text-xs font-medium ${
              row.overdue ? "text-danger" : "text-muted"
            }`}
          >
            {Math.abs(row.days)} days {row.overdue ? "overdue" : "left"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const s = row.status.toLowerCase();
        return (
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold ${
              s === "paid"
                ? "bg-success text-success"
                : s === "overdue"
                  ? "bg-danger text-white"
                  : s === "pending"
                    ? "bg-warning text-warning"
                    : "bg-primary text-white"
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: () => (
        <div className="flex justify-center gap-2">
          <button className="text-primary hover:opacity-80 transition-opacity">
            <FaEye />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-app p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-lg border border-theme p-4">
            <p className="text-xs text-muted">{s.label}</p>
            {isLoading ? (
              <div className="h-7 w-24 bg-theme rounded mt-1 animate-pulse"></div>
            ) : (
              <p className="text-xl font-bold text-main mt-1">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-theme p-4 flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search receivables or customers..."
              className="pl-9 pr-3 py-2 filter-input-refined bg-app border border-theme rounded-lg text-sm text-main"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-4 py-2 border border-theme rounded-lg bg-card text-main flex items-center gap-2 capitalize text-sm"
            >
              <FaFilter /> {filterStatus}
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full mt-2 bg-card border border-theme rounded-lg z-20 overflow-hidden min-w-[120px]">
                {["all", "pending", "overdue", "paid"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setFilterStatus(s);
                      setShowFilterDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-app transition-colors capitalize text-sm text-main"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-app border border-theme rounded-lg flex gap-2 items-center text-main text-sm hover:opacity-80 transition-opacity">
            <FaDownload /> Export
          </button>
          <button className="px-4 py-2 bg-primary rounded-lg text-white flex gap-2 items-center text-sm hover:opacity-90 transition-opacity">
            <FaPlus /> New Receivable
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-theme p-8 rounded-lg flex justify-center items-center">
          <p className="text-muted text-sm font-medium animate-pulse">
            Loading Receivables Data...
          </p>
        </div>
      ) : (
        <Table<Receivable>
          columns={columns}
          data={filteredReceivables}
          emptyMessage="No receivables found matching your criteria."
          showToolbar={false}
        />
      )}

      <div className="bg-card rounded-lg border border-theme p-6">
        <h3 className="text-lg font-semibold text-main mb-4">
          Aging Report Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {ageingLabels.map((item) => (
            <div
              key={item.label}
              className="text-center p-4 bg-app rounded-lg border border-theme"
            >
              <p className="text-xs text-muted mb-1">{item.label}</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-theme rounded mx-auto mt-1 animate-pulse"></div>
              ) : (
                <p className="text-xl font-bold text-main">
                  ₹
                  {kpis?.ageing_summary[
                    item.key as keyof typeof kpis.ageing_summary
                  ]
                    ? kpis.ageing_summary[
                        item.key as keyof typeof kpis.ageing_summary
                      ].toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : "0"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountsReceivable;
