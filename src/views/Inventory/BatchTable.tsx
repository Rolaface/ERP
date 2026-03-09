import React from "react";

interface Props {
  batches: any[];
}

const BatchTable: React.FC<Props> = ({ batches }) => {
  if (!batches.length) {
    return <div className="p-3 text-gray-500">No batch data</div>;
  }

  return (
    <table className="w-auto text-sm border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border">Batch No</th>
          <th className="p-2 border">MFG Date</th>
          <th className="p-2 border">EXP Date</th>
          <th className="p-2 border text-right">Qty</th>
          <th className="p-2 border text-right">Buy Value</th>
          <th className="p-2 border text-right">Sell Value</th>
        </tr>
      </thead>

      <tbody>
        {batches.map((b, idx) => (
          <tr key={idx}>
            <td className="p-2 border">{b.batch_no || "-"}</td>
            <td className="p-2 border">{b.manufacturing_date || "-"}</td>
            <td className="p-2 border">{b.expiry_date || "-"}</td>
            <td className="p-2 border text-right">{b.bal_qty}</td>
            <td className="p-2 border text-right">
              INR {Number(b.buy_value || 0).toLocaleString()}
            </td>
            <td className="p-2 border text-right">
              INR {Number(b.sell_value || 0).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BatchTable;