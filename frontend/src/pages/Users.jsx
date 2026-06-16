import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Activity } from 'lucide-react';

const Users = () => {
  const { user } = useAuth();

  if (user.role !== 'ADMIN') {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-rose-600 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-800">Access Denied</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Only Admin users can manage roles and view staff activity logs.
        </p>
      </div>
    );
  }

  const [staff, setStaff] = useState([
    { id: 1, username: 'admin_user', role: 'ADMIN', lastActive: '2026-06-16 09:20' },
    { id: 2, username: 'accountant_user', role: 'ACCOUNTANT', lastActive: '2026-06-16 08:45' },
    { id: 3, username: 'fo_user', role: 'FRONT_OFFICER', lastActive: '2026-06-16 09:22' }
  ]);

  const [activities, setActivities] = useState([
    { id: 101, staff: 'fo_user', action: 'Allocated Room 101 for Liam Johnson', time: '2026-06-16 09:15' },
    { id: 102, staff: 'fo_user', action: 'Uploaded Advance Slip - LKR 40,000 for SV-2026-0001', time: '2026-06-16 09:18' },
    { id: 103, staff: 'admin_user', action: 'Approved Discount LKR 15,000 for SV-2026-0002', time: '2026-06-16 09:20' },
    { id: 104, staff: 'fo_user', action: 'Requested discount for Liam Johnson', time: '2026-06-16 09:22' }
  ]);

  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('FRONT_OFFICER');

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUsername) return;

    const newStaff = {
      id: Date.now(),
      username: newUsername,
      role: newRole,
      lastActive: 'Never'
    };

    setStaff([...staff, newStaff]);
    
    setActivities([
      {
        id: Date.now() + 1,
        staff: user.username,
        action: `Created new user ${newUsername} with role ${newRole}`,
        time: new Date().toISOString().replace('T', ' ').slice(0, 16)
      },
      ...activities
    ]);

    setNewUsername('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Staff Management & Role Control</h2>
        <p className="text-xs text-slate-505 font-medium mt-0.5">Create staff accounts, allocate roles, and audit individual activity logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="h-4.5 w-4.5 text-emerald-600" /> Create Account
          </h3>
          
          <form onSubmit={handleAddUser} className="space-y-4 text-xs font-semibold text-slate-650">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="e.g. fo_sam"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role Type</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="FRONT_OFFICER">Front Officer</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-650 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Add User Account
            </button>
          </form>
        </div>

        {/* Staff list */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 lg:col-span-2 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-emerald-600" /> Active Staff Accounts
          </h3>
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-655 font-semibold">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/20 transition">
                    <td className="p-3 font-bold text-slate-900">{s.username}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-slate-50 border border-slate-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {s.role}
                      </span>
                    </td>
                    <td className="p-3 text-[10px] font-mono text-slate-400">{s.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-emerald-600" /> Staff Activity Logs
        </h3>
        
        <div className="space-y-2">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 text-xs font-semibold">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mr-2.5 uppercase tracking-wide">
                  {act.staff}
                </span>
                <span className="text-slate-700">
                  {act.action}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap ml-4">
                {act.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Users;
