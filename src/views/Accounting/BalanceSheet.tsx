import React from "react";
import { FaDownload, FaFileAlt, FaPrint } from "react-icons/fa";

// Define types for account and for the props
type Account = {
  code: string;
  name: string;
  type: string;
  balance: number;
  parent: string;
  status: string;
  category?: string;
};

type BalanceSheetData = {
  assets: number;
  liabilities: number;
  equity: number;
  currentAssets: number;
  fixedAssets: number;
  currentLiabilities: number;
  longTermLiabilities: number;
  activeAccounts: Account[];
};

type ProfitLossData = {
  netIncome: number;
};

type Props = {
  balanceSheet: BalanceSheetData;
  reportYear: string;
  setReportYear: (val: string) => void;
  monthNames: { [key: string]: string };
  profitLoss: ProfitLossData;
};

const BalanceSheet: React.FC<Props> = ({
  balanceSheet,
  reportYear,
  setReportYear,
  monthNames,
  profitLoss,
}) => {
  const handleExport = (type: string) => {
    console.warn(`Exporting as ${type}`);
    // Add export logic here
  };

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Report Header with Controls */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                As of November {reportYear}
              </h3>
              <p className="text-sm text-gray-600 mt-1">All amounts in USD</p>
            </div>

            <div className="flex gap-3">
              <select
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="px-4 py-2 bg-white rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>

              {/* Export Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FaDownload className="w-4 h-4" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 rounded-t-lg"
                  >
                    <FaFileAlt className="w-4 h-4" />
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <FaFileAlt className="w-4 h-4" />
                    Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport("print")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 border-t rounded-b-lg"
                  >
                    <FaPrint className="w-4 h-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* ASSETS SECTION */}
            <div className="h-full flex flex-col">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <h4 className="text-xl font-bold text-emerald-900">ASSETS</h4>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Current Assets */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-emerald-100">
                      <p className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                        Current Assets
                      </p>
                      <div className="space-y-2.5">
                        {balanceSheet.activeAccounts
                          .filter((a: Account) => a.parent === "Current Assets")
                          .map((acc: Account, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600">{acc.name}</span>
                              <span className="text-gray-900 font-medium">
                                ${acc.balance.toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-700 mt-4 pt-3 border-t-2 border-emerald-200">
                        <span>Total Current Assets</span>
                        <span>
                          ${balanceSheet.currentAssets.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Fixed Assets */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-emerald-100">
                      <p className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                        Fixed Assets
                      </p>
                      <div className="space-y-2.5">
                        {balanceSheet.activeAccounts
                          .filter((a: Account) => a.parent === "Fixed Assets")
                          .map((acc: Account, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600">{acc.name}</span>
                              <span className="text-gray-900 font-medium">
                                ${acc.balance.toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-700 mt-4 pt-3 border-t-2 border-emerald-200">
                        <span>Total Fixed Assets</span>
                        <span>
                          ${balanceSheet.fixedAssets.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total Assets */}
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg p-5 mt-4 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold">TOTAL ASSETS</span>
                      <span className="text-xl font-bold">
                        ${balanceSheet.assets.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY SECTION */}
            <div className="h-full flex flex-col">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">L</span>
                  </div>
                  <h4 className="text-xl font-bold text-blue-900">
                    LIABILITIES & EQUITY
                  </h4>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Current Liabilities */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                      <p className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                        Current Liabilities
                      </p>
                      <div className="space-y-2.5">
                        {balanceSheet.activeAccounts
                          .filter(
                            (a: Account) => a.parent === "Current Liabilities",
                          )
                          .map((acc: Account, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600">{acc.name}</span>
                              <span className="text-gray-900 font-medium">
                                ${acc.balance.toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-red-600 mt-4 pt-3 border-t-2 border-red-200">
                        <span>Total Current Liabilities</span>
                        <span>
                          ${balanceSheet.currentLiabilities.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Long-term Liabilities */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                      <p className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                        Long-term Liabilities
                      </p>
                      <div className="space-y-2.5">
                        {balanceSheet.activeAccounts
                          .filter(
                            (a: Account) =>
                              a.parent === "Long-term Liabilities",
                          )
                          .map((acc: Account, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600">{acc.name}</span>
                              <span className="text-gray-900 font-medium">
                                ${acc.balance.toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-red-600 mt-4 pt-3 border-t-2 border-red-200">
                        <span>Total Long-term Liabilities</span>
                        <span>
                          ${balanceSheet.longTermLiabilities.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Total Liabilities */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 shadow-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">
                          TOTAL LIABILITIES
                        </span>
                        <span className="text-lg font-bold">
                          ${balanceSheet.liabilities.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Equity */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                      <p className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                        Equity
                      </p>
                      <div className="space-y-2.5">
                        {balanceSheet.activeAccounts
                          .filter((a: Account) => a.type === "Equity")
                          .map((acc: Account, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600">{acc.name}</span>
                              <span className="text-gray-900 font-medium">
                                ${acc.balance.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Net Income</span>
                          <span className="text-gray-900 font-medium">
                            ${profitLoss.netIncome.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-purple-600 mt-4 pt-3 border-t-2 border-purple-200">
                        <span>Total Equity</span>
                        <span>
                          $
                          {(
                            balanceSheet.equity + profitLoss.netIncome
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total Liabilities & Equity */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-5 mt-4 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold">
                        TOTAL LIABILITIES & EQUITY
                      </span>
                      <span className="text-xl font-bold">
                        $
                        {(
                          balanceSheet.liabilities +
                          balanceSheet.equity +
                          profitLoss.netIncome
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Check Status */}
          <div
            className={`mt-8 p-5 rounded-xl border-2 ${
              balanceSheet.assets ===
              balanceSheet.liabilities +
                balanceSheet.equity +
                profitLoss.netIncome
                ? "bg-emerald-50 border-emerald-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    balanceSheet.assets ===
                    balanceSheet.liabilities +
                      balanceSheet.equity +
                      profitLoss.netIncome
                      ? "bg-emerald-600"
                      : "bg-red-600"
                  }`}
                >
                  <span className="text-white font-bold text-xl">
                    {balanceSheet.assets ===
                    balanceSheet.liabilities +
                      balanceSheet.equity +
                      profitLoss.netIncome
                      ? "✓"
                      : "!"}
                  </span>
                </div>
                <div>
                  <p
                    className={`font-bold text-base ${
                      balanceSheet.assets ===
                      balanceSheet.liabilities +
                        balanceSheet.equity +
                        profitLoss.netIncome
                        ? "text-emerald-800"
                        : "text-red-800"
                    }`}
                  >
                    {balanceSheet.assets ===
                    balanceSheet.liabilities +
                      balanceSheet.equity +
                      profitLoss.netIncome
                      ? "Balance Sheet is Balanced"
                      : "Balance Sheet is Out of Balance"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {balanceSheet.assets ===
                    balanceSheet.liabilities +
                      balanceSheet.equity +
                      profitLoss.netIncome
                      ? "Assets equal Liabilities + Equity"
                      : `Difference: $${Math.abs(balanceSheet.assets - (balanceSheet.liabilities + balanceSheet.equity + profitLoss.netIncome)).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Assets</p>
                <p className="text-lg font-bold text-gray-800">
                  ${balanceSheet.assets.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
