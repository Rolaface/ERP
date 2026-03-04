import React, { useState, useMemo } from "react";

interface Item {
  code: string | number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
}

const ItemsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Sample data (replace with your actual data source)
  const items: Item[] = [
    {
      code: 1,
      name: "Laptop Stand",
      sku: "LS-001",
      category: "Electronics",
      price: 2500,
      stock: 45,
    },
    {
      code: 2,
      name: "Wireless Mouse",
      sku: "WM-101",
      category: "Electronics",
      price: 899,
      stock: 120,
    },
    {
      code: 3,
      name: "Coffee Mug",
      sku: "CM-005",
      category: "Kitchen",
      price: 299,
      stock: 200,
    },
    {
      code: 4,
      name: "USB-C Hub",
      sku: "UCH-202",
      category: "Electronics",
      price: 3499,
      stock: 30,
    },
    {
      code: 5,
      name: "Desk Lamp",
      sku: "DL-301",
      category: "Furniture",
      price: 1599,
      stock: 75,
    },
  ];

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerSearch) ||
        item.sku.toLowerCase().includes(lowerSearch) ||
        item.category.toLowerCase().includes(lowerSearch),
    );
  }, [items, searchTerm]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <input
          type="search"
          placeholder="Search Items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg bg-white">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">Item Code</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-center">Stock</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.code} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{item.code}</td>
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-sm">{item.sku}</td>
                  <td className="px-4 py-2 text-sm">{item.category}</td>
                  <td className="px-4 py-2 text-right">
                    K{item.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.stock > 50
                          ? "bg-green-100 text-green-800"
                          : item.stock > 10
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button className="text-blue-600 hover:underline font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-6">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTable;
