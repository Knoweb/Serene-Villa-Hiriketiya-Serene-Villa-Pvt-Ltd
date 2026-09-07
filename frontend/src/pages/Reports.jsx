import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpeg';
import { toPng } from 'html-to-image';
import { 
  FileDown, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  CreditCard, 
  Building,
  Percent,
  Printer,
  Loader,
  Share2,
  Download,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

const Reports = () => {
  const { user } = useAuth();
  const printAreaRef = useRef(null);

  // Guard access - Front Officer cannot access reports
  if (user && user.role === 'FRONT_OFFICER') {
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

  // Report states: 'DailyCheckIn', 'Daily', 'Weekly', 'Monthly', 'Custom'
  const [reportType, setReportType] = useState('DailyCheckIn');
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Formatting helpers
  const formatLKR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const formatLKRCompact = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const getReportPeriod = () => {
    if (reportType === 'DailyCheckIn' || reportType === 'Daily') return date;
    if (reportType === 'Weekly' || reportType === 'Custom') return `${startDate} to ${endDate}`;
    if (reportType === 'Monthly') {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[month - 1]} ${year}`;
    }
    return date;
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'DailyCheckIn':
        return 'Daily Check-in Summary';
      case 'Daily':
        return 'Daily Income Summary';
      case 'Weekly':
        return 'Weekly Income Summary';
      case 'Monthly':
        return 'Monthly Income Summary';
      case 'Custom':
        return 'Custom Range Income Summary';
      default:
        return 'Financial & Operational Statement';
    }
  };

  // Fetch report data from API
  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '';
      if (reportType === 'DailyCheckIn' || reportType === 'Daily') {
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

  // Universal Action: Trigger Print View
  const handlePrint = () => {
    window.print();
  };

  // Universal Action: Download High Resolution PDF / PNG
  const handleDownloadPDF = async () => {
    const element = printAreaRef.current;
    if (!element) return;

    setDownloadingPdf(true);
    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
        style: {
          margin: '0',
          transform: 'none'
        }
      });

      const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
      const cleanFileName = `SereneVilla_${reportType}_${getReportPeriod().replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      if (jsPDF) {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;
        const xPos = margin;
        const yPos = margin;

        pdf.addImage(dataUrl, 'PNG', xPos, yPos, imgWidth, imgHeight);
        pdf.save(`${cleanFileName}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `${cleanFileName}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Unable to generate PDF directly. Please use the Print button and choose "Save as PDF".');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Universal Action: Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!data) return;

    let text = `🏨 *SERENE VILLA - HIRIKETIYA*\n`;
    text += `📋 *${getReportTitle().toUpperCase()}*\n`;
    text += `📅 *Period / Date:* ${getReportPeriod()}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (reportType === 'DailyCheckIn') {
      const checkIns = data.checkIns || [];
      text += `👥 *DAILY CHECK-IN SUMMARY*\n`;
      text += `Total Check-ins: *${checkIns.length}* | Total Pax: *${data.totalGuests || 0}*\n\n`;
      
      if (checkIns.length > 0) {
        checkIns.forEach((c, idx) => {
          text += `${idx + 1}. *${c.guestName}*\n`;
          text += `   • Room: ${c.roomNumber} ${c.roomType ? `(${c.roomType})` : ''}\n`;
          text += `   • Pax: ${c.pax} (${c.adults} Adults${c.children ? `, ${c.children} Kids` : ''})\n`;
          text += `   • Amount: ${formatLKR(c.amount)}\n`;
          text += `   • Source: ${c.bookingSource || 'Direct'}\n\n`;
        });
      } else {
        text += `No check-ins recorded for this date.\n\n`;
      }
    } else {
      text += `💰 *TOTAL REVENUE:* ${formatLKR(data.totalRevenue || 0)}\n\n`;
      text += `💳 *PAYMENT METHODS:*\n`;
      text += `• Cash: ${formatLKR(data.cashRevenue || 0)}\n`;
      text += `• Visa / Card: ${formatLKR(data.cardRevenue || 0)}\n`;
      text += `• Bank Transfer: ${formatLKR(data.bankTransferRevenue || 0)}\n\n`;

      text += `🏢 *BOOKING CHANNELS:*\n`;
      text += `• Booking.com: ${data.bookingComCount || 0} (${formatLKR(data.bookingComAmount || 0)})\n`;
      text += `• Web Booking: ${data.webBookingCount || 0} (${formatLKR(data.webBookingAmount || 0)})\n`;
      text += `• Airbnb: ${data.airbnbCount || 0} (${formatLKR(data.airbnbAmount || 0)})\n`;
      text += `• Direct Booking: ${data.directBookingCount || 0} (${formatLKR(data.directBookingAmount || 0)})\n\n`;

      text += `📊 *SUMMARY METRICS:*\n`;
      text += `• Stays / Bookings: ${data.totalBookings || 0}\n`;
      text += `• Outstanding Balance: ${formatLKR(data.totalOutstandingAmount || 0)}\n`;
      text += `• Approved Discounts: ${formatLKR(data.approvedDiscountTotal || 0)}\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Generated on ${new Date().toLocaleString()}_\n`;
    text += `Serene Villa Pvt Ltd Hiriketiya`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!data) return;

    if (reportType === 'DailyCheckIn') {
      const headers = ['Guest Name', 'Passport / ID', 'Room Number', 'Room Type', 'Pax (Total)', 'Adults', 'Children', 'Booking Value (LKR)', 'Booking Ref', 'Booking Source', 'Status'];
      const checkIns = data.checkIns || [];
      const csvRows = [
        headers.join(','),
        ...checkIns.map(c => [
          `"${c.guestName}"`,
          `"${c.passportNumber}"`,
          `"${c.roomNumber}"`,
          `"${c.roomType}"`,
          c.pax,
          c.adults,
          c.children,
          c.amount,
          `"${c.bookingNumber}"`,
          `"${c.bookingSource}"`,
          `"${c.paymentStatus}"`
        ].join(','))
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `SereneVilla_DailyCheckIn_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!data.rows || data.rows.length === 0) return;

    const headers = [
      'Invoice / Receipt', 'Booking Ref', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 
      'Payment Method', 'Cash (LKR)', 'Visa/Card (LKR)', 'Bank Transfer (LKR)', 'Total Amount (LKR)', 'Source'
    ];

    const csvRows = [
      headers.join(','),
      ...data.rows.map(row => [
        `"${row.invoiceNumber}"`,
        `"${row.bookingNumber}"`,
        `"${row.guestName}"`,
        `"${row.roomName}"`,
        `"${row.checkInDate}"`,
        `"${row.checkOutDate}"`,
        `"${row.paymentMethod}"`,
        row.cashAmount || 0,
        row.cardAmount || 0,
        row.bankTransferAmount || 0,
        row.convertedAmount || 0,
        `"${row.bookingSource}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SereneVilla_${reportType}_${getReportPeriod().replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations for transactions table
  const totalCashRows = data?.rows?.reduce((sum, r) => sum + (r.cashAmount || 0), 0) || 0;
  const totalCardRows = data?.rows?.reduce((sum, r) => sum + (r.cardAmount || 0), 0) || 0;
  const totalBankRows = data?.rows?.reduce((sum, r) => sum + (r.bankTransferAmount || 0), 0) || 0;
  const totalConvertedRows = data?.rows?.reduce((sum, r) => sum + (r.convertedAmount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls (Hidden on Print) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Financial & Operational Statements</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time business reports, daily check-in logs & executive financial summaries
          </p>
        </div>
        
        {/* Date Filter Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200/80 p-2.5 rounded-2xl shadow-sm w-full xl:w-auto">
          <div className="flex flex-col min-w-[170px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Select Statement</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="DailyCheckIn">📅 Daily Check-in Summary</option>
              <option value="Daily">💵 Daily Income Summary</option>
              <option value="Weekly">📊 Weekly Income Summary</option>
              <option value="Monthly">📈 Monthly Income Summary</option>
              <option value="Custom">🗓️ Custom Range Summary</option>
            </select>
          </div>

          {/* Conditional Date Pickers */}
          {(reportType === 'DailyCheckIn' || reportType === 'Daily') && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Date</span>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition" 
              />
            </div>
          )}

          {reportType === 'Weekly' && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Start Date</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">End Date</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
            </div>
          )}

          {reportType === 'Monthly' && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Year</span>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Month</span>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
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
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">From</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">To</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition" 
                />
              </div>
            </div>
          )}

          {/* Universal Action Buttons: Print, PDF, WhatsApp, CSV */}
          <div className="flex items-end gap-1.5 pt-4 self-stretch">
            {/* Print Button */}
            <button 
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Print Document"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {/* Download PDF Button */}
            <button 
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              title="Download High-Res PDF"
            >
              {downloadingPdf ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>PDF</span>
            </button>

            {/* Share via WhatsApp Button */}
            <button 
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
              title="Share Summary via WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Export CSV Button */}
            <button 
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Export CSV"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error Indicators */}
      {loading && (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm no-print">
          <Loader className="h-7 w-7 text-emerald-600 animate-spin mr-3" />
          <span className="font-bold text-slate-700 text-sm">Generating statement data...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2 no-print">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Printable Document Canvas (Styled for Screen & Perfect Clean Print) */}
      {!loading && !error && data && (
        <div 
          ref={printAreaRef}
          id="financial-statement-canvas"
          className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm print:shadow-none print:border-none print:p-2 space-y-6 text-slate-800"
        >
          {/* 1. Header / Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-4">
            <div className="flex items-center gap-3.5">
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
              <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-200 inline-block">
                Official Statement
              </span>
              <p className="text-[9px] text-slate-400 font-semibold">
                Doc Ref: SV-{reportType.toUpperCase()}-{new Date().getFullYear()}
              </p>
            </div>
          </div>

          {/* Title & Prominent Date Header */}
          <div className="text-center space-y-1 py-1 bg-slate-50/70 border border-slate-100 rounded-xl p-3 print:bg-transparent print:border-none print:py-0">
            <h2 className="text-base md:text-lg font-black uppercase tracking-wider text-slate-900">
              {getReportTitle()}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-600">
              <span className="bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-slate-800 font-bold">
                Date / Period: <strong className="text-emerald-800">{getReportPeriod()}</strong>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW TYPE 1: DAILY CHECK-IN SUMMARY                                      */}
          {/* ========================================================================= */}
          {reportType === 'DailyCheckIn' && (
            <div className="space-y-6">
              {/* Daily Check-in Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-700" />
                    Guest Check-in Records
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500">
                    Total Check-ins: <strong className="text-slate-900">{(data.checkIns || []).length}</strong> | Total Pax: <strong className="text-emerald-700">{data.totalGuests || 0}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[9px]">
                        <th className="p-2.5 text-center w-8">#</th>
                        <th className="p-2.5">Guest Name</th>
                        <th className="p-2.5 text-center">Room No</th>
                        <th className="p-2.5 text-center">Pax</th>
                        <th className="p-2.5 text-right">Amount / Booking Value</th>
                        <th className="p-2.5 text-center">Channel</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {(data.checkIns || []).map((checkIn, idx) => (
                        <tr key={checkIn.id || idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-2.5 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">
                            <div>
                              <span>{checkIn.guestName}</span>
                              {checkIn.passportNumber && checkIn.passportNumber !== 'N/A' && (
                                <span className="text-[9px] text-slate-400 font-normal block font-mono">ID: {checkIn.passportNumber}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-200">
                              {checkIn.roomNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-50 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                              <Users className="h-3 w-3 inline" />
                              {checkIn.pax} Pax
                              <span className="text-[8px] font-normal text-slate-500">
                                ({checkIn.adults}A{checkIn.children ? ` + ${checkIn.children}C` : ''})
                              </span>
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatLKR(checkIn.amount)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="text-[9px] font-bold uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                              {checkIn.bookingSource || 'Direct'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              checkIn.paymentStatus === 'Paid' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {checkIn.paymentStatus || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(!data.checkIns || data.checkIns.length === 0) && (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                            No guest check-ins recorded for {date}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan="3" className="p-2.5 text-right uppercase text-[10px] text-slate-500">
                          Total Check-ins Summary:
                        </td>
                        <td className="p-2.5 text-center font-black text-emerald-800 font-mono text-xs">
                          {data.totalGuests || 0} Pax
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-emerald-800 text-xs">
                          {formatLKR((data.checkIns || []).reduce((sum, c) => sum + (c.amount || 0), 0))}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW TYPE 2: INCOME SUMMARIES (Daily, Weekly, Monthly, Custom Range)      */}
          {/* Layout Order: Section 3 (Top) -> Section 1 (Bottom) -> Section 2 (Bottom) */}
          {/* ========================================================================= */}
          {reportType !== 'DailyCheckIn' && (
            <div className="space-y-6">
              
              {/* ------------------------------------------------------------------- */}
              {/* SECTION 3 (MOVED TO TOP): Detailed Transactions Table               */}
              {/* ------------------------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-emerald-700 rounded-xs"></span>
                    Detailed Transactions Table
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500">
                    Settled Transactions: <strong className="text-slate-800">{data.rows?.length || 0}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[8px] md:text-[9px]">
                        <th className="p-2.5">Invoice #</th>
                        <th className="p-2.5">Booking Ref</th>
                        <th className="p-2.5">Room</th>
                        <th className="p-2.5 text-right">Cash (LKR)</th>
                        <th className="p-2.5 text-right">Visa / Card (LKR)</th>
                        <th className="p-2.5 text-right">Bank Transfer (LKR)</th>
                        <th className="p-2.5 text-right font-black text-emerald-900">Total Amount (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {(data.rows || []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-2.5 font-bold text-slate-900 font-mono text-[10px]">
                            {row.invoiceNumber}
                          </td>
                          <td className="p-2.5 text-slate-700 font-mono text-[10px]">
                            <div>
                              <span>{row.bookingNumber}</span>
                              <span className="text-[8px] text-slate-400 block">{row.bookingSource || 'Direct'}</span>
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-slate-800">
                            {row.roomName || 'N/A'}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            {row.cashAmount > 0 ? (
                              <span className="font-bold text-emerald-700">{formatLKR(row.cashAmount)}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            {row.cardAmount > 0 ? (
                              <span className="font-bold text-blue-700">{formatLKR(row.cardAmount)}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            {row.bankTransferAmount > 0 ? (
                              <span className="font-bold text-amber-700">{formatLKR(row.bankTransferAmount)}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-emerald-900 bg-emerald-50/30">
                            {formatLKR(row.convertedAmount)}
                          </td>
                        </tr>
                      ))}

                      {(!data.rows || data.rows.length === 0) && (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                            No financial transactions recorded for the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {/* Subtotals for each payment type and grand total */}
                    <tfoot className="bg-slate-100/90 font-black border-t-2 border-slate-300 text-slate-900 text-xs">
                      <tr>
                        <td colSpan="3" className="p-2.5 text-right uppercase text-[10px] text-slate-600">
                          Subtotals / Totals:
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-800">
                          {formatLKR(totalCashRows)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-blue-800">
                          {formatLKR(totalCardRows)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-amber-800">
                          {formatLKR(totalBankRows)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-emerald-950 bg-emerald-100/60 text-sm">
                          {formatLKR(totalConvertedRows)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ------------------------------------------------------------------- */}
              {/* BOTTOM HALF: Section 1 (Executive Summary) & Section 2 (Payments)  */}
              {/* ------------------------------------------------------------------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                
                {/* ----------------------------------------------------------------- */}
                {/* SECTION 1 (BOTTOM): Executive Summary & Booking Channel Breakdown */}
                {/* ----------------------------------------------------------------- */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-emerald-700 rounded-xs"></span>
                    1. Executive Summary & Channels
                  </h3>
                  
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[8px]">
                        <th className="p-2.5">Booking Channel / Metric</th>
                        <th className="p-2.5 text-center">Bookings</th>
                        <th className="p-2.5 text-right">Revenue (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="p-2 font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-600 inline-block"></span> Booking.com
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-700">{data.bookingComCount || 0}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{formatLKR(data.bookingComAmount || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-600 inline-block"></span> Web Booking
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-700">{data.webBookingCount || 0}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{formatLKR(data.webBookingAmount || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span> Airbnb
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-700">{data.airbnbCount || 0}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{formatLKR(data.airbnbAmount || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block"></span> Direct Booking
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-700">{data.directBookingCount || 0}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{formatLKR(data.directBookingAmount || 0)}</td>
                      </tr>
                      <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                        <td className="p-2 text-slate-600">Total Bookings Volume</td>
                        <td className="p-2 text-center font-mono font-black text-slate-900">{data.totalBookings || 0}</td>
                        <td className="p-2 text-right font-mono font-black text-slate-900">
                          {formatLKR((data.bookingComAmount || 0) + (data.webBookingAmount || 0) + (data.airbnbAmount || 0) + (data.directBookingAmount || 0))}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/80 font-bold">
                        <td className="p-2 text-slate-600">Outstanding Balance</td>
                        <td className="p-2 text-center text-slate-400">-</td>
                        <td className="p-2 text-right font-mono font-bold text-rose-600">{formatLKR(data.totalOutstandingAmount || 0)}</td>
                      </tr>
                      <tr className="bg-slate-50/80 font-bold">
                        <td className="p-2 text-slate-600">Approved Discounts</td>
                        <td className="p-2 text-center text-slate-400">-</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-700">{formatLKR(data.approvedDiscountTotal || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* SECTION 2 (BOTTOM): Payment Methods Breakdown                     */}
                {/* ----------------------------------------------------------------- */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-emerald-700 rounded-xs"></span>
                    2. Payment Methods Breakdown
                  </h3>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[8px]">
                        <th className="p-2.5">Payment Channel</th>
                        <th className="p-2.5 text-right">Amount (LKR)</th>
                        <th className="p-2.5 text-right">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {(() => {
                        const totalSettled = (data.cashRevenue || 0) + (data.cardRevenue || 0) + (data.bankTransferRevenue || 0);
                        const getPct = (val) => totalSettled > 0 ? ((val / totalSettled) * 100).toFixed(1) + '%' : '0.0%';
                        return (
                          <>
                            <tr>
                              <td className="p-2 font-bold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Cash
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">{formatLKR(data.cashRevenue)}</td>
                              <td className="p-2 text-right font-mono text-slate-500 text-[10px]">{getPct(data.cashRevenue)}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span> Bank Transfer
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">{formatLKR(data.bankTransferRevenue)}</td>
                              <td className="p-2 text-right font-mono text-slate-500 text-[10px]">{getPct(data.bankTransferRevenue)}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span> Visa / Card
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">{formatLKR(data.cardRevenue)}</td>
                              <td className="p-2 text-right font-mono text-slate-500 text-[10px]">{getPct(data.cardRevenue)}</td>
                            </tr>
                            <tr className="bg-emerald-50/70 font-black border-t-2 border-emerald-200 text-slate-900">
                              <td className="p-2 text-emerald-950 uppercase text-xs">Total Settled Revenue</td>
                              <td className="p-2 text-right font-mono font-black text-emerald-900 text-sm">
                                {formatLKR(totalSettled)}
                              </td>
                              <td className="p-2 text-right font-mono font-black text-emerald-900">100.0%</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SIGNATURES & VERIFICATION (COMMON TO ALL REPORT VIEWS)                     */}
          {/* ========================================================================= */}
          <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-[10px] uppercase font-bold text-slate-700">
            <div className="space-y-8 text-center">
              <div className="border-b border-slate-400 pb-1"></div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-wider">Prepared By</p>
                <p className="text-slate-400 text-[8px] font-normal lowercase italic mt-0.5">Front Officer / Accountant</p>
              </div>
            </div>
            <div className="space-y-8 text-center">
              <div className="border-b border-slate-400 pb-1"></div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-wider">Checked By / Supervisory</p>
                <p className="text-slate-400 text-[8px] font-normal lowercase italic mt-0.5">Finance Manager / Operations</p>
              </div>
            </div>
            <div className="space-y-8 text-center">
              <div className="border-b border-slate-400 pb-1"></div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-wider">Approved By</p>
                <p className="text-slate-400 text-[8px] font-normal lowercase italic mt-0.5">General Manager / Director</p>
              </div>
            </div>
          </div>

          {/* Report Footer */}
          <div className="text-center pt-4 border-t border-slate-100 text-[8px] text-slate-400 font-bold uppercase tracking-widest">
            Confidential Document - Serene Villa Pvt Ltd Hiriketiya © {new Date().getFullYear()}
          </div>

        </div>
      )}
    </div>
  );
};

export default Reports;
