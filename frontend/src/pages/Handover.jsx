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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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
          status: p.accountantTransferStatus,
          rejectionReasons: []
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
      
      // Determine overall group status
      if (p.accountantTransferStatus === 'REJECTED') {
        groups[ref].status = 'REJECTED';
      } else if (p.accountantTransferStatus === 'PENDING' && groups[ref].status !== 'REJECTED') {
        groups[ref].status = 'PENDING';
      }
      
      if (p.accountantTransferStatus === 'REJECTED' && p.remarks) {
        // Strip "Rejected: " prefix if present for clean display
        const cleanReason = p.remarks.startsWith('Rejected: ') ? p.remarks.substring(10) : p.remarks;
        if (!groups[ref].rejectionReasons.includes(cleanReason)) {
          groups[ref].rejectionReasons.push(cleanReason);
        }
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
    const idsToFilter = [...selectedIds];
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: idsToFilter })
      });
      if (response.ok) {
        setMessage('Transactions sent to accountant successfully.');
        setSelectedIds([]);
        setPayments(prev => prev.filter(p => !idsToFilter.includes(p.id)));
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
    const idsToFilter = [...selectedIds];
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: idsToFilter })
      });
      if (response.ok) {
        setMessage('Transactions accepted successfully.');
        setSelectedIds([]);
        setPayments(prev => prev.filter(p => !idsToFilter.includes(p.id)));
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

  // Reject Handover (Accountant)
  const handleRejectTransactions = async () => {
    if (selectedIds.length === 0) return;
    if (!rejectionReason.trim()) {
      alert('Please enter the reason for rejection.');
      return;
    }
    
    setLoading(true);
    const idsToFilter = [...selectedIds];
    const reasonToSend = rejectionReason;
    setShowRejectModal(false);
    setRejectionReason('');
    
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: idsToFilter, reason: reasonToSend })
      });
      if (response.ok) {
        setMessage('Transactions rejected successfully.');
        setSelectedIds([]);
        setPayments(prev => prev.filter(p => !idsToFilter.includes(p.id)));
      } else {
        setMessage('Failed to reject transactions.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error rejecting transactions.');
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
            <div className="flex gap-2">
              {isAccountant && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              )}
              <button
                onClick={isFrontOfficer ? handleSendToAccountant : handleAcceptTransactions}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                {isFrontOfficer ? <Send className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                {isFrontOfficer ? 'Send to Accountant' : 'Accept Transactions'}
              </button>
            </div>
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
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        group.status === 'ACCEPTED' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/30' 
                          : group.status === 'PENDING' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-100/30' 
                          : group.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-100/30'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {group.status}
                      </span>
                      {group.status === 'REJECTED' && group.rejectionReasons && group.rejectionReasons.length > 0 && (
                        <p className="text-[9px] text-rose-600 font-bold max-w-[150px] break-words">
                          Reason: {group.rejectionReasons.join(', ')}
                        </p>
                      )}
                    </div>
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

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                <X className="h-4 w-4" /> Reject Transactions
              </h3>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }} 
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-500">
                Please enter a reason for rejecting the selected {selectedIds.length} transaction(s). This will be shown to the Front Office staff for corrections.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rejection Reason</label>
                <textarea 
                  required
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Reference slip uploaded is incorrect or amount doesn't match."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-rose-500 min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-bold">
              <button 
                type="button" 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleRejectTransactions}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-500/10 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Handover;
