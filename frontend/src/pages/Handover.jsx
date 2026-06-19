import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X, Send, CreditCard } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const Handover = () => {
  const { user } = useAuth();
  const isFrontOfficer = user.role === 'FRONT_OFFICER';
  const isAccountant = user.role === 'ACCOUNTANT';
  const isAdmin = user.role === 'ADMIN';

  // State
  const [payments, setPayments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch payments based on role
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const endpoint = isFrontOfficer 
        ? `${API_BASE}/billing/accountant/fo-pending` 
        : `${API_BASE}/billing/accountant/pending`;
        
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setPayments(data || []);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user.role]);

  // Group payments by bookingRef (bulk view)
  const groupedBookings = React.useMemo(() => {
    const groups = {};
    payments.forEach(p => {
      const ref = p.bookingRef || 'No Booking';
      if (!groups[ref]) {
        groups[ref] = {
          bookingRef: ref,
          guestName: p.guestName || 'Unknown Guest',
          payments: [],
          totalAmountLkr: 0,
          date: p.paymentDate || p.date || '',
          method: new Set(),
          status: p.accountantTransferStatus
        };
      }
      groups[ref].payments.push(p);
      groups[ref].totalAmountLkr += p.amountLkr || p.convertedAmountLkr || 0;
      if (p.paymentMethod || p.method) {
        groups[ref].method.add(p.paymentMethod || p.method);
      }
      const pDate = p.paymentDate || p.date;
      if (pDate && (!groups[ref].date || pDate > groups[ref].date)) {
        groups[ref].date = pDate;
      }
    });
    return Object.values(groups);
  }, [payments]);

  // Handle select/deselect for a booking's bulk of payments
  const toggleSelectBooking = (bookingRef, paymentIds) => {
    const allSelected = paymentIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      // Deselect all payments for this booking
      setSelectedIds(prev => prev.filter(id => !paymentIds.includes(id)));
    } else {
      // Select all payments for this booking
      setSelectedIds(prev => {
        const next = [...prev];
        paymentIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  };

  // Submit Handover (Front Office to Accountant)
  const handleSendToAccountant = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: selectedIds })
      });
      if (response.ok) {
        setMessage('Transactions sent to accountant successfully.');
        setSelectedIds([]);
        setPayments(prev => prev.filter(p => !selectedIds.includes(p.id)));
      } else {
        setMessage('Failed to send transactions.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error sending transactions to accountant.');
    } finally {
      setLoading(false);
    }
  };

  // Accept/Approve Handover (Accountant)
  const handleAcceptTransactions = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: selectedIds })
      });
      if (response.ok) {
        setMessage('Transactions accepted successfully.');
        setSelectedIds([]);
        setPayments(prev => prev.filter(p => !selectedIds.includes(p.id)));
      } else {
        setMessage('Failed to accept transactions.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error accepting transactions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Shift Reconciliation Handover</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isFrontOfficer 
              ? 'Select daily transactions to transfer to the Accountant' 
              : 'Review and approve transaction handovers submitted by the Front Office'}
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold">
          {message}
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
          <span className="text-xs font-bold text-slate-700">
            {selectedIds.length} Transactions Selected
          </span>
          {selectedIds.length > 0 && (
            <button
              onClick={isFrontOfficer ? handleSendToAccountant : handleAcceptTransactions}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              {isFrontOfficer ? <Send className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {isFrontOfficer ? 'Send to Accountant' : 'Accept Transactions'}
            </button>
          )}
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 w-12">Select</th>
              <th className="p-4">Date</th>
              <th className="p-4">Booking Ref</th>
              <th className="p-4">Guest</th>
              <th className="p-4">Method</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">LKR Equivalent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
            {groupedBookings.map((group) => {
              const paymentIds = group.payments.map(p => p.id);
              const isSelected = paymentIds.every(id => selectedIds.includes(id));
              const isSomeSelected = paymentIds.some(id => selectedIds.includes(id));
              
              return (
                <tr key={group.bookingRef} className="hover:bg-slate-50/20 transition">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      ref={el => {
                        if (el) {
                          el.indeterminate = isSomeSelected && !isSelected;
                        }
                      }}
                      onChange={() => toggleSelectBooking(group.bookingRef, paymentIds)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                  </td>
                  <td className="p-4 font-mono text-slate-500">{group.date}</td>
                  <td className="p-4 font-bold text-emerald-700">{group.bookingRef}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{group.guestName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {group.payments.map((pmt) => (
                        <span key={pmt.id} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          pmt.paymentType === 'FINAL' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100/30' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100/30'
                        }`}>
                          {pmt.amount || pmt.amountInCurrency} {pmt.currencyCode || pmt.currency} ({pmt.paymentType === 'FINAL' ? 'Full' : 'Advance'})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{Array.from(group.method).join(', ')}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      group.status === 'ACCEPTED' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/30' 
                        : group.status === 'PENDING' 
                        ? 'bg-amber-50 text-amber-800 border border-amber-100/30' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-900 font-bold">
                    LKR {group.totalAmountLkr.toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {groupedBookings.length === 0 && (
              <tr>
                <td colSpan="7" className="p-12 text-center text-slate-450 font-medium">
                  No transactions waiting for reconciliation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Handover;
