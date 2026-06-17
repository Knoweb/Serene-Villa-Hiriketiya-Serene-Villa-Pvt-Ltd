import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Globe, CreditCard, Save } from 'lucide-react';

const Payments = () => {
  const { user } = useAuth();
  const isFrontOfficer = user.role === 'FRONT_OFFICER';

  const [exchangeRates, setExchangeRates] = useState({
    USD: 302.50,
    EUR: 324.80,
    GBP: 384.20,
  });

  const [rateEdit, setRateEdit] = useState({ ...exchangeRates });
  const [editing, setEditing] = useState(false);

  const [payments, setPayments] = useState([
    {
      id: 1,
      bookingRef: 'SV-2026-0001',
      guestName: 'Liam Johnson',
      amountInCurrency: 132.23,
      currency: 'USD',
      rate: 302.50,
      amountLkr: 40000,
      type: 'Advance Payment',
      date: '2026-06-16',
      method: 'Bank Transfer'
    },
    {
      id: 2,
      bookingRef: 'SV-2026-0001',
      guestName: 'Liam Johnson',
      amountInCurrency: 100000,
      currency: 'LKR',
      rate: 1.0,
      amountLkr: 100000,
      type: 'Final Payment',
      date: '2026-06-16',
      method: 'Cash'
    }
  ]);

  const [newPayment, setNewPayment] = useState({
    bookingRef: '',
    guestName: '',
    amountInCurrency: '',
    currency: 'USD',
    method: 'Cash',
    type: 'Advance Payment'
  });

  const saveRates = () => {
    setExchangeRates({ ...rateEdit });
    setEditing(false);
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    const rate = newPayment.currency === 'LKR' ? 1.0 : exchangeRates[newPayment.currency];
    const amountLkr = parseFloat(newPayment.amountInCurrency) * rate;

    const paymentRecord = {
      id: Date.now(),
      bookingRef: newPayment.bookingRef,
      guestName: newPayment.guestName,
      amountInCurrency: parseFloat(newPayment.amountInCurrency),
      currency: newPayment.currency,
      rate,
      amountLkr,
      type: newPayment.type,
      date: new Date().toISOString().split('T')[0],
      method: newPayment.method
    };

    setPayments([paymentRecord, ...payments]);
    setNewPayment({
      bookingRef: '',
      guestName: '',
      amountInCurrency: '',
      currency: 'USD',
      method: 'Cash',
      type: 'Advance Payment'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payments & Exchange Rates</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Manage manual exchange rates and record multi-currency payment transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exchange Rate Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-emerald-600" /> Exchange Rates (Manual)
            </h3>
            {isFrontOfficer && !editing && (
              <button 
                onClick={() => setEditing(true)}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                Update
              </button>
            )}
          </div>

          <div className="space-y-3">
            {Object.keys(exchangeRates).map((curr) => (
              <div key={curr} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">1 {curr}</span>
                {editing ? (
                  <input
                    type="number"
                    value={rateEdit[curr]}
                    onChange={(e) => setRateEdit({ ...rateEdit, [curr]: parseFloat(e.target.value) || 0 })}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs text-slate-800 font-semibold"
                  />
                ) : (
                  <span className="font-mono text-xs text-slate-800 font-bold">{exchangeRates[curr]} LKR</span>
                )}
              </div>
            ))}
          </div>

          {editing && (
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => { setRateEdit({ ...exchangeRates }); setEditing(false); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                onClick={saveRates}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          )}
        </div>

        {/* Record Payment Form */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 lg:col-span-2 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-emerald-600" /> Record Multi-Currency Payment
          </h3>
          <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Booking Ref</label>
              <input
                type="text"
                required
                placeholder="e.g. SV-2026-0001"
                value={newPayment.bookingRef}
                onChange={(e) => setNewPayment({ ...newPayment, bookingRef: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Liam Johnson"
                value={newPayment.guestName}
                onChange={(e) => setNewPayment({ ...newPayment, guestName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Currency</label>
              <select
                value={newPayment.currency}
                onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="LKR">LKR (Sri Lankan Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Enter amount in currency"
                value={newPayment.amountInCurrency}
                onChange={(e) => setNewPayment({ ...newPayment, amountInCurrency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Method</label>
              <select
                value={newPayment.method}
                onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Type</label>
              <select
                value={newPayment.type}
                onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="Advance Payment">Advance Payment</option>
                <option value="Final Payment">Final Checkout Payment</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition"
              >
                Record Transaction
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Booking Ref</th>
              <th className="p-4">Guest</th>
              <th className="p-4">Method</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-right">LKR Equivalent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/20 transition">
                <td className="p-4 font-mono text-slate-500">{p.date}</td>
                <td className="p-4 font-bold text-emerald-700">{p.bookingRef}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-900">{p.guestName}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{p.type}</p>
                </td>
                <td className="p-4">{p.method}</td>
                <td className="p-4 font-mono">
                  {p.amountInCurrency.toLocaleString(undefined, { minimumFractionDigits: 2 })} {p.currency}
                  {p.currency !== 'LKR' && <span className="text-[9px] text-slate-400 font-sans block mt-0.5">@ {p.rate}</span>}
                </td>
                <td className="p-4 text-right font-mono text-slate-900 font-bold">
                  LKR {p.amountLkr.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
