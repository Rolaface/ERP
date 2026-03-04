import React, { useState, useMemo } from "react";
import PosModal from "../../components/sales/PosModal";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Invoice Processing",
      price: 1500,
      stock: 20,
      category: "Finance",
    },
    {
      id: 2,
      name: "Tax Filing Module",
      price: 2200,
      stock: 10,
      category: "Accounting",
    },
    { id: 3, name: "Payroll Suite", price: 3500, stock: 6, category: "HR" },
    { id: 4, name: "Loan Manager", price: 4200, stock: 4, category: "Banking" },
    {
      id: 5,
      name: "Expense Tracker",
      price: 1800,
      stock: 15,
      category: "Finance",
    },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const totalRevenue = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id && item.quantity < product.stock
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, qty: number) => {
    setCart(
      cart.map((item) =>
        item.id === id && qty > 0 && qty <= item.stock
          ? { ...item, quantity: qty }
          : item,
      ),
    );
  };

  const removeFromCart = (id: number) =>
    setCart(cart.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const handleCheckoutOpen = () => {
    if (!cart.length) return alert("Cart is empty!");
    setModalOpen(true);
  };

  const handleCheckoutConfirm = (checkoutData: any) => {
    // Example: save transaction, print receipt, etc. (use checkoutData as needed)
    const invoice = "INV-" + Math.floor(Math.random() * 100000);
    alert(`✅ Invoice ${invoice} created! Total: ₹${totalRevenue}`);
    setProducts(
      products.map((p) => {
        const item = cart.find((c) => c.id === p.id);
        return item ? { ...p, stock: p.stock - item.quantity } : p;
      }),
    );
    clearCart();
    setModalOpen(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 p-8 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-sm text-gray-500">Today's Revenue</h2>
          <p className="text-2xl font-bold text-green-600">₹{totalRevenue}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-sm text-gray-500">Items in Cart</h2>
          <p className="text-2xl font-bold text-indigo-600">{totalItems}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-sm text-gray-500">Available Products</h2>
          <p className="text-2xl font-bold text-blue-600">{products.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product selection */}
        <div>
          <input
            type="text"
            placeholder="🔍 Search finance module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] pr-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {product.name}
                  </h3>
                  <span className="text-sm text-indigo-500 font-medium">
                    {product.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600">₹{product.price}</p>
                <p className="text-xs text-gray-500 mb-3">
                  Stock: {product.stock}
                </p>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`w-full py-2 rounded-lg font-medium text-white transition-all shadow-sm ${
                    product.stock > 0
                      ? "bg-indigo-500 hover:bg-indigo-600"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Cart Summary */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-700">
            🧾 Cart Summary
          </h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Your cart is currently empty.
            </p>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[70vh]">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b border-gray-100 pb-2"
                >
                  <div>
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-500">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      max={item.stock}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value))
                      }
                      className="w-16 border border-gray-200 rounded-md px-2 py-1 text-center text-sm"
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 text-xs font-medium hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-4 text-lg font-semibold text-gray-800">
                <span>Total:</span>
                <span>₹{totalRevenue}</span>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={clearCart}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckoutOpen}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* POS Modal for checkout */}
      <PosModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        cart={cart}
        onSave={handleCheckoutConfirm}
      />
    </div>
  );
};

export default POS;
