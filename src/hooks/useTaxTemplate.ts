import { useState } from "react";
import {
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
  deleteTemplate,
} from "../api/TaxTemplateApi";
import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../utils/alert";
import type { TaxCategoryFormData } from "../types/tax/taxTemplate";

export const useTaxTemplate = () => {
  const [loading, setLoading] = useState(false);

  //  Create 
  const createTaxTemplate = async (form: TaxCategoryFormData): Promise<any> => {
    setLoading(true);
    try {
      showLoading("Creating Template...");
      const payload = {
        title: form.title,
        disabled: form.disabled ? 1 : 0,
        taxes: form.taxes.map((row) => ({
          tax_type: row.tax_type.trim(),
          tax_rate: Number(row.tax_rate),
        })),
      };
      const res = await createTemplate(payload);
      closeSwal();
      showSuccess("Tax Template created successfully");
      return res;
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  //  Update 
  const updateTaxTemplate = async (form: TaxCategoryFormData): Promise<any> => {
    if (!form.name) {
      console.error("updateTaxTemplate: name is missing");
      return;
    }
    setLoading(true);
    try {
      showLoading("Updating Template...");
      const payload = {
        name: form.name,
        title: form.title,
        disabled: form.disabled ? 1 : 0,
        taxes: form.taxes.map((row) => ({
          tax_type: row.tax_type.trim(),
          tax_rate: Number(row.tax_rate),
        })),
      };
      const res = await updateTemplate(payload);
      closeSwal();
      showSuccess("Tax Template updated successfully");
      return res;
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  //  Update Status (Enable / Disable) 
  const updateStatus = async (
    name: string,
    disabled: 0 | 1
  ): Promise<any> => {
    setLoading(true);
    try {
      showLoading(disabled ? "Disabling..." : "Enabling...");
      const res = await updateTemplateStatus(name, disabled);
      closeSwal();
      showSuccess(
        disabled
          ? "Tax Template disabled successfully"
          : "Tax Template enabled successfully"
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

  // ─── Delete 
  const deleteTaxTemplate = async (name: string): Promise<any> => {
    if (!name) {
      console.error("deleteTaxTemplate: name is missing");
      return;
    }
    setLoading(true);
    try {
      showLoading("Deleting Template...");
      const res = await deleteTemplate(name);
      closeSwal();
      showSuccess("Tax Template deleted successfully");
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
    createTaxTemplate,
    updateTaxTemplate,
    updateStatus,       
    deleteTaxTemplate,
    loading,
  };
};