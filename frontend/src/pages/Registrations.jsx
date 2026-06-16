import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Registrations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === 'ADMIN';
  const isFrontOfficer = user.role === 'FRONT_OFFICER';

  const [registrations, setRegistrations] = useState([
    {
      id: 1,
      guestName: 'Liam Johnson',
      nationality: 'British',
      whatsAppNumber: '+44 7911 123456',
      checkInDate: '2026-06-18',
      checkOutDate: '2026-06-25',
      adults: 2,
      children: 1,
      passportNumber: 'UK998877A',
      isHiddenFromFO: false,
    },
    {
      id: 2,
      guestName: 'Sophia Miller',
      nationality: 'German',
      whatsAppNumber: '+49 170 1234567',
      checkInDate: '2026-06-20',
      checkOutDate: '2026-06-24',
      adults: 1,
      children: 0,
      passportNumber: 'DE556677B',
      isHiddenFromFO: true,
    },
    {
      id: 3,
      guestName: 'Hiroshi Tanaka',
      nationality: 'Japanese',
      whatsAppNumber: '+81 90 1234 5678',
      checkInDate: '2026-06-22',
      checkOutDate: '2026-06-28',
      adults: 2,
      children: 0,
      passportNumber: 'JP112233C',
      isHiddenFromFO: false,
    }
  ]);

  const toggleVisibility = (id) => {
    setRegistrations(prev =>
      prev.map(reg => reg.id === id ? { ...reg, isHiddenFromFO: !reg.isHiddenFromFO } : reg)
    );
  };

  const visibleRegistrations = registrations.filter(
    (reg) => !isFrontOfficer || !reg.isHiddenFromFO
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Guest Registrations</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Self submissions via public QR code form</p>
        </div>
        <button 
          onClick={() => navigate('/qr-register')} 
          className="bg-emerald-650 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
        >
          <Plus className="h-4 w-4" /> Guest QR Form Link
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Guest Info</th>
              <th className="p-4">Passport & Contact</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Pax</th>
              <th className="p-4">Visibility Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold">
            {visibleRegistrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-slate-50/20 transition">
                <td className="p-4">
                  <p className="font-bold text-slate-900 text-sm">{reg.guestName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{reg.nationality}</p>
                </td>
                <td className="p-4">
                  <p className="font-mono text-slate-800">{reg.passportNumber}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{reg.whatsAppNumber}</p>
                </td>
                <td className="p-4">
                  <p>In: {reg.checkInDate}</p>
                  <p className="text-slate-405 text-[10px] mt-0.5">Out: {reg.checkOutDate}</p>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-600">
                    A: {reg.adults} / C: {reg.children}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    reg.isHiddenFromFO 
                      ? 'bg-rose-50 border border-rose-100/50 text-rose-600' 
                      : 'bg-emerald-50 border border-emerald-100/50 text-emerald-700'
                  }`}>
                    {reg.isHiddenFromFO ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {reg.isHiddenFromFO ? 'Hidden from FO' : 'Visible to All'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => toggleVisibility(reg.id)}
                        title={reg.isHiddenFromFO ? "Show to Front Office" : "Hide from Front Office"}
                        className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600 transition"
                      >
                        {reg.isHiddenFromFO ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate('/bookings', { state: { allocateFromReg: reg } })}
                      className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-600 text-white font-bold transition shadow-sm"
                    >
                      <CheckCircle className="h-3 w-3" /> Allocate & Book
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Registrations;
