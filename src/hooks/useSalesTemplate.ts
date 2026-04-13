import { useState } from "react";
import {
  createTemplate,
  getAllTemplates,
  getGlAccounts,
  updateSalesTemplate,
  // updateSalesTaxTemplateStatus,
  deleteSalesTemplate, // ← correct name
} from "../api/salesTaxTemplateApi";
import {
  showLoading,
  showApiError,
  showSuccess,
  closeSwal,
} from "../utils/alert";
import type { SalesTaxTemplateFormData } from "../types/tax/salesTemplate";

export const useSalesTaxTemplate = () => {
  const [loading, setLoading] = useState(false);

  // ── Create ────────────────────────────────────────────────────────────────
  const createSalesTax = async (
    form: SalesTaxTemplateFormData
  ): Promise<any> => {
    setLoading(true);
    try {
      showLoading("Creating Sales Tax Template...");
      const payload = {
        title: form.title,
        disabled: form.disabled,
        tax_category: form.tax_category ?? "",
        taxes: form.taxes.map((row) => ({
          name:row.name,
          charge_type: row.charge_type,
          account_head: row.account_head.trim(),
          rate: Number(row.rate),
          tax_amount: Number(row.tax_amount),
          description: row.description.trim(),
        })),
      };
      const res = await createTemplate(payload);
      closeSwal();
      showSuccess("Sales Tax Template created successfully");
      return res;
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const updateSalesTax = async (

    form: SalesTaxTemplateFormData
  ): Promise<any> => {
    if (!form.name) {
      console.error("updateSalesTax: name is missing");
      return;
    }
    setLoading(true);
    try {
      showLoading("Updating Sales Tax Template...");
     const payload = {

  title: form.title,
  disabled: form.disabled,
  tax_category: form.tax_category ?? "",
  taxes: form.taxes.map((row) => ({
    name:row.name,
    charge_type: row.charge_type,
    account_head: row.account_head.trim(),
    rate: Number(row.rate),
    tax_amount: Number(row.tax_amount),
    description: row.description.trim(),
  })),

};
      const res = await updateSalesTemplate(form.name, payload);
      closeSwal();
      showSuccess("Sales Tax Template updated successfully");
      return res;
    } catch (error) {
      closeSwal();
      showApiError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ── Update Status (Enable / Disable) ─────────────────────────────────────
  const updateStatus = async (
    name: string,
    disabled: 0 | 1
  ): Promise<any> => {
    setLoading(true);
    try {
      showLoading(disabled ? "Disabling..." : "Enabling...");
      const res = await updateSalesTaxTemplateStatus(name, disabled);
      closeSwal();
      showSuccess(
        disabled
          ? "Sales Tax Template disabled successfully"
          : "Sales Tax Template enabled successfully"
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

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteSalesTax = async (name: string): Promise<any> => {
    if (!name) {
      console.error("deleteSalesTax: name is missing");
      return;
    }
    setLoading(true);
    try {
      showLoading("Deleting Sales Tax Template...");
      const res = await deleteSalesTemplate(name);
      closeSwal();
      showSuccess("Sales Tax Template deleted successfully");
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
    createSalesTax,
    updateSalesTax,
    updateStatus,
    deleteSalesTax,
    loading,
  };
};