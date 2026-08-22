import React, { useState, useCallback, useMemo } from "react";
import { Tag, CreditCard, FileText } from "lucide-react";
import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import {
  getExpenseGLAccounts,
  createExpenseClaimType,
  updateExpenseClaimType,
} from "../../api/expenseClaimApi";
import { showApiError } from "../../utils/alert";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { cleanGLNameList , getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
const getCompanyFromStorage = (): string => {
  try {
    const raw = localStorage.getItem("company-info");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.state?.companyName ?? "";
  } catch {
    return "";
  }
};

export interface ExpenseTypeFormData {
  id?: string;
  expense_type: string;
  account: string;
}
const defaultForm: ExpenseTypeFormData = {
  id: "",
  expense_type: "",
  account: "",
};

interface ExpenseTypeModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ExpenseTypeFormData) => void;
}

export const ExpenseTypeModal: React.FC<ExpenseTypeModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const modals = useModalStore((state) => state.modals);
  const modal = useMemo(
    () => modals.find((m) => m.id === modalId),
    [modals, modalId],
  );

  const [form, setForm] = useState<ExpenseTypeFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [accountDisplay, setAccountDisplay] = useState(""); 
  const isEditMode = modal?.isEdit ?? false;
  const { markDirty, resetDirty, handleCloseWithConfirm } =
    useUnsavedChangesGuard();

  React.useEffect(() => {
    if (isOpen) {
      const data = modal?.initialData as ExpenseTypeFormData | undefined;
      setForm(data ?? defaultForm);
      setErrors({});
      setAccountDisplay(getGLNameWithoutAbbreviation(data?.account ?? "")); 
    }
  }, [isOpen]);

  const reset = () => {
    setForm(defaultForm);
    setErrors({});
    setAccountDisplay("");
    resetDirty();
  };

  // ── Field handler ───────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    markDirty();
  };

  const fetchGLAccounts = useCallback(async (search: string) => {
    const results = await getExpenseGLAccounts(getCompanyFromStorage(), search);
    return cleanGLNameList(results, "label");
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.expense_type.trim())
      newErrors.expense_type = "Expense type is required";
    if (!form.account) newErrors.account = "GL Account is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        expense_type: form.expense_type,
        accounts: [{ default_account: form.account }],
      };

      if (isEditMode) {
        await updateExpenseClaimType(form.id!, payload);
      } else {
        await createExpenseClaimType(payload);
      }

      if (modal?.context?.callback) {
        await modal.context.callback(payload);
      }
      onSubmit?.({ ...form });
      reset();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {isEditMode ? "Update" : "Submit"}
      </Button>
    </>
  );

  if (!modal) return null;
  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEditMode ? "Edit Expense Type" : "Add Expense Type"}
      subtitle={
        isEditMode
          ? "Edit and manage expense type details"
          : "Add and manage expense types"
      } icon={FileText}
      footer={footer}
      customWidth="38vw"
      height="auto"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="p-4 flex flex-col gap-4">
          <ModalInput
            label="Expense Type"
            name="expense_type"
            value={form.expense_type}
            onChange={handleChange}
            error={errors.expense_type}
            required
            disabled={isEditMode}
            placeholder="For example: Travel"
          />
          <SearchSelect2
            label="GL Account"
            required
            value={accountDisplay}
            onChange={(val, option) => {
              setForm((prev) => ({ ...prev, account: val || "" }));
              setAccountDisplay(getGLNameWithoutAbbreviation(option?.label || val || ""));
              if (errors.account)
                setErrors((prev) => ({ ...prev, account: "" }));
              markDirty();
            }}
            fetchOptions={fetchGLAccounts}
            placeholder="Select a GL account"
            error={errors.account}
          />
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ExpenseTypeModal;
