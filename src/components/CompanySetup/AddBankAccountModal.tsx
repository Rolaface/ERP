import React, { useState } from "react";
import Modal from "../ui/modal/modal";
import { Button, Input, Select, Card } from "../ui/modal/formComponent";
import { Building2 } from "lucide-react";
import type { BankAccount } from "../../types/company";
import { showApiError } from "../../utils/alert";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newAccount: BankAccount) => void;
}

const AddBankAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<BankAccount>({
    accountNo: "",
    accountHolderName: "",
    sortCode: "",
    swiftCode: "",
    bankName: "",
    branchAddress: "",
    currency: "",
    dateAdded: new Date().toISOString().split("T")[0],
    openingBalance: 0.0,
  });

  // ================= CHANGE =================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      dateAdded: new Date().toISOString().split("T")[0],
      openingBalance: 0.0,
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.accountNo ||
      !form.accountHolderName ||
      !form.bankName ||
      !form.currency
    ) {
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

            <Input
              label="Date of Addition"
              type="date"
              name="dateAdded"
              value={form.dateAdded}
              onChange={handleChange}
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
