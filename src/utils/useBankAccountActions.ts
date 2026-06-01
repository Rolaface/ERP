import { useState, useCallback } from "react";
import type { BankAccount } from "../types/BankAccount/bank";
import { updateBankAccountStatus } from "../api/BankAccountApi";
import { showApiError } from "./alert";

export function useBankAccountActions(onRefresh: () => Promise<void>) {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleSetDefault = useCallback(
    async (row: BankAccount) => {
      if (row.isDisabled) {
        showApiError("Disabled account cannot be set as default");
        return;
      }
      try {
        setActionLoadingId(String(row.id));
        await updateBankAccountStatus({
          bankAccountId: String(row.id),
          isDefault: 1,
          isDisabled: 0,
        });
        await onRefresh();
      } catch (err: any) {
        showApiError(err?.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [onRefresh],
  );

  const handleToggleDisable = useCallback(
    async (row: BankAccount) => {
      try {
        setActionLoadingId(String(row.id));
        await updateBankAccountStatus({
          bankAccountId: String(row.id),
          isDisabled: row.isDisabled ? 0 : 1,
          isDefault: row.isDisabled ? (row.isDefault ? 1 : 0) : 0,
        });
        await onRefresh();
      } catch (err: any) {
        showApiError(err?.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [onRefresh],
  );

  const getMenuActions = useCallback(
    (row: BankAccount) => [
      {
        label: "Set Default",
        onClick: () => handleSetDefault(row),
        disabled: actionLoadingId === String(row.id),
      },
      {
        label: row.isDisabled ? "Enable" : "Disable",
        onClick: () => handleToggleDisable(row),
        disabled: actionLoadingId === String(row.id),
      },
    ],
    [handleSetDefault, handleToggleDisable, actionLoadingId],
  );

  return {
    actionLoadingId,
    handleSetDefault,
    handleToggleDisable,
    getMenuActions,
  };
}