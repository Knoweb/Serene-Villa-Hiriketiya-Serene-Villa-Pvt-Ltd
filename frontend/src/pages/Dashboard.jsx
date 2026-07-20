import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const { user, currentProperty } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  
  const [registrations, setRegistrations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomsCount, setRoomsCount] = useState(0);
  const [staff, setStaff] = useState([]);
  const [pendingDiscounts, setPendingDiscounts] = useState([]);


  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

  useEffect(() => {
    // Load rooms count from database
    const fetchRoomsCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms`);
        if (res.ok) {
          const data = await res.json();
          setRoomsCount(data.length);
        }
      } catch (err) {
        console.error('Error fetching rooms count:', err);
      }
    };
    fetchRoomsCount();

    // Load discount requests
    const savedDiscounts = localStorage.getItem('pms_discounts');
    if (savedDiscounts) {
      const parsed = JSON.parse(savedDiscounts);
      setPendingDiscounts(parsed.filter(r => r.status === 'Pending'));
    } else {
      const defaultDiscounts = [
        {
          id: 1,
          bookingRef: 'SV-2026-0002',
          guestName: 'Hiroshi Tanaka',
          totalAmount: 180000,
          requestedDiscount: 'LKR 15,000',
          reason: 'Loyalty guest request',
          status: 'Pending',
          requestedBy: 'fo_user',
        },
        {
          id: 2,
          bookingRef: 'SV-2026-0001',
          guestName: 'Liam Johnson',
          totalAmount: 140000,
          requestedDiscount: '10%',
          reason: 'Slight air conditioning issue reported during first night',
          status: 'Approved',
          requestedBy: 'fo_user',
          approvedBy: 'admin_user'
        }
      ];
      localStorage.setItem('pms_discounts', JSON.stringify(defaultDiscounts));
      setPendingDiscounts(defaultDiscounts.filter(r => r.status === 'Pending'));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const regRes = await fetch(`${API_BASE}/guest-registrations?size=1000&role=${user?.role || 'FRONT_OFFICER'}`);
        if (regRes.ok) {
          const regData = await regRes.json();
          setRegistrations(regData.content || []);
        }
        const bookingRes = await fetch(`${API_BASE}/bookings`);
        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          setBookings(bookingData || []);
        }
        if (user?.role === 'ADMIN') {
          const staffRes = await fetch(`${API_BASE}/auth/users`);
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            setStaff(staffData || []);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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

          {/* Registration list and guest details split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
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
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Percent className="h-4.5 w-4.5 text-emerald-600" /> Pending Discount Approvals
                  </h3>
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
              </div>
            );
          })()}
        </div>
      )}

      {/* -------------------- ACCOUNTANT DASHBOARD -------------------- */}
      {isAccountant && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Accountant Ledger</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Shift handovers, invoice statements, and payment records</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Handover Approvals */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600" /> Pending Shift Handover approvals
              </h3>
              
              <div className="border border-slate-55 rounded-xl p-8 text-center text-slate-400 font-bold">
                No pending shift handovers waiting for approval.
              </div>
            </div>

            {/* Financial Overview quick links */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-emerald-600" /> Accounting Reports
              </h3>
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <a href="#reports" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <span>Daily Revenue Report</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                </a>
                <a href="#reports" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <span>Weekly Payments Log</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                </a>
                <a href="#reports" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <span>Outstanding Balances</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
