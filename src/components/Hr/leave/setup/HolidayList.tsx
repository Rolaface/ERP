import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { getAllHolidays } from "../../../../api/HolidayApi";
import { HolidayListForm } from "./HolidayListForm";

export interface HolidayListProps {
  onAdd: () => void;
  onClose?: () => void;
}

export const HolidayList: React.FC<HolidayListProps> = ({ onAdd, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     FETCH HOLIDAYS
  ========================= */
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await getAllHolidays(1, 20);

      setHolidays(res?.data?.holidays || []);
    } catch (err) {
      console.error("Failed to fetch holidays", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <>
      <div className="bg-card border border-theme rounded-2xl overflow-hidden">
        {/* HEADER */}
        <div className="p-6 flex items-center justify-between border-b border-theme">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-muted hover:text-main transition"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-main">Holiday List</h2>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl font-semibold transition hover:bg-primary/90"
          >
            <Plus size={18} />
            Add Holiday
          </button>
        </div>

        {/* STATS */}
        <div className="px-6 py-3 border-b border-theme flex items-center justify-between">
          <span className="text-sm text-muted">{holidays.length} Holidays</span>

          <span className="text-xs text-muted">
            Last Updated: {new Date().toDateString()}
          </span>
        </div>

        {/* EMPTY / LIST */}
        {loading ? (
          <div className="p-10 text-center text-muted">Loading holidays...</div>
        ) : holidays.length === 0 ? (
          <div className="p-16 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-6 w-20 h-20 mx-auto rounded-2xl bg-card border border-theme inline-flex items-center justify-center">
                <Calendar size={40} className="text-muted" />
              </div>

              <h3 className="text-lg font-semibold text-main mb-2">
                No Holidays Yet
              </h3>

              <p className="text-muted text-sm mb-6">
                Create holidays for your organization
              </p>

              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-primary rounded-xl font-semibold transition flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Create Holiday
              </button>
            </div>
          </div>
        ) : (
          /* HOLIDAY LIST TABLE */
          <div className="p-6 space-y-3">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="p-4 border border-theme rounded-xl flex justify-between"
              >
                <div>
                  <p className="font-semibold text-main">{h.name}</p>
                  <p className="text-sm text-muted">
                    {h.fromDate} → {h.toDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl rounded-lg">
            <HolidayListForm
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                fetchHolidays();
                onAdd();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
