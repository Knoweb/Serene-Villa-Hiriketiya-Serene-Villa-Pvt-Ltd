import React, { useState, useEffect } from 'react';
import { Building, Upload, Calendar, Send, CheckCircle2, User, FileText, Phone, Globe, Users, ChevronLeft, Loader } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GuestRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhoto: null,
    checkInDate: '',
    checkOutDate: '',
    passportFront: null,
    passportBack: null,
    passportNumber: '',
    whatsAppNumber: '',
    nationality: '',
    adults: 1,
    children: 0,
  });

  const [previews, setPreviews] = useState({
    guestPhoto: null,
    passportFront: null,
    passportBack: null,
  });

  const [nights, setNights] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const start = new Date(formData.checkInDate);
      const end = new Date(formData.checkOutDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays > 0 ? diffDays : 0);
    } else {
      setNights(0);
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      setPreviews((prev) => ({ ...prev, [name]: URL.createObjectURL(file) }));
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mandatory = [
      'guestName', 'checkInDate', 'checkOutDate', 
      'passportNumber', 'whatsAppNumber', 'nationality'
    ];
    for (const key of mandatory) {
      if (!formData[key]) {
        setError(`Please fill in the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
        return;
      }
    }

    if (!formData.guestPhoto || !formData.passportFront || !formData.passportBack) {
      setError('Please upload all requested images (face photo and passport front/back).');
      return;
    }

    setError('');
    setSubmitting(true);
    
    try {
      const guestPhotoBase64 = await fileToBase64(formData.guestPhoto);
      const passportFrontBase64 = await fileToBase64(formData.passportFront);
      const passportBackBase64 = await fileToBase64(formData.passportBack);

      const payload = {
        guestName: formData.guestName,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        passportNumber: formData.passportNumber,
        whatsappNumber: formData.whatsAppNumber,
        nationality: formData.nationality,
        adults: parseInt(formData.adults),
        children: parseInt(formData.children),
        guestPhotoPath: guestPhotoBase64,
        passportFrontPath: passportFrontBase64,
        passportBackPath: passportBackBase64
      };

      const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

      const res = await fetch(`${API_BASE}/public/guest-registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to submit guest registration to server');
      }

      setSubmitted(true);
      if (user) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Server is currently offline. Please try again later.');
      } else {
        setError(err.message || 'Network error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-emerald-50 border border-emerald-600/20 rounded-full flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Registration Submitted</h2>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed px-4">
              Thank you! Your registration details have been sent to our system. The front office will review your details shortly.
            </p>
          </div>
          {user && (
            <div className="pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md shadow-emerald-500/10"
              >
                Go to Dashboard
              </button>
            </div>
          )}
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-1">
            <img src={logoImg} alt="Serene Villa Logo" className="h-7 object-contain opacity-80" />
            <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Serene Villa Pvt Ltd</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Centered Main Form Container */}
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6 sm:py-12 space-y-6">
        
        {/* Compact Header Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm flex items-center gap-4">
          <img src={logoImg} alt="Hotel Logo" className="h-14 w-14 object-cover rounded-2xl border border-emerald-100" />
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">Guest Registration</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Please complete the check-in details below</p>
            <span className="inline-block bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md mt-1.5 uppercase tracking-wide">Serene Villa</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold shadow-xs">
              {error}
            </div>
          )}

          {/* Form Fields Section */}
          <div className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <User size={12} className="text-slate-400" /> Full Name *
              </label>
              <input
                type="text"
                name="guestName"
                placeholder="e.g. John Doe"
                value={formData.guestName}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            {/* Passport & WhatsApp Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <FileText size={12} className="text-slate-400" /> Passport Number *
                </label>
                <input
                  type="text"
                  name="passportNumber"
                  placeholder="e.g. N1234567"
                  value={formData.passportNumber}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Phone size={12} className="text-slate-400" /> WhatsApp Number *
                </label>
                <input
                  type="tel"
                  name="whatsAppNumber"
                  placeholder="e.g. +94 77 123 4567"
                  value={formData.whatsAppNumber}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Nationality */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Globe size={12} className="text-slate-400" /> Nationality *
              </label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition cursor-pointer text-slate-800"
              >
                <option value="">Select Nationality</option>
                <option value="Sri Lankan">Sri Lankan</option>
                <option value="British">British</option>
                <option value="German">German</option>
                <option value="Russian">Russian</option>
                <option value="French">French</option>
                <option value="Indian">Indian</option>
                <option value="Australian">Australian</option>
                <option value="Chinese">Chinese</option>
                <option value="Maldivian">Maldivian</option>
                <option value="American">American</option>
                <option value="Canadian">Canadian</option>
                <option value="Italian">Italian</option>
                <option value="Swiss">Swiss</option>
                <option value="Dutch">Dutch</option>
                <option value="Swedish">Swedish</option>
                <option value="Japanese">Japanese</option>
                <option value="Ukrainian">Ukrainian</option>
                <option value="Polish">Polish</option>
                <option value="Spanish">Spanish</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Check-In *
                </label>
                <input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Check-Out *
                </label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Nights Display Badge */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-emerald-700" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total Duration:</span>
              </div>
              <span className="text-xs font-extrabold text-white px-3 py-1 rounded-full bg-emerald-600 shadow-sm shadow-emerald-500/10">
                {nights} Nights
              </span>
            </div>

            {/* Guests Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Users size={12} className="text-slate-400" /> Adults *
                </label>
                <input
                  type="number"
                  name="adults"
                  min="1"
                  value={formData.adults}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Users size={12} className="text-slate-400" /> Children
                </label>
                <input
                  type="number"
                  name="children"
                  min="0"
                  value={formData.children}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

          </div>

          {/* Upload Section */}
          <div className="space-y-4 pt-5 border-t border-slate-100">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Document Copies</h3>
            
            <div className="grid grid-cols-1 gap-4">
              
              {/* Face Photo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Guest Photo (Face View) *</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 bg-white transition cursor-pointer relative overflow-hidden group shadow-xs">
                  <input
                    type="file"
                    name="guestPhoto"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept="image/*"
                  />
                  {previews.guestPhoto ? (
                    <div className="flex items-center gap-4 w-full">
                      <img src={previews.guestPhoto} alt="Face Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-150" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{formData.guestPhoto.name}</p>
                        <p className="text-[9px] text-emerald-600 font-bold">Image loaded successfully</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-xl z-20 transition">Change</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2 group-hover:text-emerald-600 transition" />
                      <p className="text-xs font-bold text-slate-700">Click to upload face photo</p>
                      <p className="text-[9px] text-slate-400 mt-1">PNG, JPG or JPEG format</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Passport Front */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Passport Front Page *</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 bg-white transition cursor-pointer relative overflow-hidden group shadow-xs">
                  <input
                    type="file"
                    name="passportFront"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept="image/*"
                  />
                  {previews.passportFront ? (
                    <div className="flex items-center gap-4 w-full">
                      <img src={previews.passportFront} alt="Passport Front Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-150" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{formData.passportFront.name}</p>
                        <p className="text-[9px] text-emerald-600 font-bold">Image loaded successfully</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-xl z-20 transition">Change</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2 group-hover:text-emerald-600 transition" />
                      <p className="text-xs font-bold text-slate-700">Click to upload passport front</p>
                      <p className="text-[9px] text-slate-400 mt-1">PNG, JPG or JPEG format</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Passport Back */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Passport Back Page *</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 bg-white transition cursor-pointer relative overflow-hidden group shadow-xs">
                  <input
                    type="file"
                    name="passportBack"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept="image/*"
                  />
                  {previews.passportBack ? (
                    <div className="flex items-center gap-4 w-full">
                      <img src={previews.passportBack} alt="Passport Back Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-150" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{formData.passportBack.name}</p>
                        <p className="text-[9px] text-emerald-600 font-bold">Image loaded successfully</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-xl z-20 transition">Change</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2 group-hover:text-emerald-600 transition" />
                      <p className="text-xs font-bold text-slate-700">Click to upload passport back</p>
                      <p className="text-[9px] text-slate-400 mt-1">PNG, JPG or JPEG format</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {submitting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Register'}
            </button>
          </div>

        </form>
      </div>

      {/* Footer copyright */}
      <footer className="w-full text-center py-4 bg-white border-t border-slate-100 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        © {new Date().getFullYear()} Serene Villa Pvt Ltd. All rights reserved.
      </footer>
    </div>
  );
};

export default GuestRegistration;
