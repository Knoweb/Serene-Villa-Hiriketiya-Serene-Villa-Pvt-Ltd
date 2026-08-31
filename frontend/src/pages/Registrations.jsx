import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import logoImg from '../assets/logo.jpeg';
import deluxeRoomImg from '../assets/deluxe_room.png';
import suiteRoomImg from '../assets/suite_room.png';
import standardRoomImg from '../assets/standard_room.png';
import budgetRoomImg from '../assets/budget_room.png';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Plus, 
  QrCode, 
  Search, 
  ShieldCheck,
  ChevronLeft, 
  ChevronRight, 
  Loader, 
  AlertCircle,
  User,
  Calendar,
  Phone,
  Globe,
  FileText,
  MapPin,
  Check,
  Download,
  FileDown,
  X,
  Share2,
  Printer,
  Receipt,
  Image as ImageIcon,
  ArrowRight,
  MessageSquare,
  Pencil,
  Save,
  Trash2,
  Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdvanceReceiptPrint from '../components/AdvanceReceiptPrint';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = API_BASE.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

const BANK_ACCOUNTS = {
  USD_PB: {
    key: 'USD_PB',
    label: "USD ($) - People's Bank (Acc: 288402130016448)",
    currency: 'USD',
    bankName: "People's Bank",
    companyName: "Serene Villa",
    accountHolder: "Serene Villa Hiriketiya",
    accountNumber: "288402130016448",
    branch: "Kudawella",
    swiftCode: "PSBKLKLX",
    hotline: "+94 70 499 8787"
  },
  LKR_PB_COMPANY: {
    key: 'LKR_PB_COMPANY',
    label: "LKR 1 - Serene Villa (pvt)LTD (People's Bank - Acc: 288100190017275)",
    currency: 'LKR',
    bankName: "People's Bank",
    companyName: "Serene Villa (pvt)LTD",
    accountHolder: "Serene Villa (pvt)LTD",
    accountNumber: "288100190017275",
    branch: "Kudawella",
    swiftCode: "PSBKLKLX",
    hotline: "+94 70 499 8787"
  },
  LKR_PB_PERSONAL: {
    key: 'LKR_PB_PERSONAL',
    label: "LKR 2 - D.W.C Prasad (People's Bank - Acc: 288100186167023)",
    currency: 'LKR',
    bankName: "People's Bank",
    companyName: "Serene Villa",
    accountHolder: "D.W.C Prasad",
    accountNumber: "288100186167023",
    branch: "Kudawella",
    swiftCode: "PSBKLKLX",
    hotline: "+94 70 499 8787"
  },
  EUR_SB: {
    key: 'EUR_SB',
    label: "EUR (€) - Sampath Bank (Acc: 521630000114)",
    currency: 'EUR',
    bankName: "Sampath Bank (EURO)",
    companyName: "Thasara Architectural Design and Construction",
    accountHolder: "Thasara Architectural Design and Construction",
    accountNumber: "521630000114",
    branch: "Dickwella",
    swiftCode: "BSAMLKLX",
    hotline: "+94 70 499 8787"
  },
  AUD_SB: {
    key: 'AUD_SB',
    label: "AUD ($) - Sampath Bank (Acc: 521630000092)",
    currency: 'AUD',
    bankName: "Sampath Bank (AUD)",
    companyName: "Thasara Architectural Design and Construction",
    accountHolder: "Thasara Architectural Design and Construction",
    accountNumber: "521630000092",
    branch: "Dickwella",
    swiftCode: "BSAMLKLX",
    hotline: "+94 70 499 8787"
  }
};

const ROOM_TEMPLATES = {
  'Deluxe Room': {
    image: deluxeRoomImg,
    occupancy: '2 Adults',
    features: ['AC', 'Free Wi-Fi', 'King Bed', 'Ocean/Balcony View', 'Minibar', 'Hot Water']
  },
  'Suite Room': {
    image: suiteRoomImg,
    occupancy: '3 Adults',
    features: ['Private Plunge Pool', 'Ocean View', 'King Bed', 'Free Wi-Fi', 'Lounge Area', 'AC']
  },
  'Standard Room': {
    image: standardRoomImg,
    occupancy: '2 Adults',
    features: ['AC', 'Free Wi-Fi', 'Queen Bed', 'Garden View', 'Hot Water']
  },
  'Budget Room': {
    image: budgetRoomImg,
    occupancy: '2 Adults',
    features: ['AC', 'Free Wi-Fi', 'Queen Bed', 'Hot Water']
  }
};

const Registrations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === 'ADMIN';
  const isFrontOfficer = user.role === 'FRONT_OFFICER';

  const getVisiblePayments = (paymentList) => {
    if (isFrontOfficer) {
      return paymentList.filter(p => !p.isHiddenFromFrontOffice);
    }
    return paymentList;
  };

  const receiptRef = React.useRef(null);
  const [forceReceiptLkr, setForceReceiptLkr] = useState(false);

  // State
  const [registrations, setRegistrations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Empty means 'All'
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [customHost, setCustomHost] = useState(() => window.location.hostname);


  // Top Scrollbar Synchronization Refs & State
  const topScrollRef = React.useRef(null);
  const tableContainerRef = React.useRef(null);
  const tableRef = React.useRef(null);
  const [tableWidth, setTableWidth] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  };

  const checkScrollability = () => {
    if (tableContainerRef.current && tableRef.current) {
      const scrollable = tableRef.current.scrollWidth > tableContainerRef.current.clientWidth;
      setIsScrollable(scrollable);
      setTableWidth(tableRef.current.scrollWidth);
    }
  };

  useEffect(() => {
    checkScrollability();
    const timer = setTimeout(checkScrollability, 300);
    return () => clearTimeout(timer);
  }, [registrations]);

  useEffect(() => {
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [rooms, setRooms] = useState([]);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(r => {
          let img = r.image;
          if (r.roomType.toLowerCase().includes('deluxe')) img = deluxeRoomImg;
          else if (r.roomType.toLowerCase().includes('suite')) img = suiteRoomImg;
          else if (r.roomType.toLowerCase().includes('standard')) img = standardRoomImg;
          else if (r.roomType.toLowerCase().includes('budget')) img = budgetRoomImg;
          return { ...r, image: img };
        });
        setRooms(mapped);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const uniqueRoomTypes = Array.from(new Set(rooms.map(r => r.roomType)));
  const defaultRoomType = uniqueRoomTypes.length > 0 ? uniqueRoomTypes[0] : '';

  const getRoomTypeDetails = (type) => {
    if (!type) return null;
    if (ROOM_TEMPLATES[type]) return ROOM_TEMPLATES[type];
    const match = rooms.find(r => r.roomType === type);
    if (match) {
      return {
        image: match.images && match.images.length > 0 ? match.images[0] : match.image,
        occupancy: type.toLowerCase().includes('suite') ? '3 Adults' : '2 Adults',
        features: match.facilities || []
      };
    }
    return null;
  };

  // Selected Guest for Details Panel
  const [selectedReg, setSelectedReg] = useState(null);
  
  // Booking Form State for selected guest
  const [bookingForm, setBookingForm] = useState({
    roomType: defaultRoomType,
    room: '',
    bookingType: 'Direct',
    bookingNumber: '',
    boardBasis: 'Room Only',
    remarks: '',
    amount: '',
    paymentStatus: 'Pending',
    registrationStatus: 'Pending'
  });
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedSlipPreview, setSelectedSlipPreview] = useState(null);
  const [allBankSlips, setAllBankSlips] = useState(() => {
    try {
      const saved = localStorage.getItem('serene_bank_slips');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Reload bank slips whenever window gains focus or storage event
  useEffect(() => {
    const loadSlips = () => {
      try {
        const saved = localStorage.getItem('serene_bank_slips');
        if (saved) setAllBankSlips(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('focus', loadSlips);
    window.addEventListener('storage', loadSlips);
    return () => {
      window.removeEventListener('focus', loadSlips);
      window.removeEventListener('storage', loadSlips);
    };
  }, []);

  // Unified Payment State
  const [advancePayments, setAdvancePayments] = useState([]);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentTab, setPaymentTab] = useState('ADVANCE'); // 'ADVANCE' | 'FULL'
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currencyCode: 'LKR',
    exchangeRate: 1,
    paymentMethod: 'Cash',
    referenceNumber: '',
    remarks: '',
    paymentDate: new Date().toISOString().split('T')[0],
    slipPath: ''
  });
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);

  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [showExtraNightModal, setShowExtraNightModal] = useState(false);
  const [showExtraPersonModal, setShowExtraPersonModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  
  const [extraNightForm, setExtraNightForm] = useState({
    amount: '',
    currencyCode: 'USD',
    remarks: '',
    room: ''
  });

  const [extraPersonForm, setExtraPersonForm] = useState({
    amount: '',
    currencyCode: 'USD',
    remarks: '',
    room: ''
  });

  const [discountForm, setDiscountForm] = useState({
    amount: '',
    currencyCode: 'USD',
    remarks: ''
  });

  const pageSize = 8;

  // Auto-print ref — set to true to trigger print when receipt modal opens
  const autoPrintRef = React.useRef(false);

  // Print only the receipt content.
  const printReceiptOnly = () => {
    console.log("receiptRef.current:", receiptRef.current);
    console.log("receiptData / invoiceData:", receiptData);

    if (!receiptData) {
      console.warn("Print blocked: receiptData is null or empty");
      return;
    }
    if (!receiptRef.current) {
      console.warn("Print blocked: receiptRef.current is null or empty");
      return;
    }
    window.print();
  };

  // Auto-print when receipt modal opens
  useEffect(() => {
    if (showReceiptModal && receiptData && autoPrintRef.current) {
      autoPrintRef.current = false;
      // Small delay to allow modal to render before printing
      const t = setTimeout(() => printReceiptOnly(), 400);
      return () => clearTimeout(t);
    }
  }, [showReceiptModal, receiptData]);

  // 1. Debounce Search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset page to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when status filter changes
  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(0);
  };

  // 2. Fetch Registrations and Bookings from Backend
  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    let fetchedBookings = [];
    try {
      // Fetch registrations
      const regRes = await fetch(
        `${API_BASE}/guest-registrations?search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&role=${user.role}&source=QR&page=${page}&size=${pageSize}`
      );
      if (!regRes.ok) throw new Error('Failed to fetch registrations');
      const regData = await regRes.json();
      setRegistrations(regData.content);
      setTotalPages(regData.totalPages);
      setTotalElements(regData.totalElements);

      // Fetch all bookings to cross-reference allocation
      const bookingRes = await fetch(`${API_BASE}/bookings`);
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        setBookings(bookingData);
        fetchedBookings = bookingData;
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Server is currently offline. Please ensure the backend server is running on port 8080 and try again.');
      } else {
        setError(err.message || 'An error occurred while loading registrations.');
      }
    } finally {
      setLoading(false);
    }
    return fetchedBookings;
  };

  useEffect(() => {
    fetchRegistrations();
  }, [debouncedSearch, statusFilter, page]);

  const fetchRegistrationsRef = React.useRef(fetchRegistrations);
  useEffect(() => {
    fetchRegistrationsRef.current = fetchRegistrations;
  }, [fetchRegistrations]);

  useEffect(() => {
    let wsUrl;
    try {
      const url = new URL(API_BASE);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${url.host}/ws/registrations`;
    } catch (e) {
      wsUrl = `ws://${window.location.hostname}:8080/ws/registrations`;
    }

    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        if (event.data === 'update') {
          fetchRegistrationsRef.current();
        }
      };

      socket.onclose = () => {
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Toggle Visibility (Admin Only)
  const handleToggleVisibility = async (reg, e) => {
    e.stopPropagation(); // Prevent opening details panel
    const endpoint = reg.isHiddenFromFrontOffice ? 'unhide' : 'hide';
    try {
      const response = await fetch(`${API_BASE}/guest-registrations/${reg.id}/${endpoint}`, {
        method: 'PUT'
      });
      if (response.ok) {
        fetchRegistrations();
        if (selectedReg && selectedReg.id === reg.id) {
          setSelectedReg({ ...selectedReg, isHiddenFromFrontOffice: !reg.isHiddenFromFrontOffice });
        }
      }
    } catch (err) {
      console.error('Failed to change visibility', err);
    }
  };

  // Delete Guest Registration (Admin & Front Office)
  const handleDeleteRegistration = async (id) => {
    if (window.confirm("Are you sure you want to delete this guest registration and all associated bookings/payments?")) {
      try {
        const response = await fetch(`${API_BASE}/guest-registrations/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchRegistrations();
          if (selectedReg && selectedReg.id === id) {
            setSelectedReg(null);
          }
        } else {
          const errData = await response.json();
          alert(errData.message || "Failed to delete registration");
        }
      } catch (err) {
        console.error('Failed to delete registration', err);
        alert("An error occurred while deleting the registration");
      }
    }
  };

  // Fetch Advance Payments
  const fetchAdvancePayments = async (bookingId) => {
    try {
      // Fetch ALL payments for this booking (advance + final)
      const res = await fetch(`${API_BASE}/payments/booking/${bookingId}?role=${user.role}`);
      if (res.ok) {
        const data = await res.json();
        setAdvancePayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments', err);
    }
  };

  // Select Guest and Populate Booking Form
  const handleSelectGuest = async (reg) => {
    setSelectedReg(reg);
    
    // Fetch full registration details containing base64 images in the background
    try {
      const detailRes = await fetch(`${API_BASE}/guest-registrations/${reg.id}`);
      if (detailRes.ok) {
        const fullReg = await detailRes.json();
        setSelectedReg(fullReg);
      }
    } catch (err) {
      console.error('Error fetching full registration details:', err);
    }
    
    let associatedBooking = getBookingForReg(reg.id);
    
    if (associatedBooking) {
      setBookingForm({
        roomType: associatedBooking.roomType || reg.roomType || defaultRoomType,
        room: associatedBooking.roomNumber || reg.roomNumber || reg.room || '',
        bookingType: associatedBooking.bookingType || 'Direct',
        bookingNumber: associatedBooking.bookingNumber || '',
        boardBasis: associatedBooking.boardBasis || 'Room Only',
        remarks: associatedBooking.remarks || '',
        amount: associatedBooking.totalAmount || reg.totalAmount || '',
        currencyCode: associatedBooking.currency || reg.currency || reg.currencyCode || 'USD',
        paymentStatus: reg.paymentStatus || associatedBooking.paymentStatus || 'Pending',
        registrationStatus: reg.registrationStatus || 'Pending',
        checkInDate: reg.checkInDate || associatedBooking.checkInDate || '',
        checkOutDate: reg.checkOutDate || associatedBooking.checkOutDate || '',
        numberOfNights: reg.numberOfNights || reg.nights || 0
      });
      fetchAdvancePayments(associatedBooking.id);
    } else {
      // Default blank/pre-filled values fallback
      setBookingForm({
        roomType: defaultRoomType,
        room: '',
        bookingType: 'Direct',
        bookingNumber: `D-${1000 + reg.id}`,
        boardBasis: 'Room Only',
        remarks: '',
        amount: reg.totalAmount || '',
        currencyCode: reg.currency || reg.currencyCode || 'USD',
        paymentStatus: reg.paymentStatus || 'Pending',
        registrationStatus: reg.registrationStatus || 'Pending',
        checkInDate: reg.checkInDate || '',
        checkOutDate: reg.checkOutDate || '',
        numberOfNights: reg.numberOfNights || reg.nights || 0
      });
      setAdvancePayments([]);
    }

    const isForeign = (reg?.country && reg.country.toLowerCase() !== 'sri lanka') || (reg?.nationality && reg.nationality.toLowerCase() !== 'sri lankan');
    const guestCurrency = associatedBooking?.currency || reg.currency || (isForeign ? 'USD' : 'LKR');
    let guestExRate = 1;
    if (guestCurrency === 'USD') guestExRate = 300;
    else if (guestCurrency === 'EUR') guestExRate = 325;
    else if (guestCurrency === 'AUD') guestExRate = 220;

    setPaymentForm(prev => ({
      ...prev,
      currencyCode: guestCurrency,
      exchangeRate: guestExRate,
      amount: ''
    }));
    setBookingSuccess(false);
    setIsEditingBooking(false);
  };

  // Upload or replace Passport/NIC photo
  const handlePassportPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedReg) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        const res = await fetch(`${API_BASE}/guest-registrations/${selectedReg.id}/booking-details`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passportFrontPath: base64Data,
            guestPhotoPath: base64Data
          })
        });

        if (res.ok) {
          const updated = await res.json();
          setSelectedReg(updated);
          fetchRegistrations();
        } else {
          alert('Failed to upload photo');
        }
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadingPhoto(false);
    }
  };



  // Switch Booking Number Prefix Dynamically
  const handleBookingChannelChange = (channel) => {
    let newBookingNumber = bookingForm.bookingNumber;
    if (newBookingNumber.startsWith('B-') && channel === 'Direct') {
      newBookingNumber = 'D-' + newBookingNumber.substring(2);
    } else if (newBookingNumber.startsWith('D-') && channel === 'Booking.com') {
      newBookingNumber = 'B-' + newBookingNumber.substring(2);
    } else if (!newBookingNumber) {
      newBookingNumber = (channel === 'Direct' ? 'D-' : 'B-') + (1000 + (selectedReg?.id || 0));
    }
    setBookingForm({
      ...bookingForm,
      bookingType: channel,
      bookingNumber: newBookingNumber
    });
  };

  const handleDateChange = (field, val) => {
    setBookingForm(prev => {
      const updated = { ...prev, [field]: val };
      if (updated.checkInDate && updated.checkOutDate) {
        const start = new Date(updated.checkInDate);
        const end = new Date(updated.checkOutDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        updated.numberOfNights = diffDays > 0 ? diffDays : 0;
      }
      return updated;
    });
  };

  // Submit Booking Form
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setUpdatingBooking(true);
    setBookingSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/guest-registrations/${selectedReg.id}/booking-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...bookingForm,
          currency: bookingForm.currencyCode || 'USD',
          currencyCode: bookingForm.currencyCode || 'USD'
        })
      });

      if (!response.ok) throw new Error('Failed to update booking details');
      
      const updatedReg = await response.json();
      setSelectedReg(updatedReg);
      setBookingSuccess(true);
      setIsEditingBooking(false);
      
      // Refresh list and sync payments history
      const latestBookings = await fetchRegistrations();
      const updatedBooking = latestBookings.find(b => b.guestRegistrationId === selectedReg.id);
      if (updatedBooking) {
        fetchAdvancePayments(updatedBooking.id);
      }
    } catch (err) {
      alert(err.message || 'Error updating booking details');
    } finally {
      setUpdatingBooking(false);
    }
  };

  const handlePaymentCurrencyChange = (e) => {
    const curr = e.target.value;
    let rate = 1;
    if (curr === 'USD') rate = 300;
    else if (curr === 'EUR') rate = 325;
    else if (curr === 'AUD') rate = 220;
    setPaymentForm(prev => ({ ...prev, currencyCode: curr, exchangeRate: rate }));
  };

  const handleSavePayment = async (e, tab, remainingBalanceInBookingCurrency) => {
    e.preventDefault();
    if (!selectedReg) return;
    const booking = getBookingForReg(selectedReg.id);
    if (!booking) { alert('Please save the booking details first.'); return; }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid amount.'); return;
    }
    if (!paymentForm.exchangeRate || parseFloat(paymentForm.exchangeRate) <= 0) {
      alert('Please enter a valid exchange rate.'); return;
    }

    const isForeignGuest = (selectedReg?.country && selectedReg.country.toLowerCase() !== 'sri lanka') || (selectedReg?.nationality && selectedReg.nationality.toLowerCase() !== 'sri lankan');
    const bookingCurrency = booking.currency || selectedReg?.currency || (isForeignGuest ? 'USD' : 'LKR');

    const enteredAmount = parseFloat(paymentForm.amount);
    const enteredCurrency = paymentForm.currencyCode || bookingCurrency;
    const exRate = parseFloat(paymentForm.exchangeRate);
    const convertedLkr = enteredCurrency === 'LKR' ? enteredAmount : enteredAmount * exRate;

    // Convert entered amount to booking currency
    let amountInBookingCurrency = enteredAmount;
    if (enteredCurrency.toUpperCase() !== bookingCurrency.toUpperCase()) {
      if (enteredCurrency === 'LKR' && exRate > 0) {
        amountInBookingCurrency = enteredAmount / exRate;
      }
    }

    // Calculate total paid in booking currency
    let currentPaidInBookingCurrency = 0;
    getVisiblePayments(advancePayments).forEach(p => {
      const pCurr = p.currencyCode || p.currency || bookingCurrency;
      let pAmt = p.amountInCurrency != null && !isNaN(p.amountInCurrency) ? parseFloat(p.amountInCurrency) : (p.amount != null && !isNaN(p.amount) ? parseFloat(p.amount) : 0);
      if (pCurr.toUpperCase() === bookingCurrency.toUpperCase()) {
        currentPaidInBookingCurrency += pAmt;
      } else if (pCurr.toUpperCase() === 'LKR' && bookingCurrency !== 'LKR') {
        const rate = parseFloat(p.exchangeRate || exRate || 1);
        if (rate > 0) currentPaidInBookingCurrency += (p.convertedAmountLkr || p.amountLkr || pAmt) / rate;
      } else {
        currentPaidInBookingCurrency += pAmt;
      }
    });

    const newTotalInBookingCurrency = currentPaidInBookingCurrency + amountInBookingCurrency;
    const totalBookingAmount = booking.totalAmount || 0;
    const isFull = tab === 'FULL' || newTotalInBookingCurrency >= (totalBookingAmount - 0.01);

    const payload = {
      bookingId: booking.id,
      guestRegistrationId: selectedReg.id,
      paymentType: isFull ? 'FINAL' : 'ADVANCE',
      amount: enteredAmount,
      currencyCode: enteredCurrency,
      currency: enteredCurrency,
      exchangeRate: exRate,
      convertedAmountLkr: convertedLkr,
      amountLkr: convertedLkr,
      amountInCurrency: enteredAmount,
      paymentMethod: paymentForm.paymentMethod,
      referenceNumber: paymentForm.referenceNumber,
      receiptNumber: paymentForm.referenceNumber,
      remarks: paymentForm.remarks,
      createdBy: user.username,
      slipPath: paymentForm.slipPath || '/uploads/dummy_slip.png',
      paymentSlipUrl: paymentForm.slipPath || '/uploads/dummy_slip.png',
      isAdvancePayment: !isFull
    };

    setSavingPayment(true);
    try {
      const res = await fetch(`${API_BASE}/payments/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save payment');
      const savedPayment = await res.json();

      // Determine new payment status
      let newPaymentStatus = 'Unpaid';
      if (isFull || newTotalInBookingCurrency >= totalBookingAmount) newPaymentStatus = 'Paid';
      else if (newTotalInBookingCurrency > 0) newPaymentStatus = 'Partially Paid';

      await fetch(`${API_BASE}/guest-registrations/${selectedReg.id}/booking-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });

      setSelectedReg(prev => ({ ...prev, paymentStatus: newPaymentStatus }));
      fetchRegistrations();
      fetchAdvancePayments(booking.id);

      setSelectedPaymentForReceipt(savedPayment);
      const realBooking = getBookingForReg(selectedReg.id) || booking;
      setReceiptData({
        ...savedPayment,
        guestName: selectedReg.guestName,
        bookingRef: realBooking?.bookingNumber || bookingForm.bookingNumber || (selectedReg.passportNumber || '').replace(/^SV-?/i, ''),
        roomNumber: realBooking?.roomNumber || bookingForm.room,
        totalAmount: totalBookingAmount,
        bookingCurrency: bookingCurrency
      });
      setShowReceiptModal(true);

      setPaymentForm({
        amount: '',
        currencyCode: bookingCurrency,
        exchangeRate: exRate,
        paymentMethod: 'Cash',
        referenceNumber: '',
        remarks: '',
        paymentDate: new Date().toISOString().split('T')[0],
        slipPath: ''
      });
    } catch (err) {
      alert(err.message || 'Error saving payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleGenerateReceipt = async (paymentId, fallbackPaymentList = null) => {
    try {
      const list = fallbackPaymentList || advancePayments;
      const p = list.find(pay => pay.id === paymentId) || { id: paymentId };
      setSelectedPaymentForReceipt(p);

      try {
        const res = await fetch(`${API_BASE}/receipts/advance/${paymentId}`);
        if (res.ok) {
          const data = await res.json();
          setReceiptData(data);
        } else {
          // Fallback receipt object if backend returned non-200
          setReceiptData({
            id: paymentId,
            receiptNumber: p.referenceNumber || p.receiptNumber || `REC-${String(paymentId).padStart(4, '0')}`,
            paymentId: paymentId,
            generatedAt: p.createdAt || p.paymentDate || new Date().toISOString(),
            generatedBy: p.createdBy || 'Front Office'
          });
        }
      } catch (fetchErr) {
        // Fallback receipt object if network fetch failed
        console.warn('Backend receipt fetch failed, using local receipt fallback:', fetchErr);
        setReceiptData({
          id: paymentId,
          receiptNumber: p.referenceNumber || p.receiptNumber || `REC-${String(paymentId).padStart(4, '0')}`,
          paymentId: paymentId,
          generatedAt: p.createdAt || p.paymentDate || new Date().toISOString(),
          generatedBy: p.createdBy || 'Front Office'
        });
      }

      setShowReceiptModal(true);
    } catch (err) {
      console.error('Error in handleGenerateReceipt:', err);
      setShowReceiptModal(true);
    }
  };

  // Cross-reference booking for row display with candidate ranking (prioritizes real manual reservations over auto-drafts)
  const getBookingForReg = (regId) => {
    if (!regId) return null;
    const targetReg = registrations.find(r => r.id === regId) || (selectedReg?.id === regId ? selectedReg : null);
    if (!targetReg) return null;

    const cleanRegName = (targetReg.guestName || '')
      .replace(/^(mr|mrs|ms|dr|prof)\.?\s*/i, '')
      .replace(/^mr\s*\/\s*mrs\s*/i, '')
      .trim().toLowerCase();

    const cleanRegEmail = (targetReg.email || '').trim().toLowerCase();
    const cleanRegPhone = (targetReg.whatsappNumber || targetReg.whatsAppNumber || targetReg.phone || '').replace(/\D/g, '');

    // 1. If registration already has a specific bookingNumber, prioritize exact match
    if (targetReg.bookingNumber) {
      const cleanTargetNum = targetReg.bookingNumber.trim().toLowerCase();
      const directMatch = bookings.find(b => b.bookingNumber && b.bookingNumber.trim().toLowerCase() === cleanTargetNum);
      if (directMatch) return directMatch;
    }

    // Find all matching candidate bookings
    const candidates = bookings.filter(b => {
      if (b.guestRegistrationId === regId) return true;

      const cleanBName = (b.guestName || '')
        .replace(/^(mr|mrs|ms|dr|prof)\.?\s*/i, '')
        .replace(/^mr\s*\/\s*mrs\s*/i, '')
        .trim().toLowerCase();

      if (cleanRegName && cleanRegName.length >= 2 && (cleanBName === cleanRegName || cleanBName.includes(cleanRegName) || cleanRegName.includes(cleanBName))) return true;
      if (cleanRegEmail && b.email && b.email.trim().toLowerCase() === cleanRegEmail) return true;
      if (cleanRegPhone && cleanRegPhone.length >= 7) {
        const bPhone = (b.contactNumber || b.phone || b.whatsappNumber || '').replace(/\D/g, '');
        if (bPhone && (bPhone.endsWith(cleanRegPhone) || cleanRegPhone.endsWith(bPhone))) return true;
      }

      return false;
    });

    if (candidates.length === 0) return null;

    // Rank candidates: REAL manual reservations (e.g. D-7892023) come FIRST over auto-drafts (D-10xx, D-11xx)!
    candidates.sort((a, b) => {
      const aIsReal = a.bookingNumber && (a.bookingNumber.startsWith('D-789') || (!a.bookingNumber.startsWith('D-10') && !a.bookingNumber.startsWith('D-11')));
      const bIsReal = b.bookingNumber && (b.bookingNumber.startsWith('D-789') || (!b.bookingNumber.startsWith('D-10') && !b.bookingNumber.startsWith('D-11')));
      if (aIsReal && !bIsReal) return -1;
      if (!aIsReal && bIsReal) return 1;
      return (b.id || 0) - (a.id || 0);
    });

    return candidates[0];
  };

  const qrPort = window.location.port ? `:${window.location.port}` : '';
  const qrUrl = `${window.location.protocol}//${customHost}${qrPort}/qr-register`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrImageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'serene_villa_checkin_qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code', error);
      alert('Could not download QR code. Please try again or right-click the image to save.');
    }
  };

  const handleShareQr = () => {
    const shareText = `Scan this QR code or click the link to fill out the Serene Villa Guest Registration Form: ${qrUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const associatedBooking = selectedReg ? getBookingForReg(selectedReg.id) : null;

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Guest Registrations</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Manage public QR submissions and allocate booking details</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowQr(true)} 
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <QrCode className="h-4 w-4 text-emerald-600" /> Guest Registration QR Code
          </button>
          <button 
            onClick={() => navigate('/qr-register')} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
          >
            <Plus className="h-4 w-4" /> Guest QR Form Link
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, passport, WhatsApp, nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-400 text-slate-750"
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid: Table + Sidebar Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Guest Table Area */}
        <div className="lg:col-span-7 min-w-0 w-full space-y-4">
          {loading && (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Loader className="h-6 w-6 text-emerald-700 animate-spin mr-2" />
              <span className="font-bold text-slate-500 text-sm">Loading registrations...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Top Scrollbar for Mobile UX */}
              {isScrollable && (
                <div 
                  ref={topScrollRef} 
                  onScroll={handleTopScroll} 
                  className="overflow-x-auto overflow-y-hidden border-b border-slate-100 bg-slate-50/40"
                  style={{ height: '10px' }}
                >
                  <div style={{ width: `${tableWidth}px`, height: '1px' }}></div>
                </div>
              )}

              <div 
                ref={tableContainerRef}
                onScroll={handleTableScroll}
                className="overflow-x-auto"
              >
                <table ref={tableRef} className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="p-4">Guest</th>
                      <th className="p-4">Passport / WhatsApp</th>
                      <th className="p-4">Dates & Room</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                      <th className="p-4 text-center w-12">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                    {(() => {
                      const displayRegistrations = [];
                      const seenKeys = new Set();
                      registrations.forEach(reg => {
                        const key = (reg.passportNumber || reg.bookingNumber || reg.guestName || '').toLowerCase().trim();
                        if (!key || !seenKeys.has(key)) {
                          if (key) seenKeys.add(key);
                          displayRegistrations.push(reg);
                        }
                      });
                      return displayRegistrations;
                    })().map((reg) => {
                      const booking = getBookingForReg(reg.id);
                      const isSelected = selectedReg && selectedReg.id === reg.id;
                      
                      return (
                        <tr 
                          key={reg.id} 
                          onClick={() => handleSelectGuest(reg)}
                          className={`hover:bg-slate-50/20 cursor-pointer transition ${
                            isSelected ? 'bg-emerald-50/30 hover:bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="p-4 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100/60 shrink-0 flex items-center justify-center font-bold text-emerald-800 text-sm">
                              {reg.passportFrontPath || reg.guestPhotoPath ? (
                                <img 
                                  src={getPhotoUrl(reg.passportFrontPath || reg.guestPhotoPath)} 
                                  alt={reg.guestName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Hide image and fallback to initials
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                reg.guestName ? reg.guestName.charAt(0).toUpperCase() : 'G'
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">{reg.guestName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{reg.country || reg.nationality || 'Other'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-mono text-slate-800 font-bold">{(reg.passportNumber || '').replace(/^SV-?/i, '')}</p>
                            <p className="text-slate-400 font-semibold text-[11px] mt-0.5">{reg.whatsappNumber || reg.whatsAppNumber || 'N/A'}</p>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-850"><span className="font-extrabold text-slate-400 text-[10px] mr-1">IN:</span> {reg.checkInDate}</div>
                            <div className="text-slate-850 mt-0.5"><span className="font-extrabold text-slate-400 text-[10px] mr-1">OUT:</span> {reg.checkOutDate}</div>
                            <p className="text-slate-500 font-bold text-[11px] mt-1">
                              {booking ? (booking.roomNumber ? `Room ${booking.roomNumber}` : 'Unallocated') : (reg.roomNumber ? `Room ${reg.roomNumber}` : 'Unallocated')}
                            </p>
                          </td>
                          <td className="p-4 space-y-1">
                            <div>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                reg.paymentStatus === 'Paid' 
                                  ? 'bg-green-100 text-green-700' 
                                  : reg.paymentStatus === 'Unpaid' 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {reg.paymentStatus}
                              </span>
                            </div>
                            <div>
                              <span className={`inline-block px-2 py-0.5 bg-slate-50 rounded text-[9px] text-slate-500 font-bold border border-slate-100/50`}>
                                {reg.registrationStatus}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isAdmin && (
                                <button
                                  onClick={(e) => handleToggleVisibility(reg, e)}
                                  title={reg.isHiddenFromFrontOffice ? "Show to Front Office" : "Hide from Front Office"}
                                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
                                >
                                  {reg.isHiddenFromFrontOffice ? (
                                    <Eye className="h-3.5 w-3.5 text-rose-600" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => handleSelectGuest(reg)}
                                className="inline-flex items-center py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-755 text-white text-[11px] font-bold transition shadow-sm cursor-pointer"
                              >
                                Manage
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteRegistration(reg.id)}
                              title="Delete Registration"
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition shadow-sm cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">
                          No guest registrations match your search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
                <div>
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} guests
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx)}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                        page === idx 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1 || totalPages === 0}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Details and Booking Form Panel */}
        <div className="lg:col-span-5 min-w-0 w-full bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-6">
          {selectedReg ? (
            <div className="space-y-6">
              
              {/* Header Info (Centered Avatar & Title) */}
              <div className="relative border-b border-slate-100 pb-4 text-center flex flex-col items-center justify-center">
                <button 
                  onClick={() => setSelectedReg(null)}
                  className="absolute top-0 right-0 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="h-16 w-16 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-800 text-xl font-black uppercase shadow-sm mx-auto mb-2.5 ring-4 ring-emerald-50">
                  {selectedReg.passportFrontPath || selectedReg.guestPhotoPath ? (
                    <img 
                      src={getPhotoUrl(selectedReg.passportFrontPath || selectedReg.guestPhotoPath)} 
                      alt={selectedReg.guestName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    selectedReg.guestName ? selectedReg.guestName.charAt(0).toUpperCase() : 'G'
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                  Mr / Mrs {selectedReg.guestName}
                </h3>
                <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1 mt-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" /> {selectedReg.country || selectedReg.nationality || 'Not Specified'}
                </p>
              </div>

              {/* Guest Core Details */}
              <div className="space-y-3 text-xs bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guest Information</h4>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditingBooking(!isEditingBooking);
                      setBookingSuccess(false);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                  >
                    <Pencil size={11} /> {isEditingBooking ? 'Cancel Edit' : 'Edit Details'}
                  </button>
                </div>

                {bookingSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Booking details updated successfully!
                  </div>
                )}

                {!isEditingBooking ? (
                  /* READ-ONLY SUMMARY CARD */
                  <div className="grid grid-cols-2 gap-3">
                    {/* Reservation ID */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Booking Number</p>
                      <p className="font-mono font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5 text-slate-400" /> {associatedBooking?.bookingNumber || bookingForm.bookingNumber || (selectedReg.passportNumber || '').replace(/^SV-?/i, '') || `D-${1000 + selectedReg.id}`}
                      </p>
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">WhatsApp Number</p>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedReg.whatsappNumber || selectedReg.whatsAppNumber || 'N/A'}
                      </p>
                    </div>

                    {/* Check-In */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Check-In</p>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> {associatedBooking?.checkInDate || selectedReg.checkInDate || bookingForm.checkInDate || 'N/A'}
                      </p>
                    </div>

                    {/* Check-Out */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Check-Out</p>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> {associatedBooking?.checkOutDate || selectedReg.checkOutDate || bookingForm.checkOutDate || 'N/A'}
                      </p>
                    </div>

                    {/* Total Nights */}
                    <div className="space-y-1 border-t border-slate-100/80 pt-2 mt-1 col-span-2 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Nights:</span>
                      <span className="font-extrabold text-emerald-700 text-xs">
                        {bookingForm.numberOfNights || selectedReg.numberOfNights || selectedReg.nights || 1} Nights
                      </span>
                    </div>

                    {/* Pax */}
                    <div className="space-y-1 col-span-2 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pax:</span>
                      <span className="font-extrabold text-slate-800">{selectedReg.adults || 1} Adults / {selectedReg.children || 0} Children</span>
                    </div>

                    {/* Booking Channel */}
                    <div className="space-y-1 col-span-2 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Booking Channel:</span>
                      <span className="font-extrabold text-slate-800">
                        {associatedBooking?.bookingType || bookingForm.bookingType || 'Direct Booking'}
                      </span>
                    </div>

                    {/* Room Details Table (Room Number & Price ONLY) */}
                    <div className="col-span-2 space-y-1.5 border-t border-slate-100/60 pt-2.5 mt-1">
                      {(() => {
                        const isForeignGuest = (selectedReg?.country && selectedReg.country.toLowerCase() !== 'sri lanka') || (selectedReg?.nationality && selectedReg.nationality.toLowerCase() !== 'sri lankan');
                        const defaultCurrency = isForeignGuest ? 'USD' : 'LKR';
                        const currency = associatedBooking?.currency || (selectedReg?.currency && selectedReg.currency !== 'LKR' ? selectedReg.currency : (bookingForm.currencyCode && bookingForm.currencyCode !== 'LKR' ? bookingForm.currencyCode : defaultCurrency));
                        const totalAmt = parseFloat(associatedBooking?.totalAmount || bookingForm.amount || selectedReg?.totalAmount || 0);
                        let parsedItems = [];

                        // 1. Try parsing roomPrices JSON if present
                        if (associatedBooking?.roomPrices) {
                          try {
                            const p = JSON.parse(associatedBooking.roomPrices);
                            if (Array.isArray(p) && p.length > 0) {
                              parsedItems = p.map((item, idx) => ({
                                roomNumber: item.roomNumber || item.roomNum || `Room ${idx + 1}`,
                                price: item.price != null && item.price !== '' ? parseFloat(item.price) : null
                              }));
                            }
                          } catch(e) {}
                        }

                        // 2. Parse from roomNumber / roomType strings if roomPrices was empty
                        if (parsedItems.length === 0) {
                          const rawRoomNums = (associatedBooking?.roomNumber || bookingForm.room || selectedReg?.roomNumber || selectedReg?.room || '')
                            .split(',')
                            .map(r => r.trim())
                            .filter(Boolean);

                          const rawRoomTypes = (associatedBooking?.roomType || bookingForm.roomType || selectedReg?.roomType || '')
                            .split(',')
                            .map(t => t.trim())
                            .filter(Boolean);

                          const count = Math.max(rawRoomNums.length, rawRoomTypes.length, 1);

                          for (let i = 0; i < count; i++) {
                            let num = rawRoomNums[i] || (count > 1 ? `Room ${i + 1}` : (rawRoomNums[0] || 'Unallocated'));
                            if (num !== 'Unallocated' && !num.startsWith('Room')) {
                              num = `Room ${num}`;
                            }
                            parsedItems.push({
                              roomNumber: num,
                              price: totalAmt > 0 ? (totalAmt / count) : null
                            });
                          }
                        }

                        return (
                          <div className="space-y-2">
                            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                                    <th className="py-2 px-3 font-extrabold">Room Number</th>
                                    <th className="py-2 px-3 font-extrabold text-right">Price ({currency})</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-[11px]">
                                  {parsedItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                                        <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-0.5 rounded text-[11px] font-extrabold">
                                          {item.roomNumber}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 text-xs">
                                        {item.price != null && !isNaN(item.price) ? (
                                          `${currency} ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                        ) : (
                                          <span className="text-slate-400 font-normal italic">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Board Basis */}
                    <div className="space-y-1 col-span-2 flex justify-between items-center border-t border-slate-100/60 pt-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Board Basis:</span>
                      <span className="font-extrabold text-slate-800">
                        {associatedBooking?.boardBasis || bookingForm.boardBasis || 'Room Only'}
                      </span>
                    </div>

                    {/* Total Price */}
                    <div className="space-y-1 col-span-2 flex justify-between items-center border-t border-slate-100/80 pt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Price:</span>
                      <span className="font-extrabold text-emerald-700 font-mono text-xs">
                        {(() => {
                          const isForeign = (selectedReg?.country && selectedReg.country.toLowerCase() !== 'sri lanka') || (selectedReg?.nationality && selectedReg.nationality.toLowerCase() !== 'sri lankan');
                          return associatedBooking?.currency || (selectedReg?.currency && selectedReg.currency !== 'LKR' ? selectedReg.currency : (bookingForm.currencyCode && bookingForm.currencyCode !== 'LKR' ? bookingForm.currencyCode : (isForeign ? 'USD' : 'LKR')));
                        })()} {parseFloat(associatedBooking?.totalAmount || bookingForm.amount || selectedReg?.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                  </div>
                ) : (
                  /* EDIT MODE INLINE FORM */
                  <form onSubmit={handleBookingSubmit} className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      {/* Room No */}
                      <div className="space-y-1 col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room No</label>
                        <select
                          value={bookingForm.room}
                          onChange={(e) => {
                            const selectedNo = e.target.value;
                            const matchedRoom = rooms.find(r => String(r.roomNumber) === String(selectedNo));
                            setBookingForm(prev => ({
                              ...prev,
                              room: selectedNo,
                              roomType: matchedRoom ? matchedRoom.roomType : prev.roomType
                            }));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs cursor-pointer"
                        >
                          <option value="">-- Select Room --</option>
                          {rooms.map((r) => (
                            <option key={r.id || r.roomNumber} value={r.roomNumber}>
                              Room {r.roomNumber} ({r.roomType})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Booking Channel */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Channel</label>
                        <select
                          value={bookingForm.bookingType}
                          onChange={(e) => handleBookingChannelChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs"
                        >
                          <option value="Direct">Direct</option>
                          <option value="Booking.com">Booking.com</option>
                          <option value="Agoda">Agoda</option>
                          <option value="Web">Web</option>
                        </select>
                      </div>

                      {/* Booking Number */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Number</label>
                        <input
                          type="text"
                          placeholder="e.g. D-1002"
                          value={bookingForm.bookingNumber}
                          onChange={(e) => setBookingForm({...bookingForm, bookingNumber: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 font-mono text-xs"
                        />
                      </div>

                      {/* Board Basis */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Board Basis</label>
                        <select
                          value={bookingForm.boardBasis}
                          onChange={(e) => setBookingForm({...bookingForm, boardBasis: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs"
                        >
                          <option value="Room Only">Room Only</option>
                          <option value="Bed & Breakfast">Bed & Breakfast</option>
                          <option value="Half Board">Half Board</option>
                          <option value="Full Board">Full Board</option>
                        </select>
                      </div>

                      {/* Total Amount & Currency */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Amount ({bookingForm.currencyCode || associatedBooking?.currency || 'USD'})</label>
                        <div className="flex gap-1">
                          <select
                            value={bookingForm.currencyCode || associatedBooking?.currency || 'USD'}
                            onChange={(e) => setBookingForm({ ...bookingForm, currencyCode: e.target.value })}
                            className="bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            <option value="USD">USD</option>
                            <option value="LKR">LKR</option>
                            <option value="EUR">EUR</option>
                            <option value="AUD">AUD</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 2250"
                            value={bookingForm.amount}
                            onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })}
                            className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Check-In Date */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-In Date</label>
                        <input
                          type="date"
                          value={bookingForm.checkInDate || ''}
                          onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs"
                        />
                      </div>

                      {/* Check-Out Date */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-Out Date</label>
                        <input
                          type="date"
                          value={bookingForm.checkOutDate || ''}
                          onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs"
                        />
                      </div>

                      {/* Room Details Table in Edit Mode */}
                      <div className="col-span-2 space-y-1.5 border-t border-slate-100/60 pt-2.5 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Allocated Room Details:</span>
                        {(() => {
                          let parsedItems = [];
                          const currency = bookingForm.currencyCode || associatedBooking?.currency || selectedReg?.currency || 'USD';
                          const totalAmt = parseFloat(bookingForm.amount || associatedBooking?.totalAmount || selectedReg?.totalAmount || 0);

                          if (associatedBooking?.roomPrices) {
                            try {
                              const p = JSON.parse(associatedBooking.roomPrices);
                              if (Array.isArray(p) && p.length > 0) {
                                parsedItems = p.map((item, idx) => ({
                                  roomNumber: item.roomNumber || item.roomNum || `Room ${idx + 1}`,
                                  price: item.price != null && item.price !== '' ? parseFloat(item.price) : null
                                }));
                              }
                            } catch(e) {}
                          }

                          if (parsedItems.length === 0) {
                            const rawRoomNums = (bookingForm.room || associatedBooking?.roomNumber || selectedReg?.roomNumber || '')
                              .split(',')
                              .map(r => r.trim())
                              .filter(Boolean);

                            const rawRoomTypes = (bookingForm.roomType || associatedBooking?.roomType || selectedReg?.roomType || '')
                              .split(',')
                              .map(t => t.trim())
                              .filter(Boolean);

                            const count = Math.max(rawRoomNums.length, rawRoomTypes.length, 1);

                            for (let i = 0; i < count; i++) {
                              let num = rawRoomNums[i] || (count > 1 ? `Room ${i + 1}` : (rawRoomNums[0] || 'Unallocated'));
                              if (num !== 'Unallocated' && !num.startsWith('Room')) {
                                num = `Room ${num}`;
                              }
                              parsedItems.push({
                                roomNumber: num,
                                price: totalAmt > 0 ? (totalAmt / count) : null
                              });
                            }
                          }

                          return (
                            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                                    <th className="py-2 px-3 font-extrabold">Room Number</th>
                                    <th className="py-2 px-3 font-extrabold text-right">Price ({currency})</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-[11px]">
                                  {parsedItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                                        <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-0.5 rounded text-[11px] font-extrabold">
                                          {item.roomNumber}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 text-xs">
                                        {item.price != null && !isNaN(item.price) ? (
                                          `${currency} ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                        ) : (
                                          <span className="text-slate-400 font-normal italic">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Submit Button */}
                      <div className="col-span-2 pt-1.5">
                        <button
                          type="submit"
                          disabled={updatingBooking}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          {updatingBooking ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save Booking Details
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Quick Actions (WhatsApp Chat) */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    let phone = selectedReg.whatsappNumber || selectedReg.whatsAppNumber || '';
                    const cleanedPhone = phone.replace(/\D/g, '');
                    let formattedPhone = cleanedPhone;
                    if (formattedPhone.startsWith('0')) {
                      formattedPhone = '94' + formattedPhone.substring(1);
                    }
                    const guestName = selectedReg.guestName || '';
                    const booking = getBookingForReg(selectedReg.id);
                    const bookingNumber = booking?.bookingNumber || ('SV-' + (1000 + selectedReg.id));
                    const checkIn = selectedReg.checkInDate || '';
                    const checkOut = selectedReg.checkOutDate || '';
                    
                    const message = `Welcome to Serene Villa - Hiriketiya 🌴\n\nHello Mr / Mrs ${guestName},\n\nWe are pleased to confirm your reservation at Serene Villa Hiriketiya!\n\nHere are your reservation details:\n- Booking Ref: ${bookingNumber}\n- Check-in: ${checkIn}\n- Check-out: ${checkOut}\n\nHow are you? Could we know what time you are planning to check-in please?\n\nWe look forward to welcoming you to Serene Villa! 😊\n\nThank you.\n\nBest regards,\nReservation department\nSerene Villa Hiriketiya`;
                    
                    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare size={14} className="text-blue-700" /> WhatsApp Chat
                </button>
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-2 text-xs bg-slate-50/50 border border-slate-100/50 p-3.5 rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uploaded Documents</h4>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs">
                    {uploadingPhoto ? <Loader size={11} className="animate-spin text-emerald-600" /> : <FileDown size={11} />}
                    {selectedReg.passportFrontPath || selectedReg.guestPhotoPath ? 'Upload New Photo' : 'Upload Photo'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePassportPhotoUpload} 
                      className="hidden" 
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Passport Photo Bar */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Passport / NIC Photo</p>
                    {selectedReg.passportFrontPath || selectedReg.guestPhotoPath ? (
                      <div 
                        onClick={() => setSelectedSlipPreview({
                          id: 'passport-nic',
                          paymentType: 'Passport / NIC Document',
                          paidDate: 'Guest Profile Attachment',
                          slipUrl: getPhotoUrl(selectedReg.passportFrontPath || selectedReg.guestPhotoPath),
                          fileName: 'passport_document.png',
                          bankKey: 'USD_PB' // default fallback so preview details don't crash
                        })}
                        className="flex items-center justify-between p-2.5 bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-200/60 rounded-xl shadow-2xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-10 w-14 rounded-lg overflow-hidden border border-emerald-200 shrink-0 bg-white shadow-2xs">
                            <img 
                              src={getPhotoUrl(selectedReg.passportFrontPath || selectedReg.guestPhotoPath)} 
                              alt="Passport Document"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">Passport / NIC Document</p>
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/50">
                              <CheckCircle size={10} className="text-emerald-600" /> Click to View Document
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-lg shrink-0">
                          View
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs italic flex items-center gap-2">
                        <FileText size={14} className="text-slate-300" /> No document uploaded
                      </div>
                    )}
                  </div>

                  {/* Bank Payment Slips Section */}
                  {(() => {
                    const bId = associatedBooking?.id || selectedReg.id;
                    const bookingSlips = allBankSlips[bId] || allBankSlips[selectedReg.id] || [];

                    if (bookingSlips.length === 0) return null;

                    return (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-100/80">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                          Bank Payment Slip / Receipt ({bookingSlips.length})
                        </p>
                        <div className="space-y-1.5">
                          {bookingSlips.map((slip) => {
                            const bd = BANK_ACCOUNTS[slip.bankKey] || BANK_ACCOUNTS.USD_PB;
                            const isPdf = slip.slipUrl?.startsWith('data:application/pdf');

                            return (
                              <div 
                                key={slip.id}
                                onClick={() => setSelectedSlipPreview(slip)}
                                className="flex items-center justify-between p-2 bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-200/60 rounded-xl shadow-2xs cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-10 w-14 rounded-lg overflow-hidden border border-emerald-200 shrink-0 bg-white shadow-2xs flex items-center justify-center">
                                    {isPdf ? (
                                      <FileText size={18} className="text-emerald-700" />
                                    ) : (
                                      <img 
                                        src={slip.slipUrl} 
                                        alt="Bank Slip"
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold">{slip.paymentType}</span>
                                      <p className="font-bold text-slate-800 text-xs truncate">{bd.bankName}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-slate-500">
                                      Paid: {slip.paidDate} • Click to View
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-lg shrink-0">
                                  View
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>





              {/* Other Options Dropdown directly above payments area */}
              {associatedBooking && (
                <div className="relative pt-4 border-t border-slate-100/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-black flex items-center gap-1">
                      OTHER OPTIONS
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOtherOptions(!showOtherOptions)}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                    >
                      <span className="text-[11px] font-bold">{showOtherOptions ? '−' : '+'}</span> Options
                    </button>
                  </div>

                  {showOtherOptions && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDiscountModal(true);
                          setShowOtherOptions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition font-medium"
                      >
                        Discount
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraNightModal(true);
                          setShowOtherOptions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition border-t border-slate-100 font-medium"
                      >
                        Extra Night
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraPersonModal(true);
                          setShowOtherOptions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition border-t border-slate-100 font-medium"
                      >
                        One Person
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Unified Payment Form */}
              {associatedBooking ? (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-emerald-600" /> Payments
                  </h4>

                  {/* Payment Summary Card */}
                  {(() => {
                    const isForeignGuest = (selectedReg?.country && selectedReg.country.toLowerCase() !== 'sri lanka') || (selectedReg?.nationality && selectedReg.nationality.toLowerCase() !== 'sri lankan');
                    const totalAmt = parseFloat(associatedBooking?.totalAmount || bookingForm.amount || selectedReg?.totalAmount || 0);

                    // Smartly detect booking currency (less than 10,000 is foreign currency USD/EUR/AUD/GBP)
                    let bookingCurrency = associatedBooking?.currency;
                    if (!bookingCurrency || bookingCurrency === 'LKR') {
                      if (selectedReg?.currency && selectedReg.currency !== 'LKR') bookingCurrency = selectedReg.currency;
                      else if (bookingForm.currencyCode && bookingForm.currencyCode !== 'LKR') bookingCurrency = bookingForm.currencyCode;
                      else if (totalAmt > 0 && totalAmt < 10000) bookingCurrency = 'USD';
                      else bookingCurrency = isForeignGuest ? 'USD' : 'LKR';
                    }

                    const visiblePays = getVisiblePayments(advancePayments);
                    const bookingExRate = parseFloat(associatedBooking?.exchangeRate || bookingForm.exchangeRate || 1);

                    let totalPaidInBookingCurrency = 0;
                    let advancePaidInBookingCurrency = 0;

                    visiblePays.forEach(p => {
                      const pCurr = (p.currencyCode || p.currency || bookingCurrency).toUpperCase();
                      const pAmt = p.amountInCurrency != null && !isNaN(p.amountInCurrency) && parseFloat(p.amountInCurrency) > 0
                        ? parseFloat(p.amountInCurrency)
                        : (p.amount != null && !isNaN(p.amount) ? parseFloat(p.amount) : 0);
                      const pLkr = parseFloat(p.convertedAmountLkr || p.amountLkr || 0);
                      const pExRate = parseFloat(p.exchangeRate) || bookingExRate || 1;

                      let convertedAmt = pAmt;
                      if (pCurr === bookingCurrency.toUpperCase()) {
                        convertedAmt = pAmt;
                      } else if (bookingCurrency.toUpperCase() === 'LKR') {
                        convertedAmt = pLkr > 0 ? pLkr : (pAmt * pExRate);
                      } else {
                        // Converting from LKR to foreign currency (e.g. USD)
                        if (pExRate > 0) {
                          convertedAmt = (pLkr > 0 ? pLkr : pAmt) / pExRate;
                        }
                      }

                      totalPaidInBookingCurrency += convertedAmt;
                      if (p.paymentType === 'ADVANCE' || p.isAdvancePayment) {
                        advancePaidInBookingCurrency += convertedAmt;
                      }
                    });

                    let pStatus = associatedBooking?.paymentStatus || selectedReg?.paymentStatus || 'Unpaid';
                    if (totalPaidInBookingCurrency >= (totalAmt - 0.01) && totalAmt > 0) pStatus = 'Paid';
                    else if (totalPaidInBookingCurrency > 0 && pStatus !== 'Paid') pStatus = 'Partially Paid';

                    const bal = pStatus === 'Paid' ? 0 : Math.max(0, totalAmt - totalPaidInBookingCurrency);

                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between font-semibold text-slate-500">
                          <span>Total Booking Amount:</span>
                          <span className="font-mono font-bold text-slate-900">{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} {bookingCurrency}</span>
                        </div>
                        {advancePaidInBookingCurrency > 0 && (
                          <div className="flex justify-between font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/50">
                            <span className="flex items-center gap-1 font-bold">
                              <ShieldCheck size={13} className="text-emerald-600" /> Advance Paid by Guest:
                            </span>
                            <span className="font-mono font-extrabold text-emerald-700">-{advancePaidInBookingCurrency.toLocaleString('en-US', { minimumFractionDigits: 2 })} {bookingCurrency}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-slate-500">
                          <span>Total Paid So Far:</span>
                          <span className="font-mono font-bold text-emerald-600">+{totalPaidInBookingCurrency.toLocaleString('en-US', { minimumFractionDigits: 2 })} {bookingCurrency}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200/60 pt-2 text-sm">
                          <span>Remaining Balance to Pay:</span>
                          <span className={`font-mono ${Math.max(0, bal) > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}`}>
                            {Math.max(0, bal).toLocaleString('en-US', { minimumFractionDigits: 2 })} {bookingCurrency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                          <span className="font-bold text-slate-500">Payment Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            pStatus === 'Paid' ? 'bg-green-100 text-green-700'
                            : pStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                          }`}>{pStatus}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment History */}
                  {getVisiblePayments(advancePayments).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payment History</p>
                      <div className="space-y-1.5">
                        {getVisiblePayments(advancePayments).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-2 bg-slate-50/50 border border-slate-100 rounded-lg text-[11px]">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="font-bold text-slate-800">
                                  {(payment.amountInCurrency || payment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {payment.currencyCode || payment.currency}
                                  <span className="text-slate-400 font-normal"> (@ {payment.exchangeRate})</span>
                                </p>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                  payment.paymentType === 'FINAL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {payment.paymentType === 'FINAL' ? 'Full' : 'Advance'}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-semibold">{payment.paymentMethod} • {payment.paymentDate}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGenerateReceipt(payment.id)}
                              className="text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-1 rounded-md transition"
                            >
                              <Receipt className="h-3 w-3" /> Receipt
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Unified Payment Form */}
                  {(() => {
                    const isForeignGuest = (selectedReg?.country && selectedReg.country.toLowerCase() !== 'sri lanka') || (selectedReg?.nationality && selectedReg.nationality.toLowerCase() !== 'sri lankan');
                    const totalAmt = parseFloat(associatedBooking?.totalAmount || bookingForm.amount || selectedReg?.totalAmount || 0);

                    // Smart currency detection: if associatedBooking has no explicit non-LKR currency, infer from amount
                    let bookingCurrency = associatedBooking?.currency;
                    if (!bookingCurrency || bookingCurrency === 'LKR') {
                      if (selectedReg?.currency && selectedReg.currency !== 'LKR') bookingCurrency = selectedReg.currency;
                      else if (bookingForm.currencyCode && bookingForm.currencyCode !== 'LKR') bookingCurrency = bookingForm.currencyCode;
                      else if (totalAmt > 0 && totalAmt < 10000) bookingCurrency = 'USD';
                      else bookingCurrency = isForeignGuest ? 'USD' : 'LKR';
                    }
                    const bookingExRate = parseFloat(associatedBooking?.exchangeRate || bookingForm.exchangeRate || 1);

                    const visiblePays = getVisiblePayments(advancePayments);
                    let totalPaidInBookingCurrency = 0;

                    visiblePays.forEach(p => {
                      const pCurr = (p.currencyCode || p.currency || bookingCurrency).toUpperCase();
                      const pAmt = p.amountInCurrency != null && !isNaN(p.amountInCurrency) && parseFloat(p.amountInCurrency) > 0
                        ? parseFloat(p.amountInCurrency)
                        : (p.amount != null && !isNaN(p.amount) ? parseFloat(p.amount) : 0);
                      const pLkr = parseFloat(p.convertedAmountLkr || p.amountLkr || 0);
                      const pExRate = parseFloat(p.exchangeRate) || bookingExRate || 1;

                      let convertedAmt = pAmt;
                      if (pCurr === bookingCurrency.toUpperCase()) {
                        convertedAmt = pAmt;
                      } else if (bookingCurrency.toUpperCase() === 'LKR') {
                        convertedAmt = pLkr > 0 ? pLkr : (pAmt * pExRate);
                      } else {
                        if (pLkr > 0 && pExRate > 1) convertedAmt = pLkr / pExRate;
                      }

                      totalPaidInBookingCurrency += convertedAmt;
                    });

                    const remainingBal = (associatedBooking?.paymentStatus === 'Paid' || selectedReg?.paymentStatus === 'Paid') ? 0 : Math.max(0, totalAmt - totalPaidInBookingCurrency);
                    const isFullyPaid = remainingBal <= 0 || associatedBooking?.paymentStatus === 'Paid' || selectedReg?.paymentStatus === 'Paid';

                    if (isFullyPaid) return (
                      <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-bold">
                        <CheckCircle className="h-4 w-4" /> Payment fully settled
                      </div>
                    );

                    // Auto-fill amount when switching to FULL tab
                    const handleTabChange = (tab) => {
                      setPaymentTab(tab);
                      let rate = 1;
                      if (bookingCurrency === 'USD') rate = 300;
                      else if (bookingCurrency === 'EUR') rate = 325;
                      else if (bookingCurrency === 'AUD') rate = 220;
                      if (tab === 'FULL') {
                        setPaymentForm(prev => ({ ...prev, amount: remainingBal.toFixed(2), currencyCode: bookingCurrency, exchangeRate: rate }));
                      } else {
                        setPaymentForm(prev => ({ ...prev, amount: '', currencyCode: bookingCurrency, exchangeRate: rate }));
                      }
                    };

                    const isFull = paymentTab === 'FULL';

                    return (
                      <form onSubmit={(e) => handleSavePayment(e, paymentTab, remainingBal)} className="space-y-3 text-xs">
                        {/* Tab Toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleTabChange('ADVANCE')}
                            className={`flex-1 py-2 transition ${
                              !isFull
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            Advance Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTabChange('FULL')}
                            className={`flex-1 py-2 transition border-l border-slate-200 ${
                              isFull
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            Full Payment
                            {remainingBal > 0 && (
                              <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${
                                isFull ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                              }`}>
                                {remainingBal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {bookingCurrency}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Form Fields */}
                        <div className={`border rounded-xl p-3.5 space-y-3 ${
                          isFull ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-slate-50/20'
                        }`}>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
                              <select
                                value={paymentForm.currencyCode || bookingCurrency}
                                onChange={handlePaymentCurrencyChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="LKR">LKR</option>
                                <option value="AUD">AUD</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Amount {isFull && <span className="text-blue-500 normal-case font-normal">(auto-filled)</span>}
                              </label>
                              <input
                                type="number"
                                step="any"
                                required
                                readOnly={isFull}
                                placeholder="0.00"
                                value={paymentForm.amount}
                                onChange={(e) => !isFull && setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 font-bold font-mono focus:outline-none ${
                                  isFull ? 'bg-blue-50 text-blue-700 cursor-default' : 'bg-white text-slate-700'
                                }`}
                              />
                            </div>
                            {!isFull && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exchange Rate</label>
                                  <input
                                    type="number"
                                    step="any"
                                    required
                                    disabled={paymentForm.currencyCode === 'LKR'}
                                    value={paymentForm.exchangeRate}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, exchangeRate: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none disabled:bg-slate-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Converted (LKR)</label>
                                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-700 font-mono">
                                    {((parseFloat(paymentForm.amount) || 0) * (parseFloat(paymentForm.exchangeRate) || 0)).toLocaleString()} LKR
                                  </div>
                                </div>
                              </>
                            )}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                              <select
                                value={paymentForm.paymentMethod}
                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none"
                              >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Date</label>
                              <input
                                type="date"
                                required
                                value={paymentForm.paymentDate}
                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                              <input
                                type="text"
                                placeholder={isFull ? 'e.g. Full balance settled at checkout' : 'e.g. Paid in USD cash'}
                                value={paymentForm.remarks}
                                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={savingPayment}
                            className={`w-full text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                              isFull
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-emerald-700 hover:bg-emerald-800'
                            }`}
                          >
                            {savingPayment ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            {isFull ? 'Save Full Payment & Mark as Paid' : 'Save Advance Payment'}
                          </button>
                        </div>
                      </form>
                    );
                  })()}


                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3.5 text-xs text-amber-700 font-semibold text-center mt-4">
                  Please save the room allocation details first to record advance payments.
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <User className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-bold text-xs">No Guest Selected</p>
              <p className="text-[10px] text-slate-450 max-w-[180px] mx-auto leading-relaxed">
                Click on any guest registration in the list to view files, check-in info, and complete room allocations.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* QR Code Modal Flyer */}
      {showQr && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-2xl p-8 space-y-6 text-center shadow-xl relative">
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition no-print cursor-pointer"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Serene Villa Check-In QR</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Scan this QR code to fill the Guest Registration Form</p>
            </div>
            
            <div className="flex justify-center p-4 bg-emerald-50/20 border border-emerald-100/40 rounded-2xl max-w-[270px] mx-auto">
              <img 
                src={qrImageSrc} 
                alt="Registration QR Code" 
                className="w-full h-auto object-contain rounded"
              />
            </div>

            <div className="space-y-3 no-print">
              <label className="block text-xs font-bold text-slate-700 text-left">
                Configuration Host/IP:
              </label>
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="e.g. 192.168.8.127"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {(customHost === 'localhost' || customHost === '127.0.0.1') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[10px] text-amber-800 text-left font-medium">
                  ⚠️ <strong>Warning:</strong> "localhost" is only accessible from this computer. To allow mobile devices to scan and connect, please enter your computer's local network IP (e.g. 192.168.8.127).
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-slate-450 break-all bg-slate-50 p-2 rounded-lg font-mono select-all">
                {qrUrl}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs no-print">
              <button 
                onClick={handleDownloadQr}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
              >
                <FileDown size={14} /> Download QR
              </button>
              <button 
                onClick={handleShareQr}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
              >
                <Share2 size={14} /> Share Link
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
              >
                <Printer size={14} /> Print Flyer
              </button>
            </div>

            <div className="no-print pt-1">
              <button 
                onClick={() => setShowQr(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Select a Room Modal */}
      {showRoomSelector && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-600 text-white rounded-t-2xl flex items-center justify-between select-none">
              <h3 className="text-base font-extrabold">Select a Room</h3>
              <button 
                type="button" 
                onClick={() => setShowRoomSelector(false)} 
                className="text-white hover:text-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {rooms.map((room) => {
                  const isAvailable = room.status === 'Available';
                  return (
                    <div 
                      key={room.id} 
                      className={`bg-white border rounded-xl overflow-hidden shadow-sm transition flex flex-col justify-between ${
                        isAvailable ? 'border-slate-200' : 'border-slate-100 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="aspect-[16/10] overflow-hidden relative bg-slate-100">
                          <img 
                            src={room.image || deluxeRoomImg} 
                            alt={room.roomType}
                            className="w-full h-full object-cover"
                          />
                          <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm ${
                            room.status === 'Available' ? 'bg-emerald-500 text-white' : 
                            room.status === 'Occupied' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {room.status}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              {room.roomType} - Room No. {room.roomNumber}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                              Enjoy comfortable boutique stays equipped with top amenities at Hiriketiya.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {room.facilities && room.facilities.slice(0, 4).map((fac, idx) => (
                              <span 
                                key={idx} 
                                className="text-[8px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded"
                              >
                                {fac}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 pt-0 flex gap-2">
                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            let mappedType = room.roomType;
                            if (mappedType.toLowerCase().includes('deluxe')) mappedType = 'Deluxe Room';
                            else if (mappedType.toLowerCase().includes('suite')) mappedType = 'Suite Room';
                            else if (mappedType.toLowerCase().includes('standard')) mappedType = 'Standard Room';
                            else if (mappedType.toLowerCase().includes('budget')) mappedType = 'Budget Room';

                            setBookingForm({
                              ...bookingForm,
                              roomType: mappedType,
                              room: room.roomNumber
                            });
                            setShowRoomSelector(false);
                          }}
                          className={`w-full py-1.5 rounded-lg font-bold text-center text-xs transition cursor-pointer ${
                            isAvailable 
                              ? 'bg-emerald-650 hover:bg-emerald-700 text-white' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isAvailable ? 'Select' : room.status}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && selectedPaymentForReceipt && (() => {
        const associatedBooking = getBookingForReg(selectedReg.id);
        if (!associatedBooking) return null;
        
        const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL';
        const cardFeeMatch = selectedPaymentForReceipt.remarks?.match(/\[(?:Bank )?Charges: ([\d.]+)\]/);
        const cardFeeVal = cardFeeMatch ? parseFloat(cardFeeMatch[1]) : 0;
        const otherMatch = selectedPaymentForReceipt.remarks?.match(/\[Other Charges: ([\d.]+)\]/);
        const otherVal = otherMatch ? parseFloat(otherMatch[1]) : 0;
        const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';

        const handleWhatsAppShare = () => {
          const bCurr = (associatedBooking.currency && associatedBooking.currency !== 'LKR') ? associatedBooking.currency : (associatedBooking.tableCurrency || 'USD');
          const exRate = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBooking.exchangeRate) || 335;
          const totalBookingAmountLkr = bCurr === 'LKR' ? (associatedBooking.totalAmount || 0) : ((associatedBooking.totalAmount || 0) * exRate);
          
          const paymentsUpToThis = getVisiblePayments(advancePayments)
            .filter(p => p.id <= selectedPaymentForReceipt.id);
          const totalPaidUpToThis = paymentsUpToThis.reduce((sum, p) => sum + (p.convertedAmountLkr || p.amountLkr || 0), 0);
          const remainingBalLkr = isFinalPayment ? 0 : Math.max(0, totalBookingAmountLkr - totalPaidUpToThis);
          const remainingBalInBookingCurr = isFinalPayment ? 0 : (bCurr === 'LKR' ? remainingBalLkr : (remainingBalLkr / exRate));

          const currencyCode = selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency || 'LKR';
          const isLkr = currencyCode === 'LKR';
          const paidAmtLkr = selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0;
          const paidAmtOrig = selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency || paidAmtLkr;

          const amountPaidStr = isLkr
            ? `LKR ${paidAmtLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `${currencyCode} ${(parseFloat(paidAmtOrig) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (LKR ${paidAmtLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;

          const balanceStr = isFinalPayment
            ? (bCurr === 'LKR' ? 'LKR 0.00 (Fully Settled)' : `${bCurr} 0.00 (LKR 0.00) (Fully Settled)`)
            : (bCurr === 'LKR'
              ? `LKR ${remainingBalLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${bCurr} ${remainingBalInBookingCurr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (LKR ${remainingBalLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);

          const nightsCount = selectedReg.numberOfNights || selectedReg.nights || 1;

          const text = `🌴 *SERENE VILLA - ${receiptTitle.toUpperCase()}* 🌴

Dear *${selectedReg.guestName || 'Guest'}*,

Thank you for your payment! Here is your official payment receipt:

📄 *Receipt No:* ${receiptData.receiptNumber}
🔖 *Booking Ref:* ${associatedBooking.bookingNumber}
🗓 *Check-in - Check-out:* ${selectedReg.checkInDate} to ${selectedReg.checkOutDate} (${nightsCount} ${nightsCount === 1 ? 'Night' : 'Nights'})

💳 *Payment Method:* ${selectedPaymentForReceipt.paymentMethod}
💵 *Amount Paid:* ${amountPaidStr}
💰 *Remaining Balance:* ${balanceStr}

We look forward to welcoming you to Serene Villa! 😊

Best regards,
*Reservation Department*
Serene Villa Hiriketiya`;

          let rawPhone = selectedReg?.whatsappNumber || selectedReg?.whatsAppNumber || selectedReg?.mobileNumber || selectedReg?.phone || associatedBooking?.contactNumber || associatedBooking?.phone || '';
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

        const handlePrintReceipt = () => {
          printReceiptOnly();
        };

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

        const bCurrRender = (associatedBooking.currency && associatedBooking.currency !== 'LKR') ? associatedBooking.currency : (associatedBooking.tableCurrency || 'USD');
        const exRateRender = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBooking.exchangeRate) || 335;
        const paymentsUpToThis = getVisiblePayments(advancePayments).filter(p => p.id <= selectedPaymentForReceipt.id);
        const totalPaidUpToThis = paymentsUpToThis.reduce((sum, p) => sum + (p.convertedAmountLkr || p.amountLkr || 0), 0);
        
        const roomsList = (associatedBooking?.roomNumber || selectedReg?.roomNumber || '')
          .split(',').map(r => r.trim()).filter(Boolean);
        const roomTypesList = (associatedBooking?.roomType || selectedReg?.roomType || '')
          .split(',').map(t => t.trim()).filter(Boolean);
        
        let parsedRoomPrices = null;
        if (associatedBooking?.roomPrices) {
          try {
            const p = JSON.parse(associatedBooking.roomPrices);
            if (Array.isArray(p) && p.length > 0) parsedRoomPrices = p;
          } catch(e) {}
        }

        const countRooms = Math.max(
          roomsList.length, 
          roomTypesList.length, 
          parsedRoomPrices ? parsedRoomPrices.length : 0, 
          1
        );
        const numRooms = countRooms;
        const nightsVal = selectedReg.numberOfNights || selectedReg.nights || 1;
        const totalAmount = associatedBooking?.totalAmount || selectedReg?.totalAmount || 0;
        
        const dispCurr = forceReceiptLkr ? 'LKR' : bCurrRender;
        const convFactor = (forceReceiptLkr && bCurrRender !== 'LKR') ? exRateRender : 1;

        const dispTotalAmount = totalAmount * convFactor;
        const totalCents = Math.round(dispTotalAmount * 100);
        
        let itemizedRows = [];
        for (let idx = 0; idx < countRooms; idx++) {
          let rowAmount = 0;
          if (parsedRoomPrices && parsedRoomPrices[idx] && parsedRoomPrices[idx].price) {
            rowAmount = (parseFloat(parsedRoomPrices[idx].price) || 0) * convFactor;
          } else {
            const currentCentsSum = Math.round((totalCents / numRooms) * (idx + 1));
            const prevCentsSum = Math.round((totalCents / numRooms) * idx);
            const rowCents = currentCentsSum - prevCentsSum;
            rowAmount = rowCents / 100;
          }
          
          const rateAmount = rowAmount / nightsVal;
          const amountVal = Math.floor(rowAmount);
          const amountCts = Math.round((rowAmount - amountVal) * 100).toString().padStart(2, '0');
          const currentRoomType = roomTypesList[idx] || (roomTypesList.length === 1 ? roomTypesList[0] : (roomTypesList[0] || 'Room'));
          const rNum = roomsList[idx] || (roomsList.length === 1 ? roomsList[0] : '');

          const desc = rNum 
            ? `Night - ${currentRoomType} (Room ${rNum})`
            : `Night - ${currentRoomType}`;
          
          itemizedRows.push({
            roomNumber: rNum,
            description: desc,
            rate: rateAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amountVal: amountVal.toLocaleString(),
            amountCts: amountCts
          });
        }

        const defaultRowAmount = dispTotalAmount;
        const defaultRateAmount = defaultRowAmount / nightsVal;
        const defaultAmountVal = Math.floor(defaultRowAmount);
        const defaultAmountCts = Math.round((defaultRowAmount - defaultAmountVal) * 100).toString().padStart(2, '0');
        
        const fallbackRow = {
          description: `Night - ${associatedBooking?.roomType || 'Room'}`,
          rate: defaultRateAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          amountVal: defaultAmountVal.toLocaleString(),
          amountCts: defaultAmountCts
        };

        const bookingNoDisplay = associatedBooking?.bookingNumber || (selectedReg.passportNumber || '').replace(/^SV-?/i, '') || `D-${1000 + selectedReg.id}`;

        return (
          <div id="printable-receipt-modal-wrapper" className="no-print fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 md:py-8 print:p-0 print:bg-transparent print:static overflow-y-auto">
            <div 
              id="printable-receipt-modal" 
              className="bg-white text-slate-900 p-5 md:p-6 mx-auto w-full max-w-xl shadow-2xl border border-slate-200 rounded-lg text-xs font-sans animate-in fade-in zoom-in-95 duration-150 relative print:border-0 print:shadow-none print:w-full print:max-w-none print:p-0 print:my-0"
            >
              <button 
                onClick={() => {
                  setShowReceiptModal(false);
                  if (isFinalPayment) navigate('/handover');
                }}
                className="no-print-close-btn absolute top-3 right-3 text-slate-400 hover:text-slate-650 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition print:hidden"
                title={isFinalPayment ? 'Close & Go to Handover' : 'Close'}
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
                    <p className="flex items-center gap-1"><MapPin size={9} className="text-emerald-800 shrink-0" /> Pehembiya Road, Hiriketiya, Dickwella.</p>
                    <p className="flex items-center gap-1"><Globe size={9} className="text-emerald-800 shrink-0" /> Serenehiriketiya@gmail.com</p>
                    <p className="flex items-center gap-1"><Phone size={9} className="text-emerald-800 shrink-0" /> <span>Hot line : +94 41 225 5204 / +94 70 499 8787</span></p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <h1 className={`text-base font-black tracking-wide uppercase ${isFinalPayment ? 'text-blue-700' : 'text-emerald-800'}`}>{receiptTitle}</h1>
                  {isFinalPayment && <span className="inline-block bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">✓ Fully Settled</span>}
                  <div className="inline-block border border-emerald-800/30 rounded-lg px-2.5 py-1.5 bg-emerald-50/20 text-[10px] text-left space-y-0.5 mt-1 print:bg-transparent">
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-500 font-semibold">Booking No:</span>
                      <span className="font-mono font-bold text-emerald-800">{bookingNoDisplay}</span>
                    </div>
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-500 font-semibold">Receipt No:</span>
                      <span className="font-mono font-bold text-slate-800">{receiptData.receiptNumber}</span>
                    </div>
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-500 font-semibold">Date:</span>
                      <span className="font-bold text-slate-800">{new Date(receiptData.generatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[9px] font-extrabold text-emerald-800 uppercase mb-2 tracking-wider">RESERVATION DETAILS</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 border border-slate-200 rounded-lg text-[11px] mb-4 bg-white">
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Guest Name</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{selectedReg?.guestName || associatedBooking?.guestName || ''}</span></div>
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Channel</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{associatedBooking?.bookingType || 'Direct Booking'}</span></div>
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Check - in</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{(selectedReg?.checkInDate || associatedBooking?.checkInDate || '').replace(/-/g, '.')}</span></div>
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Check - out</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{(selectedReg?.checkOutDate || associatedBooking?.checkOutDate || '').replace(/-/g, '.')}</span></div>
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Nights</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(nightsVal).padStart(2, '0')} nights</span></div>
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Basis</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{associatedBooking?.boardBasis || 'Bed & Breakfast'}</span></div>
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Adults</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(selectedReg?.adults || associatedBooking?.adults || 1).padStart(2, '0')}</span></div>
                <div className="flex items-baseline gap-1.5"><span className="text-slate-500 font-semibold w-24 shrink-0">Children</span><span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(selectedReg?.children || associatedBooking?.children || 0).padStart(2, '0')}</span></div>
              </div>

              <div className="mb-4">
                <table className="w-full border-collapse border border-emerald-800/30 text-[11px] print:border-slate-400">
                  <thead>
                    <tr style={{ backgroundColor: '#065f46', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <th className="px-3 py-1.5 text-left uppercase text-[8px] tracking-wider" style={{ backgroundColor: '#065f46', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.2)', width: '70%' }}>DESCRIPTION</th>
                      <th colSpan={2} className="px-3 py-1.5 text-center uppercase text-[8px] tracking-wider" style={{ backgroundColor: '#065f46', color: '#ffffff', width: '30%' }}>AMOUNT</th>
                    </tr>
                    <tr style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <th style={{ backgroundColor: '#ffffff', border: '1px solid rgba(6, 95, 70, 0.2)', borderTop: 'none' }}></th>
                      <th className="px-3 py-1 text-center uppercase text-[8px] tracking-wider" style={{ backgroundColor: '#ffffff', color: '#1e293b', borderRight: '1px solid rgba(6, 95, 70, 0.2)', borderBottom: '1px solid rgba(6, 95, 70, 0.2)' }}>{dispCurr === 'LKR' ? 'RS.' : dispCurr}</th>
                      <th className="px-2 py-1 text-center uppercase text-[8px] tracking-wider" style={{ backgroundColor: '#ffffff', color: '#1e293b', borderBottom: '1px solid rgba(6, 95, 70, 0.2)' }}>CTS.</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-slate-800">
                    {itemizedRows.length > 0 ? (
                      itemizedRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-emerald-800/20 print:border-slate-400">
                          <td className="border-r border-emerald-800/20 px-3 py-1.5 text-left print:border-slate-400">{row.description}</td>
                          <td className="border-r border-emerald-800/20 px-3 py-1.5 text-right font-mono print:border-slate-400">{row.amountVal}</td>
                          <td className="px-2 py-1.5 text-center font-mono border-emerald-800/20">{row.amountCts}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-emerald-800/20 print:border-slate-400">
                        <td className="border-r border-emerald-800/20 px-3 py-1.5 text-left print:border-slate-400">{fallbackRow.description}</td>
                        <td className="border-r border-emerald-800/20 px-3 py-1.5 text-right font-mono print:border-slate-400">{fallbackRow.amountVal}</td>
                        <td className="px-2 py-1.5 text-center font-mono">{fallbackRow.amountCts}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/10 font-bold text-slate-900 border-t-2 border-emerald-800/30 print:border-slate-400">
                      <td className="border-r border-emerald-800/20 px-3 py-2 text-right uppercase text-[8px] tracking-wider print:border-slate-400 font-extrabold" colSpan={1}>TOTAL VALUE</td>
                      <td className="border-r border-emerald-800/20 px-3 py-2 text-right font-mono font-bold print:border-slate-400 text-emerald-800">{Math.floor(dispTotalAmount).toLocaleString()}</td>
                      <td className="px-2 py-2 text-center font-mono font-bold text-emerald-800">{Math.round((dispTotalAmount - Math.floor(dispTotalAmount)) * 100).toString().padStart(2, '0')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
                <div className="border border-dashed border-slate-200 rounded-lg p-2.5 text-slate-500 flex flex-col justify-between print:border-slate-300">
                  <div>
                    <p className="font-bold text-[8px] uppercase tracking-wider mb-0.5 text-slate-400">Payment Reference</p>
                    <p className="font-mono text-slate-700 font-bold">{selectedPaymentForReceipt.referenceNumber || 'N/A'}</p>
                    {selectedPaymentForReceipt.remarks && (
                      <p className="mt-1 text-[10px] leading-snug">
                        <span className="font-bold">Remarks:</span> {selectedPaymentForReceipt.remarks.replace(/\[(?:Bank )?Charges: [\d.]+\]/g, '').trim()}
                      </p>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-2">
                    {isFinalPayment ? '* This is the final payment receipt. Account fully settled.' : '* Please preserve this receipt for final checkout subtraction.'}
                  </div>
                </div>

                {(() => {
                  const bCurr = bCurrRender;
                  const exRate = exRateRender;
                  const dispCurr = forceReceiptLkr ? 'LKR' : bCurr;
                  const totAmt = forceReceiptLkr && bCurr !== 'LKR' ? (associatedBooking.totalAmount || 0) * exRate : (associatedBooking.totalAmount || 0);
                  const rawPaid = parseFloat(selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency || 0);
                  const paidAmt = forceReceiptLkr && (selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency) !== 'LKR' 
                    ? (selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || (rawPaid * exRate))
                    : rawPaid;
                  const totalPaidBCurr = (totalPaidUpToThis * (forceReceiptLkr ? 1 : (1/exRate)));
                  const remBal = isFinalPayment ? 0 : Math.max(0, totAmt - totalPaidBCurr);
                  const convertedLkrPaid = (selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || (rawPaid * exRate));

                  return (
                    <div className="border border-emerald-800/20 rounded-lg p-3 bg-emerald-50/10 space-y-1.5 print:border-slate-300 print:bg-transparent">
                      <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                        <span className="text-slate-500 font-semibold">Total Booking Amount:</span>
                        <span className="font-bold text-slate-800">{dispCurr} {totAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                        <span className="text-slate-500 font-semibold">{isFinalPayment ? 'Final Payment Paid:' : 'Advance Paid:'}</span>
                        <span className="font-bold text-emerald-850 print:text-slate-900">{dispCurr} {paidAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {paymentsUpToThis.length > 1 && (
                        <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200 text-slate-500">
                          <span>Total Paid So Far:</span>
                          <span className="font-bold">{dispCurr} {totalPaidBCurr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {cardFeeVal > 0 && (
                        <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                          <span className="text-slate-500 font-semibold">CHARGES:</span>
                          <span className="font-bold text-slate-850">
                            {dispCurr} {(dispCurr === 'LKR' ? (cardFeeVal < (rawPaid * 0.01) ? cardFeeVal * exRate : cardFeeVal) : (cardFeeVal > (rawPaid * 0.5) ? cardFeeVal / exRate : cardFeeVal)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {otherVal > 0 && (
                        <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                          <span className="text-slate-500 font-semibold">OTHER CHARGES:</span>
                          <span className="font-bold text-amber-700">
                            {dispCurr} {(dispCurr === 'LKR' ? (selectedPaymentForReceipt.currencyCode === 'LKR' ? otherVal : otherVal * exRate) : otherVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {dispCurr !== 'LKR' && (
                        <>
                          <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200 text-[10px]">
                            <span className="text-slate-500">Exchange Rate:</span>
                            <span className="font-medium text-slate-700">{exRate}</span>
                          </div>
                          <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                            <span className="text-slate-500 font-semibold">Converted Amount:</span>
                            <span className="font-bold text-emerald-850 print:text-slate-900">LKR {convertedLkrPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-1 font-bold text-sm border-t border-emerald-800/30 print:border-slate-300">
                        <span className="text-emerald-950 font-black print:text-slate-900 text-xs">Remaining Balance:</span>
                        <span className={`font-mono text-xs ${isFinalPayment ? 'text-blue-700' : 'text-emerald-800'} print:text-slate-900`}>{dispCurr} {remBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {isFinalPayment && <div className="text-center mt-1"><span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">✓ FULLY PAID</span></div>}
                    </div>
                  );
                })()}
              </div>

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

              {/* Metadata / Timestamp */}
              <div className="flex justify-between text-[8px] text-slate-400 mt-6 pt-3 border-t border-slate-100/50 print:mt-10">
                <span>Printed: {new Date().toLocaleString()}</span>
                <span>Staff: {receiptData.generatedBy || 'Front Office'}</span>
              </div>

              {/* Print & Share Buttons */}
              <div className="no-print-action-bar flex gap-2 pt-4 mt-4 border-t border-slate-100 print:hidden justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false);
                    if (isFinalPayment) navigate('/handover');
                  }}
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
                  onClick={() => {
                    setForceReceiptLkr(true);
                    setTimeout(() => {
                      window.print();
                    }, 150);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1 transition text-[11px] cursor-pointer shadow-sm"
                >
                  <Printer size={11} /> Print in LKR
                </button>
                {bCurrRender !== 'LKR' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForceReceiptLkr(false);
                      setTimeout(() => {
                        window.print();
                      }, 150);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1 transition text-[11px] cursor-pointer shadow-sm"
                  >
                    <Printer size={11} /> Print in {bCurrRender}
                  </button>
                )}
                {isFinalPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowReceiptModal(false);
                      navigate('/handover');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer shadow-md"
                  >
                    <ArrowRight size={11} /> Go to Handover
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bank Slip & Passport Modal Image Preview */}
      {selectedSlipPreview && (() => {
        const isPassport = selectedSlipPreview.id === 'passport-nic';
        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 flex flex-col space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="text-emerald-600" size={16} />
                    {isPassport ? 'Passport / NIC Document Preview' : `Bank Payment Slip - ${selectedSlipPreview.paymentType}`}
                  </h3>
                  {!isPassport && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Paid Date: {selectedSlipPreview.paidDate} | {BANK_ACCOUNTS[selectedSlipPreview.bankKey]?.bankName || ''} (Acc: {BANK_ACCOUNTS[selectedSlipPreview.bankKey]?.accountNumber || ''})
                    </p>
                  )}
                  {isPassport && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Uploaded Guest Identity Document / Card
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedSlipPreview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto max-h-[70vh] border border-slate-200 rounded-xl bg-slate-50 p-3 flex justify-center items-center">
                {selectedSlipPreview.slipUrl?.startsWith('data:application/pdf') ? (
                  <iframe src={selectedSlipPreview.slipUrl} className="w-full h-[500px] rounded-lg" title="PDF Slip" />
                ) : (
                  <img src={selectedSlipPreview.slipUrl} alt={isPassport ? "Passport / NIC" : "Bank Slip"} className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm" />
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                <a
                  href={selectedSlipPreview.slipUrl}
                  download={selectedSlipPreview.fileName || (isPassport ? 'passport_document.png' : 'bank_slip.png')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Download size={13} /> {isPassport ? 'Download Document' : 'Download Slip'}
                </a>
                <button
                  onClick={() => setSelectedSlipPreview(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Extra Night Modal */}
      {showExtraNightModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 flex flex-col space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="text-emerald-600" size={16} /> Add Extra Night Booking
              </h3>
              <button onClick={() => setShowExtraNightModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedReg || !associatedBooking) return;
              try {
                const newBNum = `${associatedBooking.bookingNumber}/1N`;
                const payload = {
                  guestRegistrationId: selectedReg.id,
                  bookingNumber: newBNum,
                  roomNumber: extraNightForm.room || associatedBooking.roomNumber,
                  roomType: associatedBooking.roomType,
                  bookingType: 'Direct',
                  boardBasis: associatedBooking.boardBasis || 'Room Only',
                  remarks: extraNightForm.remarks || 'Extra Night addition',
                  amount: parseFloat(extraNightForm.amount || 0),
                  currency: extraNightForm.currencyCode,
                  currencyCode: extraNightForm.currencyCode,
                  checkInDate: associatedBooking?.checkOutDate || selectedReg?.checkOutDate || new Date().toISOString().split('T')[0],
                  checkOutDate: (() => {
                    const baseDate = associatedBooking?.checkOutDate || selectedReg?.checkOutDate;
                    if (!baseDate) return new Date(Date.now() + 86400000).toISOString().split('T')[0];
                    const dateObj = new Date(baseDate);
                    dateObj.setDate(dateObj.getDate() + 1);
                    return dateObj.toISOString().split('T')[0];
                  })(),
                  numberOfNights: 1,
                  status: 'Confirmed'
                };
                
                const response = await fetch(`${API_BASE}/bookings/create-extra`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText || 'Failed to create extra night booking');
                }
                
                alert('Extra Night booking added successfully!');
                setShowExtraNightModal(false);
                setExtraNightForm({ amount: '', currencyCode: 'USD', remarks: '', room: '' });
                fetchRegistrations();
              } catch(err) {
                alert(err.message);
              }
            }} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Room Number(s)</label>
                <select
                  value={extraNightForm.room}
                  onChange={(e) => {
                    const roomNo = e.target.value;
                    setExtraNightForm(prev => ({ ...prev, room: roomNo }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => (
                    <option key={r.roomNumber} value={r.roomNumber}>Room {r.roomNumber}</option>
                  ))}
                </select>
              </div>

              {extraNightForm.room && (() => {
                const matchedRoom = rooms.find(r => String(r.roomNumber) === String(extraNightForm.room));
                const roomTypeStr = matchedRoom ? matchedRoom.roomType : 'Deluxe Room';
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Room Allocations & Prices</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Table Currency:</span>
                        <select
                          value={extraNightForm.currencyCode}
                          onChange={(e) => setExtraNightForm(prev => ({ ...prev, currencyCode: e.target.value }))}
                          className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="USD">USD</option>
                          <option value="LKR">LKR</option>
                          <option value="EUR">EUR</option>
                          <option value="AUD">AUD</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="pb-1.5 font-semibold">Room Name</th>
                            <th className="pb-1.5 font-semibold">Room Number</th>
                            <th className="pb-1.5 font-semibold w-36 text-right">Price ({extraNightForm.currencyCode})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="text-slate-700">
                            <td className="py-2 pr-2 font-medium">{roomTypeStr}</td>
                            <td className="py-2 pr-2 font-mono font-bold text-slate-900">{extraNightForm.room}</td>
                            <td className="py-1 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <span className="text-[10px] text-slate-400 font-bold font-mono">{extraNightForm.currencyCode}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={extraNightForm.amount}
                                  onChange={(e) => setExtraNightForm(prev => ({ ...prev, amount: e.target.value }))}
                                  className="w-24 bg-white border border-slate-200 rounded-md px-2 py-1 text-right text-slate-800 focus:outline-none font-bold font-mono text-xs"
                                  required
                                />
                              </div>
                            </td>
                          </tr>
                          <tr className="border-t-2 border-slate-200 text-slate-900 font-bold bg-slate-100/50">
                            <td className="py-2.5 pl-2 font-bold" colSpan={2}>Total Sum</td>
                            <td className="py-2.5 pr-2 text-right font-mono font-bold text-slate-900">
                              {extraNightForm.currencyCode} {(parseFloat(extraNightForm.amount) || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Extra night at checkout"
                  value={extraNightForm.remarks}
                  onChange={(e) => setExtraNightForm({...extraNightForm, remarks: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowExtraNightModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl transition cursor-pointer shadow-sm">
                  Add Extra Night
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Person Modal */}
      {showExtraPersonModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 flex flex-col space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="text-emerald-600" size={16} /> Add Extra Person Booking
              </h3>
              <button onClick={() => setShowExtraPersonModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedReg || !associatedBooking) return;
              try {
                const newBNum = `${associatedBooking.bookingNumber}/1P`;
                const payload = {
                  guestRegistrationId: selectedReg.id,
                  bookingNumber: newBNum,
                  roomNumber: extraPersonForm.room || associatedBooking.roomNumber,
                  roomType: associatedBooking.roomType,
                  bookingType: 'Direct',
                  boardBasis: associatedBooking.boardBasis || 'Room Only',
                  remarks: extraPersonForm.remarks || 'Extra Person addition',
                  amount: parseFloat(extraPersonForm.amount || 0),
                  currency: extraPersonForm.currencyCode,
                  currencyCode: extraPersonForm.currencyCode,
                  checkInDate: associatedBooking?.checkInDate || selectedReg?.checkInDate || new Date().toISOString().split('T')[0],
                  checkOutDate: associatedBooking?.checkOutDate || selectedReg?.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                  numberOfNights: associatedBooking?.numberOfNights || selectedReg?.numberOfNights || 1,
                  status: 'Confirmed'
                };
                
                const response = await fetch(`${API_BASE}/bookings/create-extra`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText || 'Failed to create extra person booking');
                }
                
                alert('Extra Person booking added successfully!');
                setShowExtraPersonModal(false);
                setExtraPersonForm({ amount: '', currencyCode: 'USD', remarks: '', room: '' });
                fetchRegistrations();
              } catch(err) {
                alert(err.message);
              }
            }} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Room Number(s)</label>
                <select
                  value={extraPersonForm.room}
                  onChange={(e) => {
                    const roomNo = e.target.value;
                    setExtraPersonForm(prev => ({ ...prev, room: roomNo }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => (
                    <option key={r.roomNumber} value={r.roomNumber}>Room {r.roomNumber}</option>
                  ))}
                </select>
              </div>

              {extraPersonForm.room && (() => {
                const matchedRoom = rooms.find(r => String(r.roomNumber) === String(extraPersonForm.room));
                const roomTypeStr = matchedRoom ? matchedRoom.roomType : 'Deluxe Room';
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Room Allocations & Prices</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Table Currency:</span>
                        <select
                          value={extraPersonForm.currencyCode}
                          onChange={(e) => setExtraPersonForm(prev => ({ ...prev, currencyCode: e.target.value }))}
                          className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="USD">USD</option>
                          <option value="LKR">LKR</option>
                          <option value="EUR">EUR</option>
                          <option value="AUD">AUD</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="pb-1.5 font-semibold">Room Name</th>
                            <th className="pb-1.5 font-semibold">Room Number</th>
                            <th className="pb-1.5 font-semibold w-36 text-right">Price ({extraPersonForm.currencyCode})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="text-slate-700">
                            <td className="py-2 pr-2 font-medium">{roomTypeStr}</td>
                            <td className="py-2 pr-2 font-mono font-bold text-slate-900">{extraPersonForm.room}</td>
                            <td className="py-1 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <span className="text-[10px] text-slate-400 font-bold font-mono">{extraPersonForm.currencyCode}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={extraPersonForm.amount}
                                  onChange={(e) => setExtraPersonForm(prev => ({ ...prev, amount: e.target.value }))}
                                  className="w-24 bg-white border border-slate-200 rounded-md px-2 py-1 text-right text-slate-800 focus:outline-none font-bold font-mono text-xs"
                                  required
                                />
                              </div>
                            </td>
                          </tr>
                          <tr className="border-t-2 border-slate-200 text-slate-900 font-bold bg-slate-100/50">
                            <td className="py-2.5 pl-2 font-bold" colSpan={2}>Total Sum</td>
                            <td className="py-2.5 pr-2 text-right font-mono font-bold text-slate-900">
                              {extraPersonForm.currencyCode} {(parseFloat(extraPersonForm.amount) || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Extra person bed charge"
                  value={extraPersonForm.remarks}
                  onChange={(e) => setExtraPersonForm({...extraPersonForm, remarks: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowExtraPersonModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl transition cursor-pointer shadow-sm">
                  Add Extra Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 flex flex-col space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="text-emerald-600" size={16} /> Add Discount to Booking
              </h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedReg || !associatedBooking) return;
              try {
                const discountVal = parseFloat(discountForm.amount || 0);
                if (discountVal <= 0) {
                  alert('Please enter a positive value to deduct.');
                  return;
                }
                const newBNum = `${associatedBooking.bookingNumber}/DISC`;
                const payload = {
                  guestRegistrationId: selectedReg.id,
                  bookingNumber: newBNum,
                  roomNumber: associatedBooking.roomNumber || 'Discount',
                  roomType: associatedBooking.roomType || 'Discount',
                  bookingType: 'Direct',
                  boardBasis: 'Room Only',
                  remarks: discountForm.remarks || 'Discount adjustment',
                  amount: -discountVal, // negative entry for discount deduction
                  currency: discountForm.currencyCode,
                  currencyCode: discountForm.currencyCode,
                  checkInDate: associatedBooking.checkInDate,
                  checkOutDate: associatedBooking.checkOutDate,
                  numberOfNights: 1,
                  status: 'Confirmed'
                };
                
                const response = await fetch(`${API_BASE}/bookings/create-extra`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText || 'Failed to apply discount');
                }
                
                alert('Discount applied successfully!');
                setShowDiscountModal(false);
                setDiscountForm({ amount: '', currencyCode: 'USD', remarks: '' });
                fetchRegistrations();
              } catch(err) {
                alert(err.message);
              }
            }} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Discount Amount</label>
                <div className="flex gap-1">
                  <select
                    value={discountForm.currencyCode}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, currencyCode: e.target.value }))}
                    className="bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="LKR">LKR</option>
                    <option value="EUR">EUR</option>
                    <option value="AUD">AUD</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={discountForm.amount}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. 10% Early Bird Discount"
                  value={discountForm.remarks}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowDiscountModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl transition cursor-pointer shadow-sm">
                  Apply Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print-only layout */}
      <div className="print-only">
        {showReceiptModal && (
          <AdvanceReceiptPrint
            ref={receiptRef}
            receiptData={receiptData}
            selectedPaymentForReceipt={selectedPaymentForReceipt}
            selectedReg={selectedReg}
            associatedBooking={associatedBooking}
            payments={advancePayments}
            forceLkr={forceReceiptLkr}
          />
        )}
      </div>
    </div>
  );
};

export default Registrations;
