import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

const Discounts = () => {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';

  const [requests, setRequests] = useState([
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
  ]);

  const handleAction = (id, status) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status,
          approvedBy: status === 'Approved' ? user.username : undefined
        };
      }
      return req;
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Discount Approval Requests</h2>
        <p className="text-xs text-slate-505 font-medium mt-0.5">
          {isAdmin 
            ? 'Review and Approve/Reject discount requests submitted by Front Office staff' 
            : 'Track the approval status of your submitted discount requests.'}
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Booking Ref</th>
              <th className="p-4">Guest Info</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Status</th>
              {isAdmin && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/20 transition">
                <td className="p-4 font-mono text-emerald-700 font-bold">{req.bookingRef}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-900">{req.guestName}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">By: {req.requestedBy}</p>
                </td>
                <td className="p-4 font-mono">LKR {req.totalAmount.toLocaleString()}</td>
                <td className="p-4 text-emerald-650 font-extrabold font-mono">{req.requestedDiscount}</td>
                <td className="p-4 text-slate-500 font-normal">{req.reason}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    req.status === 'Approved' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/30' 
                      : req.status === 'Rejected' 
                      ? 'bg-rose-50 text-rose-800 border border-rose-100/30' 
                      : 'bg-amber-50 text-amber-800 border border-amber-100/30'
                  }`}>
                    {req.status}
                  </span>
                  {req.status === 'Approved' && (
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">By {req.approvedBy}</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="p-4 text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleAction(req.id, 'Approved')}
                          className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 transition"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'Rejected')}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 transition"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Discounts;
