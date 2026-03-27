import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Modern Section for card-style headers
const Block: React.FC<{ title: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="border rounded-md bg-white mb-4">
    <div className="px-4 pt-3 pb-2 text-gray-800 font-bold text-sm border-b bg-gray-50">
      {title}
    </div>
    <div className="p-4 grid gap-4">{children}</div>
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props,
) => (
  <input
    {...props}
    className="border border-gray-300 rounded-md bg-white px-3 py-2 text-sm w-full"
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (
  props,
) => (
  <select
    {...props}
    className="border border-gray-300 rounded-md bg-white px-3 py-2 text-sm w-full"
  >
    {props.children}
  </select>
);

const TableHeader: React.FC<{ label: string; className?: string }> = ({
  label,
  className = "",
}) => (
  <th
    className={`bg-gray-50 border-b border-gray-200 px-2 py-2 text-xs font-medium text-gray-700 ${className}`}
  >
    {label}
  </th>
);

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}

const demoCustomers = ["Cash Customer", "Acme Ventures", "Sample Walkin"];
const demoProducts = [
  { product: "C001 - Choco Bar", price: 40, available: 16 },
  { product: "C002 - Milk Shake", price: 60, available: 9 },
  { product: "S005 - Veg Sandwich", price: 50, available: 20 },
];

const POSModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave }) => {
  const [number] = useState("POS-2025-001");
  const [date, setDate] = useState("");
  const [cashier] = useState("Demo User");
  const [customer, setCustomer] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [remarks, setRemarks] = useState("");
  const [phone, setPhone] = useState("");

  // Add demo item to cart for simplicity
  const addToCart = () => {
    const found = demoProducts.find((prod) =>
      prod.product.startsWith(scanCode),
    );
    if (found) {
      setCart([...cart, { ...found, qty: 1, amount: found.price }]);
      setScanCode("");
    }
  };

  const updateItemQty = (idx: number, qty: number) => {
    const ct = [...cart];
    ct[idx].qty = qty;
    ct[idx].amount = qty * ct[idx].price;
    setCart(ct);
  };

  const removeItem = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const subtotal = cart.reduce((acc, itm) => acc + itm.amount, 0);
  const discountVal = Number(discount);
  const grandTotal = subtotal - discountVal;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        number,
        date,
        cashier,
        customer,
        phone,
        cart,
        paymentMethod,
        discount: discountVal,
        note,
        remarks,
        grandTotal,
      });
    }
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setDate("");
    setCustomer("");
    setScanCode("");
    setCart([]);
    setPaymentMethod("");
    setDiscount(0);
    setNote("");
    setRemarks("");
    setPhone("");
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
            autoComplete="off"
          >
            <div className="flex h-12 items-center justify-between border-b px-6 py-3 rounded-t-lg bg-indigo-100/30 shrink-0">
              <h3 className="text-2xl w-full font-semibold text-indigo-600">
                New POS Sale
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
              {/* Document Header */}
              <div className="border m-4 p-6 flex flex-col gap-y-2">
                <div className="font-semibold text-gray-600 mb-4">
                  DOCUMENT HEADER
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Input value={number} readOnly placeholder="Bill No." />
                  <Input value={cashier} readOnly placeholder="Cashier" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Date"
                  />
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any remarks"
                  />
                </div>
              </div>

              {/* Customer */}
              <div className="border m-4 p-6 flex flex-col gap-y-2">
                <div className="font-semibold text-gray-600 mb-4">CUSTOMER</div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Select
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                  >
                    <option value="">Select customer</option>
                    {demoCustomers.map((cust) => (
                      <option key={cust}>{cust}</option>
                    ))}
                  </Select>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (optional)"
                  />
                </div>
              </div>

              {/* Add/scan product */}
              <div className="border m-4 p-6 flex flex-col gap-y-2">
                <div className="font-semibold text-gray-600 mb-4">
                  ADD/SCAN PRODUCT
                </div>
                <div className="flex gap-3 items-center mb-6">
                  <Input
                    placeholder="Scan code or enter (e.g., C001)"
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addToCart}
                    className="bg-indigo-600 text-white rounded px-5 py-2 font-bold"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Product Table */}
              <div className="border m-4 p-6 flex flex-col gap-y-2">
                <div className="font-semibold text-gray-600 mb-2">
                  CART ITEMS
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-200 bg-white mb-2 py-4 px-2">
                  <table className="min-w-full text-xs table-fixed">
                    <thead>
                      <tr className="bg-gray-50 text-gray-800">
                        <th className="w-1/12 px-2 py-1 text-left">#</th>
                        <th className="w-5/12 px-2 py-1 text-left">Product</th>
                        <th className="w-1/6 px-2 py-1 text-left">Qty</th>
                        <th className="w-1/6 px-2 py-1 text-left">Price</th>
                        <th className="w-1/6 px-2 py-1 text-left">Amount</th>
                        <th className="w-1/10 px-2 py-1 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-2 text-gray-400"
                          >
                            No items added.
                          </td>
                        </tr>
                      ) : (
                        cart.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-2">{idx + 1}</td>
                            <td className="px-2 py-2">{item.product}</td>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                min={1}
                                max={item.available}
                                value={item.qty}
                                onChange={(e) =>
                                  updateItemQty(idx, Number(e.target.value))
                                }
                                style={{ width: "60px" }}
                              />
                            </td>
                            <td className="px-2 py-2">{item.price}</td>
                            <td className="px-2 py-2">{item.amount}</td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="bg-red-100 border border-red-300 rounded px-2 py-1"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment & Note */}
              <div className="border m-4 p-6 flex flex-col gap-y-2">
                <div className="font-semibold text-gray-600 mb-4">
                  PAYMENT & NOTES
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-600 text-xs mb-1 font-semibold">
                      Payment Method
                    </label>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="">Select method</option>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1 font-semibold">
                      Discount
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="Discount ()"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1 font-semibold">
                      Note
                    </label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Any note"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end my-6 px-4">
                <div className="bg-gray-100 rounded px-6 py-4 text-lg font-medium text-gray-700 w-72">
                  <div className="mb-1 flex justify-between">
                    <span>Subtotal:</span>
                    <span>{subtotal}</span>
                  </div>
                  <div className="mb-1 flex justify-between">
                    <span>Discount:</span>
                    <span>{discountVal}</span>
                  </div>
                  <div className="flex justify-between text-indigo-800 font-bold border-t pt-2 mt-2 text-xl">
                    <span>Grand Total:</span>
                    <span>{grandTotal}</span>
                  </div>
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
                  className="w-24 rounded-3xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
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

export default POSModal;
