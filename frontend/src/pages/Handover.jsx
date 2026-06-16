import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X, AlertTriangle } from 'lucide-react';

const Handover = () => {
  const { user } = useAuth();
  const isFrontOfficer = user.role === 'FRONT_OFFICER';
  const isAccountant = user.role === 'ACCOUNTANT';
  const isAdmin = user.role === 'ADMIN';

  const [handovers, setHandovers] = useState([
    {
      id: 1,
      date: '2026-06-15',
      submittedBy: 'fo_user',
      totalTransactions: 3,
      totalLkrEquivalent: 140000,
      status: 'Approved',
      reviewerNote: 'All matches with bank statement.',
    },
    {
      id: 2,
      date: '2026-06-16',
      submittedBy: 'fo_user',
      totalTransactions: 2,
      totalLkrEquivalent: 100000,
      status: 'Pending',
      reviewerNote: '',
    }
  ]);

  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionModalId, setRejectionModalId] = useState(null);

  const handleSubmitHandover = () => {
    const newHandover = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      submittedBy: user.username,
      totalTransactions: 4,
      totalLkrEquivalent: 240000,
      status: 'Pending',
      reviewerNote: '',
    };
    setHandovers([newHandover, ...handovers]);
  };

  const handleReview = (id, status, note = '') => {
    setHandovers(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          status,
          reviewerNote: note || (status === 'Approved' ? 'Verified by Accountant.' : 'Returned for Correction')
        };
      }
      return h;
    }));
    setRejectionModalId(null);
    setRejectionNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Daily Transaction Handovers</h2>
          <p className="text-xs text-slate-505 font-medium mt-0.5">Shift transactions submission and validation logger</p>
        </div>
        {isFrontOfficer && (
          <button
            onClick={handleSubmitHandover}
            className="bg-emerald-600 hover:bg-emerald-650 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm"
          >
            Submit Shift Transactions
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Shift Date</th>
              <th className="p-4">Submitted By</th>
              <th className="p-4">Tx Count</th>
              <th className="p-4">LKR Equivalent</th>
              <th className="p-4">Status</th>
              <th className="p-4">Reviewer Note</th>
              {(isAccountant || isAdmin) && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-655 font-semibold">
            {handovers.map((h) => (
              <tr key={h.id} className="hover:bg-slate-50/20 transition">
                <td className="p-4 font-mono font-bold text-slate-800">{h.date}</td>
                <td className="p-4 font-bold text-slate-905">{h.submittedBy}</td>
                <td className="p-4">{h.totalTransactions} Transactions</td>
                <td className="p-4 font-bold text-slate-900 font-mono">LKR {h.totalLkrEquivalent.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    h.status === 'Approved' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/30' 
                      : h.status === 'Rejected' 
                      ? 'bg-rose-50 text-rose-800 border border-rose-100/30' 
                      : 'bg-amber-50 text-amber-800 border border-amber-100/30'
                  }`}>
                    {h.status === 'Rejected' ? 'Returned for Correction' : h.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500 font-normal italic">
                  {h.reviewerNote || 'No notes yet'}
                </td>
                {(isAccountant || isAdmin) && (
                  <td className="p-4 text-right">
                    {h.status === 'Pending' ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleReview(h.id, 'Approved')}
                          className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 transition"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setRejectionModalId(h.id)}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 transition"
                          title="Request correction"
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

      {rejectionModalId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Reject Shift Submission</h3>
            </div>
            <p className="text-xs text-slate-500">This submission will be returned to the FO dashboard for corrections.</p>
            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Correction Instructions</label>
                <textarea 
                  required
                  rows="3"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Please recheck amount in transaction #2."
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl p-3 focus:outline-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setRejectionModalId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleReview(rejectionModalId, 'Rejected', rejectionNote)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-650 text-white rounded-xl font-bold"
                >
                  Reject & Send Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Handover;
