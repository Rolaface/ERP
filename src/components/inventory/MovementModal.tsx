import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

interface MovementItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  uom: string;
  movementDate: string;
  referenceNumber: string;
}

const emptyMovementItem: MovementItem = {
  itemCode: "",
  itemName: "",
  quantity: 0,
  fromLocation: "",
  toLocation: "",
  uom: "",
  movementDate: "",
  referenceNumber: "",
};

const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    movementNumber: "",
    tag: "",
    dateTime: "",
    description: "",
    requestedBy: "",
    approvedBy: "",
    remarks: "",
  });

  const [items, setItems] = useState<MovementItem[]>([
    { ...emptyMovementItem },
  ]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    idx: number,
  ) => {
    const rows = [...items];
    const name = e.target.name;
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    rows[idx] = { ...rows[idx], [name]: value };
    setItems(rows);
  };

  const addItem = () => setItems([...items, { ...emptyMovementItem }]);

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
      movementNumber: "",
      tag: "",
      dateTime: "",
      description: "",
      requestedBy: "",
      approvedBy: "",
      remarks: "",
    });
    setItems([{ ...emptyMovementItem }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/40">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="rounded-lg bg-white w-[96vw] max-w-6xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden"
        >
          <form
            className="pb-2 bg-[#fefefe]/10 flex flex-col flex-1 overflow-hidden"
            onSubmit={handleSave}
          >
            <div className="flex h-12 items-center justify-between border-b px-6 py-3 rounded-t-lg bg-blue-100/30 shrink-0">
              <h3 className="text-2xl w-full font-semibold text-blue-600">
                Inventory Movement
              </h3>
              <button
                type="button"
                className="text-gray-700 hover:bg-[#fefefe] rounded-full w-8 h-8"
                onClick={onClose}
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border-b px-4">
              {/* MOVEMENT HEADER */}
              <div className="border m-4 p-6 flex flex-col gap-y-2">
                <div className="font-semibold text-gray-600 mb-4">
                  MOVEMENT DETAILS
                </div>
                <div className="grid grid-cols-6 gap-4 mb-6">
                  <input
                    className="col-span-1 border rounded p-2"
                    placeholder="Movement Number"
                    name="movementNumber"
                    value={form.movementNumber}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-1 border rounded p-2"
                    placeholder="Tag"
                    name="tag"
                    value={form.tag}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 border rounded p-2"
                    type="datetime-local"
                    name="dateTime"
                    value={form.dateTime}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 border rounded p-2"
                    placeholder="Description"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 border rounded p-2"
                    placeholder="Requested By"
                    name="requestedBy"
                    value={form.requestedBy}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 border rounded p-2"
                    placeholder="Approved By"
                    name="approvedBy"
                    value={form.approvedBy}
                    onChange={handleFormChange}
                  />
                  <input
                    className="col-span-2 border rounded p-2"
                    placeholder="Remarks"
                    name="remarks"
                    value={form.remarks}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* MOVEMENT ITEMS */}
              <div className="border m-4 p-6 flex flex-col gap-y-2">
                <div className="font-semibold text-gray-600 mb-2">
                  MOVEMENT ITEMS
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-200 bg-white mb-2 py-4 px-2">
                  <table className="min-w-full text-xs table-fixed">
                    <thead>
                      <tr className="bg-gray-50 text-gray-800">
                        <th className="w-1/9 px-2 py-1 text-left">ITEM CODE</th>
                        <th className="w-1/9 px-2 py-1 text-left">ITEM NAME</th>
                        <th className="w-1/9 px-2 py-1 text-left">QUANTITY</th>
                        <th className="w-1/9 px-2 py-1 text-left">
                          FROM LOCATION
                        </th>
                        <th className="w-1/9 px-2 py-1 text-left">
                          TO LOCATION
                        </th>
                        <th className="w-1/9 px-2 py-1 text-left">UOM</th>
                        <th className="w-1/9 px-2 py-1 text-left">
                          MOVEMENT DATE
                        </th>
                        <th className="w-1/9 px-2 py-1 text-left">
                          REFERENCE NO.
                        </th>
                        <th className="w-1/10 px-2 py-1 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-1">
                            <input
                              className="border rounded p-1 w-full"
                              placeholder="Item Code"
                              name="itemCode"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className="border rounded p-1 w-full"
                              placeholder="Item Name"
                              name="itemName"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              className="border rounded p-1 w-full"
                              name="quantity"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className="border rounded p-1 w-full"
                              placeholder="From Location"
                              name="fromLocation"
                              value={item.fromLocation}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className="border rounded p-1 w-full"
                              placeholder="To Location"
                              name="toLocation"
                              value={item.toLocation}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className="border rounded p-1 w-full"
                              placeholder= "Unit of Measure"

                              name="uom"
                              value={item.uom}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="date"
                              className="border rounded p-1 w-full"
                              name="movementDate"
                              value={item.movementDate}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              className="border rounded p-1 w-full"
                              placeholder="Reference Number"
                              name="referenceNumber"
                              value={item.referenceNumber}
                              onChange={(e) => handleItemChange(e, idx)}
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              type="button"
                              className="bg-red-100 border border-red-300 rounded px-2 py-1"
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
                <div>
                  <button
                    type="button"
                    className="bg-blue-100 border border-blue-300 rounded px-2 py-1"
                    onClick={addItem}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="m-3 flex items-center justify-between gap-x-7 shrink-0">
              <button
                type="button"
                className="w-24 rounded-3xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                onClick={onClose}
              >
                Cancel
              </button>
              <div className="flex gap-x-2">
                <button
                  type="submit"
                  className="w-24 rounded-3xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="w-24 rounded-3xl bg-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-500 hover:text-white"
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

export default MovementModal;
