import React, { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
  Calendar,
  Clock,
  Printer,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';

const RoomIncomeAnalytics = ({ currentProperty }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Period filter states: 'DAILY', 'MONTHLY', 'ALL'
  const [periodType, setPeriodType] = useState('DAILY');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const printableRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;
  const propId = currentProperty?.id || 2;

  // Calculate start and end date based on periodType
  const getDateRange = () => {
    if (periodType === 'DAILY') {
      return { start: dailyDate, end: dailyDate };
    }
    if (periodType === 'MONTHLY') {
      const year = parseInt(selectedYear, 10);
      const month = parseInt(selectedMonth, 10);
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDayDate = new Date(year, month, 0).getDate();
      const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayDate).padStart(2, '0')}`;
      return { start: firstDay, end: lastDay };
    }
    return { start: null, end: null };
  };

  const getPeriodLabel = () => {
    if (periodType === 'DAILY') return `Date: ${dailyDate}`;
    if (periodType === 'MONTHLY') {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `Month: ${monthNames[selectedMonth - 1]} ${selectedYear}`;
    }
    return 'All-Time Performance';
  };

  // 1. Fetch Rooms list for active property
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

  // 2. Fetch Room-specific financial metrics with date filtering
  const fetchRoomAnalytics = async () => {
    if (!selectedRoomId) return;

    setLoadingStats(true);
    try {
      const { start, end } = getDateRange();
      let url = `${API_BASE}/accountant/analytics/room/${selectedRoomId}?propertyId=${propId}`;
      if (start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }

      const res = await fetch(url, {
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

  useEffect(() => {
    fetchRoomAnalytics();
  }, [selectedRoomId, propId, periodType, dailyDate, selectedMonth, selectedYear]);

  const selectedRoomObj = rooms.find(r => String(r.id) === String(selectedRoomId));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header with Room Selector Dropdown and Period Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Home className="h-5 w-5" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Room Income & Grand Totals
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Summary of Room-wise Revenue & Grand Totals (Daily & Monthly)
          </p>
        </div>

        {/* Room & Period Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Room Selector */}
          <div className="relative min-w-[220px]">
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

          {/* Quick Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Print Room Income"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs & Date Controls (Daily & Monthly Focused) */}
      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1.5 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Income Period:
          </span>
          {[
            { id: 'DAILY', label: '📅 Daily Income' },
            { id: 'MONTHLY', label: '📈 Monthly Income' },
            { id: 'ALL', label: '📊 All Time' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriodType(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                periodType === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Period Input Controls */}
        <div className="flex items-center gap-2">
          {periodType === 'DAILY' && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none text-xs cursor-pointer"
              />
            </div>
          )}

          {periodType === 'MONTHLY' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchRoomAnalytics}
            disabled={loadingStats}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
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
        <div ref={printableRef} className="space-y-5">
          {/* Room Header & Grand Total Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-mono font-black text-xl text-emerald-300 border border-white/10">
                {analytics.roomNumber || selectedRoomObj?.roomNumber || '01'}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-xl font-extrabold tracking-tight">
                    Room {analytics.roomNumber || selectedRoomObj?.roomNumber}
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {analytics.roomType || selectedRoomObj?.roomType || 'Standard'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-1 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Period: <strong className="text-white">{getPeriodLabel()}</strong>
                </p>
              </div>
            </div>

            {/* Total Room Grand Income */}
            <div className="text-left sm:text-right bg-white/10 px-5 py-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                Total Room Income (Grand Total)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                LKR {Number(analytics.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 3 Payment Channels Grand Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash Total */}
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
              <p className="text-[11px] text-slate-500 font-medium">Total cash collection</p>
            </div>

            {/* Card Total */}
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
              <p className="text-[11px] text-slate-500 font-medium">Total card payments</p>
            </div>

            {/* Bank Transfer Total */}
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
              <p className="text-[11px] text-slate-500 font-medium">Total bank transfers</p>
            </div>
          </div>

          {/* Occupancy Summary Strip */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4.5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Stays */}
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
          Select a room to view income analytics.
        </div>
      )}
    </div>
  );
};

export default RoomIncomeAnalytics;
