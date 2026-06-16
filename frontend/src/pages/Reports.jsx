import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileDown, AlertCircle, ArrowUpRight } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();

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

  const [dateRange, setDateRange] = useState({
    start: '2026-06-01',
    end: '2026-06-30'
  });

  const [reportType, setReportType] = useState('Daily');

  const reportData = {
    revenueSummary: 'LKR 840,000',
    paymentSummary: 'LKR 720,000',
    bookingSummary: '18 Active Bookings',
    outstandingPayments: 'LKR 120,000',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial & Accountant Reports</h2>
          <p className="text-xs text-slate-505 font-medium mt-0.5">Generate daily, weekly, monthly and custom range statements</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 p-2 rounded-xl shadow-sm">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none"
          >
            <option value="Daily">Daily Report</option>
            <option value="Weekly">Weekly Report</option>
            <option value="Monthly">Monthly Report</option>
            <option value="Custom">Custom Range</option>
          </select>
          {reportType === 'Custom' && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1" 
              />
              <span className="text-slate-400">to</span>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1" 
              />
            </div>
          )}
          <button className="bg-emerald-600 hover:bg-emerald-650 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition flex items-center gap-1">
            <FileDown className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Summary</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{reportData.revenueSummary}</h3>
          <p className="text-[10px] text-emerald-650 mt-1 flex items-center gap-1 font-bold">
            <ArrowUpRight className="h-3 w-3" /> +14% Target
          </p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payments Settled</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{reportData.paymentSummary}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Bank deposits</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Volume</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{reportData.bookingSummary}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Confirmed stays</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Amount</p>
          <h3 className="text-xl font-extrabold text-rose-600 mt-1">{reportData.outstandingPayments}</h3>
          <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> Due at check-out
          </p>
        </div>
      </div>

      {/* Ledger statement */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ledger Statement ({reportType})</h3>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Transaction / Categories</th>
              <th className="p-4">Currency Used</th>
              <th className="p-4">Processing Rates</th>
              <th className="p-4 text-right">LKR Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold">
            <tr className="hover:bg-slate-50/20 transition">
              <td className="p-4 font-bold text-slate-900">Direct Room Bookings</td>
              <td className="p-4">USD / LKR</td>
              <td className="p-4">Manual FO Rates</td>
              <td className="p-4 text-right font-mono text-slate-900">LKR 460,000</td>
            </tr>
            <tr className="hover:bg-slate-50/20 transition">
              <td className="p-4 font-bold text-slate-900">Booking.com Inflow</td>
              <td className="p-4">LKR</td>
              <td className="p-4">1.00</td>
              <td className="p-4 text-right font-mono text-slate-900">LKR 380,000</td>
            </tr>
            <tr className="hover:bg-slate-50/10 transition bg-slate-50/20 font-bold">
              <td colSpan="3" className="p-4 text-slate-400 text-right uppercase">Gross Summary Total:</td>
              <td className="p-4 text-right font-mono text-emerald-700 text-sm">LKR 840,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
