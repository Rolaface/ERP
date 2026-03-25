import React, { useState } from "react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const CustomerGroupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    name: "",
    isGroup: false,
    defaultPriceList: "",
    defaultPaymentTerms: "",
  });

  /* ✅ DYNAMIC ROWS */
  const [accounts, setAccounts] = useState([
    { company: "", account: "" },
  ]);

  const [credits, setCredits] = useState([
    { company: "", limit: "", bypass: false },
  ]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  /* ADD ROW */
  const addAccountRow = () => {
    setAccounts((prev) => [...prev, { company: "", account: "" }]);
  };

  const addCreditRow = () => {
    setCredits((prev) => [
      ...prev,
      { company: "", limit: "", bypass: false },
    ]);
  };

  /* UPDATE */
  const updateAccount = (i: number, field: string, value: any) => {
    const updated = [...accounts];
    updated[i][field] = value;
    setAccounts(updated);
  };

  const updateCredit = (i: number, field: string, value: any) => {
    const updated = [...credits];
    updated[i][field] = value;
    setCredits(updated);
  };

  const footer = (
    <div className="flex justify-between w-full">
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSubmit}>
        Save
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Group"
      subtitle="Manage customer group details"
      footer={footer}
      customWidth="70vw"
      height="87vh"
    >
      <div className="p-6 space-y-8 bg-app">

        {/* TOP FORM */}
        <div className="grid grid-cols-3 gap-6">
          <ModalInput
            label="Customer Group Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <ModalInput
            label="Default Price List"
            name="defaultPriceList"
            value={form.defaultPriceList}
            onChange={handleChange}
          />

          <ModalInput
            label="Default Payment Terms Template"
            name="defaultPaymentTerms"
            value={form.defaultPaymentTerms}
            onChange={handleChange}
          />

          <div className="col-span-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isGroup}
              onChange={(e) =>
                setForm((p) => ({ ...p, isGroup: e.target.checked }))
              }
            />
            <span className="text-sm text-main">Is Group</span>
          </div>
        </div>

        {/* DEFAULT ACCOUNTS */}
        <div>
          <h2 className="text-sm font-semibold text-main mb-2">
            Default Accounts
          </h2>

          <div className="border border-theme rounded-xl bg-card">
            {/* HEADER */}
            <div className="grid grid-cols-[60px_1fr_1fr] px-4 py-2 text-sm font-medium border-b border-theme bg-gray-50">
              <div>No.</div>
              <div>Company</div>
              <div>Default Account</div>
            </div>

            {/* ROWS */}
            {accounts.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[60px_1fr_1fr] px-4 py-3 items-center gap-3"
              >
                <div className="text-sm">{i + 1}</div>

                <input
                  className="form-input"
                  placeholder="Company"
                  value={row.company}
                  onChange={(e) =>
                    updateAccount(i, "company", e.target.value)
                  }
                />

                <input
                  className="form-input"
                  placeholder="Default Account"
                  value={row.account}
                  onChange={(e) =>
                    updateAccount(i, "account", e.target.value)
                  }
                />
              </div>
            ))}

            {/* ADD ROW */}
            <div className="px-4 py-2">
              <span
                className="text-primary cursor-pointer text-sm"
                onClick={addAccountRow}
              >
                + Add Row
              </span>
            </div>
          </div>
        </div>

        {/* CREDIT LIMITS */}
        <div>
          <h2 className="text-sm font-semibold text-main mb-2">
            Credit Limits
          </h2>

          <div className="border border-theme rounded-xl bg-card">
            {/* HEADER */}
            <div className="grid grid-cols-[60px_1fr_1fr_1fr] px-4 py-2 text-sm font-medium border-b border-theme bg-gray-50">
              <div>No.</div>
              <div>Company</div>
              <div>Credit Limit</div>
              <div>Bypass Credit Limit</div>
            </div>

            {/* ROWS */}
            {credits.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[60px_1fr_1fr_1fr] px-4 py-3 items-center gap-3"
              >
                <div className="text-sm">{i + 1}</div>

                <input
                  className="form-input"
                  placeholder="Company"
                  value={row.company}
                  onChange={(e) =>
                    updateCredit(i, "company", e.target.value)
                  }
                />

                <input
                  className="form-input no-spinner"
                  placeholder="₹ 0.00"
                  value={row.limit}
                  onChange={(e) =>
                    updateCredit(i, "limit", e.target.value)
                  }
                />

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={row.bypass}
                    onChange={(e) =>
                      updateCredit(i, "bypass", e.target.checked)
                    }
                  />
                </div>
              </div>
            ))}

            {/* ADD ROW */}
            <div className="px-4 py-2">
              <span
                className="text-primary cursor-pointer text-sm"
                onClick={addCreditRow}
              >
                + Add Row
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerGroupModal;