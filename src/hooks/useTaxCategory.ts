import { useState } from "react";
import { createTaxCategory,updateTaxCategoryStatus,deleteTaxCategory } from "../api/taxCategoryApi";
import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../utils/alert";

export interface TaxCategoryFormData {
  title: string;
  disabled: boolean; 
}

export const useTaxCategory = () => {
  const [loading, setLoading] = useState(false);

  //  Create 
  const createTaxCategoryEntry = async (
    form: TaxCategoryFormData
  ): Promise<any> => {
    setLoading(true);
    try {
      showLoading("Creating Tax Category...");
      const payload = {
        title: form.title.trim(),
        disabled: form.disabled ? (1 as const) : (0 as const),
      };
      const res = await createTaxCategory(payload);
      closeSwal();
      showSuccess("Tax Category created successfully");
      return res;
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  //  Update Status (Enable / Disable only) 
  const updateStatus = async (
    name: string,
    disabled: 0 | 1
  ): Promise<any> => {
    setLoading(true);
    try {
      showLoading(disabled ? "Disabling..." : "Enabling...");
      const res = await updateTaxCategoryStatus(name, disabled);
      closeSwal();
      showSuccess(
        disabled
          ? "Tax Category disabled successfully"
          : "Tax Category enabled successfully"
      );
      return res;
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  //  Delete 
  const deleteTaxCategoryEntry = async (name: string): Promise<any> => {
    setLoading(true);
    try {
      showLoading("Deleting Tax Category...");
      const res = await deleteTaxCategory(name);
      closeSwal();
      showSuccess("Tax Category deleted successfully");
      return res;
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTaxCategoryEntry,
    updateStatus,
    deleteTaxCategoryEntry,
    loading,
  };
};