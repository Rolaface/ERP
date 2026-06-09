import React, { useEffect, useState } from "react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { BookOpen, Loader2 } from "lucide-react";
import type { COAAccount } from "../../types/coa";
import { getCOAById } from "../../api/Accounting/AccountApi";
import { showApiError } from "../../utils/alert";
import { ModalInput } from "../../components/ui/modal/modalComponent";

interface ViewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: COAAccount | null;
}

const rootTypeBadge: Record<string, string> = {
  Asset:     "bg-info text-info",
  Liability: "bg-danger text-danger",
  Equity:    "bg-warning text-warning",
  Income:    "bg-success text-success",
  Expense:   "bg-draft text-gray-100",
};

const ViewAccountModal: React.FC<ViewAccountModalProps> = ({ isOpen, onClose, account }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !account) return;
    setData(null);
    setLoading(true);
    getCOAById(account.name)
      .then(setData)
      .catch(showApiError)
      .finally(() => setLoading(false));
  }, [isOpen, account]);

  const footer = (
    <Button variant="secondary" type="button" onClick={onClose}>
      Close
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="View Account"
      subtitle="Detailed information about the selected account"
      icon={BookOpen}
      footer={footer}
      customWidth="40vw"
      height="50vh"
    >
      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3">
          <Loader2 size={22} className="animate-spin text-primary" />
          <span className="text-sm text-muted">Loading account details…</span>
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 py-3 px-1">
          {/* LEFT */}
          <div className="flex flex-col gap-5">
            <ModalInput
              label="Account Name"
              name="account_name"
              value={data.account_name ?? ""}
              disabled
              onChange={() => {}}
            />
            <ModalInput
              label="Account Number"
              name="account_number"
              value={data.account_number ?? ""}
              disabled
              onChange={() => {}}
            />
            <ModalInput
              label="Parent Account"
              name="parent_account"
              value={data.parent_account ?? ""}
              disabled
              onChange={() => {}}
            />
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-5">
            {/* Root Type + Is Group side by side */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-1">
                <span className="block text-[10px] font-medium text-main mb-1">
                  Root Type
                </span>
                {data.root_type ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                      rootTypeBadge[data.root_type] ?? "bg-info text-info"
                    }`}
                  >
                    {data.root_type}
                  </span>
                ) : (
                  <span className="text-muted text-xs">—</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="block text-[10px] font-medium text-main mb-1">
                  Is Group
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                    data.is_group === 1
                      ? "bg-primary/10 text-primary"
                      : "bg-[var(--row-hover)] text-muted"
                  }`}
                >
                  {data.is_group === 1 ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <ModalInput
              label="Account Type"
              name="account_type"
              value={data.account_type ?? ""}
              disabled
              onChange={() => {}}
            />
            <ModalInput
              label="Currency"
              name="account_currency"
              value={data.account_currency ?? ""}
              disabled
              onChange={() => {}}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ViewAccountModal;