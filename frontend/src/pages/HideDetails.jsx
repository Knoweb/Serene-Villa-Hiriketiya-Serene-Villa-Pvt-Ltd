import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Search, AlertCircle, Loader, Filter, ShieldAlert, CheckCircle } from 'lucide-react';

const HideDetails = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMethod, setFilterMethod] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch payments
      const payRes = await fetch(`${API_BASE}/payments`);
      let payData = [];
      if (payRes.ok) {
        payData = await payRes.json();
      }

      // Fetch bookings
      const bookRes = await fetch(`${API_BASE}/bookings`);
      let bookData = [];
      if (bookRes.ok) {
        bookData = await bookRes.json();
      }

      // Fetch registrations
      const regRes = await fetch(`${API_BASE}/guest-registrations?size=1000`);
      let regData = [];
      if (regRes.ok) {
        const pageResult = await regRes.json();
        regData = pageResult.content || [];
      }

      // Map details
      const mapped = payData.map(p => {
        const booking = bookData.find(b => b.id === p.bookingId);
        const registration = booking ? regData.find(r => r.id === booking.guestRegistrationId) : null;
        return {
          ...p,
          guestName: registration ? registration.guestName : 'Unknown Guest',
          bookingRef: booking ? booking.bookingNumber : 'N/A'
        };
      });

      // Sort by date descending
      mapped.sort((a, b) => new Date(b.createdAt || b.paymentDate) - new Date(a.createdAt || a.paymentDate));
      setPayments(mapped);
    } catch (err) {
      console.error('Error fetching hide details:', err);
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
  const handleToggleVisibility = async (payment) => {
    const isHidden = payment.isHiddenFromFrontOffice;
    const endpoint = isHidden ? 'unhide' : 'hide';
    try {
      const res = await fetch(`${API_BASE}/payments/${payment.id}/${endpoint}`, {
        method: 'PUT'
      });
      if (res.ok) {
        setActionSuccess(`Payment successfully ${isHidden ? 'visible' : 'hidden'} from Front Office.`);
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

  // Bulk visibility change
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

  // Filtering
  const filteredPayments = payments.filter(p => {
    const matchesMethod = filterMethod === 'All' || p.paymentMethod?.toLowerCase() === filterMethod.toLowerCase();
    const matchesSearch = p.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.bookingRef?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Hide Payment Details</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Filter and hide specific transaction records from Front Office Cashier view</p>
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
              <option value="All">All Payment Methods</option>
              <option value="Cash">Cash Payments</option>
              <option value="Card">Card Payments</option>
              <option value="Bank Transfer">Bank Transfer Payments</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest, booking ref, reference..."
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <EyeOff size={13} /> Hide All {filterMethod}
            </button>
            <button
              onClick={() => handleBulkVisibility(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Eye size={13} /> Show All {filterMethod}
            </button>
          </div>
        )}
      </div>

      {/* Payments List Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
            <Loader className="h-5 w-5 animate-spin text-emerald-600" /> Loading transactions...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
            No payments found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Booking Ref</th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Front Office Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/20 transition">
                    <td className="p-4 font-mono text-slate-500">{p.paymentDate || p.createdAt?.split('T')[0]}</td>
                    <td className="p-4 font-bold text-slate-700">{p.bookingRef}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{p.guestName}</p>
                      {p.referenceNumber && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {p.referenceNumber}</p>}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-900">
                      {p.amountInCurrency?.toLocaleString()} {p.currency}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isHiddenFromFrontOffice 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.isHiddenFromFrontOffice ? (
                          <>
                            <EyeOff size={10} /> Hidden
                          </>
                        ) : (
                          <>
                            <Eye size={10} /> Visible
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleVisibility(p)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition cursor-pointer ${
                          p.isHiddenFromFrontOffice 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.isHiddenFromFrontOffice ? 'Unhide' : 'Hide'}
                      </button>
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
