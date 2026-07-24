import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Activity, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

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

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('FRONT_OFFICER');

  // Fetch all users from the backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    setAddingUser(true);
    try {
      const payload = {
        username: newUsername,
        password: newPassword,
        role: newRole,
        propertyId: 1,
        active: true
      };

      const res = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdUser = await res.json();
        setStaff(prev => [...prev, createdUser]);

        setNewUsername('');
        setNewPassword('');
        alert('User account successfully created in database!');
      } else {
        alert('Failed to create user account. Username might already exist.');
      }
    } catch (err) {
      alert('Error connecting to backend: ' + err.message);
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create New Account Form */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="h-4.5 w-4.5 text-emerald-600" /> Create Account
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Register new system users and assign roles</p>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="e.g. frontdesk1"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              >
                <option value="ADMIN">Administrator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="FRONT_OFFICER">Front Officer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={addingUser}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingUser ? (
                <>
                  <Loader className="h-3.5 w-3.5 animate-spin" /> Creating Account...
                </>
              ) : (
                <>Create Account</>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Staff List */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-emerald-600" /> Active System Staff
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Manage system logins and active user status</p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-450 gap-2">
                <Loader className="h-6 w-6 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold">Loading users...</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pl-3">Username</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 pl-3 font-bold text-slate-850">{s.username}</td>
                      <td className="p-3">
                        <span className="bg-slate-50 text-slate-700 border border-slate-150 rounded px-2 py-0.5 font-bold uppercase text-[9px] tracking-wide">
                          {s.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.active ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                          {s.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
