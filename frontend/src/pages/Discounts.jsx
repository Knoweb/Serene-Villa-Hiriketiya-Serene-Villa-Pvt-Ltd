import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X, Tag, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Discounts = () => {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('DISCOUNTS'); // 'DISCOUNTS' | 'DELETIONS'
  const [staff, setStaff] = useState([]);

  // Discount Requests state (Server DB)
  const [requests, setRequests] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  // Delete Requests state (Server DB)
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [loadingDeletes, setLoadingDeletes] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

  const fetchDiscountRequests = async () => {
    setLoadingDiscounts(true);
    try {
      const res = await fetch(`${API_BASE}/discount-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching discount requests:', err);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const fetchDeleteRequests = async () => {
    setLoadingDeletes(true);
    try {
      const res = await fetch(`${API_BASE}/delete-requests`);
      if (res.ok) {
        const data = await res.json();
        setDeleteRequests(data);
      }
    } catch (err) {
      console.error('Error fetching delete requests:', err);
    } finally {
      setLoadingDeletes(false);
    }
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/users`);
        if (res.ok) {
          const data = await res.json();
          setStaff(data);
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
      }
    };
    fetchStaff();
    fetchDiscountRequests();
    fetchDeleteRequests();

    // Setup live WebSocket sync
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname;
    const wsPort = import.meta.env.VITE_API_BASE_URL ? '' : ':8080';
    const wsUrl = `${wsProtocol}//${wsHost}${wsPort}/ws/registrations`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = () => {
        fetchDiscountRequests();
        fetchDeleteRequests();
      };
    } catch (e) {
      console.warn('WebSocket connection not supported or failed', e);
    }

    // Interval fallback to keep requests fresh
    const interval = setInterval(() => {
      fetchDiscountRequests();
      fetchDeleteRequests();
    }, 10000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, []);

  const handleAction = async (id, status) => {
    try {
      const endpoint = status === 'Approved'
        ? `${API_BASE}/discount-requests/${id}/approve?approvedBy=${encodeURIComponent(user.username || 'Admin')}`
        : `${API_BASE}/discount-requests/${id}/reject?rejectedBy=${encodeURIComponent(user.username || 'Admin')}`;

      const res = await fetch(endpoint, { method: 'PUT' });
      if (res.ok) {
        toast.success(`Discount request marked as ${status}`);
        fetchDiscountRequests();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update discount request');
      }
    } catch (err) {
      console.error('Error handling discount request:', err);
      toast.error('Network error updating discount request');
    }
  };

  const handleDeleteApproval = async (id, action) => {
    try {
      const endpoint = action === 'approve' 
        ? `${API_BASE}/delete-requests/${id}/approve?approvedBy=${encodeURIComponent(user.username || 'Admin')}`
        : `${API_BASE}/delete-requests/${id}/reject?rejectedBy=${encodeURIComponent(user.username || 'Admin')}`;

      const res = await fetch(endpoint, { method: 'PUT' });
      if (res.ok) {
        toast.success(action === 'approve' ? 'Deletion approved and record deleted successfully!' : 'Deletion request rejected');
        fetchDeleteRequests();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update request');
      }
    } catch (err) {
      console.error('Error handling delete request:', err);
      toast.error('Network error updating delete request');
    }
  };

  // Clear all history from Server Database (Admin Only)
  const handleClearHistory = async (type) => {
    const confirmMessage = type === 'DISCOUNTS' 
      ? 'Are you sure you want to permanently clear all discount requests from the database?' 
      : 'Are you sure you want to permanently clear all deletion requests from the database?';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const endpoint = type === 'DISCOUNTS'
        ? `${API_BASE}/discount-requests/clear-all`
        : `${API_BASE}/delete-requests/clear-all`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        toast.success(type === 'DISCOUNTS' ? 'All discount requests cleared!' : 'All deletion requests cleared!');
        if (type === 'DISCOUNTS') {
          fetchDiscountRequests();
          localStorage.removeItem('pms_discounts');
        } else {
          fetchDeleteRequests();
        }
      } else {
        toast.error('Failed to clear history');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error('Network error clearing history');
    }
  };

  const pendingDiscountsCount = requests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const pendingDeletesCount = deleteRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Staff Approval Requests</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isAdmin 
              ? 'Review and Approve/Reject discount and deletion requests submitted by Front Office staff' 
              : 'Track the approval status of your submitted discount and deletion requests.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('DISCOUNTS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'DISCOUNTS'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              <span>Discounts</span>
              {pendingDiscountsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                  {pendingDiscountsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('DELETIONS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'DELETIONS'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span>Delete Requests</span>
              {pendingDeletesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
                  {pendingDeletesCount}
                </span>
              )}
            </button>
          </div>

          {/* Admin Clear All History Button */}
          {isAdmin && (
            <button
              onClick={() => handleClearHistory(activeTab)}
              title="Clear all records in current tab"
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear History
            </button>
          )}
        </div>
      </div>

      {activeTab === 'DISCOUNTS' ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          {loadingDiscounts ? (
            <div className="p-8 text-center text-slate-400 font-semibold">Loading discount requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold">No discount requests found.</div>
          ) : (
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
              <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/20 transition">
                    <td className="p-4 font-mono text-emerald-700 font-bold">{req.bookingRef}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{req.guestName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-slate-400 font-bold">By: {req.requestedBy}</span>
                        <span className="text-[8px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          {staff.find(s => s.username === req.requestedBy)?.role?.replace('_', ' ') || 'Front Officer'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">{req.currency || 'USD'} {req.totalAmount ? Number(req.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td className="p-4 text-emerald-700 font-extrabold font-mono">{req.requestedDiscount || (req.discountAmount ? `${req.currency || 'USD'} ${Number(req.discountAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '')}</td>
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
                      {req.status === 'Approved' && req.approvedBy && (
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">By {req.approvedBy}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        {req.status === 'Pending' ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleAction(req.id, 'Approved')}
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 transition cursor-pointer"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAction(req.id, 'Rejected')}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 transition cursor-pointer"
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
          )}
        </div>
      ) : (
        /* Delete Requests Table */
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          {loadingDeletes ? (
            <div className="p-8 text-center text-slate-400 font-semibold">Loading delete requests...</div>
          ) : deleteRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold">No delete requests found.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Ref / ID</th>
                  <th className="p-4">Guest Name</th>
                  <th className="p-4">Requested By</th>
                  <th className="p-4">Reason for Deletion</th>
                  <th className="p-4">Status</th>
                  {isAdmin && <th className="p-4 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                {deleteRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/20 transition">
                    <td className="p-4 font-mono text-slate-800 font-bold">
                      {req.bookingRef || `Reg #${req.registrationId}`}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{req.guestName}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{req.requestedBy}</p>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : ''}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs text-slate-600 font-medium">
                      {req.reason}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/30'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-100/30'
                          : 'bg-amber-50 text-amber-800 border border-amber-100/30'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'APPROVED' && req.approvedBy && (
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">By {req.approvedBy}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleDeleteApproval(req.id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-sm cursor-pointer transition text-[11px]"
                              title="Approve Deletion (Permanently deletes the record)"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve & Delete
                            </button>
                            <button
                              onClick={() => handleDeleteApproval(req.id, 'reject')}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition cursor-pointer"
                              title="Reject Request"
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
          )}
        </div>
      )}
    </div>
  );
};

export default Discounts;
