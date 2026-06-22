import { useState, useEffect, useCallback } from "react";
import {
  getAllShedulers,
  createShedular,
  editShedular,
  deleteShedularById,
} from "../api/schedulerApi";
import type { SchedulerRecord, SchedulerFormValues } from "../api/schedulerApi";
import { useModalStore } from "../store/modalStore";
import { showConfirm, showSuccess, showApiError } from "../utils/alert"; 

export const useShedular = () => {
  const [data, setData] = useState<SchedulerRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllShedulers();
      setData(result.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    useModalStore.getState().openModal("scheduler", null, false, {
      onSuccess: async () => {
        await fetchData();
      },
    });
  };

  const openEdit = (record: SchedulerRecord) => {
    useModalStore.getState().openModal("scheduler", record, true, {
      onSuccess: async () => {
        await fetchData();
      },
    });
  };

  const openView = (record: SchedulerRecord) => {
    useModalStore.getState().openModal("scheduler", record, false, {
      isViewMode: true,
    });
  };

  const handleSubmit = async (values: SchedulerFormValues, id?: string) => {
    if (id) {
      await editShedular(id, values);
    } else {
      await createShedular(values);
    }
    await fetchData();
  };

  // ✅ showConfirm → delete → showSuccess / showApiError
  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "Are you sure you want to delete this scheduler?",
      {
        title: "Delete Scheduler",
        confirmButtonText: "Delete",
      }
    );

    if (!confirmed) return;

    try {
      await deleteShedularById(id);
      await fetchData();
      showSuccess("Scheduler deleted successfully.");
    } catch (err) {
      showApiError(err);
    }
  };

  return {
    data,
    loading,
    openAdd,
    openView,
    openEdit,
    handleSubmit,
    handleDelete,
  };
};