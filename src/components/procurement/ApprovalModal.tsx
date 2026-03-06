import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

interface ApprovalItem {
  approver: string;
  role: string;
  status: string;
  comments: string;
  date: string;
}

const emptyApprovalItem: ApprovalItem = {
  approver: "",
  role: "",
  status: "",
  comments: "",
  date: "",
};

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    approvalNumber: "",
    tag: "",
    dateTime: "",
    description: "",
    requester: "",
    department: "",
    priority: "",
  });

  const [items, setItems] = useState<ApprovalItem[]>([
    { ...emptyApprovalItem },
  ]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    idx: number,
  ) => {
    const rows = [...items];
    rows[idx] = { ...rows[idx], [e.target.name]: e.target.value };
    setItems(rows);
  };

  const addItem = () => setItems([...items, { ...emptyApprovalItem }]);

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ ...form, items });
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setForm({
      approvalNumber: "",
      tag: "",
      dateTime: "",
      description: "",
      requester: "",
      department: "",
      priority: "",
    });
    setItems([{ ...emptyApprovalItem }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/40">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="rounded-xl bg-card w-[96vw] max-w-6xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden border border-theme"
        >
          <form
            className="pb-2 bg-card flex flex-col flex-1 overflow-hidden"
            onSubmit={handleSave}
          >
            {/* Header */}
            <div className="flex h-12 items-center justify-between border-b border-theme px-6 py-3 rounded-t-xl bg-app shrink-0">
              <h3 className="text-xl w-full font-semibold text-primary">
                Approval Request
              </h3>
              <button
                type="button"
                className="text-muted hover:bg-app rounded-full w-8 h-8"
                onClick={onClose}
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border-b border-theme px-4">
              {/* APPROVAL HEADER */}
              <div className="border border-theme m-4 p-6 flex flex-col gap-y-2 bg-card rounded-lg">
                <div className="font-semibold text-muted mb-4">
                  APPROVAL DETAILS
                </div>

                <div className="grid grid-cols-6 gap-4 mb-6">
                  {[
                    {
                      name: "approvalNumber",
                      placeholder: "Approval Number",
                      span: 1,
                    },
                    { name: "tag", placeholder: "Tag", span: 1 },
                  ].map((f) => (
                    <input
                      key={f.name}
                      className={`col-span-${f.span} filter-input-refined`}
                      placeholder={f.placeholder}
                      name={f.name}
                      value={(form as any)[f.name]}
                      onChange={handleFormChange}
                    />
                  ))}

                  <input
                    className="col-span-2 filter-input-refined"
                    type="datetime-local"
                    name="dateTime"
                    value={form.dateTime}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 filter-input-refined"
                    placeholder="Description"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 filter-input-refined"
                    placeholder="Requester"
                    name="requester"
                    value={form.requester}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 filter-input-refined"
                    placeholder="Department"
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 filter-input-refined"
                    placeholder="Priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* APPROVAL ITEMS */}
              <div className="border border-theme m-4 p-6 flex flex-col gap-y-2 bg-card rounded-lg">
                <div className="font-semibold text-muted mb-2">
                  APPROVAL STEPS
                </div>

                <div className="overflow-x-auto rounded-md border border-theme bg-card mb-2 py-4 px-2">
                  <table className="min-w-full text-xs table-fixed">
                    <thead>
                      <tr className="table-head">
                        <th className="px-2 py-1 text-left">APPROVER</th>
                        <th className="px-2 py-1 text-left">ROLE</th>
                        <th className="px-2 py-1 text-left">STATUS</th>
                        <th className="px-2 py-1 text-left">COMMENTS</th>
                        <th className="px-2 py-1 text-left">DATE</th>
                        <th className="px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="row-hover">
                          <td className="px-2 py-1">
                            <input
                              className="filter-input-refined"
                              placeholder="Approver"
                              name="approver"
                              value={item.approver}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className="filter-input-refined"
                              placeholder="Role"
                              name="role"
                              value={item.role}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <select
                              name="status"
                              className="filter-input-refined"
                              value={item.status}
                              onChange={(e) => handleItemChange(e, idx)}
                            >
                              <option value="">Select</option>
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <textarea
                              name="comments"
                              className="filter-input-refined"
                              placeholder="Comments"
                              value={item.comments}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="date"
                              name="date"
                              className="filter-input-refined"
                              value={item.date}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              type="button"
                              className="bg-danger border border-danger-700 rounded px-2 py-1 text-white"
                              onClick={() => removeItem(idx)}
                            >
                              -
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="bg-primary rounded px-3 py-1 text-sm"
                  onClick={addItem}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="m-3 flex items-center justify-between gap-x-7 shrink-0">
              <button
                type="button"
                className="w-24 rounded-3xl bg-app border border-theme px-4 py-2 text-sm text-main"
                onClick={onClose}
              >
                Cancel
              </button>

              <div className="flex gap-x-2">
                <button
                  type="submit"
                  className="w-24 rounded-3xl bg-primary px-4 py-2 text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="w-24 rounded-3xl bg-app border border-theme px-4 py-2 text-sm text-main"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ApprovalModal;
