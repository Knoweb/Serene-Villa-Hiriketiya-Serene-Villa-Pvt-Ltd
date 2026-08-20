import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Building, Upload, Calendar, Send, CheckCircle2, User, FileText, Phone, Globe, Users, ChevronLeft, Loader, MapPin, CreditCard, Receipt, Printer, Share2, X, Search, AlertCircle, Camera, RefreshCw } from 'lucide-react';
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
  });

  const [previews, setPreviews] = useState({
    guestPhoto: null,
    passportFront: null,
    paymentSlip: null,
  });

  // Native capture refs
  const guestPhotoFileRef = React.useRef(null);
  const guestPhotoCamRef = React.useRef(null);
  const passportFrontFileRef = React.useRef(null);
  const passportFrontCamRef = React.useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/public/rooms`);
        if (res.ok) {
          const data = await res.json();
          // Filter out demo/empty rooms if any
          const filtered = data.filter(r => r.id !== 101 || r.roomType !== 'Deluxe Room');
          setRooms(filtered);
        }
      } catch (err) {
        console.error('Error fetching rooms from server:', err);
      }
    };
    fetchRooms();
  }, []);
  const uniqueRoomTypes = Array.from(new Set(rooms.map(r => r.roomType)));

  const [nights, setNights] = useState(0);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
  const [associatedBookingData, setAssociatedBookingData] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lookup Reservation states
  const bookingPrefixes = {
    'Direct Booking': 'D-',
    'Web Booking': 'W-',
    'Agoda Booking': 'A-',
    'Booking.com Booking': 'B-'
  };
  const [selectedBookingType, setSelectedBookingType] = useState('Direct Booking');
  const [searchBookingNumber, setSearchBookingNumber] = useState('');
  const [lookingUpReservation, setLookingUpReservation] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const [showLookup, setShowLookup] = useState(false);

  const handleLookupReservation = async () => {
    const prefix = bookingPrefixes[selectedBookingType] || 'D-';
    let cleanNum = searchBookingNumber.trim();
    if (cleanNum.toUpperCase().startsWith(prefix.toUpperCase())) {
      cleanNum = cleanNum.substring(prefix.length).trim();
    }
    
    if (!cleanNum) {
      setLookupError('Please enter a booking number to search.');
      return;
    }

    const fullBookingNumber = `${prefix}${cleanNum}`;

    setLookingUpReservation(true);
    setLookupError('');
    setLookupSuccess(false);

    try {
      const url = `${API_BASE}/public/reservations/search?bookingNumber=${encodeURIComponent(fullBookingNumber)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const booking = data.booking;
        const reg = data.registration;

        if (booking) {
          setFormData(prev => ({
            ...prev,
            guestName: reg?.guestName || booking.guestName || prev.guestName || '',
            checkInDate: reg?.checkInDate || booking.checkInDate || prev.checkInDate || '',
            checkOutDate: reg?.checkOutDate || booking.checkOutDate || prev.checkOutDate || '',
            passportNumber: reg?.passportNumber || booking.passportNumber || prev.passportNumber || '',
            whatsAppNumber: reg?.whatsappNumber || reg?.whatsAppNumber || booking.whatsappNumber || booking.contactNumber || booking.phone || prev.whatsAppNumber || '',
            nationality: reg?.nationality || booking.nationality || prev.nationality || '',
            adults: reg?.adults || booking.adults || prev.adults || 1,
            children: reg?.children || booking.children || prev.children || 0,
            roomType: booking.roomType || prev.roomType || '',
            totalAmount: booking.totalAmount || prev.totalAmount || '',
          }));
          setLookupSuccess(true);
        } else {
          setLookupError(`No reservation found matching ${fullBookingNumber}.`);
        }
      } else {
        setLookupError(`No reservation found matching ${fullBookingNumber}.`);
      }
    } catch (err) {
      console.error(err);
      setLookupError('Failed to search reservation. Please try again.');
    } finally {
      setLookingUpReservation(false);
    }
  };

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
      // 5MB limit check (5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setError(`The uploaded file "${file.name}" exceeds the 5MB size limit. Please upload a smaller file.`);
        e.target.value = ''; // Reset input
        return;
      }
      setError('');
      setFormData((prev) => ({ ...prev, [name]: file }));
      setPreviews((prev) => ({ ...prev, [name]: URL.createObjectURL(file) }));
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      // If it's not an image (e.g. PDF), resolve as standard base64
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Downscale large camera images (max width/height of 1600px)
          const MAX_SIZE = 1600;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.70 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
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

    if (!formData.passportFront) {
      setError('Please upload the passport front page.');
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
      const passportFrontBase64 = await compressImage(formData.passportFront);

      const payload = {
        guestName: formData.guestName,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        passportNumber: formData.passportNumber,
        whatsappNumber: formData.whatsAppNumber,
        nationality: formData.nationality,
        adults: parseInt(formData.adults),
        children: parseInt(formData.children),
        guestPhotoPath: null,
        passportFrontPath: passportFrontBase64,
        passportBackPath: null
      };

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
        paymentStatus: formData.paymentType !== 'NONE' ? (formData.paymentType === 'FULL' ? 'Paid' : 'Paid Advance') : 'Confirm',
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
        const paymentSlipBase64 = formData.paymentSlip ? await compressImage(formData.paymentSlip) : '';
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
    const bCurr = (associatedBookingData.currency && associatedBookingData.currency !== 'LKR') ? associatedBookingData.currency : 'USD';
    const exRate = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBookingData.exchangeRate) || 335;
    const totalBookingAmountLkr = bCurr === 'LKR' ? (associatedBookingData.totalAmount || 0) : ((associatedBookingData.totalAmount || 0) * exRate);
    
    const paidAmtLkr = selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0;
    const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL';
    const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';
    
    const remainingBalLkr = isFinalPayment ? 0 : Math.max(0, totalBookingAmountLkr - paidAmtLkr);
    const remainingBalInBookingCurr = isFinalPayment ? 0 : (bCurr === 'LKR' ? remainingBalLkr : (remainingBalLkr / exRate));

    const currencyCode = selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency || 'LKR';
    const isLkr = currencyCode === 'LKR';
    const paidAmtOrig = selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency || paidAmtLkr;

    const amountPaidStr = isLkr
      ? `LKR ${paidAmtLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${currencyCode} ${(parseFloat(paidAmtOrig) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (LKR ${paidAmtLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;

    const balanceStr = isFinalPayment
      ? (bCurr === 'LKR' ? 'LKR 0.00 (Fully Settled)' : `${bCurr} 0.00 (LKR 0.00) (Fully Settled)`)
      : (bCurr === 'LKR'
        ? `LKR ${remainingBalLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `${bCurr} ${remainingBalInBookingCurr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (LKR ${remainingBalLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);

    const text = `🌴 *SERENE VILLA - ${receiptTitle.toUpperCase()}* 🌴

Dear *${formData.guestName || 'Guest'}*,

Thank you for your payment! Here is your official payment receipt:

📄 *Receipt No:* ${receiptData.receiptNumber}
🔖 *Booking Ref:* ${associatedBookingData.bookingNumber}
🗓 *Check-in - Check-out:* ${formData.checkInDate} to ${formData.checkOutDate} (${nights} ${nights === 1 ? 'Night' : 'Nights'})

💳 *Payment Method:* ${selectedPaymentForReceipt.paymentMethod}
💵 *Amount Paid:* ${amountPaidStr}
💰 *Remaining Balance:* ${balanceStr}

We look forward to welcoming you to Serene Villa! 😊

Best regards,
*Reservation Department*
Serene Villa Hiriketiya`;

    let rawPhone = formData?.mobileNumber || formData?.whatsappNumber || formData?.whatsAppNumber || formData?.phone || associatedBookingData?.contactNumber || associatedBookingData?.phone || '';
    const cleanedPhone = rawPhone.replace(/\D/g, '');
    let formattedPhone = cleanedPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '94' + formattedPhone.substring(1);
    }

    const url = formattedPhone 
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
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

          const handleDownloadPDF = async () => {
            const element = document.getElementById('printable-receipt-modal');
            if (!element) return;

            const actionBtns = element.querySelector('.no-print-action-bar');
            const closeBtn = element.querySelector('.no-print-close-btn');

            if (actionBtns) actionBtns.style.display = 'none';
            if (closeBtn) closeBtn.style.display = 'none';

            try {
              const dataUrl = await toPng(element, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                width: element.offsetWidth,
                height: element.offsetHeight,
                style: {
                  margin: '0',
                  transform: 'none'
                }
              });

              const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;

              if (jsPDF) {
                const pdf = new jsPDF({
                  orientation: 'portrait',
                  unit: 'pt',
                  format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const margin = 20;
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;
                const xPos = margin;
                const yPos = margin;

                pdf.addImage(dataUrl, 'PNG', xPos, yPos, imgWidth, imgHeight);
                pdf.save(`Receipt_${receiptData.receiptNumber || 'Invoice'}.pdf`);
              } else {
                const link = document.createElement('a');
                link.download = `Receipt_${receiptData.receiptNumber || 'Invoice'}.png`;
                link.href = dataUrl;
                link.click();
              }
            } catch (err) {
              console.error('PDF Download error:', err);
              alert('Failed to download PDF: ' + (err ? (err.message || err.toString()) : 'Unknown error'));
            } finally {
              if (actionBtns) actionBtns.style.display = '';
              if (closeBtn) closeBtn.style.display = '';
            }
          };

          return (
            <div id="printable-receipt-modal-wrapper" className="no-print fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 md:py-8 print:p-0 print:bg-transparent print:static overflow-y-auto">
              <div 
                id="printable-receipt-modal" 
                className="bg-white text-slate-900 p-5 md:p-6 mx-auto w-full max-w-xl shadow-2xl border border-slate-200 rounded-lg text-xs font-sans animate-in fade-in zoom-in-95 duration-150 relative print:border-0 print:shadow-none print:w-full print:max-w-none print:p-0 print:my-0"
              >
                <button 
                  onClick={() => setShowReceiptModal(false)}
                  className="no-print-close-btn absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition print:hidden"
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

                {/* Reservation Details Section (Matching Draft Bill / Print layout) */}
                <div className="text-[9px] font-extrabold text-emerald-800 uppercase mb-2 tracking-wider">
                  RESERVATION DETAILS
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 border border-slate-200 rounded-lg text-[11px] mb-4 bg-white">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Guest Name</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{formData?.guestName || associatedBookingData?.guestName || ''}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Channel</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{associatedBookingData?.bookingType || 'Direct Booking'}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Check - in</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{(formData?.checkInDate || associatedBookingData?.checkInDate || '').replace(/-/g, '.')}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Check - out</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{(formData?.checkOutDate || associatedBookingData?.checkOutDate || '').replace(/-/g, '.')}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Nights</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(formData?.numberOfNights || formData?.nights || associatedBookingData?.nights || 1).padStart(2, '0')} nights</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Basis</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{associatedBookingData?.boardBasis || 'Bed & Breakfast'}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Adults</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(formData?.adults || associatedBookingData?.adults || 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-500 font-semibold w-24 shrink-0">Children</span>
                    <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(formData?.children || associatedBookingData?.children || 0).padStart(2, '0')}</span>
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
                    <div className="border-b border-slate-300 w-full mb-2 h-4"></div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Guest Signature</p>
                  </div>
                  <div className="text-center w-48">
                    <div className="border-b border-slate-300 w-full mb-2 h-4"></div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Received By</p>
                  </div>
                </div>

                <div className="flex justify-between text-[8px] text-slate-400 mt-6 pt-3 border-t border-slate-100/50 print:mt-10">
                  <span>Printed: {new Date().toLocaleString()}</span>
                  <span>Staff: {receiptData.generatedBy || 'Guest QR Form'}</span>
                </div>

                {/* Actions */}
                <div className="no-print-action-bar flex gap-2 pt-4 mt-4 border-t border-slate-100 print:hidden justify-end flex-wrap">
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
                    onClick={handleDownloadPDF}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1 transition text-[11px] cursor-pointer shadow-sm"
                  >
                    <Download size={11} /> Download
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

          {/* Reservation Lookup Option */}
          <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowLookup(!showLookup)}
              className="w-full flex items-center justify-between font-bold text-slate-800 text-xs text-left focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-emerald-700" />
                <span>Have a Confirmed Reservation? (Auto-fill)</span>
              </div>
              <span className="text-slate-400 text-base leading-none">
                {showLookup ? '−' : '+'}
              </span>
            </button>

            {showLookup && (
              <div className="pt-3 space-y-3 border-t border-emerald-100/30">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Select your Booking Type and enter your Booking Number below to retrieve your reservation and auto-fill details.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  
                  {/* Booking Type Select */}
                  <div className="sm:col-span-5">
                    <select
                      value={selectedBookingType}
                      onChange={(e) => {
                        setSelectedBookingType(e.target.value);
                        setLookupError('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Direct Booking">Direct Booking (D-)</option>
                      <option value="Web Booking">Web Booking (W-)</option>
                      <option value="Agoda Booking">Agoda / Airbnb Booking (A-)</option>
                      <option value="Booking.com Booking">Booking.com (B-)</option>
                    </select>
                  </div>

                  {/* Booking Number Input with Locked Prefix Badge */}
                  <div className="sm:col-span-5 flex items-center">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-700 text-xs font-extrabold select-none shrink-0">
                      {bookingPrefixes[selectedBookingType] || 'D-'}
                    </span>
                    <input
                      type="text"
                      placeholder="Enter Number (e.g. 789452)"
                      value={searchBookingNumber}
                      onChange={(e) => {
                        let raw = e.target.value;
                        const upper = raw.trim().toUpperCase();
                        
                        // Auto-switch prefix if user types or pastes full booking number (e.g., W-4562358, B-123456)
                        if (upper.startsWith('W-')) {
                          setSelectedBookingType('Web Booking');
                          raw = raw.substring(2);
                        } else if (upper.startsWith('A-')) {
                          setSelectedBookingType('Agoda Booking');
                          raw = raw.substring(2);
                        } else if (upper.startsWith('B-')) {
                          setSelectedBookingType('Booking.com Booking');
                          raw = raw.substring(2);
                        } else if (upper.startsWith('D-')) {
                          setSelectedBookingType('Direct Booking');
                          raw = raw.substring(2);
                        }

                        const currentType = upper.startsWith('W-') ? 'Web Booking'
                          : upper.startsWith('A-') ? 'Agoda Booking'
                          : upper.startsWith('B-') ? 'Booking.com Booking'
                          : upper.startsWith('D-') ? 'Direct Booking'
                          : selectedBookingType;

                        const prefix = bookingPrefixes[currentType] || 'D-';
                        let cleaned = raw;
                        if (cleaned.toUpperCase().startsWith(prefix.toUpperCase())) {
                          cleaned = cleaned.substring(prefix.length);
                        }
                        setSearchBookingNumber(cleaned);
                        setLookupError('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-r-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Find Button */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleLookupReservation}
                      disabled={lookingUpReservation}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      {lookingUpReservation ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                      Find
                    </button>
                  </div>
                </div>

                {lookupError && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {lookupError}
                  </p>
                )}
                {lookupSuccess && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-600" /> Details loaded successfully!
                  </p>
                )}
              </div>
            )}
          </div>

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
              

              {/* Passport Front */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Passport Front Page *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-white transition relative overflow-hidden shadow-xs">
                  {previews.passportFront ? (
                    <div className="flex items-center gap-4 w-full">
                      <img src={previews.passportFront} alt="Passport Front Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-150" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{formData.passportFront.name || 'Captured Image'}</p>
                        <p className="text-[9px] text-emerald-600 font-bold">Image loaded successfully</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, passportFront: null }));
                          setPreviews(prev => ({ ...prev, passportFront: null }));
                        }}
                        className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={passportFrontFileRef}
                        name="passportFront"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                      {/* Hidden Camera Input */}
                      <input
                        type="file"
                        ref={passportFrontCamRef}
                        name="passportFront"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                      />
                      
                      <button
                        type="button"
                        onClick={() => passportFrontFileRef.current?.click()}
                        className="flex items-center justify-center border border-slate-200 hover:border-emerald-500 rounded-xl px-4 py-3 bg-slate-50 cursor-pointer transition flex-1 w-full text-center hover:bg-slate-100"
                      >
                        <Upload className="h-4 w-4 text-slate-500 mr-2" />
                        <span className="text-xs font-bold text-slate-700">Upload File</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => passportFrontCamRef.current?.click()}
                        className="flex items-center justify-center border border-slate-200 hover:border-emerald-500 rounded-xl px-4 py-3 bg-slate-50 cursor-pointer transition flex-1 w-full text-center hover:bg-slate-100"
                      >
                        <Camera className="h-4 w-4 text-slate-500 mr-2 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">Scan Passport</span>
                      </button>
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
