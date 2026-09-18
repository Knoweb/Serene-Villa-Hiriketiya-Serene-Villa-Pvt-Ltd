import React, { useState, useEffect, useRef } from 'react';
import logoImg from '../assets/logo.jpeg';
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
  const propId = currentProperty?.id || 1;

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
      {/* Header with Room Selector Dropdown and Period Filters (Hidden on Print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 no-print">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20 cursor-pointer"
            title="Print Room Income"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs & Date Controls (Daily & Monthly Focused) (Hidden on Print) */}
      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-3 no-print">
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
        <div ref={printableRef} className="room-income-print-area space-y-4 bg-white">
          {/* 1. Official Serene Villa Letterhead Header */}
          <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-3">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Serene Villa Logo" className="h-12 w-12 object-contain rounded-xl border border-slate-100" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="text-emerald-800">SERENE VILLA</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="text-slate-600 text-xs font-bold tracking-wider">HIRIKETIYA</span>
                </h1>
                <p className="text-[9px] text-slate-500 font-medium">
                  Hiriketiya Beach Road, Dikwella, Sri Lanka | info@serenevillahiriketiya.com | +94 77 123 4567
                </p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-emerald-200 inline-block">
                Official Room Statement
              </span>
              <p className="text-[9px] text-slate-400 font-semibold">
                Doc Ref: SV-ROOM-{analytics.roomNumber || selectedRoomObj?.roomNumber || '01'}-{new Date().getFullYear()}
              </p>
            </div>
          </div>

          {/* 2. Statement Title & Period */}
          <div className="text-center py-2 bg-slate-50/70 border border-slate-200/80 rounded-xl px-3 print:bg-slate-50 print:border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Room Income & Grand Totals Summary — Room {analytics.roomNumber || selectedRoomObj?.roomNumber}
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 mt-0.5">
              <span className="bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-slate-800 font-bold text-[11px]">
                Period: <strong className="text-emerald-800">{getPeriodLabel()}</strong>
              </span>
            </div>
          </div>

          {/* 3. Room Header & Grand Total Banner */}
          <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-4.5 rounded-2xl shadow-sm print:bg-emerald-900">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center font-mono font-black text-xl text-emerald-300 border border-white/10">
                {analytics.roomNumber || selectedRoomObj?.roomNumber || '01'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-extrabold tracking-tight">
                    Room {analytics.roomNumber || selectedRoomObj?.roomNumber}
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {analytics.roomType || selectedRoomObj?.roomType || 'Standard'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5 flex items-center gap-1 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Status: <strong className="text-white">Active Verified Record</strong>
                </p>
              </div>
            </div>

            {/* Total Room Grand Income */}
            <div className="text-right bg-white/10 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 block">
                Total Room Income (Grand Total)
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                LKR {Number(analytics.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 4. 3 Payment Channels Grand Totals */}
          <div className="grid grid-cols-3 gap-3">
            {/* Cash Total */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Cash Received
                </span>
                <span className="text-[9px] font-bold bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded">
                  CASH
                </span>
              </div>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                LKR {Number(analytics.cashAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Total cash collection</p>
            </div>

            {/* Card Total */}
            <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Card / POS
                </span>
                <span className="text-[9px] font-bold bg-blue-100/80 text-blue-800 px-1.5 py-0.5 rounded">
                  CARD
                </span>
              </div>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                LKR {Number(analytics.cardAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Total card payments</p>
            </div>

            {/* Bank Transfer Total */}
            <div className="bg-purple-50/50 border border-purple-100 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                  <Landmark className="h-3.5 w-3.5 text-purple-600" /> Bank Transfer
                </span>
                <span className="text-[9px] font-bold bg-purple-100/80 text-purple-800 px-1.5 py-0.5 rounded">
                  BANK
                </span>
              </div>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                LKR {Number(analytics.bankTransferAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Total bank transfers</p>
            </div>
          </div>

          {/* 5. Occupancy Summary Strip */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 grid grid-cols-3 gap-3">
            {/* Total Stays */}
            <div className="flex items-center gap-3 bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-2xs">
              <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stays</p>
                <h5 className="text-sm font-extrabold text-slate-900">
                  {analytics.totalNights || 0} <span className="text-[11px] font-semibold text-slate-500">Nights</span>
                </h5>
              </div>
            </div>

            {/* Total Adults */}
            <div className="flex items-center gap-3 bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-2xs">
              <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adult Guests</p>
                <h5 className="text-sm font-extrabold text-slate-900">
                  {analytics.totalAdults || 0} <span className="text-[11px] font-semibold text-slate-500">Adults</span>
                </h5>
              </div>
            </div>

            {/* Total Children */}
            <div className="flex items-center gap-3 bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-2xs">
              <div className="h-8 w-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                <Smile className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Child Guests</p>
                <h5 className="text-sm font-extrabold text-slate-900">
                  {analytics.totalChildren || 0} <span className="text-[11px] font-semibold text-slate-500">Children</span>
                </h5>
              </div>
            </div>
          </div>

          {/* 6. Signatures & Verification (Official Single Page Print Section) */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-[10px] uppercase font-bold text-slate-700">
            <div className="space-y-6 text-center">
              <div className="border-b border-slate-400 pb-1"></div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-wider">Prepared By</p>
                <p className="text-slate-400 text-[8px] font-normal lowercase italic mt-0.5">Front Officer / Accountant</p>
              </div>
            </div>
            <div className="space-y-6 text-center">
              <div className="border-b border-slate-400 pb-1"></div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-wider">Checked By</p>
                <p className="text-slate-400 text-[8px] font-normal lowercase italic mt-0.5">Finance Manager / Operations</p>
              </div>
            </div>
            <div className="space-y-6 text-center">
              <div className="border-b border-slate-400 pb-1"></div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-wider">Approved By</p>
                <p className="text-slate-400 text-[8px] font-normal lowercase italic mt-0.5">General Manager / Director</p>
              </div>
            </div>
          </div>

          {/* 7. Statement Footer */}
          <div className="text-center pt-2 text-[8px] text-slate-400 font-bold uppercase tracking-widest">
            Confidential Document - Serene Villa Pvt Ltd Hiriketiya © {new Date().getFullYear()}
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
