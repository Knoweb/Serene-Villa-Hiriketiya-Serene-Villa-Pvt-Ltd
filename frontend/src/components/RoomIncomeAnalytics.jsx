import React, { useState, useEffect } from 'react';
import { 
  Home, 
  DollarSign, 
  CreditCard, 
  Landmark, 
  Moon, 
  Users, 
  Smile, 
  CheckCircle2, 
  ChevronDown,
  Sparkles,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

const RoomIncomeAnalytics = ({ currentProperty }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;
  const propId = currentProperty?.id || 1;

  // 1. Fetch Rooms list for the active property
  useEffect(() => {
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await fetch(`${API_BASE}/accountant/analytics/rooms?propertyId=${propId}`, {
          headers: {
            'X-Active-Property': String(propId)
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data || []);
          if (data && data.length > 0) {
            setSelectedRoomId(data[0].id);
          } else {
            setSelectedRoomId('');
            setAnalytics(null);
          }
        }
      } catch (err) {
        console.error('Error fetching rooms for analytics:', err);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [propId]);

  // 2. Fetch Room-specific financial metrics
  useEffect(() => {
    if (!selectedRoomId) return;

    const fetchRoomAnalytics = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(`${API_BASE}/accountant/analytics/room/${selectedRoomId}?propertyId=${propId}`, {
          headers: {
            'X-Active-Property': String(propId)
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Error fetching room analytics:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchRoomAnalytics();
  }, [selectedRoomId, propId]);

  const selectedRoomObj = rooms.find(r => String(r.id) === String(selectedRoomId));

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header with Room Selector Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Home className="h-5 w-5" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Room-Wise Income & Occupancy Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Reconciled revenue & guest stay metrics (Accountant Accepted Handover Only)
          </p>
        </div>

        {/* Dynamic Room Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="room-selector" className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Select Room:
          </label>
          <div className="relative min-w-[200px]">
            <select
              id="room-selector"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              disabled={loadingRooms || rooms.length === 0}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-4 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - {room.roomType || 'Standard'}
                </option>
              ))}
              {rooms.length === 0 && <option value="">No rooms available</option>}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Room Analytics Matrix / Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Room Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center font-mono font-extrabold text-lg text-emerald-300 border border-white/10">
                {analytics.roomNumber || selectedRoomObj?.roomNumber || '01'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-extrabold tracking-tight">
                    Room {analytics.roomNumber || selectedRoomObj?.roomNumber}
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {analytics.roomType || selectedRoomObj?.roomType || 'Deluxe Room'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-0.5 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Audit Verified: Handover Accepted Payments Only
                </p>
              </div>
            </div>

            {/* Total Room Income Highlighting */}
            <div className="text-right sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Total Handed-Over Revenue
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                LKR {Number(analytics.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 3 Payment Methods Breakdown Cards + Occupancy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash Breakdown */}
            <div className="bg-emerald-50/40 border border-emerald-100/80 p-4.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" /> Cash Received
                </span>
                <span className="text-[10px] font-bold bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-md">
                  CASH
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                LKR {Number(analytics.cashAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Accepted physical cash payments</p>
            </div>

            {/* Card Breakdown */}
            <div className="bg-blue-50/40 border border-blue-100/80 p-4.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-blue-600" /> Card / POS Payments
                </span>
                <span className="text-[10px] font-bold bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded-md">
                  CARD
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                LKR {Number(analytics.cardAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Verified credit / debit card slips</p>
            </div>

            {/* Bank Transfer Breakdown */}
            <div className="bg-purple-50/40 border border-purple-100/80 p-4.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-purple-600" /> Bank Transfers
                </span>
                <span className="text-[10px] font-bold bg-purple-100/70 text-purple-800 px-2 py-0.5 rounded-md">
                  BANK
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                LKR {Number(analytics.bankTransferAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Direct deposits & online bank slips</p>
            </div>
          </div>

          {/* Occupancy & Guest Details Strip */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4.5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Nights */}
            <div className="flex items-center gap-3.5 bg-white border border-slate-200/60 p-3.5 rounded-xl shadow-2xs">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stays</p>
                <h5 className="text-base font-extrabold text-slate-900">
                  {analytics.totalNights || 0} <span className="text-xs font-semibold text-slate-500">Nights</span>
                </h5>
              </div>
            </div>

            {/* Total Adults */}
            <div className="flex items-center gap-3.5 bg-white border border-slate-200/60 p-3.5 rounded-xl shadow-2xs">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adult Guests</p>
                <h5 className="text-base font-extrabold text-slate-900">
                  {analytics.totalAdults || 0} <span className="text-xs font-semibold text-slate-500">Adults</span>
                </h5>
              </div>
            </div>

            {/* Total Children */}
            <div className="flex items-center gap-3.5 bg-white border border-slate-200/60 p-3.5 rounded-xl shadow-2xs">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Smile className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Child Guests</p>
                <h5 className="text-base font-extrabold text-slate-900">
                  {analytics.totalChildren || 0} <span className="text-xs font-semibold text-slate-500">Children</span>
                </h5>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400 font-semibold text-sm">
          Select a room to view financial and occupancy analytics.
        </div>
      )}
    </div>
  );
};

export default RoomIncomeAnalytics;
