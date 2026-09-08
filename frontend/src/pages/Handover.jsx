import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X, Send, CreditCard, ChevronDown, ChevronRight, Layers, FileText, DollarSign, Calendar, User, Search, RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

const Handover = () => {
  const { user } = useAuth();
  const isFrontOfficer = user?.role === 'FRONT_OFFICER';
  const isAccountant = user?.role === 'ACCOUNTANT';
  const isAdmin = user?.role === 'ADMIN';

  // State
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedBookingRefs, setSelectedBookingRefs] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = isFrontOfficer 
        ? `${API_BASE}/billing/accountant/fo-pending` 
        : `${API_BASE}/billing/accountant/pending`;
        
      const [payRes, bookRes, regRes] = await Promise.all([
        fetch(endpoint),
        fetch(`${API_BASE}/bookings`),
        fetch(`${API_BASE}/registrations`)
      ]);

      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData || []);
      } else {
        setPayments([]);
      }

      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBookings(bookData || []);
      }

      if (regRes.ok) {
        const regData = await regRes.json();
        setRegistrations(regData || []);
      }
    } catch (err) {
      console.error('Error fetching handover data:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  // Consolidated Grouping Logic per Booking
  const consolidatedBookings = React.useMemo(() => {
    const groups = {};

    payments.forEach(p => {
      let rawRef = p.bookingRef || '';
      // If booking ref has a sub-suffix like W-12345/EN or W-12345/1P, map to base ref
      let baseRef = rawRef;
      if (rawRef.includes('/')) {
        baseRef = rawRef.split('/')[0].trim();
      }
      if (!baseRef) {
        baseRef = `NO-REF-${p.id}`;
      }

      if (!groups[baseRef]) {
        // Find matching base booking and registration
        const matchedBaseBooking = bookings.find(b => {
          const bNum = (b.bookingNumber || '').trim().toLowerCase();
          return bNum === baseRef.toLowerCase() || bNum.startsWith(baseRef.toLowerCase() + '/');
        });

        const regId = matchedBaseBooking?.guestRegistrationId || p.guestRegistrationId;
        const matchedReg = registrations.find(r => r.id === regId) || {};

        // Find all sub-bookings for this booking / guest
        const relatedBookings = bookings.filter(b => {
          if (!b.bookingNumber) return false;
          const bNum = b.bookingNumber.trim().toLowerCase();
          const targetBase = baseRef.toLowerCase();
          return bNum === targetBase || bNum.startsWith(targetBase + '/') || (regId && b.guestRegistrationId === regId);
        });

        // Determine Room Details & Guest Name
        const roomNumbers = matchedBaseBooking?.roomNumber || matchedReg?.roomNumber || '-';
        const guestName = p.guestName || matchedReg?.guestName || matchedBaseBooking?.guestName || 'Guest';
        const checkIn = matchedBaseBooking?.checkInDate || matchedReg?.checkInDate || '-';
        const checkOut = matchedBaseBooking?.checkOutDate || matchedReg?.checkOutDate || '-';
        const currency = matchedBaseBooking?.currency || p.currencyCode || p.currency || 'USD';

        // Calculate Extra Nights, Extra Persons, Discounts, Base Room Price
        let baseRoomPrice = 0;
        let extraNightsPrice = 0;
        let extraPersonsPrice = 0;
        let discountVal = 0;
        let discountRemarks = '';

        relatedBookings.forEach(b => {
          const num = b.bookingNumber || '';
          const amt = parseFloat(b.totalAmount || b.amount || 0);

          if (num.includes('/EN')) {
            extraNightsPrice += Math.abs(amt);
          } else if (num.includes('/1P')) {
            extraPersonsPrice += Math.abs(amt);
          } else if (num.includes('/DISC') || amt < 0) {
            discountVal += Math.abs(amt);
            if (b.remarks) discountRemarks = b.remarks;
          } else if (!num.includes('/')) {
            baseRoomPrice += amt;
          }
        });

        // Fallback for base room price if not strictly broken down
        if (baseRoomPrice === 0 && matchedBaseBooking) {
          baseRoomPrice = parseFloat(matchedBaseBooking.totalAmount || matchedBaseBooking.amount || 0);
        }

        groups[baseRef] = {
          bookingRef: baseRef,
          guestName,
          roomNumbers,
          checkIn,
          checkOut,
          currency,
          baseRoomPrice,
          extraNightsPrice,
          extraPersonsPrice,
          discountVal,
          discountRemarks,
          payments: [],
          exchangeRate: p.exchangeRate || 1.0,
          status: p.accountantTransferStatus || 'NONE',
          rejectionReasons: [],
          paymentMethods: new Set(),
          date: p.paymentDate || p.date || ''
        };
      }

      // Add payment to this consolidated booking
      groups[baseRef].payments.push(p);
      if (p.paymentMethod || p.method) {
        groups[baseRef].paymentMethods.add(p.paymentMethod || p.method);
      }
      if (p.exchangeRate && p.exchangeRate > 1) {
        groups[baseRef].exchangeRate = p.exchangeRate;
      }
      const pDate = p.paymentDate || p.date;
      if (pDate && (!groups[baseRef].date || pDate > groups[baseRef].date)) {
        groups[baseRef].date = pDate;
      }

      // Track Overall Handover Status
      if (p.accountantTransferStatus === 'REJECTED') {
        groups[baseRef].status = 'REJECTED';
      } else if (p.accountantTransferStatus === 'PENDING' && groups[baseRef].status !== 'REJECTED') {
        groups[baseRef].status = 'PENDING';
      } else if (p.accountantTransferStatus === 'ACCEPTED' && groups[baseRef].status === 'NONE') {
        groups[baseRef].status = 'ACCEPTED';
      }

      if (p.accountantTransferStatus === 'REJECTED' && p.remarks) {
        const cleanReason = p.remarks.startsWith('Rejected: ') ? p.remarks.substring(10) : p.remarks;
        if (!groups[baseRef].rejectionReasons.includes(cleanReason)) {
          groups[baseRef].rejectionReasons.push(cleanReason);
        }
      }
    });

    // Compute aggregated financial summaries for each group
    return Object.values(groups).map(g => {
      const extrasSubtotal = g.extraNightsPrice + g.extraPersonsPrice;
      const grossBillValue = g.baseRoomPrice + extrasSubtotal;
      const netPayable = Math.max(0, grossBillValue - g.discountVal);

      // Separate Advance and Final Payments
      let advancePaid = 0;
      let finalPaid = 0;
      let totalPaidInCurrency = 0;
      let totalLkrEquivalent = 0;

      g.payments.forEach(p => {
        const pAmt = parseFloat(p.amount || p.amountInCurrency || 0);
        const pLkr = parseFloat(p.amountLkr || p.convertedAmountLkr || (pAmt * (g.currency === 'LKR' ? 1 : g.exchangeRate)));
        
        totalPaidInCurrency += pAmt;
        totalLkrEquivalent += pLkr;

        if (p.paymentType === 'FINAL' || (!p.isAdvancePayment && p.paymentType !== 'ADVANCE')) {
          finalPaid += pAmt;
        } else {
          advancePaid += pAmt;
        }
      });

      const remainingBalance = Math.max(0, netPayable - (advancePaid + finalPaid));

      return {
        ...g,
        extrasSubtotal,
        grossBillValue,
        netPayable,
        advancePaid,
        finalPaid,
        totalPaidInCurrency,
        totalLkrEquivalent,
        remainingBalance
      };
    });
  }, [payments, bookings, registrations]);

  // Filter based on search query
  const filteredBookings = React.useMemo(() => {
    if (!searchTerm.trim()) return consolidatedBookings;
    const q = searchTerm.toLowerCase();
    return consolidatedBookings.filter(b => 
      b.bookingRef.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.roomNumbers.toLowerCase().includes(q)
    );
  }, [consolidatedBookings, searchTerm]);

  // Multi-select helpers
  const allPaymentIdsSelected = React.useMemo(() => {
    const allIds = [];
    filteredBookings.forEach(g => {
      if (selectedBookingRefs.includes(g.bookingRef)) {
        g.payments.forEach(p => allIds.push(p.id));
      }
    });
    return allIds;
  }, [filteredBookings, selectedBookingRefs]);

  const toggleSelectAll = () => {
    if (selectedBookingRefs.length === filteredBookings.length) {
      setSelectedBookingRefs([]);
    } else {
      setSelectedBookingRefs(filteredBookings.map(b => b.bookingRef));
    }
  };

  const toggleSelectBooking = (ref) => {
    setSelectedBookingRefs(prev => 
      prev.includes(ref) ? prev.filter(r => r !== ref) : [...prev, ref]
    );
  };

  const toggleExpandRow = (ref) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  // Handover Action: Send to Accountant
  const handleSendToAccountant = async () => {
    if (allPaymentIdsSelected.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: allPaymentIdsSelected })
      });
      if (response.ok) {
        setMessage(`Successfully handed over ${selectedBookingRefs.length} guest booking(s) to the Accountant.`);
        setSelectedBookingRefs([]);
        fetchData();
      } else {
        setMessage('Failed to send batch handover.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error submitting batch handover to accountant.');
    } finally {
      setLoading(false);
    }
  };

  // Handover Action: Accept by Accountant
  const handleAcceptTransactions = async () => {
    if (allPaymentIdsSelected.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: allPaymentIdsSelected })
      });
      if (response.ok) {
        setMessage(`Accepted and reconciled ${selectedBookingRefs.length} guest settlement(s).`);
        setSelectedBookingRefs([]);
        fetchData();
      } else {
        setMessage('Failed to accept handovers.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error accepting transactions.');
    } finally {
      setLoading(false);
    }
  };

  // Handover Action: Reject by Accountant
  const handleRejectTransactions = async () => {
    if (allPaymentIdsSelected.length === 0) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    
    setLoading(true);
    const reasonToSend = rejectionReason;
    setShowRejectModal(false);
    setRejectionReason('');
    
    try {
      const response = await fetch(`${API_BASE}/billing/accountant/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: allPaymentIdsSelected, reason: reasonToSend })
      });
      if (response.ok) {
        setMessage(`Rejected ${selectedBookingRefs.length} handover(s) with feedback to Front Office.`);
        setSelectedBookingRefs([]);
        fetchData();
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

  // Calculate selected total LKR for banner
  const selectedTotalLkr = React.useMemo(() => {
    return filteredBookings
      .filter(b => selectedBookingRefs.includes(b.bookingRef))
      .reduce((sum, b) => sum + b.totalLkrEquivalent, 0);
  }, [filteredBookings, selectedBookingRefs]);

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Layers size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Consolidated Guest Settlement Handover</h2>
              <p className="text-xs text-slate-500 font-medium">
                {isFrontOfficer 
                  ? 'Batch & handover complete guest settlements (Advances, Extras, Discounts & Final Payments) to Accountant' 
                  : 'Audit, verify, and reconcile consolidated guest billing packages submitted by Front Office'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search booking, guest or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-60"
            />
          </div>
          <button 
            onClick={fetchData}
            title="Refresh"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        {/* Action Header */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={filteredBookings.length > 0 && selectedBookingRefs.length === filteredBookings.length}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">
                Select All ({selectedBookingRefs.length}/{filteredBookings.length} Bookings)
              </span>
            </label>
            {selectedBookingRefs.length > 0 && (
              <span className="text-[11px] font-bold bg-emerald-100/70 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Selected Total: LKR {selectedTotalLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {selectedBookingRefs.length > 0 && (
            <div className="flex items-center gap-2">
              {isAccountant && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <X size={14} /> Reject Handover ({selectedBookingRefs.length})
                </button>
              )}
              <button
                onClick={isFrontOfficer ? handleSendToAccountant : handleAcceptTransactions}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isFrontOfficer ? <Send size={14} /> : <Check size={14} />}
                {isFrontOfficer ? `Submit Batch Handover to Accountant (${selectedBookingRefs.length})` : `Accept & Reconcile Batch (${selectedBookingRefs.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Consolidated Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 w-10 text-center">Select</th>
                <th className="p-3">Booking Details</th>
                <th className="p-3 text-right">Extra Nights</th>
                <th className="p-3 text-right">Extra Persons</th>
                <th className="p-3 text-right">Extras Total</th>
                <th className="p-3 text-right">Gross Bill</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3 text-right">Net Payable</th>
                <th className="p-3 text-right">Advance Paid</th>
                <th className="p-3 text-right">Final Settlement</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">LKR Equivalent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredBookings.map((b) => {
                const isSelected = selectedBookingRefs.includes(b.bookingRef);
                const isExpanded = expandedRows.has(b.bookingRef);

                return (
                  <React.Fragment key={b.bookingRef}>
                    <tr className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBooking(b.bookingRef)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>

                      {/* Booking No / Guest / Room / Dates */}
                      <td className="p-3">
                        <div className="flex items-start gap-2">
                          <button 
                            onClick={() => toggleExpandRow(b.bookingRef)}
                            className="text-slate-400 hover:text-slate-700 pt-0.5"
                            title="Toggle Transaction Details"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-700 font-mono text-xs">{b.bookingRef}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded">
                                Rm: {b.roomNumbers}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 mt-0.5">{b.guestName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {b.checkIn} → {b.checkOut}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Extra Nights Amount */}
                      <td className="p-3 text-right font-mono font-semibold">
                        {b.extraNightsPrice > 0 ? (
                          <span className="text-indigo-700 bg-indigo-50/60 px-1.5 py-0.5 rounded">
                            {b.currency} {b.extraNightsPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Extra Person Amount */}
                      <td className="p-3 text-right font-mono font-semibold">
                        {b.extraPersonsPrice > 0 ? (
                          <span className="text-purple-700 bg-purple-50/60 px-1.5 py-0.5 rounded">
                            {b.currency} {b.extraPersonsPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Subtotal (Extra Nights + Extra Persons) */}
                      <td className="p-3 text-right font-mono font-bold">
                        {b.extrasSubtotal > 0 ? (
                          <span className="text-slate-800">
                            {b.currency} {b.extrasSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300">0.00</span>
                        )}
                      </td>

                      {/* Gross Booking / Final Bill Value */}
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {b.currency} {b.grossBillValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Discount Deductions */}
                      <td className="p-3 text-right font-mono font-semibold">
                        {b.discountVal > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold" title={b.discountRemarks}>
                            -{b.currency} {b.discountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Net Payable Amount (Post-Discount) */}
                      <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50/40">
                        {b.currency} {b.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Advance Payments Paid */}
                      <td className="p-3 text-right font-mono font-semibold">
                        {b.advancePaid > 0 ? (
                          <span className="text-amber-700 font-bold">
                            {b.currency} {b.advancePaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300">0.00</span>
                        )}
                      </td>

                      {/* Final Settlement Amount Paid */}
                      <td className="p-3 text-right font-mono font-bold">
                        {b.finalPaid > 0 ? (
                          <span className="text-emerald-700">
                            {b.currency} {b.finalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300">0.00</span>
                        )}
                        <div className="text-[9px] text-slate-400 font-sans font-medium">
                          {Array.from(b.paymentMethods).join(', ') || 'Direct'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          b.status === 'ACCEPTED' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : b.status === 'PENDING' 
                            ? 'bg-amber-100 text-amber-800' 
                            : b.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.status === 'NONE' ? (isFrontOfficer ? 'Ready' : 'Pending FO') : b.status}
                        </span>
                        {b.status === 'REJECTED' && b.rejectionReasons.length > 0 && (
                          <p className="text-[9px] text-rose-600 font-bold mt-1 max-w-[120px] mx-auto truncate" title={b.rejectionReasons.join(', ')}>
                            {b.rejectionReasons.join(', ')}
                          </p>
                        )}
                      </td>

                      {/* LKR Converted Equivalent */}
                      <td className="p-3 text-right font-mono font-black text-slate-900">
                        LKR {b.totalLkrEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Expandable Breakdown of Individual Payment Slips / Receipts */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <td colSpan="12" className="p-4 pl-12">
                          <div className="bg-white rounded-xl p-3 border border-slate-200/70 shadow-2xs space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <FileText size={12} className="text-emerald-600" /> Transaction & Receipt Receipts for {b.bookingRef}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {b.payments.map((p, idx) => (
                                <div key={p.id || idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                                        p.paymentType === 'FINAL' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {p.paymentType === 'FINAL' ? 'Final Payment' : 'Advance'}
                                      </span>
                                      <span className="font-mono text-[10px] text-slate-500">{p.receiptNumber || p.referenceNumber || 'N/A'}</span>
                                    </div>
                                    <p className="font-bold text-slate-800 mt-1">
                                      {p.currencyCode || p.currency || 'USD'} {(parseFloat(p.amount || p.amountInCurrency || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-medium">Method: {p.paymentMethod || 'Cash'} • {p.paymentDate || p.date || '-'}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] font-mono font-bold text-slate-700">
                                      LKR {(parseFloat(p.amountLkr || p.convertedAmountLkr || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    {p.slipPath && (
                                      <div className="mt-1">
                                        <a href={p.slipPath} target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-600 hover:underline font-bold">
                                          View Slip
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="12" className="p-10 text-center text-slate-400 font-semibold">
                    No transactions or settled bookings waiting for handover.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                <X size={16} /> Reject Consolidated Handover
              </h3>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }} 
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-500">
                Please enter a reason for rejecting the selected {selectedBookingRefs.length} booking package(s). The Front Office staff will review and correct the amounts.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rejection Reason</label>
                <textarea 
                  required
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Extra night charges do not match room rate or payment reference slip is missing."
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleRejectTransactions}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-500/10 transition cursor-pointer"
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
