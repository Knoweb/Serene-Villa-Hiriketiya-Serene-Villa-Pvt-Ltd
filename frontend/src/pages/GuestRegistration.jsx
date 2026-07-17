import React, { useState, useEffect } from 'react';
import { Building, Upload, Calendar, Send, CheckCircle2, User, FileText, Phone, Globe, Users, ChevronLeft, Loader, MapPin, CreditCard, Receipt, Printer, Share2, X } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdvanceReceiptPrint from '../components/AdvanceReceiptPrint';

const GuestRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const receiptRef = React.useRef(null);
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
    roomType: '',
    paymentType: 'NONE',
    totalAmount: '',
    paymentAmount: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    paymentSlip: null,
    remarks: '',
  });

  const [previews, setPreviews] = useState({
    guestPhoto: null,
    passportFront: null,
    passportBack: null,
    paymentSlip: null,
  });

  // Load rooms from localStorage (same pattern as Registrations.jsx)
  const [rooms] = useState(() => {
    const saved = localStorage.getItem('pms_rooms');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Filter out demo rooms (id 101 with specific demo room type)
      const isDemo = parsed.length === 8 && parsed.some(r => r.id === 101 && r.roomType === 'Deluxe Room');
      if (!isDemo) return parsed;
      // Also check Rooms.jsx demo format
      const isDemo2 = parsed.length === 6 && parsed.some(r => r.id === 101 && r.roomType === 'Deluxe Ocean View');
      if (!isDemo2) return parsed;
    }
    return [];
  });
  const uniqueRoomTypes = Array.from(new Set(rooms.map(r => r.roomType)));

  const [nights, setNights] = useState(0);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
  const [associatedBookingData, setAssociatedBookingData] = useState(null);
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
      'roomType', 'guestName', 'checkInDate', 'checkOutDate', 
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

    if (formData.paymentType !== 'NONE') {
      if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
        setError('Please enter a valid total booking amount.');
        return;
      }
      if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
        setError('Please enter a valid payment amount.');
        return;
      }
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

      const savedReg = await res.json();

      // Silently create the associated booking record in backend
      const defaultForm = {
        roomType: formData.roomType || 'Deluxe Room',
        room: '',
        bookingType: 'Direct',
        bookingNumber: `D-${1000 + savedReg.id}`,
        boardBasis: 'Room Only',
        remarks: formData.remarks || '',
        amount: formData.totalAmount ? parseFloat(formData.totalAmount) : 0,
        paymentStatus: formData.paymentType !== 'NONE' ? (formData.paymentType === 'FULL' ? 'Paid' : 'Partially Paid') : 'Pending',
        registrationStatus: 'Pending'
      };

      const bookingRes = await fetch(`${API_BASE}/guest-registrations/${savedReg.id}/booking-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(defaultForm)
      });

      let createdBooking = null;
      if (bookingRes.ok) {
        const allBookingsRes = await fetch(`${API_BASE}/bookings`);
        if (allBookingsRes.ok) {
          const allBookings = await allBookingsRes.json();
          createdBooking = allBookings.find(b => b.guestRegistrationId === savedReg.id);
          if (createdBooking) {
            setAssociatedBookingData(createdBooking);
          }
        }
      }

      // If payment is selected, save the payment record
      let paymentSaved = false;
      if (createdBooking && formData.paymentType !== 'NONE') {
        const paymentSlipBase64 = formData.paymentSlip ? await fileToBase64(formData.paymentSlip) : '';
        const payAmt = parseFloat(formData.paymentAmount || 0);
        const totalAmt = parseFloat(formData.totalAmount || 0);
        const isFull = formData.paymentType === 'FULL' || payAmt >= totalAmt;

        const paymentPayload = {
          bookingId: createdBooking.id,
          guestRegistrationId: savedReg.id,
          paymentType: isFull ? 'FINAL' : 'ADVANCE',
          amount: payAmt,
          currencyCode: 'LKR',
          currency: 'LKR',
          exchangeRate: 1,
          convertedAmountLkr: payAmt,
          amountLkr: payAmt,
          amountInCurrency: payAmt,
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
          receiptNumber: formData.referenceNumber || `REC-${Date.now().toString().slice(-6)}`,
          remarks: formData.remarks || '',
          createdBy: 'Public QR Code',
          slipPath: paymentSlipBase64 || '/uploads/dummy_slip.png',
          paymentSlipUrl: paymentSlipBase64 || '/uploads/dummy_slip.png',
          isAdvancePayment: !isFull
        };

        const payRes = await fetch(`${API_BASE}/payments/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentPayload)
        });

        if (payRes.ok) {
          const savedPayment = await payRes.json();
          setSelectedPaymentForReceipt(savedPayment);
          setReceiptData({
            receiptNumber: savedPayment.receiptNumber || ('REC-' + Date.now().toString().slice(-6)),
            generatedAt: new Date().toISOString(),
            generatedBy: 'Guest QR Form'
          });
          paymentSaved = true;
        }
      }

      setSubmitted(true);
      // Only auto-redirect if no payment was made to print receipts/invoices
      if (user && !paymentSaved) {
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

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!selectedPaymentForReceipt || !receiptData || !associatedBookingData) return;
    const paidAmt = selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0;
    const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL';
    const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';
    const text = `*${receiptTitle.toUpperCase()}*
Receipt No: ${receiptData.receiptNumber}
Date: ${new Date(receiptData.generatedAt).toLocaleDateString()}
Guest Name: ${formData.guestName}
Booking No: ${associatedBookingData.bookingNumber}
Room Type: ${associatedBookingData.roomType}
Check-in: ${formData.checkInDate}
Check-out: ${formData.checkOutDate}
Nights: ${nights}
Method: ${selectedPaymentForReceipt.paymentMethod}
Amount: ${selectedPaymentForReceipt.amount} LKR
Converted: ${paidAmt.toLocaleString()} LKR
Balance: ${Math.max(0, associatedBookingData.totalAmount - paidAmt).toLocaleString()} LKR`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (submitted) {
    const fakeReg = {
      guestName: formData.guestName,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      numberOfNights: nights,
      nights: nights,
      nationality: formData.nationality,
      passportNumber: formData.passportNumber,
      whatsappNumber: formData.whatsAppNumber
    };

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
          {selectedPaymentForReceipt && (
            <div className="pt-2">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5"
              >
                <Receipt className="h-4 w-4" /> View & Print Payment Receipt
              </button>
            </div>
          )}
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

        {/* Receipt Modal Wrapper for QR client */}
        {showReceiptModal && receiptData && selectedPaymentForReceipt && associatedBookingData && (() => {
          const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL';
          const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';

          return (
            <div id="printable-receipt-modal-wrapper" className="no-print fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-transparent print:static overflow-y-auto">
              <div 
                id="printable-receipt-modal" 
                className="bg-white text-slate-900 p-5 md:p-6 mx-auto w-full max-w-xl shadow-2xl border border-slate-200 rounded-lg text-xs font-sans animate-in fade-in zoom-in-95 duration-150 relative print:border-0 print:shadow-none print:w-full print:max-w-none print:p-0 print:my-0"
              >
                <button 
                  onClick={() => setShowReceiptModal(false)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition print:hidden"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-3 mb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <img src={logoImg} alt="Serene Villa Logo" className="h-10 w-10 object-contain" />
                      <div>
                        <h2 className="text-lg font-extrabold text-emerald-800 tracking-tight leading-none">Serene Villa</h2>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">(Pvt) Ltd - Hiriketiya</p>
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-slate-650 leading-normal font-medium space-y-0.5 mt-1.5">
                      <p className="flex items-center gap-1">
                        <MapPin size={9} className="text-emerald-800 shrink-0" /> Pehembiya Road, Hiriketiya, Dickwella.
                      </p>
                      <p className="flex items-center gap-1">
                        <Globe size={9} className="text-emerald-800 shrink-0" /> Serenehiriketiya@gmail.com
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone size={9} className="text-emerald-800 shrink-0" /> 
                        <span>Hot line : +94 41 225 5204 / +94 70 499 8787</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <h1 className="text-base font-black tracking-wide uppercase text-emerald-800">
                      {receiptTitle}
                    </h1>
                    <div className="inline-block border border-emerald-800/30 rounded-lg px-2.5 py-1.5 bg-emerald-50/20 text-[10px] text-left space-y-0.5 mt-1 print:bg-transparent">
                      <div className="flex gap-3 justify-between">
                        <span className="text-slate-500 font-semibold">Receipt No:</span>
                        <span className="font-mono font-bold text-emerald-800">{receiptData.receiptNumber}</span>
                      </div>
                      <div className="flex gap-3 justify-between">
                        <span className="text-slate-500 font-semibold">Date:</span>
                        <span className="font-bold text-slate-800">{new Date(receiptData.generatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Information */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 bg-slate-50/50 px-3 py-2 border border-slate-100 rounded-lg text-[11px] print:bg-transparent print:border-0 print:p-0 print:mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-550 font-bold uppercase tracking-wider text-[8px] w-20 shrink-0">Guest Name:</span>
                    <span className="font-bold text-slate-850 border-b border-dashed border-slate-305 flex-1 pb-0.5">{formData.guestName}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-550 font-bold uppercase tracking-wider text-[8px] w-20 shrink-0">Booking No:</span>
                    <span className="font-mono font-bold text-slate-850 border-b border-dashed border-slate-305 flex-1 pb-0.5">{associatedBookingData.bookingNumber}</span>
                  </div>
                </div>

                {/* Table */}
                <div className="mb-4">
                  <table className="w-full border-collapse border border-emerald-800/30 text-[11px] print:border-slate-400">
                    <thead>
                      <tr className="bg-emerald-800 text-white uppercase text-[8px] tracking-wider print:bg-slate-100 print:text-slate-900">
                        <th className="border border-emerald-800/30 px-2 py-1 text-center w-12 print:border-slate-400">Qty</th>
                        <th className="border border-emerald-800/30 px-3 py-1 text-left print:border-slate-400">Description</th>
                        <th className="border border-emerald-800/30 px-3 py-1 text-right w-24 print:border-slate-400">Rate (LKR)</th>
                        <th className="border border-emerald-800/30 px-3 py-1 text-right w-28 print:border-slate-400">Amount (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-slate-700">
                      <tr className="border-b border-emerald-800/20 print:border-slate-400">
                        <td className="border-r border-emerald-800/20 px-2 py-1.5 text-center print:border-slate-400">
                          {nights}
                        </td>
                        <td className="border-r border-emerald-800/20 px-3 py-1.5 print:border-slate-400">
                          Accommodation ({formData.checkInDate} - {formData.checkOutDate})
                        </td>
                        <td className="border-r border-emerald-800/20 px-3 py-1.5 text-right print:border-slate-400">
                          {((associatedBookingData.totalAmount || 0) / (nights || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {(associatedBookingData.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-b border-emerald-800/10 bg-slate-50/20 print:border-slate-400">
                        <td className="border-r border-emerald-800/20 px-2 py-1 text-center text-slate-400 print:border-slate-400">-</td>
                        <td className="border-r border-emerald-800/20 px-3 py-1 text-slate-500 print:border-slate-400">
                          <span className="font-bold text-[8px] uppercase tracking-wider mr-1.5 text-slate-400">Room Type:</span>
                          <span className="font-bold text-slate-700">{associatedBookingData.roomType}</span>
                        </td>
                        <td className="border-r border-emerald-800/20 px-3 py-1 text-right text-slate-400 print:border-slate-400">-</td>
                        <td className="px-3 py-1 text-right text-slate-400">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
                  <div className="border border-dashed border-slate-200 rounded-lg p-2.5 text-slate-500 flex flex-col justify-between print:border-slate-300">
                    <div>
                      <p className="font-bold text-[8px] uppercase tracking-wider mb-0.5 text-slate-400">Payment Reference</p>
                      <p className="font-mono text-slate-700 font-bold">{selectedPaymentForReceipt.referenceNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="border border-emerald-800/20 rounded-lg p-3 bg-emerald-50/10 space-y-1.5 print:border-slate-300 print:bg-transparent">
                    <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                      <span className="text-slate-550 font-semibold">Total Booking Amount:</span>
                      <span className="font-bold text-slate-800">LKR {(associatedBookingData.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                      <span className="text-slate-550 font-semibold">{isFinalPayment ? 'Final Payment:' : 'Advance Paid:'}</span>
                      <span className="font-bold text-emerald-850 print:text-slate-900">
                        {selectedPaymentForReceipt.amount} LKR
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-sm border-t border-emerald-805/30 print:border-slate-300">
                      <span className="text-emerald-950 font-black print:text-slate-900 text-xs">Remaining Balance:</span>
                      <span className="font-mono text-emerald-800 print:text-slate-900 text-xs">
                        LKR {Math.max(0, (associatedBookingData.totalAmount || 0) - (selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="flex justify-between items-end mt-8 pt-4 border-t border-slate-100 print:mt-16">
                  <div className="text-center w-48">
                    <p className="border-b border-slate-300 pb-0.5 font-mono text-slate-400">...................................................</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Guest Signature</p>
                  </div>
                  <div className="text-center w-48">
                    <p className="border-b border-slate-300 pb-0.5 font-mono text-slate-400">...................................................</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Received By</p>
                  </div>
                </div>

                <div className="flex justify-between text-[8px] text-slate-400 mt-6 pt-3 border-t border-slate-100/50 print:mt-10">
                  <span>Printed: {new Date().toLocaleString()}</span>
                  <span>Staff: {receiptData.generatedBy || 'Guest QR Form'}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100 print:hidden justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-4 rounded-lg flex items-center justify-center gap-1 transition text-[11px] cursor-pointer"
                  >
                    <X size={11} /> Close
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition text-[11px] cursor-pointer"
                  >
                    <Share2 size={11} /> Share
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-4 rounded-lg flex items-center justify-center gap-1 transition text-[11px] cursor-pointer"
                  >
                    <Printer size={11} /> Print
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Print-only layout */}
        <div className="print-only">
          {showReceiptModal && (
            <AdvanceReceiptPrint
              ref={receiptRef}
              receiptData={receiptData}
              selectedPaymentForReceipt={selectedPaymentForReceipt}
              selectedReg={fakeReg}
              associatedBooking={associatedBookingData}
            />
          )}
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

            {/* Room Selection with Images */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Building size={12} className="text-slate-400" /> Select Your Room *
              </label>

              {rooms.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <Building className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No rooms configured yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please ask staff to add rooms from the dashboard.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rooms.map((room) => {
                    const isSelected = formData.roomType === room.roomType && formData.selectedRoomNumber === room.roomNumber;
                    const isAvailable = room.status === 'Available';
                    const roomImage = (room.images && room.images.length > 0) ? room.images[0] : room.image;

                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          if (!isAvailable) return;
                          setFormData(prev => ({
                            ...prev,
                            roomType: room.roomType,
                            selectedRoomNumber: room.roomNumber
                          }));
                        }}
                        className={`rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-100'
                            : isAvailable
                              ? 'border-slate-200 hover:border-emerald-300'
                              : 'border-slate-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {/* Room Image */}
                        <div className="aspect-[16/9] overflow-hidden relative bg-slate-100">
                          {roomImage ? (
                            <img
                              src={roomImage}
                              alt={room.roomType}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                              <Building className="h-10 w-10 text-slate-300" />
                            </div>
                          )}
                          {/* Status Badge */}
                          <span className={`absolute top-2 left-2 text-[8px] font-bold px-2 py-0.5 rounded-md shadow-sm ${
                            room.status === 'Available' ? 'bg-emerald-500 text-white' :
                            room.status === 'Occupied' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {room.status}
                          </span>
                          {/* Selected Checkmark */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                              <CheckCircle2 size={14} />
                            </div>
                          )}
                        </div>

                        {/* Room Info */}
                        <div className="p-3 space-y-1.5 bg-white">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              {room.roomType}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              Room No. {room.roomNumber}
                            </p>
                          </div>
                          {room.facilities && room.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {room.facilities.slice(0, 3).map((fac, idx) => (
                                <span
                                  key={idx}
                                  className="text-[7px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded"
                                >
                                  {fac}
                                </span>
                              ))}
                              {room.facilities.length > 3 && (
                                <span className="text-[7px] bg-slate-100 text-slate-400 font-semibold px-1.5 py-0.5 rounded">
                                  +{room.facilities.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Room Summary */}
              {formData.roomType && (
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Selected:</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {formData.roomType} {formData.selectedRoomNumber ? `— Room ${formData.selectedRoomNumber}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Option */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <CreditCard size={12} className="text-slate-400" /> Payment Option
              </label>
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition cursor-pointer text-slate-800"
              >
                <option value="NONE">No Payment (Pay at Hotel)</option>
                <option value="ADVANCE">Advance Payment</option>
                <option value="FULL">Full Payment</option>
              </select>
            </div>

            {/* Conditional Payment Form Fields */}
            {formData.paymentType !== 'NONE' && (
              <div className="space-y-4 p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl animate-in fade-in duration-200">
                <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Receipt size={12} /> Payment Details
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Amount (LKR) *</label>
                    <input 
                      type="number" 
                      name="totalAmount"
                      placeholder="e.g. 75000"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {formData.paymentType === 'FULL' ? 'Amount to Settle (LKR) *' : 'Advance Paid (LKR) *'}
                    </label>
                    <input 
                      type="number" 
                      name="paymentAmount"
                      placeholder="e.g. 20000"
                      value={formData.paymentAmount}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                    <select 
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online">Online Payment</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reference / Receipt Number</label>
                    <input 
                      type="text" 
                      name="referenceNumber"
                      placeholder="e.g. TXN998877"
                      value={formData.referenceNumber}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Slip / Receipt Proof</label>
                    <div className="border border-dashed border-slate-200 bg-white hover:border-emerald-500/50 rounded-xl p-3 text-center cursor-pointer transition relative">
                      <input
                        type="file"
                        name="paymentSlip"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                      <Upload className="h-4.5 w-4.5 text-slate-400 mx-auto mb-1" />
                      <p className="text-[10px] font-bold text-slate-700">Upload Receipt Slip</p>
                      <p className="text-[8px] text-slate-400 mt-0.5 truncate">
                        {formData.paymentSlip ? formData.paymentSlip.name : 'Select JPG/PNG photo of slip'}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Remarks</label>
                    <input 
                      type="text" 
                      name="remarks"
                      placeholder="e.g. Settle advance via USD bank transfer"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}
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
