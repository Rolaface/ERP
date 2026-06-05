import React, { useState, useEffect } from "react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import {
  ModalInput,
  ModalSelect,
} from "../../components/ui/modal/modalComponent";
import {
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useJournalEntryLogic } from "../../hooks/useJournalEntriesLogic";
import AccountSelect from "../selects/AccountSelect";

// IMPORT YOUR STORE
import { useModalStore } from "../../store/modalStore";
import Tooltip from "../Tooltip";
import DatePickerInput from "../calendar/DatePickerInput";
import {useUnsavedChanges} from "../../hooks/useUnsavedChanges";;

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  entryId?: string | null;
  isReadOnly?: boolean; 
  modalId: string;
}

const ITEMS_PER_PAGE = 6;

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modalId,
  entryId, // Coming from props (likely undefined if using global store)
  isReadOnly = false, // Defaults to false
}) => {
  // 1. PULL DATA FROM THE GLOBAL STORE
  const modalState = useModalStore((state) => state.getModalById(modalId));
  
  // 2. DETERMINE ACTUAL VALUES (Fallback to props if store data isn't present)
  const actualEntryId = (modalState?.initialData as string) || entryId;
  const actualIsReadOnly = modalState?.context?.isReadOnly || isReadOnly;
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const handleModalClose = () => handleCloseWithConfirm(onClose, modalId);

  const {
    form,
    entries,
    loading,
    errors,
    totals,
    accountOptions,
    fetchAccountOptions,
    partyTypeOptions,
    customerOptions,
    supplierOptions,
    currencyOptions,
    handleChange,
    handleEntryChange,
    handleAddRow,
    handleRemoveRow,
    handleSubmit,
    reset,
  } = useJournalEntryLogic(
  //   isOpen,
  //   () => {
  //     if (onSubmit) onSubmit({});
  //     onClose();
  //   },
  //   actualEntryId || undefined, 
  // );
  isOpen,
    () => {
      resetDirty();  
      if (onSubmit) onSubmit({});
      onClose();  
    },
    actualEntryId || undefined, 
  );

  // --- Pagination Logic ---
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [entries.length, currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEntries = entries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAddDoubleRow = () => {
    handleAddRow();
    const newTotalLength = entries.length + 2;
    setCurrentPage(Math.ceil(newTotalLength / ITEMS_PER_PAGE));
  };

  const footer = (
    <>
      <Button variant="secondary" type="button" onClick={onClose}>
        {actualIsReadOnly ? "Close" : "Cancel"}
      </Button>

      {/* Hide action buttons if in View Mode */}
      {!actualIsReadOnly && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              resetDirty();
              reset();
              setCurrentPage(1);
            }}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            type="button"
            loading={loading}
            onClick={handleSubmit}
          >
            {actualEntryId ? "Update Entry" : "Save Entry"}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        actualIsReadOnly
          ? `View Entry: ${actualEntryId}`
          : actualEntryId
            ? `Edit Entry: ${actualEntryId}`
            : "New Journal Entry"
      }
      subtitle={
        actualIsReadOnly
          ? "Viewing journal entry details"
          : actualEntryId
            ? "Update existing manual journal entry"
            : "Create a new manual journal entry"
      }
      icon={FileText}
      footer={footer}
      customWidth="80vw"
      height="80vh"
    >
{/* <div className="flex flex-col gap-6 py-3 px-1"> */}
<div className="flex flex-col gap-6 py-3 px-1" onChange={() => markDirty()}>
  {/* TOP SECTION */}
  <div className="grid grid-cols-4 gap-6 w-full items-start">
    
    {/* Posting Date: Always Row 1, Column 1 */}
    <div className="flex flex-col gap-1 w-full col-start-1 row-start-1">
      <ModalInput
        label="Posting Date"
        name="postingDate"
        type="date"
        value={form.postingDate}
        onChange={handleChange}
        required
        error={errors.postingDate}
        disabled={actualIsReadOnly}
      />
    </div>

    <div className="flex flex-col gap-1 w-full col-start-2 row-start-1">
      <ModalSelect
  label="Type"
  name="voucher_type"
  value={form.voucher_type || "Journal Entry"} 
  onChange={handleChange}
  required
  error={errors.voucher_type}
  placeholder="Select Type"
  disabled={actualIsReadOnly}
>
  <option value="Bank Entry">Bank Entry</option>      
  <option value="Journal Entry">Journal Entry</option>  
</ModalSelect>
    </div>
    {form.voucher_type === "Bank Entry" && (
      <>
        <div className="flex flex-col gap-1 w-full col-start-3 row-start-1">
          <ModalInput
            label="Reference Number"
            name="cheque_no"
            value={form.cheque_no}
            onChange={handleChange}
            placeholder="Enter reference number..."
            error={errors.cheque_no}
            disabled={actualIsReadOnly}
          />
        </div>
        
        <div className="flex flex-col gap-1 w-full col-start-4 row-start-1">
          <DatePickerInput
    label="Reference Date"
    name="cheque_date"
    value={form.cheque_date}
   onChange={(name, value) => {
    handleChange({
      target: { name, value, type: "date" },
    } as React.ChangeEvent<HTMLInputElement>);
  }}
    disabled={actualIsReadOnly}
    required
  />
        </div>
      </>
    )}

    <div 
      className={`flex flex-col gap-1 w-full ${
        form.voucher_type === "Journal Entry" 
          ? "col-start-3 row-start-1 col-span-1" 
          : "col-start-1 row-start-2 col-span-2"
      }`}
    >
      <ModalInput
        label="User Remarks"
        name="remarks"
        value={form.remarks}
        onChange={handleChange}
        placeholder="Enter remarks for this journal entry..."
        error={errors.remarks}
        disabled={actualIsReadOnly}
      />
    </div>

    {/* <div 
      className={`flex flex-col gap-1 justify-center min-w-max mt-7 ${
        form.voucher_type === "Journal Entry" 
          ? "col-start-4 row-start-1" 
          : "col-start-3 row-start-2"
      }`}
    >
      <label
        className={`flex items-center gap-2 w-fit ${
          actualIsReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          name="isOpening"
          checked={form.isOpening}
          onChange={handleChange}
          className="w-4 h-5 accent-primary"
          disabled={actualIsReadOnly}
        />
        <span className="text-sm font-medium text-main">
          Is Opening Entry
        </span>
      </label>
    </div> */}
<div 
      className={`flex flex-col gap-1 w-full ${
        form.voucher_type === "Journal Entry" 
          ? "col-start-4 row-start-1" 
          : "col-start-3 row-start-2"
      }`}
    >
      {/* Invisible label acts as a perfectly sized spacer */}
      <label className="text-sm invisible">Spacer</label>
      
      <div className="flex items-center h-full">
        <label
          className={`flex items-center gap-2 w-fit ${
            actualIsReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
        >
          <input
            type="checkbox"
            name="isOpening"
            checked={form.isOpening}
            onChange={handleChange}
            className="w-4 h-4 accent-primary" 
            disabled={actualIsReadOnly}
          />
          <span className="text-sm font-medium text-main">
            Is Opening Entry
          </span>
        </label>
      </div>
    </div>
  </div>
{/* </div> */}
        {/* MIDDLE SECTION */}
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-main">Entry Lines</h3>

            {/* Hide Add Rows button if in View Mode */}
            {!actualIsReadOnly && (
              <Button
                variant="secondary"
                type="button"
                onClick={handleAddDoubleRow}
                className="text-xs py-1 px-2 flex items-center gap-1"
              >
                <Plus size={14} /> Add Rows
              </Button>
            )}
          </div>

          <div className="w-full border border-gray-200 rounded-md">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm text-main whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 font-medium w-48">Account</th>
                    <th className="px-3 py-2 font-medium w-14">CCY</th>
                    <th className="px-3 py-2 font-medium w-20">Type</th>
                    <th className="px-3 py-2 font-medium w-28">Amount</th>
                    <th className="px-3 py-2 font-medium w-32">Party Type</th>
                    <th className="px-3 py-2 font-medium w-48">Party</th>
                    <th className="px-3 py-2 font-medium w-10">Exc. Rate</th>
                    <th className="px-3 py-2 font-medium">Remark</th>
                    {!actualIsReadOnly && (
                      <th className="px-3 py-2 font-medium w-10"></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((entry, index) => {
                    const actualIndex = startIndex + index;
                    const isDropdown =
                      entry.partyType === "Customer" ||
                      entry.partyType === "Supplier";

                    let rowPartyOptions = [{ label: "", value: "" }];

                    if (entry.partyType === "Customer") {
                      rowPartyOptions = [
                        ...customerOptions.map((opt) => ({
                          label: opt.label,
                          value: opt.value,
                        })),
                      ];
                    } else if (entry.partyType === "Supplier") {
                      rowPartyOptions = [
                        ...supplierOptions.map((opt) => ({
                          label: opt.label,
                          value: opt.value,
                        })),
                      ];
                    }

                    return (
                      <tr
                        key={actualIndex}
                        className="border-b border-gray-100 last:border-none"
                      >
                        <td className="px-2 py-1">
                          <div className="w-[280px]">
                          <AccountSelect
                            label=""
                            value={entry.account}
                            onChange={(accountObj) => {
                              handleEntryChange(
                                actualIndex,
                                "account",
                                accountObj.name,
                                {
                                  ccy: accountObj.currency,
                                  exchange_rate: accountObj.currency ? "1" : "",
                                },
                              );
                            }}
                            disabled={actualIsReadOnly}
                            className="w-full"
                          />
                          </div>
                        </td>

                        <td className="px-2 py-1">
                          <ModalInput
                            label=""
                            name={`ccy-${actualIndex}`}
                            value={entry.ccy}
                            onChange={() => {}}
                            disabled={true}
                            placeholder="CCY"
                            className="w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <ModalSelect
                            label=""
                            name={`type-${actualIndex}`}
                            value={entry.entryType}
                            onChange={(e) =>
                              handleEntryChange(
                                actualIndex,
                                "entryType",
                                e.target.value,
                              )
                            }
                            options={[
                              { label: "Dr", value: "Dr" },
                              { label: "Cr", value: "Cr" },
                            ]}
                            disabled={actualIsReadOnly}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput
                            label=""
                            name={`amount-${actualIndex}`}
                            type="number"
                            value={entry.amount}
                            onChange={(e) =>
                              handleEntryChange(
                                actualIndex,
                                "amount",
                                e.target.value,
                              )
                            }
                            disabled={actualIsReadOnly || entry.isRateMissing}
                            className="w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <ModalSelect
                            label=""
                            name={`partyType-${actualIndex}`}
                            value={entry.partyType}
                            onChange={(e) =>
                              handleEntryChange(
                                actualIndex,
                                "partyType",
                                e.target.value,
                              )
                            }
                            options={[...partyTypeOptions]}
                            disabled={actualIsReadOnly}
                          />
                        </td>
                        <td className="px-2 py-1">
                          {isDropdown ? (
                            <ModalSelect
                              label=""
                              name={`party-${actualIndex}`}
                              value={entry.party}
                              onChange={(e) =>
                                handleEntryChange(
                                  actualIndex,
                                  "party",
                                  e.target.value,
                                )
                              }
                              options={rowPartyOptions}
                              disabled={actualIsReadOnly}
                            />
                          ) : (
                            <ModalInput
                              label=""
                              name={`party-${actualIndex}`}
                              value={entry.party}
                              onChange={(e) =>
                                handleEntryChange(
                                  actualIndex,
                                  "party",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter Party Name"
                              disabled={actualIsReadOnly}
                            />
                          )}
                        </td>

                        <td className="px-2 py-1">
                          <ModalInput
                            label=""
                            name={`exchangeRate-${actualIndex}`}
                            type="number"
                            value={entry.exchange_rate}
                            onChange={() => {}}
                            disabled={true}
                            className="w-full bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput
                            label=""
                            name={`remark-${actualIndex}`}
                            value={entry.remark}
                            onChange={(e) =>
                              handleEntryChange(
                                actualIndex,
                                "remark",
                                e.target.value,
                              )
                            }
                            disabled={actualIsReadOnly}
                          />
                        </td>

                        {/* Hide Trash Button if in View Mode */}
                        {!actualIsReadOnly && (
                          <td className="px-2 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(actualIndex)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {entries.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50/50 rounded-b-md">
                <span className="text-xs text-muted">
                  Showing{" "}
                  <span className="font-medium text-main">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-main">
                    {Math.min(startIndex + ITEMS_PER_PAGE, entries.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-main">
                    {entries.length}
                  </span>{" "}
                  entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-main"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-main">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-main"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end items-center gap-12 bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider">
              Total Debit (Base)
            </span>
            <span className="text-lg font-bold text-main">
              {totals.debit.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider">
              Total Credit (Base)
            </span>
            <span className="text-lg font-bold text-main">
              {totals.credit.toFixed(2)}
            </span>
          </div>

          <div className="h-10 border-l border-gray-300"></div>

          <div className="flex flex-col text-right min-w-[120px]">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider">
              Net Balance
            </span>
            <span
              className={`text-lg font-bold ${
                Math.abs(totals.debit - totals.credit) > 0.001
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {Math.abs(totals.debit - totals.credit).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default JournalEntryModal;