import React, { useState, useEffect } from 'react';
import { Building, Upload, Calendar, Send, CheckCircle2 } from 'lucide-react';

const GuestRegistration = () => {
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

  const [nights, setNights] = useState(0);
  const [submitted, setSubmitted] = useState(false);
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
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mandatory = [
      'guestName', 'checkInDate', 'checkOutDate', 
      'passportNumber', 'whatsAppNumber', 'nationality'
    ];
    for (const key of mandatory) {
      if (!formData[key]) {
        setError(`Please fill in all mandatory text fields (including ${key.replace(/([A-Z])/g, ' $1')})`);
        return;
      }
    }

    if (!formData.guestPhoto || !formData.passportFront || !formData.passportBack) {
      setError('Please upload your photo and passport front/back images');
      return;
    }

    setError('');
    
    const payload = {
      guestName: formData.guestName,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      passportNumber: formData.passportNumber,
      whatsappNumber: formData.whatsAppNumber,
      nationality: formData.nationality,
      adults: parseInt(formData.adults),
      children: parseInt(formData.children),
      guestPhotoPath: `/uploads/${formData.guestPhoto.name}`,
      passportFrontPath: `/uploads/${formData.passportFront.name}`,
      passportBackPath: `/uploads/${formData.passportBack.name}`
    };

    fetch('http://localhost:8080/api/public/guest-registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to submit guest registration to server');
      }
      return res.json();
    })
    .then(() => {
      setSubmitted(true);
    })
    .catch(err => {
      setError(err.message || 'Network error occurred. Please try again.');
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-emerald-50/40 text-slate-800 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-emerald-100 rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-emerald-50 border border-emerald-550 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registration Submitted</h2>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed">
            Thank you! Your registration details have been sent to the Front Office dashboard.
            The front office staff will allocate your room and finalize your booking.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Property: Serene Villa Pvt Ltd</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 text-slate-850 py-12 px-6 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden">
        {/* Header Banner */}
        <div className="bg-emerald-600 p-8 flex items-center gap-4 text-white">
          <div className="h-11 w-11 bg-white/10 rounded-xl flex items-center justify-center">
            <Building className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Guest Registration</h1>
            <p className="text-xs text-emerald-100 mt-0.5">Please complete the check-in details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Guest Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
            <input
              type="text"
              name="guestName"
              placeholder="e.g. John Doe"
              value={formData.guestName}
              onChange={handleInputChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passport Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Passport Number *</label>
              <input
                type="text"
                name="passportNumber"
                placeholder="e.g. N1234567"
                value={formData.passportNumber}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number *</label>
              <input
                type="tel"
                name="whatsAppNumber"
                placeholder="e.g. +94 77 123 4567"
                value={formData.whatsAppNumber}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nationality *</label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer text-slate-800"
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

            {/* Dates */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Check-In Date *</label>
              <input
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Check-Out Date *</label>
              <input
                type="date"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Calculated Nights */}
            <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-4 flex items-center justify-between col-span-1 md:col-span-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Nights:</span>
              </div>
              <span className="text-sm font-extrabold text-white px-3.5 py-1 rounded-full bg-emerald-600 shadow-sm">
                {nights} Nights
              </span>
            </div>

            {/* Adults & Children */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Number of Adults *</label>
              <input
                type="number"
                name="adults"
                min="1"
                value={formData.adults}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Number of Children</label>
              <input
                type="number"
                name="children"
                min="0"
                value={formData.children}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Document and Photo Uploads</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Guest Photo */}
              <div className="border border-dashed border-slate-200 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  name="guestPhoto"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                />
                <Upload className="h-5.5 w-5.5 text-slate-400 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-slate-700">Guest Photo *</p>
                <p className="text-[9px] text-slate-400 mt-1 truncate">
                  {formData.guestPhoto ? formData.guestPhoto.name : 'Upload face photo'}
                </p>
              </div>

              {/* Passport Front */}
              <div className="border border-dashed border-slate-200 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  name="passportFront"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                />
                <Upload className="h-5.5 w-5.5 text-slate-400 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-slate-700">Passport Front *</p>
                <p className="text-[9px] text-slate-400 mt-1 truncate">
                  {formData.passportFront ? formData.passportFront.name : 'Upload front page'}
                </p>
              </div>

              {/* Passport Back */}
              <div className="border border-dashed border-slate-200 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  name="passportBack"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                />
                <Upload className="h-5.5 w-5.5 text-slate-400 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-slate-700">Passport Back *</p>
                <p className="text-[9px] text-slate-400 mt-1 truncate">
                  {formData.passportBack ? formData.passportBack.name : 'Upload back page'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-slate-200"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Send className="h-4 w-4" />
              Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestRegistration;
