import React, { useState, useRef } from "react";
import Modal from "../ui/modal/modal";
import { Button, Input, Select, Card } from "../ui/modal/formComponent";
import { Building2, CalendarDays } from "lucide-react";
import type { BankAccount } from "../../types/company";
import { showApiError } from "../../utils/alert";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newAccount: BankAccount) => void;
}

// ================= DATE HELPERS =================
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** JS Date → "03-Mar-2022" */
const dateToDisplay = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mmm = MONTHS[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
};

/** "03-Mar-2022" → ISO "2022-03-03" */
const displayToIso = (display: string): string => {
  const match = display.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return "";
  const monthIdx = MONTHS.findIndex(
    (m) => m.toLowerCase() === match[2].toLowerCase()
  );
  if (monthIdx === -1) return "";
  return `${match[3]}-${String(monthIdx + 1).padStart(2, "0")}-${match[1]}`;
};

/** ISO "2022-03-03" → "03-Mar-2022" */
const isoToDisplay = (iso: string): string => {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.split("-");
  const monthIdx = parseInt(mm, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return "";
  return `${dd}-${MONTHS[monthIdx]}-${yyyy}`;
};

/**
 * Normalise free-typed input → "DD-MMM-YYYY"
 * Accepts: 03/03/2022 | 03-03-2022 | 03.03.2022 | 03032022 | 03-mar-2022
 */
const parseAndFormat = (raw: string): string => {
  const trimmed = raw.trim();

  // Already has month name: DD[-/.]MMM[-/.]YYYY
  const namedFull = trimmed.match(/^(\d{1,2})[-\/\.]([A-Za-z]{3})[-\/\.](\d{4})$/);
  if (namedFull) {
    const dd = namedFull[1].padStart(2, "0");
    const mmm = namedFull[2].charAt(0).toUpperCase() + namedFull[2].slice(1).toLowerCase();
    if (MONTHS.includes(mmm)) return `${dd}-${mmm}-${namedFull[3]}`;
  }

  // Numeric separators: DD/MM/YYYY
  const numSep = trimmed.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/);
  if (numSep) {
    const dd = numSep[1].padStart(2, "0");
    const monthNum = parseInt(numSep[2], 10);
    if (monthNum >= 1 && monthNum <= 12)
      return `${dd}-${MONTHS[monthNum - 1]}-${numSep[3]}`;
  }

  // 8 raw digits: DDMMYYYY
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 8) {
    const dd = digits.slice(0, 2);
    const monthNum = parseInt(digits.slice(2, 4), 10);
    const yyyy = digits.slice(4);
    if (monthNum >= 1 && monthNum <= 12)
      return `${dd}-${MONTHS[monthNum - 1]}-${yyyy}`;
  }

  return trimmed; // couldn't parse – return as-is
};

// ================= CUSTOM DATE INPUT COMPONENT =================
interface DateInputProps {
  label: string;
  value: string;           // display value "DD-MMM-YYYY"
  onChange: (display: string, iso: string) => void;
  required?: boolean;
}

const DateInput: React.FC<DateInputProps> = ({ label, value, onChange, required }) => {
  const hiddenRef = useRef<HTMLInputElement>(null);

  /** Live update while user is typing */
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, "");
  };

  /** On blur: auto-format whatever was typed */
  const handleTextBlur = () => {
    const formatted = parseAndFormat(value);
    const iso = displayToIso(formatted);
    onChange(formatted, iso);
  };

  /** Calendar picker selected a date */
  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (!iso) return;
    const display = isoToDisplay(iso);
    onChange(display, iso);
  };

  /** Click the calendar icon → open native date picker */
  const openCalendar = () => {
    hiddenRef.current?.showPicker?.();
  };

  const isoValue = displayToIso(value) || "";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative flex items-center">
        {/* Visible text input */}
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          placeholder="DD-MMM-YYYY"
          required={required}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     placeholder:text-gray-400 bg-white"
        />

        {/* Calendar icon — clicks the hidden date input */}
        <button
          type="button"
          onClick={openCalendar}
          className="absolute right-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
          tabIndex={-1}
          title="Pick from calendar"
        >
          <CalendarDays className="w-5 h-5" />
        </button>

        {/* Hidden native date picker — positioned over the icon so showPicker works */}
        <input
          ref={hiddenRef}
          type="date"
          value={isoValue}
          onChange={handleCalendarChange}
          className="absolute right-0 bottom-0 w-8 h-8 opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================
const AddBankAccountModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {

  const todayDisplay = dateToDisplay(new Date());
  const todayIso = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<BankAccount>({
    accountNo: "",
    accountHolderName: "",
    sortCode: "",
    swiftCode: "",
    bankName: "",
    branchAddress: "",
    currency: "",
    dateAdded: todayIso,
    openingBalance: 0.0,
  });

  const [dateDisplay, setDateDisplay] = useState<string>(todayDisplay);

  // ================= CHANGE =================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (display: string, iso: string) => {
    setDateDisplay(display);
    if (iso) setForm((prev) => ({ ...prev, dateAdded: iso }));
  };

  // ================= RESET =================
  const handleReset = () => {
    setForm({
      accountNo: "",
      accountHolderName: "",
      sortCode: "",
      swiftCode: "",
      bankName: "",
      branchAddress: "",
      currency: "",
      dateAdded: todayIso,
      openingBalance: 0.0,
    });
    setDateDisplay(todayDisplay);
  };

  // ================= SUBMIT =================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.accountNo || !form.accountHolderName || !form.bankName || !form.currency) {
      showApiError("Please fill in all required fields.");
      return;
    }

    onSubmit(form);
    handleReset();
    onClose();
  };

  // ================= FOOTER =================
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="primary" type="submit" form="bankAccountForm">
          Save Account
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Bank Account"
      subtitle="Enter bank account details"
      icon={Building2}
      footer={footer}
      maxWidth="4xl"
      height="90vh"
    >
      <form id="bankAccountForm" onSubmit={handleSubmit} className="space-y-6">
        <Card
          title="Bank Account Information"
          subtitle="Enter account and banking details"
          icon={<Building2 className="w-5 h-5 text-primary" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <Input
              label="Account No"
              name="accountNo"
              value={form.accountNo}
              onChange={handleChange}
              required
            />

            <Input
              label="Account Holder Name"
              name="accountHolderName"
              value={form.accountHolderName}
              onChange={handleChange}
              required
            />

            <Input
              label="Bank Name"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              required
            />

            <Input
              label="Sort Code"
              name="sortCode"
              value={form.sortCode}
              onChange={handleChange}
            />

            <Input
              label="SWIFT Code"
              name="swiftCode"
              value={form.swiftCode}
              onChange={handleChange}
            />

            <Input
              label="Branch Address"
              name="branchAddress"
              value={form.branchAddress}
              onChange={handleChange}
            />

            <Select
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              required
              options={[
                { value: "USD", label: "USD - US Dollar" },
                { value: "EUR", label: "EUR - Euro" },
                { value: "GBP", label: "GBP - British Pound" },
                { value: "INR", label: "INR - Indian Rupee" },
                { value: "ZAR", label: "ZAR - South African Rand" },
                { value: "AUD", label: "AUD - Australian Dollar" },
              ]}
            />

            {/* ── Custom Date: Calendar icon + Manual text input ── */}
            <DateInput
              label="Date of Addition"
              value={dateDisplay}
              onChange={handleDateChange}
            />

            <Input
              label="Opening Balance"
              type="number"
              name="openingBalance"
              value={form.openingBalance}
              onChange={handleChange}
            />

          </div>
        </Card>
      </form>
    </Modal>
  );
};

export default AddBankAccountModal;