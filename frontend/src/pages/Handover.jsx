import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Check, X, Send, CreditCard, ChevronDown, ChevronUp, Layers, FileText, 
  DollarSign, Calendar, User, Search, RefreshCw, AlertCircle, Sparkles, CheckCircle2,
  Clock, ArrowUpRight, BedDouble, Tag, ShieldCheck
} from 'lucide-react';

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
  const [expandedCards, setExpandedCards] = useState(new Set());
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
      let baseRef = rawRef;
      if (rawRef.includes('/')) {
        baseRef = rawRef.split('/')[0].trim();
      }
      if (!baseRef) {
        baseRef = `NO-REF-${p.id}`;
      }

      if (!groups[baseRef]) {
        const matchedBaseBooking = bookings.find(b => {
          const bNum = (b.bookingNumber || '').trim().toLowerCase();
          return bNum === baseRef.toLowerCase() || bNum.startsWith(baseRef.toLowerCase() + '/');
        });

        const regId = matchedBaseBooking?.guestRegistrationId || p.guestRegistrationId;
        const matchedReg = registrations.find(r => r.id === regId) || {};

        const relatedBookings = bookings.filter(b => {
          if (!b.bookingNumber) return false;
          const bNum = b.bookingNumber.trim().toLowerCase();
          const targetBase = baseRef.toLowerCase();
          return bNum === targetBase || bNum.startsWith(targetBase + '/') || (regId && b.guestRegistrationId === regId);
        });

        const roomNumbers = matchedBaseBooking?.roomNumber || matchedReg?.roomNumber || '-';
        const guestName = p.guestName || matchedReg?.guestName || matchedBaseBooking?.guestName || 'Guest';
        const checkIn = matchedBaseBooking?.checkInDate || matchedReg?.checkInDate || '-';
        const checkOut = matchedBaseBooking?.checkOutDate || matchedReg?.checkOutDate || '-';
        const currency = matchedBaseBooking?.currency || p.currencyCode || p.currency || 'USD';

        let baseRoomPrice = 0;
        let extraNightsPrice = 0;
        let extraPersonsPrice = 0;
        let discountVal = 0;
        let discountRemarks = '';

        relatedBookings.forEach(b => {
          const num = b.bookingNumber || '';
          const amt = parseFloat(b.totalAmount || b.amount || 0);

          if (num.includes('/EN') || num.includes('/1N')) {
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

    return Object.values(groups).map(g => {
      const extrasSubtotal = g.extraNightsPrice + g.extraPersonsPrice;
      const grossBillValue = g.baseRoomPrice + extrasSubtotal;
      const netPayable = Math.max(0, grossBillValue - g.discountVal);

      let advancePaid = 0;
      let extraNightsPaid = 0;
      let extraPersonsPaid = 0;
      let finalPaid = 0;
      let totalPaidInCurrency = 0;
      let totalLkrEquivalent = 0;

      g.payments.forEach(p => {
        const pAmt = parseFloat(p.amount || p.amountInCurrency || 0);
        const pLkr = parseFloat(p.amountLkr || p.convertedAmountLkr || (pAmt * (g.currency === 'LKR' ? 1 : g.exchangeRate)));
        
        totalPaidInCurrency += pAmt;
        totalLkrEquivalent += pLkr;

        const ref = (p.referenceNumber || p.receiptNumber || p.bookingRef || '').toUpperCase();
        const rem = (p.remarks || '').toUpperCase();
        const isExtraNight = ref.includes('/1N') || ref.includes('/EN') || rem.includes('EXTRA NIGHT');
        const isExtraPerson = ref.includes('/1P') || rem.includes('ONE PERSON') || rem.includes('EXTRA PERSON');
        const isFinal = p.paymentType === 'FINAL' || rem.includes('FINAL') || rem.includes('SETTLEMENT');

        if (isExtraNight) {
          extraNightsPaid += pAmt;
        } else if (isExtraPerson) {
          extraPersonsPaid += pAmt;
        } else if (isFinal) {
          finalPaid += pAmt;
        } else {
          advancePaid += pAmt;
        }
      });

      const remainingBalance = Math.max(0, netPayable - (advancePaid + extraNightsPaid + extraPersonsPaid + finalPaid));

      return {
        ...g,
        extrasSubtotal,
        grossBillValue,
        netPayable,
        advancePaid,
        extraNightsPaid,
        extraPersonsPaid,
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

  const toggleExpandCard = (ref) => {
    setExpandedCards(prev => {
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
        setMessage(`Successfully sent ${selectedBookingRefs.length} guest handover(s) to the Accountant.`);
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
        setMessage(`Successfully approved ${selectedBookingRefs.length} guest handover(s).`);
        setSelectedBookingRefs([]);
        fetchData();
      } else {
        setMessage('Failed to accept batch handover.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error approving batch handover.');
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="text-emerald-600" size={22} />
            {isFrontOfficer ? 'Cash & Payment Handover to Accountant' : 'Accountant Payment Verification & Acceptance'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isFrontOfficer 
              ? 'Consolidated guest billing settlements ready for verification and transfer to Accountant.' 
              : 'Review settled guest bills, examine advance & extra slips, and reconcile daily handovers.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="Search booking ref, guest..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 w-56 font-medium shadow-2xs"
            />
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition cursor-pointer shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
        </div>
      </div>

      {/* Status / Notice Message */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-950 cursor-pointer font-bold">✕</button>
        </div>
      )}

      {/* Action Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200/80 transition">
            <input 
              type="checkbox"
              checked={filteredBookings.length > 0 && selectedBookingRefs.length === filteredBookings.length}
              onChange={toggleSelectAll}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">
              Select All ({selectedBookingRefs.length} / {filteredBookings.length} Cards)
            </span>
          </label>

          {selectedBookingRefs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">•</span>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                Total Handover: LKR {selectedTotalLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {selectedBookingRefs.length > 0 && (
          <div className="flex items-center gap-2">
            {isAccountant && (
              <button
                onClick={() => setShowRejectModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shadow-rose-600/10 cursor-pointer"
              >
                <X size={15} /> Reject Selected ({selectedBookingRefs.length})
              </button>
            )}
            <button
              onClick={isFrontOfficer ? handleSendToAccountant : handleAcceptTransactions}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-5 rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {isFrontOfficer ? <Send size={15} /> : <Check size={15} />}
              {isFrontOfficer 
                ? `Send ${selectedBookingRefs.length} Booking(s) to Accountant` 
                : `Approve & Reconcile ${selectedBookingRefs.length} Booking(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Modern Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredBookings.map((b) => {
          const isSelected = selectedBookingRefs.includes(b.bookingRef);
          const isExpanded = expandedCards.has(b.bookingRef);

          return (
            <div 
              key={b.bookingRef}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                isSelected 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/5' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectBooking(b.bookingRef)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-emerald-800 tracking-tight">{b.bookingRef}</span>
                      <span className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                        Room {b.roomNumbers}
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-slate-800 mt-0.5">{b.guestName}</h3>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    b.status === 'ACCEPTED' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : b.status === 'PENDING' 
                      ? 'bg-amber-100 text-amber-800' 
                      : b.status === 'REJECTED' 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-blue-50 text-blue-800 border border-blue-100'
                  }`}>
                    {b.status === 'NONE' ? (isFrontOfficer ? '● Ready for Handover' : 'Pending FO') : `● ${b.status}`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-medium">
                    {b.checkIn} → {b.checkOut}
                  </span>
                </div>
              </div>

              {/* Card Body: Financial Summary Tiles */}
              <div className="p-4 space-y-3.5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gross Total</p>
                    <p className="font-mono font-bold text-xs text-slate-800 mt-0.5">
                      {b.currency} {b.grossBillValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50/40 border border-emerald-100/60 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Net Payable</p>
                    <p className="font-mono font-black text-xs text-emerald-900 mt-0.5">
                      {b.currency} {b.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-50/40 border border-amber-100/60 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Advance Paid</p>
                    <p className="font-mono font-bold text-xs text-amber-800 mt-0.5">
                      {b.currency} {b.advancePaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-2.5 bg-blue-50/40 border border-blue-100/60 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-blue-700 tracking-wider">Final Settlement</p>
                    <p className="font-mono font-bold text-xs text-blue-800 mt-0.5">
                      {b.currency} {b.finalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {b.extraNightsPrice > 0 && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <BedDouble size={11} /> Extra Night: {b.currency} {b.extraNightsPrice.toLocaleString()}
                    </span>
                  )}
                  {b.extraPersonsPrice > 0 && (
                    <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <User size={11} /> Extra Person: {b.currency} {b.extraPersonsPrice.toLocaleString()}
                    </span>
                  )}
                  {b.discountVal > 0 && (
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Tag size={11} /> Discount: -{b.currency} {b.discountVal.toLocaleString()}
                    </span>
                  )}
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg ml-auto">
                    Method: {Array.from(b.paymentMethods).join(', ') || 'Direct'}
                  </span>
                </div>

                {b.status === 'REJECTED' && b.rejectionReasons.length > 0 && (
                  <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                    <p className="font-bold flex items-center gap-1 text-[11px] text-rose-900">
                      <AlertCircle size={13} /> Rejection Reason from Accountant:
                    </p>
                    <p className="mt-0.5 text-[11px]">{b.rejectionReasons.join(', ')}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Total Handover LKR</span>
                    <p className="font-mono font-black text-sm text-slate-900">
                      LKR {b.totalLkrEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <button 
                    onClick={() => toggleExpandCard(b.bookingRef)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 transition cursor-pointer"
                  >
                    {isExpanded ? (
                      <>Hide Transactions <ChevronUp size={13} /></>
                    ) : (
                      <>View {b.payments.length} Transaction(s) <ChevronDown size={13} /></>
                    )}
                  </button>
                </div>

                {/* Expanded Individual Receipts & Breakdown */}
                {isExpanded && (
                  <div className="pt-2 space-y-2 border-t border-slate-100 bg-slate-50/60 p-3 rounded-xl">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Itemized Handover Breakdown & Timestamps</p>
                      <span className="text-[9px] font-bold text-slate-400">{b.payments.length} Item(s)</span>
                    </div>
                    <div className="space-y-1.5">
                      {b.payments.map((p, pIdx) => {
                        const ref = (p.referenceNumber || p.receiptNumber || p.bookingRef || '').toUpperCase();
                        const rem = (p.remarks || '').toUpperCase();
                        const isExtraNight = ref.includes('/1N') || ref.includes('/EN') || rem.includes('EXTRA NIGHT');
                        const isExtraPerson = ref.includes('/1P') || rem.includes('ONE PERSON') || rem.includes('EXTRA PERSON');
                        const isFinal = p.paymentType === 'FINAL' || rem.includes('FINAL') || rem.includes('SETTLEMENT');
                        
                        const itemTypeLabel = isExtraNight ? 'Extra Night' : isExtraPerson ? 'One Person' : isFinal ? 'Final Settlement' : 'Advance Payment';
                        const itemBadgeColor = isExtraNight ? 'bg-indigo-100 text-indigo-800' : isExtraPerson ? 'bg-purple-100 text-purple-800' : isFinal ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';
                        
                        const paidTimestamp = p.paymentDate 
                          ? `${p.paymentDate} ${p.createdAt ? (new Date(p.createdAt)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}`.trim()
                          : (p.createdAt ? new Date(p.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '-');

                        const handoverTimestamp = p.sentToAccountantAt 
                          ? new Date(p.sentToAccountantAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
                          : (p.accountantTransferStatus === 'PENDING' || p.accountantTransferStatus === 'ACCEPTED'
                              ? (p.createdAt ? new Date(p.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '-')
                              : 'Pending Handover');

                        return (
                          <div key={p.id || pIdx} className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between text-xs hover:border-slate-300 transition">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${itemBadgeColor}`}>
                                  {itemTypeLabel}
                                </span>
                                <span className="font-mono font-bold text-slate-800 text-[10px]">
                                  {p.receiptNumber || p.referenceNumber || `Item #${p.id}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium flex-wrap">
                                <span>Method: <strong className="text-slate-700">{p.paymentMethod || 'Cash'}</strong></span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Calendar size={10} className="text-blue-600" />
                                  Paid: <strong className="text-slate-800">{paidTimestamp}</strong>
                                </span>
                                {handoverTimestamp !== 'Pending Handover' && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-slate-600">
                                      <Clock size={10} className="text-emerald-600" />
                                      Handover: <strong className="text-slate-800">{handoverTimestamp}</strong>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-mono font-black text-slate-900 text-xs">
                                {p.currencyCode || p.currency || 'USD'} {(parseFloat(p.amount || p.amountInCurrency || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] font-mono font-semibold text-emerald-800">
                                LKR {(parseFloat(p.amountLkr || p.convertedAmountLkr || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              {p.slipPath && (
                                <a 
                                  href={p.slipPath} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[9px] text-emerald-600 hover:underline font-bold inline-block mt-0.5"
                                >
                                  View Attached Slip ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">All caught up!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No pending guest settlements waiting for handover or accountant approval.
            </p>
          </div>
        )}
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
                Please enter a reason for rejecting the selected {selectedBookingRefs.length} booking package(s). Front Office staff will review and make corrections.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rejection Reason</label>
                <textarea 
                  required
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Extra night rate does not match or bank slip reference is missing."
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
