import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building, Mail, Lock } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your email or username');
      return;
    }

    // Auto-detect role and validate credentials
    let determinedRole = 'FRONT_OFFICER';
    const lowerUser = username.toLowerCase();
    
    if (lowerUser.includes('admin')) {
      determinedRole = 'ADMIN';
      if (username !== 'admin@serene.com' || password !== 'admin@serene123') {
        setError('Invalid admin credentials');
        return;
      }
    } else if (lowerUser.includes('account')) {
      determinedRole = 'ACCOUNTANT';
    }

    const success = login(username, password, determinedRole);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };



  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left side: Hotel Property Image */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src="/login_bg.png"
          alt="Hotel Entrance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-900/20 to-black/30 flex flex-col justify-end p-12 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight">Serene Villa</h1>
          <p className="text-emerald-100 text-sm mt-2 max-w-md">
            Premium hospitality and property management suite. Track reservations, process payments, and manage property portfolios effortlessly.
          </p>
        </div>
      </div>

      {/* Right side: Clean Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-20 lg:px-24 py-12 bg-emerald-50/10">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Logo & Welcome Header */}
          <div className="flex flex-col items-center">
            <img src={logoImg} alt="Serene Villa Logo" className="h-28 w-28 object-contain mb-3" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back!</h1>
            <p className="text-xs text-slate-500 mt-2 text-center max-w-xs leading-relaxed font-semibold">
              To keep connected with us please login with your personal information by email and password.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter your email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="text-emerald-600 hover:text-emerald-700">Forget Password?</a>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md"
            >
              Login
            </button>
          </form>


        </div>
      </div>
    </div>
  );
};

export default Login;
