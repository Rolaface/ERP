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

  const handleToggleEnable = async (id: string, enable: boolean) => {
  const confirmed = await showConfirm(
    enable
      ? "Are you sure you want to enable this scheduler?"
      : "Are you sure you want to disable this scheduler?",
    {
      title: enable ? "Enable Scheduler" : "Disable Scheduler",
      confirmButtonText: enable ? "Enable" : "Disable",
    }
  );

  if (!confirmed) return;

  try {
    // pehle current record dhundo data mein se
    const record = data.find((r) => r.id === id);
    if (!record) return;

    // poora object bhejo, sirf enabled toggle karo
    await editShedular(id, {
      schedulerName: record.schedulerName,
      frequency: record.frequency,
      enabled: enable,
    });

    showSuccess(enable ? "Scheduler enabled." : "Scheduler disabled.");
    await fetchData();
  } catch (err) {
    showApiError(err);
  }
};
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
    handleToggleEnable
  };
};