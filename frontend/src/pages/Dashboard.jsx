import React, { useState } from 'react';
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

  // Role Checks
  const isAdmin = user.role === 'ADMIN';
  const isAccountant = user.role === 'ACCOUNTANT';
  const isFrontOfficer = user.role === 'FRONT_OFFICER';

  // Front Office Mock Data
  const foCards = {
    todayGuests: 0,
    currentlyStaying: 0,
    todayLeaving: 0,
    upcomingBookings: 0
  };

  const guestRegistrations = [];

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
                        <td className="py-3.5">Room {g.room}</td>
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
                      <span className="text-emerald-700 font-bold">Room {selectedGuest.room}</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-emerald-600" /> Staff & Roles
              </h3>
              <p className="text-xs text-slate-500">Create, manage, and monitor activities performed by Front Office and Accountant roles.</p>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold">0 FO Staff</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold">0 Accountant</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BedDouble className="h-4.5 w-4.5 text-emerald-600" /> Room Management
              </h3>
              <p className="text-xs text-slate-500">Manage room configurations, view amenities, upload photos, and update availability status.</p>
              <span className="text-xs font-bold text-emerald-700 block">Total Rooms: 6 (Serene Villa Pvt Ltd)</span>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-600" /> Booking Source Analytics
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Direct Bookings</span>
                  <span className="font-bold text-slate-800">0 (0%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Booking.com</span>
                  <span className="font-bold text-slate-800">0 (0%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 col-span-1 md:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Percent className="h-4.5 w-4.5 text-emerald-600" /> Pending Discount Approvals
              </h3>
              <div className="border border-slate-50 rounded-xl overflow-hidden text-xs">
                <div className="p-8 text-center text-slate-400 font-bold">
                  No pending discount approval requests.
                </div>
              </div>
            </div>
          </div>
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
