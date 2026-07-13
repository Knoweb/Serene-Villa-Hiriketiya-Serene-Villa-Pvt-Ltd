import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Search, AlertCircle, Loader, Filter, ShieldAlert, CheckCircle, User, Calendar, Receipt } from 'lucide-react';

const HideDetails = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [registrations, setRegistrations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMethod, setFilterMethod] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch registrations
      const regRes = await fetch(`${API_BASE}/guest-registrations?size=1000`);
      let regData = [];
      if (regRes.ok) {
        const pageResult = await regRes.json();
        regData = pageResult.content || [];
      }

      // Fetch bookings
      const bookRes = await fetch(`${API_BASE}/bookings`);
      let bookData = [];
      if (bookRes.ok) {
        bookData = await bookRes.json();
      }

      // Fetch payments
      const payRes = await fetch(`${API_BASE}/payments`);
      let payData = [];
      if (payRes.ok) {
        payData = await payRes.json();
      }

      setRegistrations(regData);
      setBookings(bookData);
      setPayments(payData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Guard access
  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-rose-600 shadow-sm space-y-3">
        <ShieldAlert className="h-10 w-10 mx-auto" />
        <h3 className="text-base font-bold text-slate-805">Access Denied</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Only administrators have permission to manage cashier payment visibility settings.
        </p>
      </div>
    );
  }

  // Toggle individual payment visibility
  const handleToggleVisibility = async (paymentId, isCurrentlyHidden) => {
    const endpoint = isCurrentlyHidden ? 'unhide' : 'hide';
    try {
      const res = await fetch(`${API_BASE}/payments/${paymentId}/${endpoint}`, {
        method: 'PUT'
      });
      if (res.ok) {
        setActionSuccess(`Payment successfully ${isCurrentlyHidden ? 'visible' : 'hidden'} from Front Office.`);
        fetchData();
        setTimeout(() => setActionSuccess(''), 3000);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      setActionError(err.message || 'Error updating status');
      setTimeout(() => setActionError(''), 3000);
    }
  };

  // Bulk visibility change by payment method
  const handleBulkVisibility = async (hide) => {
    if (filterMethod === 'All') {
      alert('Please select a specific payment method from the dropdown to perform bulk hide/show actions.');
      return;
    }

    const action = hide ? 'hide-by-method' : 'unhide-by-method';
    try {
      const res = await fetch(`${API_BASE}/payments/${action}?method=${filterMethod}`, {
        method: 'PUT'
      });
      if (res.ok) {
        setActionSuccess(`All ${filterMethod} payments have been successfully ${hide ? 'hidden from' : 'shown to'} Front Office.`);
        fetchData();
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        throw new Error('Bulk update failed');
      }
    } catch (err) {
      setActionError(err.message || 'Error during bulk visibility update');
      setTimeout(() => setActionError(''), 3000);
    }
  };

  // Prepare registrations with their bookings and payments
  const mappedGuests = registrations.map(reg => {
    const booking = bookings.find(b => b.guestRegistrationId === reg.id);
    const guestPayments = booking ? payments.filter(p => p.bookingId === booking.id) : [];
    return {
      ...reg,
      booking,
      payments: guestPayments
    };
  });

  // Filter based on dropdown and search query
  const filteredGuests = mappedGuests.filter(guest => {
    // Search query matching
    const matchesSearch = guest.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guest.passportNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guest.booking?.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    // Payment method filter matching
    if (filterMethod === 'All') {
      return matchesSearch;
    } else {
      // Must have at least one payment of the selected payment method
      const hasMatchingPayment = guest.payments.some(p => p.paymentMethod?.toLowerCase() === filterMethod.toLowerCase());
      return matchesSearch && hasMatchingPayment;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Hide Details</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Filter registered guests and toggle cashier visibility of their payments</p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-pulse">
          <CheckCircle className="h-4 w-4" /> {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4" /> {actionError}
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* Method Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Registered Guests</option>
              <option value="Cash">Guests with Cash Payments</option>
              <option value="Card">Guests with Card Payments</option>
              <option value="Bank Transfer">Guests with Bank Transfers</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest name, passport, booking ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Bulk Action Buttons */}
        {filterMethod !== 'All' && (
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => handleBulkVisibility(true)}
              className="bg-rose-650 hover:bg-rose-700 text-rose-700 bg-rose-50 border border-rose-100 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <EyeOff size={13} /> Hide All {filterMethod}
            </button>
            <button
              onClick={() => handleBulkVisibility(false)}
              className="bg-emerald-650 hover:bg-emerald-700 text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Eye size={13} /> Show All {filterMethod}
            </button>
          </div>
        )}
      </div>

      {/* Guest Registrations Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
            <Loader className="h-5 w-5 animate-spin text-emerald-600" /> Loading guests list...
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
            No registered guests found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Guest Info</th>
                  <th className="p-4">Stay Dates & Room</th>
                  <th className="p-4">Booking Ref</th>
                  <th className="p-4">Payment Transactions Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                {filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/10 transition align-top">
                    {/* Guest Info */}
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-emerald-55 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                          {g.guestName?.charAt(0)}
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm">{g.guestName}</p>
                      </div>
                      <p className="text-[10px] text-slate-450 font-mono pl-9">PP: {g.passportNumber} • {g.whatsappNumber}</p>
                    </td>

                    {/* Stay Dates & Room */}
                    <td className="p-4 space-y-1 font-medium">
                      <p className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> In: {g.checkInDate}</p>
                      <p className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> Out: {g.checkOutDate}</p>
                      <p className="text-[10px] text-emerald-700 font-bold mt-1">
                        {g.booking ? `Room ${g.booking.roomNumber || 'No Room'} (${g.booking.roomType})` : 'Unallocated'}
                      </p>
                    </td>

                    {/* Booking Ref */}
                    <td className="p-4">
                      {g.booking ? (
                        <div>
                          <p className="font-bold text-slate-800">{g.booking.bookingNumber}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Total: LKR {g.booking.totalAmount?.toLocaleString()}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A</span>
                      )}
                    </td>

                    {/* Payments Details */}
                    <td className="p-4 space-y-2 max-w-sm">
                      {g.payments.length === 0 ? (
                        <span className="text-slate-400 font-normal italic">No payments recorded yet</span>
                      ) : (
                        <div className="space-y-1.5">
                          {g.payments
                            .filter(p => filterMethod === 'All' || p.paymentMethod?.toLowerCase() === filterMethod.toLowerCase())
                            .map((p) => (
                              <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50/50 border border-slate-100 rounded-lg text-[10px]">
                                <div className="space-y-0.5">
                                  <p className="font-extrabold text-slate-800">
                                    {p.amountInCurrency?.toLocaleString()} {p.currency} 
                                    <span className="text-[9px] text-slate-400 font-normal"> ({p.paymentMethod})</span>
                                  </p>
                                  <p className="text-[9px] text-slate-450 font-normal font-mono">{p.paymentDate || p.createdAt?.split('T')[0]}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                    p.isHiddenFromFrontOffice 
                                      ? 'bg-rose-100 text-rose-700' 
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {p.isHiddenFromFrontOffice ? 'Hidden' : 'Visible'}
                                  </span>

                                  <button
                                    onClick={() => handleToggleVisibility(p.id, p.isHiddenFromFrontOffice)}
                                    className={`p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-550`}
                                    title={p.isHiddenFromFrontOffice ? 'Show to Cashier' : 'Hide from Cashier'}
                                  >
                                    {p.isHiddenFromFrontOffice ? (
                                      <EyeOff size={14} className="text-rose-600" />
                                    ) : (
                                      <Eye size={14} className="text-emerald-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HideDetails;
