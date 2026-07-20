import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Bell, 
  User as UserIcon, 
  LogOut,
  Building,
  ChevronDown,
  Instagram,
  Facebook,
  Mail,
  Settings,
  Sliders,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

const Layout = ({ children }) => {
  const { user, logout, currentProperty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Custom personalization settings
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('pms_custom_bg') || '/src/assets/resort_bg.png');
  const [bgOpacity, setBgOpacity] = useState(() => {
    const saved = localStorage.getItem('pms_bg_opacity');
    return saved !== null ? parseFloat(saved) : 0.58;
  });

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
    { name: 'Reservations', path: '/reservations', roles: ['ADMIN', 'ACCOUNTANT', 'FRONT_OFFICER'] },
    { name: 'Rooms', path: '/rooms', roles: ['ADMIN'] },
    { name: 'Bookings', path: '/bookings', roles: ['ADMIN'] },
    { name: 'Payments', path: '/payments', roles: ['ADMIN', 'ACCOUNTANT'] },
    { name: 'Discounts', path: '/discounts', roles: ['ADMIN'] },
    { name: 'Reports', path: '/reports', roles: ['ADMIN', 'ACCOUNTANT'] },
    { name: 'Hide Details', path: '/hide-details', roles: ['ADMIN'] },
    { name: 'Users', path: '/users', roles: ['ADMIN'] },
  ];

  return (
    <div 
      className="min-h-screen text-slate-800 flex flex-col font-sans"
      style={{
        backgroundImage: `linear-gradient(rgba(240, 253, 244, ${bgOpacity}), rgba(240, 253, 244, ${bgOpacity})), url('${bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-emerald-100/80 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Property Area */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <img src={logoImg} alt="Serene Villa Logo" className="h-11 w-11 object-contain shrink-0" />
              <div className="shrink-0">
                <span className="font-bold text-slate-900 tracking-tight text-base whitespace-nowrap block">Serene Villa</span>
                <span className="text-xs text-emerald-600 block -mt-1 font-medium whitespace-nowrap">{currentProperty.name}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden xl:flex items-center gap-3.5 ml-4 shrink-0">
              {navItems
                .filter((item) => item.roles.includes(user.role))
                .map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                       key={item.path}
                       to={item.path}
                       className={`px-1 py-1.5 text-xs font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${
                         isActive
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-emerald-600'
                       }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
            </nav>
            
            {/* Fallback for smaller desktop displays to show a compact scrollable list */}
            <nav className="hidden lg:flex xl:hidden items-center gap-2.5 ml-3 overflow-x-auto no-scrollbar py-1 shrink">
              {navItems
                .filter((item) => item.roles.includes(user.role))
                .map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                       key={item.path}
                       to={item.path}
                       className={`px-1 py-1 text-[11px] font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${
                         isActive
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-emerald-600'
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
            <button className="h-10 w-10 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 flex items-center justify-center border border-slate-100 transition relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-3 h-2 w-2 bg-emerald-600 rounded-full"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-2 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition text-left"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-750 font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{user.username}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-50 text-sm">
                    <p className="text-slate-400">Signed in as</p>
                    <p className="font-bold text-slate-800 truncate">{user.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-semibold transition border-b border-slate-50 text-left"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    User Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium transition text-left"
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

      {/* Footer Section */}
      <footer className="bg-gradient-to-b from-slate-900 to-emerald-950 text-slate-300 py-8 border-t border-emerald-900/40 print:hidden mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center space-y-5">
          
          <Link to="/handover" onClick={() => window.scrollTo(0, 0)} className="bg-white p-1 rounded shadow-md flex items-center justify-center cursor-pointer hover:opacity-90 transition">
            <img src={logoImg} alt="Serene Villa Logo" className="h-10 w-10 object-contain" />
          </Link>

          {/* Tagline */}
          <p className="text-[11px] md:text-xs text-slate-400 font-medium tracking-wide text-center">
            Discover a Range of Exceptional Services Tailored to Enhance Your Experience
          </p>

          {/* Divider */}
          <div className="w-full border-t border-slate-800/80"></div>

          {/* Bottom Bar */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-slate-550 font-bold">
            {/* Copyright */}
            <p>
              © 2026 Serene Villa. Designed & Developed by <a href="https://knowebsolutions.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition">knowebsolutions</a>.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded bg-slate-800/60 hover:bg-emerald-800/30 border border-slate-700/60 hover:border-emerald-600/40 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition">
                <Instagram size={12} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded bg-slate-800/60 hover:bg-emerald-800/30 border border-slate-700/60 hover:border-emerald-600/40 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition">
                <Facebook size={12} />
              </a>
              <a href="mailto:reservations@serenevilla.com" className="h-7 w-7 rounded bg-slate-800/60 hover:bg-emerald-800/30 border border-slate-700/60 hover:border-emerald-600/40 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition">
                <Mail size={12} />
              </a>
            </div>
          </div>

        </div>
      </footer>
      {/* Settings / Personalization Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Personalization Settings</h3>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Background Image Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Dashboard Background
                </label>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Option 1: Default Resort */}
                  <button
                    onClick={() => {
                      setBgImage('/src/assets/resort_bg.png');
                      localStorage.setItem('pms_custom_bg', '/src/assets/resort_bg.png');
                    }}
                    className={`aspect-video rounded-lg overflow-hidden border-2 relative transition cursor-pointer ${
                      bgImage === '/src/assets/resort_bg.png' ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-emerald-100' : 'border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="w-full h-full bg-slate-100 relative">
                      <img src="/src/assets/resort_bg.png" alt="Resort" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-end justify-center p-1">
                        <span className="text-[8px] text-white font-bold uppercase">Default</span>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Soft Color (No Image) */}
                  <button
                    onClick={() => {
                      setBgImage('');
                      localStorage.setItem('pms_custom_bg', '');
                    }}
                    className={`aspect-video rounded-lg overflow-hidden border-2 relative transition cursor-pointer ${
                      bgImage === '' ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-emerald-100' : 'border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-emerald-55 to-emerald-100/50 flex items-center justify-center relative">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">None</span>
                    </div>
                  </button>

                  {/* Option 3: Custom Upload */}
                  <div className="relative aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 transition flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target.result;
                            setBgImage(result);
                            localStorage.setItem('pms_custom_bg', result);
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-[8px] text-slate-500 font-bold uppercase text-center leading-tight">Upload</span>
                  </div>
                </div>
              </div>

              {/* Opacity / Visibility Slider */}
              {bgImage && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Background Image Visibility</span>
                    <span className="text-emerald-700 font-extrabold">{Math.round((1 - bgOpacity) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="80"
                    value={Math.round((1 - bgOpacity) * 100)}
                    onChange={(e) => {
                      const visibilityVal = parseInt(e.target.value);
                      const computedOpacity = 1 - (visibilityVal / 100);
                      setBgOpacity(computedOpacity);
                      localStorage.setItem('pms_bg_opacity', computedOpacity.toString());
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-150 rounded-lg cursor-pointer appearance-none"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>Softer (Faded)</span>
                    <span>Stronger (Vibrant)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSettingsOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-500/10"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
