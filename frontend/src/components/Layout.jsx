import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Bell, 
  User as UserIcon, 
  LogOut,
  Building,
  ChevronDown
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, currentProperty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  if (!user) {
    return <div className="min-h-screen bg-emerald-50/40 flex items-center justify-center text-slate-800">Redirecting...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'ACCOUNTANT', 'FRONT_OFFICER'] },
    { name: 'Registrations', path: '/registrations', roles: ['ADMIN', 'ACCOUNTANT', 'FRONT_OFFICER'] },
    { name: 'Rooms', path: '/rooms', roles: ['ADMIN'] },
    { name: 'Bookings', path: '/bookings', roles: ['ADMIN'] },
    { name: 'Payments', path: '/payments', roles: ['ADMIN', 'ACCOUNTANT'] },
    { name: 'Discounts', path: '/discounts', roles: ['ADMIN'] },
    { name: 'Handovers', path: '/handover', roles: ['ADMIN', 'ACCOUNTANT', 'FRONT_OFFICER'] },
    { name: 'Reports', path: '/reports', roles: ['ADMIN', 'ACCOUNTANT'] },
    { name: 'Users', path: '/users', roles: ['ADMIN'] },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/30 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-emerald-100/80 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Property Area */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base">Serene Villa</span>
                <span className="text-xs text-emerald-600 block -mt-1 font-medium">{currentProperty.name}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems
                .filter((item) => item.roles.includes(user.role))
                .map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
            </nav>
          </div>

          {/* Right Area: Notifications & Profile Dropdown */}
          <div className="flex items-center gap-4">
            {/* Notification Icon */}
            <button className="h-9 w-9 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 flex items-center justify-center border border-slate-100 transition relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-emerald-600 rounded-full"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition text-left"
              >
                <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-750 font-bold text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-bold text-slate-900 leading-tight">{user.username}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">{user.role}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-50 text-xs">
                    <p className="text-slate-400">Signed in as</p>
                    <p className="font-bold text-slate-800 truncate">{user.username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
