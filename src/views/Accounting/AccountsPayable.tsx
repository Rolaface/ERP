import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaClock,
} from "react-icons/fa";

import { getAllPayables } from "../../api/Accounting/AccountApi";

type PayableRecord = {
  report_date: string;
  supplier: string;
  party_type: string;
  payable_account: string;
  voucher_type: string;
  voucher_no: string;
  due_date: string | null;
  bill_no: string | null;
  bill_date: string | null;
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
  overdue_amount: number;
  average_payment_days: number;
};

type Payable = {
  id: string;
  billNo: string;
  vendor: string;
  voucherType: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  due: string;
  status: string;
  days: number;
  priority: string;
  actions?: string;
};

const AccountsPayable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [payables, setPayables] = useState<Payable[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response: any = await getAllPayables({ page: 1, page_size: 100 });

        if (response?.message?.data) {
          const { data: backendData, kpis: backendKpis } =
            response.message.data;

          setKpis(backendKpis);

          const mappedPayables: Payable[] = backendData.map(
            (row: PayableRecord) => {
              const today = new Date();
              let daysLeft = 0;
              let dueDisplay = "N/A";

              if (row.due_date) {
                const dueDate = new Date(row.due_date);
                const timeDiff = dueDate.getTime() - today.getTime();
                daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                dueDisplay = row.due_date;
              } else {
                daysLeft = -row.age;
                dueDisplay = `Reported: ${row.report_date}`;
              }

              let status = "Pending";
              if (row.amounts.outstanding <= 0) status = "Paid";
              else if (daysLeft < 0) status = "Overdue";

              let priority = "low";
              if (daysLeft < 0) priority = "high";
              else if (daysLeft <= 7) priority = "medium";

              return {
                id: row.voucher_no || "N/A",
                billNo: row.bill_no || "-",
                vendor: row.supplier || "Unknown Vendor",
                voucherType: row.voucher_type || "-",
                invoicedAmount: row.amounts.invoiced || 0,
                paidAmount: row.amounts.paid || 0,
                outstandingAmount: row.amounts.outstanding || 0,
                due: dueDisplay,
                status,
                days: daysLeft,
                priority,
              };
            },
          );

          setPayables(mappedPayables);
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
      label: "Total Payables (Outstanding)",
      value: `₹${(kpis?.total_outstanding || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      label: "Overdue Amount",
      value: `₹${(kpis?.overdue_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      label: "Avg Payment Days",
      value: `${kpis?.average_payment_days || 0} days`,
    },
    {
      label: "Total Invoiced",
      value: `₹${(kpis?.total_invoiced || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
  ];

  const filteredPayables = payables.filter((payable) => {
    const matchesSearch =
      payable.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.billNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || payable.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const scheduleData = {
    thisWeek: { label: "This Week", amount: 0, count: 0 },
    week2: { label: "Week 2", amount: 0, count: 0 },
    week3: { label: "Week 3", amount: 0, count: 0 },
    week4Plus: { label: "Week 4+", amount: 0, count: 0 },
  };

  payables.forEach((payable) => {
    if (
      payable.status.toLowerCase() !== "paid" &&
      payable.status.toLowerCase() !== "overdue"
    ) {
      if (payable.days <= 7) {
        scheduleData.thisWeek.amount += payable.outstandingAmount;
        scheduleData.thisWeek.count += 1;
      } else if (payable.days <= 14) {
        scheduleData.week2.amount += payable.outstandingAmount;
        scheduleData.week2.count += 1;
      } else if (payable.days <= 21) {
        scheduleData.week3.amount += payable.outstandingAmount;
        scheduleData.week3.count += 1;
      } else {
        scheduleData.week4Plus.amount += payable.outstandingAmount;
        scheduleData.week4Plus.count += 1;
      }
    }
  });

  const paymentSchedule = [
    scheduleData.thisWeek,
    scheduleData.week2,
    scheduleData.week3,
    scheduleData.week4Plus,
  ];

  const columns: Column<Payable>[] = [
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
      key: "billNo",
      header: "Bill No",
      render: (row) => <span className="text-xs text-muted">{row.billNo}</span>,
    },
    {
      key: "vendor",
      header: "Supplier",
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
      header: "Days Left",
      render: (row) => (
        <div className="flex items-center gap-1">
          <FaClock className="text-muted text-xs" />
          <span
            className={`text-xs font-medium ${
              row.days < 0
                ? "text-danger"
                : row.days <= 7
                  ? "text-warning"
                  : "text-muted"
            }`}
          >
            {row.days < 0
              ? `${Math.abs(row.days)} days overdue`
              : `${row.days} days`}
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
              placeholder="Search payables or suppliers..."
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
            <FaPlus /> New Payable
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-theme p-8 rounded-lg flex justify-center items-center">
          <p className="text-muted text-sm font-medium animate-pulse">
            Loading Payables Data...
          </p>
        </div>
      ) : (
        <Table<Payable>
          columns={columns}
          data={filteredPayables}
          emptyMessage="No payables found matching your criteria."
          showToolbar={false}
        />
      )}

      <div className="bg-card rounded-lg border border-theme p-6">
        <h3 className="text-lg font-semibold text-main mb-4">
          Payment Schedule - Next 30 Days
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {paymentSchedule.map((schedule) => (
            <div
              key={schedule.label}
              className="text-center p-4 bg-app rounded-lg border border-theme"
            >
              <p className="text-xs text-muted mb-1">{schedule.label}</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-theme rounded mx-auto mt-1 animate-pulse"></div>
              ) : (
                <p className="text-xl font-bold text-main">
                  ₹
                  {schedule.amount.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              )}
              <p className="text-xs text-muted mt-1">
                {isLoading ? "—" : schedule.count} payables
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountsPayable;
