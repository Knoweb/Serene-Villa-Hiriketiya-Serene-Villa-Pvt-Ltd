import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileDown, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar, 
  FileText, 
  DollarSign, 
  Users, 
  CreditCard, 
  Building,
  Percent,
  Printer,
  Loader
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const Reports = () => {
  const { user } = useAuth();

  // Guard access - Front Officer cannot access reports
  if (user.role === 'FRONT_OFFICER') {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-rose-600 shadow-sm space-y-3">
        <AlertCircle className="h-10 w-10 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Access Denied</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Front Office users are restricted from viewing financial analytics, profit margins, and reports.
        </p>
      </div>
    );
  }

  // Report states
  const [reportType, setReportType] = useState('Daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI layout tabs
  const [activeMainTab, setActiveMainTab] = useState('overview');
  const [breakdownTab, setBreakdownTab] = useState('payments');

  // Fetch report data from API
  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '';
      if (reportType === 'Daily') {
        url = `${API_BASE}/reports/daily?date=${date}`;
      } else if (reportType === 'Weekly') {
        url = `${API_BASE}/reports/weekly?startDate=${startDate}&endDate=${endDate}`;
      } else if (reportType === 'Monthly') {
        url = `${API_BASE}/reports/monthly?year=${year}&month=${month}`;
      } else if (reportType === 'Custom') {
        url = `${API_BASE}/reports/range?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch report data from server.');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Server is currently offline. Please ensure the backend server is running on port 8080 and try again.');
      } else {
        setError(err.message || 'An error occurred while fetching reports.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, date, startDate, endDate, year, month]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!data || !data.rows || data.rows.length === 0) return;

    const headers = [
      'Invoice Number', 'Booking Number', 'Guest Name', 'Passport Number', 
      'Room', 'Check-In Date', 'Check-Out Date', 'Nights', 'Payment Method', 
      'Payment Status', 'Currency', 'Exchange Rate', 'Paid Amount', 
      'Converted Amount (LKR)', 'Invoice Total (LKR)', 'Advance Payment (LKR)', 
      'Remaining Balance (LKR)', 'Booking Source', 'Discount Amount (LKR)', 'Discount Status'
    ];

    const csvRows = [
      headers.join(','),
      ...data.rows.map(row => [
        `"${row.invoiceNumber}"`,
        `"${row.bookingNumber}"`,
        `"${row.guestName}"`,
        `"${row.passportNumber}"`,
        `"${row.roomName}"`,
        `"${row.checkInDate}"`,
        `"${row.checkOutDate}"`,
        row.numberOfNights,
        `"${row.paymentMethod}"`,
        `"${row.paymentStatus}"`,
        `"${row.currencyCode}"`,
        row.exchangeRate,
        row.paidAmount,
        row.convertedAmount,
        row.invoiceTotal,
        row.advancePaymentAmount,
        row.remainingBalance,
        `"${row.bookingSource}"`,
        row.discountAmount,
        `"${row.discountStatus}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SereneVilla_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print View
  const handlePrint = () => {
    window.print();
  };

  // Formatting currency
  const formatLKR = (val) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Financial Statements</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Generate dynamic operational and financial statements for Serene Villa</p>
        </div>
        
        {/* Date Filter Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-100 p-3 rounded-2xl shadow-sm w-full xl:w-auto">
          <div className="flex flex-col min-w-[130px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Report Mode</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="Daily">Daily Report</option>
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {/* Conditional Date Pickers */}
          {reportType === 'Daily' && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Date</span>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-750 focus:outline-none focus:border-emerald-500 transition" 
              />
            </div>
          )}

          {reportType === 'Weekly' && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Start Date</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-750 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">End Date</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-750 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
            </div>
          )}

          {reportType === 'Monthly' && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Year</span>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Month</span>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {reportType === 'Custom' && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">From</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-750 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">To</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-750 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-end gap-2 h-full pt-5 self-stretch">
            <button 
              onClick={handlePrint}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold p-2.5 rounded-xl transition flex items-center justify-center"
              title="Print Report"
            >
              <Printer className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
              title="Export CSV"
            >
              <FileDown className="h-4 w-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error Messages */}
      {loading && (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader className="h-8 w-8 text-emerald-700 animate-spin mr-3" />
          <span className="font-bold text-slate-600">Generating report data...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Body */}
      {!loading && !error && data && (
        <div className="space-y-6">
          
          {/* Print Only Header Banner */}
          <div className="hidden print:block border-b border-emerald-500 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900">Serene Villa Pvt Ltd</h1>
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wide mt-1">Operational & Financial Statement</p>
            <p className="text-xs text-slate-500 mt-2">
              <strong>Statement Mode:</strong> {reportType} Report &nbsp;|&nbsp; 
              <strong>Generated:</strong> {new Date().toLocaleString()}
            </p>
          </div>

          {/* Main Tab Switcher (no-print) */}
          <div className="flex gap-2 border-b border-slate-100 pb-px no-print">
            <button
              onClick={() => setActiveMainTab('overview')}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeMainTab === 'overview'
                  ? 'border-emerald-600 text-emerald-800 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Overview Summary
            </button>
            <button
              onClick={() => setActiveMainTab('ledger')}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeMainTab === 'ledger'
                  ? 'border-emerald-600 text-emerald-800 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Transaction Ledger
            </button>
          </div>

          {/* 1. OVERVIEW VIEW */}
          {(activeMainTab === 'overview' || window.matchMedia('print').matches) && (
            <div className="space-y-6">
              {/* Stats Widgets */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Total Revenue</p>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatLKR(data.totalRevenue)}</h3>
                  <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-bold">
                    <TrendingUp className="h-3 w-3" /> Settled payments
                  </p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Bookings Volume</p>
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.totalBookings}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Stays in period</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Invoices Count</p>
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.totalInvoices}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Transactions recorded</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Outstanding Amount</p>
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{formatLKR(data.totalOutstandingAmount)}</h3>
                  <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    Collect at check-out
                  </p>
                </div>
              </div>

              {/* Simplified consolidated breakdown panel */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-2 flex flex-wrap gap-1.5 no-print">
                  {[
                    { id: 'payments', label: 'Payment Methods' },
                    { id: 'occupancy', label: 'Occupancy & Guests' },
                    { id: 'channels', label: 'Booking Channels' },
                    { id: 'discounts', label: 'Discounts & Rebates' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setBreakdownTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        breakdownTab === tab.id
                          ? 'bg-emerald-600 text-white shadow-sm border border-emerald-600'
                          : 'text-slate-500 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Print mode displays all breakdowns sequentially */}
                <div className="p-6">
                  {/* Payments Segment */}
                  {(breakdownTab === 'payments' || window.matchMedia('print').matches) && (
                    <div className="space-y-4 max-w-md print:mb-6">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-emerald-600" /> Revenue by Payment Method
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Cash:</span>
                          <span className="text-slate-900 font-bold">{formatLKR(data.cashRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Card:</span>
                          <span className="text-slate-900 font-bold">{formatLKR(data.cardRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Bank Transfer:</span>
                          <span className="text-slate-900 font-bold">{formatLKR(data.bankTransferRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Occupancy Segment */}
                  {(breakdownTab === 'occupancy' || window.matchMedia('print').matches) && (
                    <div className={`space-y-4 max-w-md print:mb-6 ${breakdownTab !== 'occupancy' ? 'hidden print:block' : ''}`}>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-emerald-600" /> Occupancy & Guest Details
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Total Check-Ins:</span>
                          <span className="text-slate-900 font-bold">{data.totalCheckIns}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Total Check-Outs:</span>
                          <span className="text-slate-900 font-bold">{data.totalCheckOuts}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Guests (Adults / Kids):</span>
                          <span className="text-slate-900 font-bold">{data.totalGuests} ({data.totalAdults} / {data.totalChildren})</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Channels Segment */}
                  {(breakdownTab === 'channels' || window.matchMedia('print').matches) && (
                    <div className={`space-y-4 max-w-md print:mb-6 ${breakdownTab !== 'channels' ? 'hidden print:block' : ''}`}>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-emerald-600" /> Booking Channels & Sources
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Direct Bookings:</span>
                          <span className="text-slate-900 font-bold">{data.directBookingCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Booking.com:</span>
                          <span className="text-slate-900 font-bold">{data.bookingComCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Advance Payments:</span>
                          <span className="text-emerald-700 font-extrabold">{formatLKR(data.totalAdvancePayments)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discounts Segment */}
                  {(breakdownTab === 'discounts' || window.matchMedia('print').matches) && (
                    <div className={`space-y-4 max-w-md ${breakdownTab !== 'discounts' ? 'hidden print:block' : ''}`}>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="h-4 w-4 text-emerald-600" /> Discounts & Outstandings
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Approved Total:</span>
                          <span className="text-rose-600 font-bold">{formatLKR(data.approvedDiscountTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Pending Requests:</span>
                          <span className="text-amber-600 font-bold">{data.pendingDiscountRequestCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Remaining Balance:</span>
                          <span className="text-slate-900 font-bold">{formatLKR(data.totalRemainingBalance)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. LEDGER VIEW */}
          {(activeMainTab === 'ledger' || window.matchMedia('print').matches) && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between no-print">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ledger & Transaction Log</h3>
                <span className="bg-slate-50 border border-slate-100 rounded-full px-3 py-1 text-[10px] font-bold text-slate-500">
                  {data.rows.length} Transactions
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Receipt</th>
                      <th className="p-4">Booking</th>
                      <th className="p-4">Guest</th>
                      <th className="p-4">Room</th>
                      <th className="p-4">Stay Dates</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Paid Currency</th>
                      <th className="p-4 text-right">LKR Paid</th>
                      <th className="p-4 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                    {data.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20 transition">
                        <td className="p-4 font-bold text-slate-900">{row.invoiceNumber}</td>
                        <td className="p-4">{row.bookingNumber}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-slate-800">{row.guestName}</p>
                            <p className="text-[10px] text-slate-400">{row.passportNumber}</p>
                          </div>
                        </td>
                        <td className="p-4">{row.roomName}</td>
                        <td className="p-4">
                          {row.checkInDate} to {row.checkOutDate}
                          <span className="text-[10px] text-slate-400 block font-normal">{row.numberOfNights} Nights ({row.bookingSource})</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-50 text-slate-600 border border-slate-100 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                            {row.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4">
                          {row.currencyCode} {row.paidAmount} 
                          {row.currencyCode !== 'LKR' && (
                            <span className="text-[10px] text-slate-405 block">Rate: {row.exchangeRate}</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900">
                          {formatLKR(row.convertedAmount)}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">
                          {formatLKR(row.remainingBalance)}
                        </td>
                      </tr>
                    ))}

                    {data.rows.length === 0 && (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-slate-400 font-bold">
                          No transactions recorded for the selected period.
                        </td>
                      </tr>
                    )}

                    <tr className="bg-slate-50/30 font-bold border-t border-slate-100">
                      <td colSpan="7" className="p-4 text-slate-400 text-right uppercase">Total Revenue (Settled):</td>
                      <td className="p-4 text-right font-mono text-emerald-700 text-sm">{formatLKR(data.totalRevenue)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Reports;
