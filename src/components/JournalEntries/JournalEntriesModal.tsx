import React, { useState, useEffect } from "react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import {
  ModalInput,
} from "../../components/ui/modal/modalComponent";
import { FileText, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

// Assuming you will create a hook similar to useCoaLogic for this modal's state
import { useJournalEntryLogic } from "../../hooks/useJournalEntriesLogic";

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ITEMS_PER_PAGE = 4;

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    form,
    entries, // Array of table row objects
    loading,
    errors,
    totals, // { debit: number, credit: number }
    handleChange,
    handleEntryChange,
    handleAddRow,
    handleRemoveRow,
    handleSubmit,
    reset,
  } = useJournalEntryLogic(() => {
    onSuccess();
    onClose();
  });

  // --- Pagination State & Logic ---
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);

  // Safety check: if rows are deleted and the current page becomes empty, go back a page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [entries.length, currentPage, totalPages]);

  // Calculate which entries to show on the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEntries = entries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Custom handler to add 2 rows at once and jump to the newest page
  const handleAddDoubleRow = () => {
    handleAddRow();
    handleAddRow();
    const newTotalLength = entries.length + 2;
    setCurrentPage(Math.ceil(newTotalLength / ITEMS_PER_PAGE));
  };
  // --------------------------------

  const footer = (
    <>
      <Button variant="secondary" type="button" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" type="button" onClick={() => { reset(); setCurrentPage(1); }}>
          Reset
        </Button>
        <Button
          variant="primary"
          type="button"
          loading={loading}
          onClick={handleSubmit}
        >
          Save Entry
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Journal Entry"
      subtitle="Create a new manual journal entry"
      icon={FileText}
      footer={footer}
      customWidth="70vw" 
      height="650px"
    >
      <div className="flex flex-col gap-6 py-3 px-1">
        
        {/* TOP SECTION: Meta Fields */}
        <div className="flex flex-row items-start gap-6 w-full">
          {/* Posting Date */}
          <div className="flex flex-col gap-1 w-1/4 min-w-[150px]">
            <ModalInput
              label="Posting Date"
              name="postingDate"
              type="date"
              value={form.postingDate}
              onChange={handleChange}
              required
              error={errors.postingDate}
            />
          </div>

          {/* User Remarks */}
          <div className="flex flex-col gap-1 flex-1">
            <ModalInput
              label="User Remarks"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Enter remarks for this journal entry..."
              error={errors.remarks}
            />
          </div>

          {/* Is Opening Checkbox */}
          <div className="flex flex-col gap-1 justify-center mt-7 min-w-max">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                name="isOpening"
                checked={form.isOpening}
                onChange={handleChange}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-main">Is Opening Entry</span>
            </label>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Check if for opening balances.
            </p>
          </div>
        </div>

        {/* MIDDLE SECTION: Line Items Table */}
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-main">Entry Lines</h3>
            <Button variant="secondary" type="button" onClick={handleAddDoubleRow} className="text-xs py-1 px-2 flex items-center gap-1">
              <Plus size={14} /> Add Row
            </Button>
          </div>
          
          <div className="w-full border border-gray-200 rounded-md">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm text-main whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 font-medium">Account</th>
                    <th className="px-3 py-2 font-medium w-24">CCY</th>
                    <th className="px-3 py-2 font-medium w-32">Amount</th>
                    <th className="px-3 py-2 font-medium w-32">Party Type</th>
                    <th className="px-3 py-2 font-medium">Party</th>
                    <th className="px-3 py-2 font-medium w-24">Exc. Rate</th>
                    <th className="px-3 py-2 font-medium">Remark</th>
                    <th className="px-3 py-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((entry, index) => {
                    // Calculate the true index of the item in the master array
                    const actualIndex = startIndex + index;
                    
                    return (
                      <tr key={actualIndex} className="border-b border-gray-100 last:border-none">
                        <td className="px-2 py-1">
                          <ModalInput label="" name={`account-${actualIndex}`} value={entry.account} onChange={(e) => handleEntryChange(actualIndex, 'account', e.target.value)} />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput label="" name={`ccy-${actualIndex}`} value={entry.ccy} onChange={(e) => handleEntryChange(actualIndex, 'ccy', e.target.value)} />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput label="" name={`amount-${actualIndex}`} type="number" value={entry.amount} onChange={(e) => handleEntryChange(actualIndex, 'amount', e.target.value)} />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput label="" name={`partyType-${actualIndex}`} value={entry.partyType} onChange={(e) => handleEntryChange(actualIndex, 'partyType', e.target.value)} />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput label="" name={`party-${actualIndex}`} value={entry.party} onChange={(e) => handleEntryChange(actualIndex, 'party', e.target.value)} />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput label="" name={`exchangeRate-${actualIndex}`} type="number" value={entry.exchangeRate} onChange={(e) => handleEntryChange(actualIndex, 'exchangeRate', e.target.value)} />
                        </td>
                        <td className="px-2 py-1">
                          <ModalInput label="" name={`remark-${actualIndex}`} value={entry.remark} onChange={(e) => handleEntryChange(actualIndex, 'remark', e.target.value)} />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button type="button" onClick={() => handleRemoveRow(actualIndex)} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {entries.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50/50 rounded-b-md">
                <span className="text-xs text-muted">
                  Showing <span className="font-medium text-main">{startIndex + 1}</span> to <span className="font-medium text-main">{Math.min(startIndex + ITEMS_PER_PAGE, entries.length)}</span> of <span className="font-medium text-main">{entries.length}</span> entries
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => p - 1)}
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
                    onClick={() => setCurrentPage(p => p + 1)}
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

        {/* BOTTOM SECTION: Totals */}
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider">Total Debit</span>
            <span className="text-lg font-bold text-main">{totals.debit.toFixed(2)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider">Total Credit</span>
            <span className="text-lg font-bold text-main">{totals.credit.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default JournalEntryModal;