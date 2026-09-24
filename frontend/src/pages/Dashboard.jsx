import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Search, 
  ArrowUpRight, 
  Home, 
  Clock, 
  Percent, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  BedDouble, 
  CheckCircle,
  AlertTriangle,
  Moon,
  Tag,
  PieChart,
  Receipt,
  CreditCard,
  Sparkles
} from 'lucide-react';
import RoomIncomeAnalytics from '../components/RoomIncomeAnalytics';

const Dashboard = () => {
  const { user, currentProperty } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  
  const [registrations, setRegistrations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomsCount, setRoomsCount] = useState(0);
  const [staff, setStaff] = useState([]);
  const [pendingDiscounts, setPendingDiscounts] = useState([]);
  const [pendingHandovers, setPendingHandovers] = useState([]);
  const [accountantStats, setAccountantStats] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

  useEffect(() => {
    // Load rooms count from database
    const fetchRoomsCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms?propertyId=1`);
        if (res.ok) {
          const data = await res.json();
          setRoomsCount(data.length);
        }
      } catch (err) {
        console.error('Error fetching rooms count:', err);
      }
    };
    fetchRoomsCount();

    // Load discount requests from server database
    const fetchDiscountRequests = async () => {
      try {
        const res = await fetch(`${API_BASE}/discount-requests?status=Pending&propertyId=1`);
        if (res.ok) {
          const data = await res.json();
          setPendingDiscounts(data);
        }
      } catch (err) {
        console.error('Error fetching pending discounts:', err);
      }
    };
    fetchDiscountRequests();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const regRes = await fetch(`${API_BASE}/guest-registrations?propertyId=1&size=1000&role=${user?.role || 'FRONT_OFFICER'}`);
        if (regRes.ok) {
          const regData = await regRes.json();
          setRegistrations(regData.content || []);
        }
        const bookingRes = await fetch(`${API_BASE}/bookings?propertyId=1`);
        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          setBookings(bookingData || []);
        }
        if (user?.role === 'ADMIN') {
          const staffRes = await fetch(`${API_BASE}/auth/users?propertyId=1`);
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            setStaff(staffData || []);
          }
        }
        if (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') {
          const handoverRes = await fetch(`${API_BASE}/billing/accountant/pending?propertyId=${currentProperty?.id || 1}`);
          if (handoverRes.ok) {
            const handoverData = await handoverRes.json();
            setPendingHandovers(handoverData || []);
          }

          const statsRes = await fetch(`${API_BASE}/accountant/dashboard-stats?propertyId=${currentProperty?.id || 1}`, {
            headers: {
              'X-Active-Property': String(currentProperty?.id || 1)
            }
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setAccountantStats(statsData);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, currentProperty]);

  // Role Checks
  const isAdmin = user.role === 'ADMIN';
  const isAccountant = user.role === 'ACCOUNTANT';
  const isFrontOfficer = user.role === 'FRONT_OFFICER';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayGuestsCount = registrations.filter(r => r.checkInDate === todayStr).length;
  const currentlyStayingCount = registrations.filter(r => r.registrationStatus === 'CheckedIn').length;
  const todayLeavingCount = registrations.filter(r => r.checkOutDate === todayStr).length;
  const upcomingBookingsCount = registrations.filter(r => r.registrationStatus === 'Pending' && r.checkInDate > todayStr).length;

  const foCards = {
    todayGuests: todayGuestsCount,
    currentlyStaying: currentlyStayingCount,
    todayLeaving: todayLeavingCount,
    upcomingBookings: upcomingBookingsCount
  };

  const guestRegistrations = registrations
    .map(r => {
      const b = bookings.find(book => book.guestRegistrationId === r.id);
      return {
        id: r.id,
        name: r.guestName,
        passport: r.passportNumber,
        phone: r.whatsappNumber,
        nationality: r.nationality,
        in: r.checkInDate,
        out: r.checkOutDate,
        room: b ? b.roomNumber : 'Unallocated',
        roomType: b ? b.roomType : 'N/A',
        status: b ? b.paymentStatus : 'Pending',
        regStatus: r.registrationStatus || 'Pending'
      };
    })
    .filter(g => g.regStatus === 'CheckedIn');


  const filteredGuests = guestRegistrations.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.passport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* -------------------- FRONT OFFICE DASHBOARD -------------------- */}
      {isFrontOfficer && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Front Office Portal</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Property: {currentProperty.name}</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-emerald-100/60 p-5 rounded-2xl shadow-sm shadow-emerald-500/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Guests</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{foCards.todayGuests}</h3>
              </div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-emerald-100/60 p-5 rounded-2xl shadow-sm shadow-emerald-500/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currently Staying</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{foCards.currentlyStaying}</h3>
              </div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Home className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-emerald-100/60 p-5 rounded-2xl shadow-sm shadow-emerald-500/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today Leaving</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{foCards.todayLeaving}</h3>
              </div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-emerald-100/60 p-5 rounded-2xl shadow-sm shadow-emerald-500/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Bookings</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{foCards.upcomingBookings}</h3>
              </div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 min-w-0 w-full bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Guest Registrations</h3>
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name/passport..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                      <th className="py-3">Guest</th>
                      <th className="py-3">Passport</th>
                      <th className="py-3">Room</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                    {filteredGuests.map((g) => (
                      <tr 
                        key={g.id} 
                        onClick={() => setSelectedGuest(g)}
                        className={`hover:bg-slate-55/60 cursor-pointer transition ${selectedGuest?.id === g.id ? 'bg-emerald-50/40 text-emerald-800' : ''}`}
                      >
                        <td className="py-3.5 font-bold text-slate-800">{g.name}</td>
                        <td className="py-3.5 font-mono">{g.passport}</td>
                        <td className="py-3.5">{g.room === 'Unallocated' ? 'Unallocated' : 'Room ' + g.room}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            g.status === 'Paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : g.status === 'Pending' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guest Details Panel */}
            <div className="min-w-0 w-full bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Guest Details</h3>
              {selectedGuest ? (
                <div className="space-y-4 text-sm text-slate-600 font-semibold">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                    <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-extrabold text-sm">
                      {selectedGuest.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{selectedGuest.name}</p>
                      <p className="text-xs text-slate-400 font-bold">{selectedGuest.nationality}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Passport Number:</span>
                      <span className="font-mono text-slate-800">{selectedGuest.passport}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">WhatsApp:</span>
                      <span className="text-slate-800">{selectedGuest.phone}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Check-In:</span>
                      <span className="text-slate-800">{selectedGuest.in}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Check-Out:</span>
                      <span className="text-slate-800">{selectedGuest.out}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Allocated Room:</span>
                      <span className="text-emerald-700 font-bold">
                        {selectedGuest.room === 'Unallocated' ? 'Unallocated' : 'Room ' + selectedGuest.room}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-450 text-sm">
                  Select a guest from the list to view complete registration records.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ADMIN DASHBOARD -------------------- */}
      {isAdmin && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin Control Panel</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Property Management Systems & Settings</p>
          </div>

          {/* Calculations */}
          {(() => {
            const foStaffCount = staff.filter(s => s.role === 'FRONT_OFFICER').length;
            const accountantCount = staff.filter(s => s.role === 'ACCOUNTANT').length;

            const totalBookings = bookings.length;
            const directBookings = bookings.filter(b => b.bookingType === 'Direct').length;
            const bookingComBookings = bookings.filter(b => b.bookingType === 'Booking.com').length;

            const directPercent = totalBookings > 0 ? Math.round((directBookings / totalBookings) * 100) : 0;
            const bookingComPercent = totalBookings > 0 ? Math.round((bookingComBookings / totalBookings) * 100) : 0;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-emerald-600" /> Staff & Roles
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Create, manage, and monitor activities performed by Front Office and Accountant roles.</p>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold">{foStaffCount} FO Staff</span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold">{accountantCount} Accountant</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <BedDouble className="h-4.5 w-4.5 text-emerald-600" /> Room Management
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Manage room configurations, view amenities, upload photos, and update availability status.</p>
                  <span className="text-xs font-bold text-emerald-700 block">Total Rooms: {roomsCount} ({currentProperty.name})</span>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-600" /> Booking Source Analytics
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Direct Bookings</span>
                      <span className="font-bold text-slate-805">{directBookings} ({directPercent}%)</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Booking.com</span>
                      <span className="font-bold text-slate-805">{bookingComBookings} ({bookingComPercent}%)</span>
                    </div>
                  </div>
                </div>



                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Percent className="h-4.5 w-4.5 text-emerald-600" /> Pending Discount Approvals
                    </h3>
                    <button 
                      onClick={() => navigate('/discounts')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1"
                    >
                      Manage Discounts <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs font-semibold text-slate-600">
                    {pendingDiscounts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-bold">
                        No pending discount approval requests.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="p-3">Booking Ref</th>
                              <th className="p-3">Guest Name</th>
                              <th className="p-3">Total Amount</th>
                              <th className="p-3">Discount</th>
                              <th className="p-3">Reason</th>
                              <th className="p-3 text-right">Requested By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {pendingDiscounts.map((req) => (
                              <tr key={req.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-3 font-mono text-emerald-700 font-bold">{req.bookingRef}</td>
                                <td className="p-3 text-slate-900">{req.guestName}</td>
                                <td className="p-3 font-mono">LKR {req.totalAmount.toLocaleString()}</td>
                                <td className="p-3 text-emerald-700 font-extrabold font-mono">{req.requestedDiscount}</td>
                                <td className="p-3 text-slate-500 font-normal">{req.reason}</td>
                                <td className="p-3 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-bold text-slate-900">{req.requestedBy}</span>
                                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5 uppercase tracking-wide">
                                      {staff.find(s => s.username === req.requestedBy)?.role?.replace('_', ' ') || 'Front Officer'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approved Discounts & Applied Reductions Section on Dashboard */}
                {(() => {
                  const savedDiscounts = localStorage.getItem('pms_discounts');
                  const allDiscounts = savedDiscounts ? JSON.parse(savedDiscounts) : [];
                  const approvedDiscounts = allDiscounts.filter(d => d.status === 'Approved');

                  if (approvedDiscounts.length === 0) return null;

                  return (
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 col-span-1 md:col-span-2 lg:col-span-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-600" /> Approved Discounts & Reduced Final Bills ({approvedDiscounts.length})
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                          Auto-Deducted from Final Bill
                        </span>
                      </div>

                      <div className="border border-emerald-100/60 rounded-xl overflow-hidden text-xs font-semibold">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-800 font-bold uppercase tracking-wider text-[9px]">
                                <th className="p-3">Booking Ref</th>
                                <th className="p-3">Guest Name</th>
                                <th className="p-3">Original Total</th>
                                <th className="p-3">Discount Deducted</th>
                                <th className="p-3">Reduced Net Total</th>
                                <th className="p-3">Approved By</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50/60 text-slate-700">
                              {approvedDiscounts.map((disc) => {
                                const rawDiscountNum = parseFloat(String(disc.requestedDiscount).replace(/[^\d.-]/g, '')) || 0;
                                const originalTot = disc.totalAmount || 0;
                                const reducedTot = Math.max(0, originalTot - rawDiscountNum);
                                const curr = disc.currency || (String(disc.requestedDiscount).includes('LKR') ? 'LKR' : 'USD');

                                return (
                                  <tr key={disc.id} className="hover:bg-emerald-50/30 transition">
                                    <td className="p-3 font-mono text-emerald-700 font-bold">
                                      {disc.bookingRef}
                                    </td>
                                    <td className="p-3 font-bold text-slate-900">{disc.guestName}</td>
                                    <td className="p-3 font-mono text-slate-500 line-through">
                                      {curr} {originalTot.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-rose-600">
                                      -{curr} {rawDiscountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 font-mono font-extrabold text-emerald-700 bg-emerald-50/30">
                                      {curr} {reducedTot.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-slate-500">
                                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                        ✓ {disc.approvedBy || 'Admin'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => navigate('/registrations')}
                                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-xs cursor-pointer"
                                      >
                                        <FileText className="h-3 w-3" /> View Final Bill
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      )}

      {/* -------------------- ACCOUNTANT DASHBOARD -------------------- */}
      {isAccountant && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Accountant Financial Analytics</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Property Scope: <span className="font-bold text-emerald-700">{currentProperty?.name || 'Active Property'}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-lg">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Property Scoped
              </span>
            </div>
          </div>

          {/* KPI Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Gross Revenue */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Total Revenue</p>
                <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-extrabold text-slate-900">
                  LKR {Number(accountantStats?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sum of all collected payments</p>
              </div>
            </div>

            {/* Card 2: Web Booking Other Charges (Deductions) */}
            <div className="bg-white border border-amber-100/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition bg-amber-50/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Web Other Charges</p>
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-extrabold text-amber-700">
                  LKR {Number(accountantStats?.totalOtherCharges || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Channel deductions & other fees</p>
              </div>
            </div>

            {/* Card 3: Card Processing Charges (3%) */}
            <div className="bg-white border border-blue-100/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition bg-blue-50/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Card Charges (3%)</p>
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-extrabold text-blue-700">
                  LKR {Number(accountantStats?.totalCardCharges || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-blue-600/80 font-medium mt-0.5">Bank processing commissions</p>
              </div>
            </div>

            {/* Card 4: Net Reconciled Revenue */}
            <div className="bg-white border border-emerald-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Net Reconciled Revenue</p>
                <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-extrabold text-emerald-900 font-mono">
                  LKR {Number(accountantStats?.netRevenue || accountantStats?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Gross minus other charges</p>
              </div>
            </div>
          </div>

          {/* Secondary Stats Row: Bookings, Nights, Discounts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sub-Card 1: Total Bookings */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{accountantStats?.totalBookings || 0}</h4>
                <p className="text-[10px] text-slate-400 font-medium">Confirmed reservations</p>
              </div>
              <div className="h-9 w-9 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>

            {/* Sub-Card 2: Total Nights */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Guest Nights</p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{accountantStats?.totalNights || 0} <span className="text-xs font-semibold text-slate-500">Nights</span></h4>
                <p className="text-[10px] text-slate-400 font-medium">Calculated across stays</p>
              </div>
              <div className="h-9 w-9 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                <Moon className="h-4 w-4" />
              </div>
            </div>

            {/* Sub-Card 3: Total Discounts */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Discounts</p>
                <h4 className="text-lg font-extrabold text-rose-600 mt-0.5">
                  LKR {Number(accountantStats?.totalDiscounts || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Approved reductions</p>
              </div>
              <div className="h-9 w-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                <Tag className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Breakdown Visual Chart + Handover Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Chart: Bookings by Type */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <PieChart className="h-4.5 w-4.5 text-emerald-600" /> Bookings by Type Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Channel distribution & source volume</p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  Total: {accountantStats?.totalBookings || 0} Bookings
                </span>
              </div>

              {/* Chart Visual Progress Bars */}
              <div className="space-y-4 pt-2">
                {(() => {
                  const dist = accountantStats?.bookingTypeDistribution || {};
                  const total = accountantStats?.totalBookings || 1;
                  const entries = Object.entries(dist);
                  
                  const colorMap = {
                    'Direct': { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    'Booking.com': { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
                    'Airbnb': { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
                    'Walk-in': { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-200' }
                  };

                  return entries.map(([type, count]) => {
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    const style = colorMap[type] || { bar: 'bg-teal-500', badge: 'bg-teal-50 text-teal-800 border-teal-200' };

                    return (
                      <div key={type} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${style.badge}`}>
                              {type}
                            </span>
                          </span>
                          <span className="font-bold text-slate-800 font-mono">
                            {count} bookings <span className="text-slate-400 font-normal">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.max(percentage, count > 0 ? 3 : 0)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Handover Approvals Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600" /> Pending Handover Approvals
              </h3>
              
              {pendingHandovers.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-amber-800 font-semibold">
                      You have <span className="font-bold">{pendingHandovers.length}</span> pending shift handover transaction(s) waiting for accountant reconciliation.
                    </p>
                    <button
                      onClick={() => navigate('/handover')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition uppercase tracking-wide cursor-pointer text-center"
                    >
                      Review & Reconcile Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-xl p-6 text-center text-slate-400 font-bold text-xs">
                  No pending shift handovers waiting for approval.
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quick Navigation</h4>
                <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                  <button 
                    onClick={() => navigate('/reports')} 
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer text-left"
                  >
                    <span>View Financial Reports</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button 
                    onClick={() => navigate('/handover')} 
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer text-left"
                  >
                    <span>Shift Handover Logs</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Room-Wise Income & Occupancy Analytics Section */}
          <RoomIncomeAnalytics currentProperty={currentProperty} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
