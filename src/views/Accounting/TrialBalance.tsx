import React from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import {
  FaDownload,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

type TrialBalanceAccount = {
  code: string;
  name: string;
  debit: number;
  credit: number;
};

type Props = {
  trialBalance: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  reportMonth: string;
  reportYear: string;
  setReportMonth: (month: string) => void;
  setReportYear: (year: string) => void;
  monthNames: { [key: string]: string };
};

const nf = (v: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(
    Math.round(v),
  );

const TrialBalance: React.FC<Props> = ({
  trialBalance,
  totalDebit,
  totalCredit,
  reportMonth,
  reportYear,
  setReportMonth,
  setReportYear,
  monthNames,
}) => {
  const balanced = totalDebit === totalCredit;

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns: Column<TrialBalanceAccount>[] = [
    {
      key: "code",
      header: "Account Code",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Account Name",
    },
    {
      key: "debit",
      header: "Debit",
      align: "right",
      render: (row) => (row.debit > 0 ? nf(row.debit) : "—"),
    },
    {
      key: "credit",
      header: "Credit",
      align: "right",
      render: (row) => (row.credit > 0 ? nf(row.credit) : "—"),
    },
  ];

  return (
    <div className="p-6 bg-app">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-main">Trial Balance</h2>
            <p className="text-sm text-muted">
              {monthNames[reportMonth]} {reportYear} — amounts in USD
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 items-center bg-card rounded-lg border border-theme p-2">
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="px-3 py-2 bg-card rounded-md text-sm focus:outline-none border border-theme"
              >
                {Object.entries(monthNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="px-3 py-2 bg-card rounded-md text-sm focus:outline-none border border-theme"
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm">
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Table */}
              <div className="flex-1">
                <Table<TrialBalanceAccount>
                  columns={columns}
                  data={trialBalance}
                  emptyMessage="No trial balance data for the selected period."
                  showToolbar={false}
                />

                {/* Totals Row */}
                <div className="mt-2 bg-app border border-theme rounded-lg">
                  <div className="grid grid-cols-4 text-xs font-bold">
                    <div className="col-span-2 px-6 py-3">Total</div>
                    <div className="px-6 py-3 text-right">{nf(totalDebit)}</div>
                    <div className="px-6 py-3 text-right">
                      {nf(totalCredit)}
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-4 items-center text-xs font-bold ${
                      balanced ? "bg-success/10" : "bg-danger/10"
                    }`}
                  >
                    <div className="col-span-2 px-6 py-3 flex items-center gap-3">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${
                          balanced
                            ? "bg-success text-white"
                            : "bg-danger text-white"
                        }`}
                      >
                        {balanced ? (
                          <FaCheckCircle />
                        ) : (
                          <FaExclamationTriangle />
                        )}
                      </span>
                      {balanced ? "Balanced" : "Out of Balance"}
                    </div>
                    <div className="col-span-2 px-6 py-3 text-right">
                      {nf(Math.abs(totalDebit - totalCredit))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side summary */}
              <aside className="w-full lg:w-60">
                <div className="bg-primary text-white rounded-lg p-3 shadow-md text-sm">
                  <div className="text-xs opacity-80">Totals</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Debit</span>
                      <span className="font-bold">{nf(totalDebit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credit</span>
                      <span className="font-bold">{nf(totalCredit)}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded-md bg-white/10 text-xs">
                    <div>Status</div>
                    <div className="mt-1 font-semibold flex justify-between">
                      <span>{balanced ? "Balanced" : "Difference"}</span>
                      <span>{nf(Math.abs(totalDebit - totalCredit))}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-card rounded-lg border border-theme p-2 shadow-sm text-xs">
                  <div className="text-muted">Actions</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <button className="px-3 py-1.5 rounded-md bg-app border border-theme">
                      Download CSV
                    </button>
                    <button className="px-3 py-1.5 rounded-md bg-card border border-theme">
                      Print
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;
