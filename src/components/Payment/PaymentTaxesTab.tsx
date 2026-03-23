import { ModalInput } from "../ui/modal/modalComponent";

const PaymentTaxesTab = ({  }: any) => {


  
  return (
    <div className="space-y-6">

      {/* Top */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Taxes and Charges</h3>
       
      </div>

          

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-2 text-sm font-semibold">
          <div>No.</div>
          <div>Type</div>
          <div>Account Head</div>
          <div>Tax Rate</div>
          <div>Amount</div>
          <div>Total</div>
        </div>

        {[1, 2].map((row) => (
          <div key={row} className="grid grid-cols-6 px-4 py-2 gap-2 items-center border-t">
            <div>{row}</div>
            <input className="input" placeholder="Type" />
            <input className="input" placeholder="Account Head" />
            <input className="input" placeholder="Tax %" />
            <input className="input" placeholder="Amount" />
            <input className="input" placeholder="Total" />
          </div>
        ))}
      </div>


 

    </div>
  );
};

export default PaymentTaxesTab;