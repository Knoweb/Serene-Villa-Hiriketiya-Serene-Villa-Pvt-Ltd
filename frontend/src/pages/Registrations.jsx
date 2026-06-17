import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Plus, 
  QrCode, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader, 
  AlertCircle,
  User,
  Calendar,
  Phone,
  Globe,
  FileText,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Registrations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === 'ADMIN';
  const isFrontOfficer = user.role === 'FRONT_OFFICER';

  // State
  const [registrations, setRegistrations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Empty means 'All'
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQr, setShowQr] = useState(false);

  // Selected Guest for Details Panel
  const [selectedReg, setSelectedReg] = useState(null);
  
  // Booking Form State for selected guest
  const [bookingForm, setBookingForm] = useState({
    roomType: 'Deluxe Room',
    room: '',
    bookingType: 'Direct',
    bookingNumber: '',
    boardBasis: 'Room Only',
    remarks: '',
    amount: '',
    paymentStatus: 'Pending',
    registrationStatus: 'Pending'
  });
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const pageSize = 8;

  // 1. Debounce Search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset page to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when status filter changes
  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(0);
  };

  // 2. Fetch Registrations and Bookings from Backend
  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch registrations
      const regRes = await fetch(
        `http://localhost:8080/api/guest-registrations?search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&role=${user.role}&page=${page}&size=${pageSize}`
      );
      if (!regRes.ok) throw new Error('Failed to fetch registrations');
      const regData = await regRes.json();
      setRegistrations(regData.content);
      setTotalPages(regData.totalPages);
      setTotalElements(regData.totalElements);

      // Fetch all bookings to cross-reference allocation
      const bookingRes = await fetch('http://localhost:8080/api/bookings');
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        setBookings(bookingData);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [debouncedSearch, statusFilter, page]);

  // Toggle Visibility (Admin Only)
  const handleToggleVisibility = async (reg, e) => {
    e.stopPropagation(); // Prevent opening details panel
    const endpoint = reg.isHiddenFromFrontOffice ? 'unhide' : 'hide';
    try {
      const response = await fetch(`http://localhost:8080/api/guest-registrations/${reg.id}/${endpoint}`, {
        method: 'PUT'
      });
      if (response.ok) {
        fetchRegistrations();
        if (selectedReg && selectedReg.id === reg.id) {
          setSelectedReg({ ...selectedReg, isHiddenFromFrontOffice: !reg.isHiddenFromFrontOffice });
        }
      }
    } catch (err) {
      console.error('Failed to change visibility', err);
    }
  };

  // Select Guest and Populate Booking Form
  const handleSelectGuest = (reg) => {
    setSelectedReg(reg);
    const associatedBooking = bookings.find(b => b.guestRegistrationId === reg.id);
    
    if (associatedBooking) {
      setBookingForm({
        roomType: associatedBooking.roomType || 'Deluxe Room',
        room: associatedBooking.roomNumber || '',
        bookingType: associatedBooking.bookingType || 'Direct',
        bookingNumber: associatedBooking.bookingNumber || '',
        boardBasis: associatedBooking.boardBasis || 'Room Only',
        remarks: associatedBooking.remarks || '',
        amount: associatedBooking.totalAmount || '',
        paymentStatus: reg.paymentStatus || 'Pending',
        registrationStatus: reg.registrationStatus || 'Pending'
      });
    } else {
      // Default blank/pre-filled values
      setBookingForm({
        roomType: 'Deluxe Room',
        room: '',
        bookingType: 'Direct',
        bookingNumber: `B-${1000 + reg.id}`,
        boardBasis: 'Room Only',
        remarks: '',
        amount: '',
        paymentStatus: reg.paymentStatus || 'Pending',
        registrationStatus: reg.registrationStatus || 'Pending'
      });
    }
    setBookingSuccess(false);
  };

  // Submit Booking Form
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setUpdatingBooking(true);
    setBookingSuccess(false);

    try {
      const response = await fetch(`http://localhost:8080/api/guest-registrations/${selectedReg.id}/booking-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingForm)
      });

      if (!response.ok) throw new Error('Failed to update booking details');
      
      const updatedReg = await response.json();
      setSelectedReg(updatedReg);
      setBookingSuccess(true);
      
      // Refresh list to update status badges
      fetchRegistrations();
    } catch (err) {
      alert(err.message || 'Error updating booking details');
    } finally {
      setUpdatingBooking(false);
    }
  };

  // Cross-reference booking for row display
  const getBookingForReg = (regId) => {
    return bookings.find(b => b.guestRegistrationId === regId);
  };

  const qrUrl = window.location.origin + '/qr-register';
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Guest Registrations</h2>
          <p className="text-sm text-slate-505 font-medium mt-0.5">Manage public QR submissions and allocate booking details</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowQr(true)} 
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <QrCode className="h-4 w-4 text-emerald-600" /> Guest Registration QR Code
          </button>
          <button 
            onClick={() => navigate('/qr-register')} 
            className="bg-emerald-600 hover:bg-emerald-650 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
          >
            <Plus className="h-4 w-4" /> Guest QR Form Link
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, passport, WhatsApp, nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-400 text-slate-750"
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid: Table + Sidebar Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Guest Table Area */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Loader className="h-6 w-6 text-emerald-650 animate-spin mr-2" />
              <span className="font-bold text-slate-550 text-sm">Loading registrations...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="p-4">Guest</th>
                      <th className="p-4">Passport / WhatsApp</th>
                      <th className="p-4">Dates & Room</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-655 font-semibold">
                    {registrations.map((reg) => {
                      const booking = getBookingForReg(reg.id);
                      const isSelected = selectedReg && selectedReg.id === reg.id;
                      
                      return (
                        <tr 
                          key={reg.id} 
                          onClick={() => handleSelectGuest(reg)}
                          className={`hover:bg-slate-50/20 cursor-pointer transition ${
                            isSelected ? 'bg-emerald-50/30 hover:bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="p-4">
                            <p className="font-extrabold text-slate-900 text-sm">{reg.guestName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{reg.nationality}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-mono text-slate-800">{reg.passportNumber}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{reg.whatsappNumber || reg.whatsAppNumber}</p>
                          </td>
                          <td className="p-4">
                            <p>In: {reg.checkInDate}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">
                              {booking ? `${booking.roomNumber || 'No Room'} (${booking.roomType})` : 'Unallocated'}
                            </p>
                          </td>
                          <td className="p-4 space-y-1">
                            <div>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                reg.paymentStatus === 'Paid' 
                                  ? 'bg-green-100 text-green-700' 
                                  : reg.paymentStatus === 'Unpaid' 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {reg.paymentStatus}
                              </span>
                            </div>
                            <div>
                              <span className={`inline-block px-2 py-0.5 bg-slate-50 rounded text-[9px] text-slate-500 font-bold border border-slate-100/50`}>
                                {reg.registrationStatus}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isAdmin && (
                                <button
                                  onClick={(e) => handleToggleVisibility(reg, e)}
                                  title={reg.isHiddenFromFrontOffice ? "Show to Front Office" : "Hide from Front Office"}
                                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
                                >
                                  {reg.isHiddenFromFrontOffice ? (
                                    <Eye className="h-3.5 w-3.5 text-rose-600" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleSelectGuest(reg)}
                                className="inline-flex items-center py-1.5 px-3 rounded-xl bg-emerald-550 hover:bg-emerald-600 text-white text-[11px] font-bold transition shadow-sm"
                              >
                                Manage
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400 font-bold">
                          No guest registrations match your search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
                <div>
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} guests
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx)}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                        page === idx 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1 || totalPages === 0}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Details and Booking Form Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-6">
          {selectedReg ? (
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-855 text-lg font-bold uppercase shadow-sm">
                    {selectedReg.guestName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">{selectedReg.guestName}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Globe className="h-3 w-3" /> {selectedReg.nationality}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReg(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Guest Core Details */}
              <div className="space-y-3 text-xs bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Guest Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Passport Number</p>
                    <p className="font-mono font-bold text-slate-805 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-slate-400" /> {selectedReg.passportNumber}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">WhatsApp Number</p>
                    <p className="font-bold text-slate-805 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" /> {selectedReg.whatsappNumber || selectedReg.whatsAppNumber}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Check-In</p>
                    <p className="font-bold text-slate-805 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" /> {selectedReg.checkInDate}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Check-Out</p>
                    <p className="font-bold text-slate-850 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" /> {selectedReg.checkOutDate}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2 flex justify-between border-t border-slate-100 pt-2 mt-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total Stay Nights:</span>
                    <span className="font-extrabold text-emerald-700">{selectedReg.numberOfNights || selectedReg.nights} Nights</span>
                  </div>
                  <div className="space-y-1 col-span-2 flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Pax (Adults / Kids):</span>
                    <span className="font-extrabold text-slate-800">{selectedReg.adults} Adults / {selectedReg.children} Children</span>
                  </div>
                </div>
              </div>

              {/* Complete Booking Form (Front Office Update) */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Allocate & Complete Booking</h4>
                
                {bookingSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-pulse">
                    <Check className="h-4 w-4" /> Booking details updated successfully!
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Room Type */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room Type</label>
                    <select
                      value={bookingForm.roomType}
                      disabled={isFrontOfficer === false && isAdmin === false} // Read-only for Accountant
                      onChange={(e) => setBookingForm({...bookingForm, roomType: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700"
                    >
                      <option value="Deluxe Room">Deluxe Room</option>
                      <option value="Suite Room">Suite Room</option>
                      <option value="Standard Room">Standard Room</option>
                      <option value="Budget Room">Budget Room</option>
                    </select>
                  </div>

                  {/* Room */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room No</label>
                    <input
                      type="text"
                      placeholder="e.g. 101"
                      disabled={isFrontOfficer === false && isAdmin === false}
                      value={bookingForm.room}
                      onChange={(e) => setBookingForm({...bookingForm, room: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700"
                    />
                  </div>

                  {/* Booking Type */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Channel</label>
                    <select
                      value={bookingForm.bookingType}
                      disabled={isFrontOfficer === false && isAdmin === false}
                      onChange={(e) => setBookingForm({...bookingForm, bookingType: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700"
                    >
                      <option value="Direct">Direct</option>
                      <option value="Booking.com">Booking.com</option>
                    </select>
                  </div>

                  {/* Booking Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. B-1002"
                      disabled={isFrontOfficer === false && isAdmin === false}
                      value={bookingForm.bookingNumber}
                      onChange={(e) => setBookingForm({...bookingForm, bookingNumber: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 font-mono"
                    />
                  </div>

                  {/* Board Basis */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Board Basis</label>
                    <select
                      value={bookingForm.boardBasis}
                      disabled={isFrontOfficer === false && isAdmin === false}
                      onChange={(e) => setBookingForm({...bookingForm, boardBasis: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700"
                    >
                      <option value="Room Only">Room Only</option>
                      <option value="Half Board">Half Board</option>
                      <option value="Full Board">Full Board</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Amount (LKR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 75000"
                      disabled={isFrontOfficer === false && isAdmin === false}
                      value={bookingForm.amount}
                      onChange={(e) => setBookingForm({...bookingForm, amount: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-750 font-mono"
                    />
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status</label>
                    <select
                      value={bookingForm.paymentStatus}
                      disabled={isFrontOfficer === false && isAdmin === false}
                      onChange={(e) => setBookingForm({...bookingForm, paymentStatus: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-700"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  {/* Booking / Registration Status */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stay Status</label>
                    <select
                      value={bookingForm.registrationStatus}
                      disabled={isFrontOfficer === false && isAdmin === false}
                      onChange={(e) => setBookingForm({...bookingForm, registrationStatus: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-700"
                    >
                      <option value="Pending">Pending</option>
                      <option value="CheckedIn">Checked In</option>
                      <option value="CheckedOut">Checked Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remarks / Special Notes</label>
                    <textarea
                      placeholder="e.g. Needs early check-in, extra bedding."
                      disabled={isFrontOfficer === false && isAdmin === false}
                      value={bookingForm.remarks}
                      onChange={(e) => setBookingForm({...bookingForm, remarks: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 min-h-[50px] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Save Buttons */}
                {(isFrontOfficer || isAdmin) && (
                  <button
                    type="submit"
                    disabled={updatingBooking}
                    className="w-full bg-emerald-600 hover:bg-emerald-650 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    {updatingBooking ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Save Booking Details
                  </button>
                )}
              </form>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <User className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-bold text-xs">No Guest Selected</p>
              <p className="text-[10px] text-slate-450 max-w-[180px] mx-auto leading-relaxed">
                Click on any guest registration in the list to view files, check-in info, and complete room allocations.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* QR Code Modal Flyer */}
      {showQr && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-sm rounded-2xl p-8 space-y-6 text-center shadow-xl relative">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Serene Villa Check-In QR</h3>
              <p className="text-xs text-slate-505 font-medium mt-1">Scan this QR code to fill the Guest Registration Form</p>
            </div>
            
            <div className="flex justify-center p-4 bg-emerald-50/20 border border-emerald-100/40 rounded-2xl max-w-[270px] mx-auto">
              <img 
                src={qrImageSrc} 
                alt="Registration QR Code" 
                className="w-full h-auto object-contain rounded"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-slate-450 break-all bg-slate-50 p-2 rounded-lg font-mono select-all">
                {qrUrl}
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2 text-xs">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition"
              >
                Print Flyer
              </button>
              <button 
                onClick={() => setShowQr(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registrations;
