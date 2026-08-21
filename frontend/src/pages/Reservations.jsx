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
  X,
  Share2,
  Printer,
  Receipt,
  Image as ImageIcon,
  ArrowRight,
  MessageSquare,
  Trash2,
  PlusCircle,
  CreditCard,
  Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdvanceReceiptPrint from '../components/AdvanceReceiptPrint';
import ReservationConfirmationPrint from '../components/ReservationConfirmationPrint';
import AdvanceRequestPrint from '../components/AdvanceRequestPrint';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;

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

const mapBookingTypeForBackend = (type) => {
  if (!type) return 'Direct';
  const t = type.toLowerCase();
  if (t.includes('booking.com')) return 'Booking.com';
  if (t.includes('airbnb')) return 'Airbnb';
  if (t.includes('web')) return 'Web Booking';
  return 'Direct';
};

const Reservations = () => {
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
  const [isSaving, setIsSaving] = useState(false);
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

  const confirmationPrintRef = React.useRef(null);
  const advancePrintRef = React.useRef(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  // Bank Slip Upload state
  const [bankSlipForm, setBankSlipForm] = useState({
    bankKey: 'USD_PB',
    paidDate: new Date().toISOString().split('T')[0],
    paymentType: 'Advance Payment',
    slipUrl: '',
    fileName: ''
  });

  const [allBankSlips, setAllBankSlips] = useState(() => {
    try {
      const saved = localStorage.getItem('serene_bank_slips');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [selectedSlipPreview, setSelectedSlipPreview] = useState(null);

  const handleSaveBankSlip = (e, bookingId) => {
    e.preventDefault();
    if (!bookingId) {
      alert('Please select a booking to upload slip.');
      return;
    }
    if (!bankSlipForm.slipUrl) {
      alert('Please select a payment slip file to upload.');
      return;
    }

    const currentSlips = allBankSlips[bookingId] || [];
    const newSlip = {
      id: Date.now(),
      bankKey: bankSlipForm.bankKey,
      paidDate: bankSlipForm.paidDate,
      paymentType: bankSlipForm.paymentType,
      slipUrl: bankSlipForm.slipUrl,
      fileName: bankSlipForm.fileName || 'bank_slip.png',
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...allBankSlips,
      [bookingId]: [newSlip, ...currentSlips]
    };

    setAllBankSlips(updated);
    try {
      localStorage.setItem('serene_bank_slips', JSON.stringify(updated));
    } catch (err) {
      console.error('LocalStorage save error', err);
    }

    setBankSlipForm({
      bankKey: 'USD_PB',
      paidDate: new Date().toISOString().split('T')[0],
      paymentType: 'Advance Payment',
      slipUrl: '',
      fileName: ''
    });
    alert('Bank Payment Slip uploaded and saved successfully!');
  };

  const handleDeleteBankSlip = (bookingId, slipId) => {
    if (!window.confirm('Are you sure you want to remove this bank slip?')) return;
    const currentSlips = allBankSlips[bookingId] || [];
    const updatedSlips = currentSlips.filter(s => s.id !== slipId);
    const updated = {
      ...allBankSlips,
      [bookingId]: updatedSlips
    };
    setAllBankSlips(updated);
    try {
      localStorage.setItem('serene_bank_slips', JSON.stringify(updated));
    } catch (e) {}
  };

  const [advanceFormData, setAdvanceFormData] = useState({
    guestName: '',
    nights: 1,
    checkIn: '',
    checkOut: '',
    remarks: '',
    totalAmount: 0,
    advanceAmount: 0,
    currency: 'USD'
  });
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDirectDownloadContainer, setShowDirectDownloadContainer] = useState(false);
  const [isCreatingNewReservation, setIsCreatingNewReservation] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    address: '',
    email: '',
    vatNo: '',
    whatsappNumber: '',
    nationality: '',
    reservationDate: new Date().toISOString().split('T')[0],
    roomReference: '',
    unitPrice: '',
    totalPrice: '',
    currency: 'USD',
    tableCurrency: 'USD',
    exchangeRate: '1.00',
    allocatedRooms: [],
    confirmedBy: localStorage.getItem('pms_confirmed_by') || 'Muthuni Weerasingha',
    reservationStatus: 'Confirm Booking',
    senderName: localStorage.getItem('pms_sender_name') || 'Muthuni Weerasingha',
    badgeText: 'Hold'
  });

  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms`);
        if (res.ok) {
          const data = await res.json();
          // Filter out demo/empty rooms if any
          const filtered = data.filter(r => r.id !== 101 || r.roomType !== 'Deluxe Room');
          
          // Map images
          const mapped = filtered.map(r => {
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
        console.error('Error fetching rooms from server:', err);
      }
    };
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
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [isModalRoomDropdownOpen, setIsModalRoomDropdownOpen] = useState(false);
  const [isModalRoomNameDropdownOpen, setIsModalRoomNameDropdownOpen] = useState(false);
  const [showDraftPreviewModal, setShowDraftPreviewModal] = useState(false);
  const [forceLkr, setForceLkr] = useState(false);
  const [forceReceiptLkr, setForceReceiptLkr] = useState(false);

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
    cardFee: '',
    paymentDate: new Date().toISOString().split('T')[0],
    slipPath: ''
  });
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);

  const pageSize = 8;

  // Auto-print ref — set to true to trigger print when receipt modal opens
  const autoPrintRef = React.useRef(false);

  // Print only the receipt content.
  const openCreateAdvanceModal = () => {
    if (!selectedReg) return;
    const associatedB = getBookingForReg(selectedReg.id);
    const baseCurr = (associatedB?.currency || confirmationData?.currency || 'USD').toUpperCase();
    const exRate = parseFloat(associatedB?.exchangeRate || confirmationData?.exchangeRate) || 335;
    const baseTotal = parseFloat(associatedB?.totalAmount || confirmationData?.totalPrice || 0);
    const baseAdvance = Math.round(baseTotal * 0.5 * 100) / 100;

    let initialBankKey = 'USD_PB';
    if (baseCurr === 'LKR') initialBankKey = 'LKR_PB_COMPANY';
    else if (baseCurr === 'EUR') initialBankKey = 'EUR_SB';
    else if (baseCurr === 'AUD') initialBankKey = 'AUD_SB';

    const selectedBank = BANK_ACCOUNTS[initialBankKey];

    setAdvanceFormData({
      guestName: selectedReg.guestName || confirmationData?.guestName || '',
      nights: selectedReg.numberOfNights || selectedReg.nights || associatedB?.nights || 1,
      checkIn: selectedReg.checkInDate || associatedB?.checkInDate || '',
      checkOut: selectedReg.checkOutDate || associatedB?.checkOutDate || '',
      remarks: associatedB?.remarks || selectedReg?.remarks || confirmationData?.remarks || '',
      baseTotalAmount: baseTotal,
      baseAdvanceAmount: baseAdvance,
      exchangeRate: exRate,
      baseCurrency: baseCurr,
      bankKey: initialBankKey,
      currency: selectedBank.currency,
      totalAmount: selectedBank.currency === 'LKR' ? baseTotal * exRate : baseTotal,
      advanceAmount: selectedBank.currency === 'LKR' ? Math.round(baseAdvance * exRate * 100) / 100 : baseAdvance,
      bankDetails: selectedBank
    });
    setShowAdvanceModal(true);
  };

  const handleAdvanceBankOptionChange = (newBankKey) => {
    const selectedBank = BANK_ACCOUNTS[newBankKey];
    if (!selectedBank) return;

    const newCurrency = selectedBank.currency;
    const exRate = parseFloat(advanceFormData.exchangeRate) || 335;
    const baseTotal = parseFloat(advanceFormData.baseTotalAmount || 0);
    const baseAdvance = parseFloat(advanceFormData.baseAdvanceAmount || 0);

    let newTotal = baseTotal;
    let newAdvance = baseAdvance;

    if (newCurrency === 'LKR') {
      newTotal = baseTotal * exRate;
      newAdvance = baseAdvance * exRate;
    } else if (newCurrency === 'USD' || newCurrency === 'EUR' || newCurrency === 'AUD') {
      newTotal = baseTotal;
      newAdvance = baseAdvance;
    }

    setAdvanceFormData({
      ...advanceFormData,
      bankKey: newBankKey,
      currency: newCurrency,
      totalAmount: Math.round(newTotal * 100) / 100,
      advanceAmount: Math.round(newAdvance * 100) / 100,
      bankDetails: selectedBank
    });
  };

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
    try {
      // Fetch registrations
      const regRes = await fetch(
        `${API_BASE}/guest-registrations?search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&role=${user.role}&source=Staff&page=${page}&size=${pageSize}`
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
    setIsEditingBooking(false);
    let associatedBooking = bookings.find(b => b.guestRegistrationId === reg.id);
    
    if (associatedBooking) {
      setBookingForm({
        roomType: associatedBooking.roomType || defaultRoomType,
        room: associatedBooking.roomNumber || '',
        bookingType: associatedBooking.bookingType || 'Direct Booking',
        bookingNumber: associatedBooking.bookingNumber || '',
        boardBasis: associatedBooking.boardBasis || 'Room Only',
        remarks: associatedBooking.remarks || '',
        amount: associatedBooking.totalAmount || '',
        paymentStatus: reg.paymentStatus || 'Pending',
        registrationStatus: reg.registrationStatus || 'Pending',
        checkInDate: reg.checkInDate || '',
        checkOutDate: reg.checkOutDate || '',
        whatsappNumber: reg.whatsappNumber || reg.whatsAppNumber || '',
        adults: reg.adults || 1,
        children: reg.children || 0
      });
      fetchAdvancePayments(associatedBooking.id);
    } else {
      // Default blank/pre-filled values fallback
      setBookingForm({
        roomType: defaultRoomType,
        room: '',
        bookingType: 'Direct Booking',
        bookingNumber: `D-${1000 + reg.id}`,
        boardBasis: 'Room Only',
        remarks: '',
        amount: '',
        paymentStatus: reg.paymentStatus || 'Pending',
        registrationStatus: reg.registrationStatus || 'Pending',
        checkInDate: reg.checkInDate || '',
        checkOutDate: reg.checkOutDate || '',
        whatsappNumber: reg.whatsappNumber || reg.whatsAppNumber || '',
        adults: reg.adults || 1,
        children: reg.children || 0
      });
      setAdvancePayments([]);
    }
    setBookingSuccess(false);
  };

  const getBookingCurrency = (booking) => {
    if (!booking) return 'USD';
    if (booking.currency && booking.currency !== 'LKR') return booking.currency;
    // For all channels (Airbnb, Booking.com, Web, Direct), default past invoices to USD
    return 'USD';
  };

  const getRoomsForBooking = (booking) => {
    if (!booking) return [];
    if (booking.roomPrices) {
      try {
        const parsed = JSON.parse(booking.roomPrices);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (booking.roomNumber) {
      const roomNums = booking.roomNumber.split(',').map(r => r.trim());
      const numRooms = roomNums.length;
      const curr = getBookingCurrency(booking);
      const exRate = parseFloat(booking.exchangeRate || 335) || 335;
      
      let total = booking.totalAmount || 0;
      if (curr === 'USD' && total > 20000 && exRate > 1) {
        total = total / exRate;
      }

      return roomNums.map(cleanNum => {
        const matchedRoom = rooms.find(room => room.roomNumber === cleanNum);
        return {
          roomType: matchedRoom ? matchedRoom.roomType : (booking.roomType || 'Room'),
          roomNumber: cleanNum,
          price: (total / numRooms).toFixed(2)
        };
      });
    }
    return [];
  };

  const handlePrintPDFClick = () => {
    if (!selectedReg) return;
    let booking = getBookingForReg(selectedReg.id);
    if (!booking) {
      booking = {
        bookingNumber: 'SV-' + (1000 + selectedReg.id),
        roomNumber: 'Unallocated',
        roomType: 'Deluxe Room',
        totalAmount: 100.00,
        boardBasis: 'Bed & Breakfast',
        remarks: '',
        bookingType: 'Direct Booking'
      };
    }

    const nightsVal = selectedReg.numberOfNights || selectedReg.nights || 1;
    const defaultUnitPrice = (booking.totalAmount / nightsVal).toFixed(2);

    setConfirmationData({
      guestName: selectedReg.guestName || '',
      bookingNumber: booking.bookingNumber || '',
      checkInDate: selectedReg.checkInDate || '',
      checkOutDate: selectedReg.checkOutDate || '',
      nights: nightsVal,
      adults: selectedReg.adults || 1,
      children: selectedReg.children || 0,
      boardBasis: booking.boardBasis || 'Room Only',
      email: selectedReg.email || 'N/A',
      whatsappNumber: selectedReg.whatsappNumber || 'N/A',
      nationality: selectedReg.nationality || 'N/A',
      reservationDate: new Date().toISOString().split('T')[0],
      roomType: booking.roomType || '',
      unitPrice: booking.unitPrice || defaultUnitPrice,
      totalPrice: (booking.totalAmount || 0).toFixed(2),
      currency: booking.currency || 'LKR',
      exchangeRate: booking.exchangeRate || '1.00',
      allocatedRooms: getRoomsForBooking(booking),
      confirmedBy: booking.confirmedBy || localStorage.getItem('pms_confirmed_by') || 'Muthuni Weerasingha',
      reservationStatus: 'Confirm Booking',
      senderName: booking.senderName || localStorage.getItem('pms_sender_name') || 'Muthuni Weerasingha',
      badgeText: 'Hold',
      remarks: booking.remarks || '',
      bookingType: booking.bookingType || 'Direct Booking'
    });
    setShowDraftPreviewModal(true);
  };

  const handleOpenConfirmationModal = (regToUse) => {
    const reg = regToUse || selectedReg;
    if (!reg) return;

    let booking = getBookingForReg(reg.id);
    if (!booking) {
      booking = {
        bookingNumber: 'SV-' + (1000 + reg.id),
        roomNumber: 'Unallocated',
        roomType: 'Deluxe Room',
        totalAmount: 100.00,
        boardBasis: 'Bed & Breakfast',
        remarks: '',
        bookingType: 'Direct Booking'
      };
    }

    const nightsCount = reg.numberOfNights || reg.nights || 1;
    const defaultUnitPrice = (booking.totalAmount / nightsCount).toFixed(2);
    setConfirmationData({
      address: '',
      email: reg.email || 'N/A',
      vatNo: '',
      whatsappNumber: reg?.whatsappNumber || reg?.whatsAppNumber || 'N/A',
      nationality: reg?.nationality || 'N/A',
      roomType: booking.roomType || 'Deluxe Room',
      nights: nightsCount,
      reservationDate: new Date().toISOString().split('T')[0],
      roomReference: `Room ${booking.roomNumber || ''} (${booking.roomType || ''})`,
      unitPrice: booking.unitPrice || defaultUnitPrice,
      totalPrice: (booking.totalAmount || 0).toFixed(2),
      currency: booking.currency || 'LKR',
      exchangeRate: booking.exchangeRate || '1.00',
      allocatedRooms: getRoomsForBooking(booking),
      confirmedBy: booking.confirmedBy || localStorage.getItem('pms_confirmed_by') || 'Muthuni Weerasingha',
      reservationStatus: 'Confirm Booking',
      senderName: booking.senderName || localStorage.getItem('pms_sender_name') || 'Muthuni Weerasingha',
      badgeText: 'Hold',
      remarks: booking.remarks || '',
      bookingType: booking.bookingType || 'Direct Booking'
    });
    setIsCreatingNewReservation(false);
    setShowConfirmationModal(true);
  };

  const handleInstantDownloadPDF = (reg) => {
    setSelectedReg(reg);
    let booking = getBookingForReg(reg.id);
    if (!booking) {
      booking = {
        bookingNumber: 'SV-' + (1000 + reg.id),
        roomNumber: 'Unallocated',
        roomType: 'Deluxe Room',
        totalAmount: 100.00,
        boardBasis: 'Bed & Breakfast',
        remarks: '',
        bookingType: 'Direct Booking'
      };
    }

    const nightsCount = reg.numberOfNights || reg.nights || 1;
    const defaultUnitPrice = (booking.totalAmount / nightsCount).toFixed(2);
    setConfirmationData({
      address: '',
      email: reg.email || 'N/A',
      vatNo: '',
      whatsappNumber: reg?.whatsappNumber || reg?.whatsAppNumber || 'N/A',
      nationality: reg?.nationality || 'N/A',
      roomType: booking.roomType || 'Deluxe Room',
      nights: nightsCount,
      reservationDate: new Date().toISOString().split('T')[0],
      roomReference: `Room ${booking.roomNumber || ''} (${booking.roomType || ''})`,
      unitPrice: booking.unitPrice || defaultUnitPrice,
      totalPrice: (booking.totalAmount || 0).toFixed(2),
      currency: booking.currency || 'LKR',
      exchangeRate: booking.exchangeRate || '1.00',
      allocatedRooms: getRoomsForBooking(booking),
      confirmedBy: booking.confirmedBy || localStorage.getItem('pms_confirmed_by') || 'Muthuni Weerasingha',
      reservationStatus: 'Confirm Booking',
      senderName: booking.senderName || localStorage.getItem('pms_sender_name') || 'Muthuni Weerasingha',
      badgeText: 'Hold',
      remarks: booking.remarks || '',
      bookingType: booking.bookingType || 'Direct Booking'
    });
    setIsCreatingNewReservation(false);
    setShowDirectDownloadContainer(true);

    setTimeout(() => {
      const element = document.getElementById('direct-pdf-download-container');
      if (element) {
        // Temporarily shadow document.styleSheets to return [] to prevent html2canvas from reading and crashing on Tailwind v4's oklab/oklch rules
        Object.defineProperty(document, 'styleSheets', {
          value: [],
          configurable: true
        });

        const opt = {
          margin:       0.3,
          filename:     `Confirmation_Slip_${booking.bookingNumber || reg.id}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            onclone: (clonedDoc) => {
              // Remove any left-over stylesheets in the cloned document
              clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
            }
          },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        window.html2pdf().set(opt).from(element).save().then(() => {
          // Restore original document.styleSheets descriptor
          delete document.styleSheets;
          setShowDirectDownloadContainer(false);
        }).catch(err => {
          console.error(err);
          // Restore original document.styleSheets descriptor on error
          delete document.styleSheets;
          setShowDirectDownloadContainer(false);
        });
      } else {
        setShowDirectDownloadContainer(false);
      }
    }, 400);
  };

  const handleCreateNewReservation = () => {
    setShowTypeSelector(true);
  };

  const handleSelectReservationType = (type) => {
    let prefix = 'D-';
    if (type === 'Booking.com Booking') prefix = 'B-';
    else if (type === 'Airbnb Booking') prefix = 'A-';
    else if (type === 'Web Booking') prefix = 'W-';

    const defaultBookingNum = prefix;

    setConfirmationData({
      guestName: '',
      bookingNumber: defaultBookingNum,
      checkInDate: '',
      checkOutDate: '',
      nights: '',
      adults: '',
      children: '',
      boardBasis: 'Room Only',
      address: '',
      email: '',
      vatNo: '',
      whatsappNumber: '',
      nationality: '',
      reservationDate: new Date().toISOString().split('T')[0],
      roomReference: '',
      roomType: '',
      unitPrice: '',
      totalPrice: '',
      currency: 'USD',
    tableCurrency: 'USD',
      tableCurrency: 'LKR',
      exchangeRate: '1.00',
    allocatedRooms: [],
    exchangeRate: '1.00',
    allocatedRooms: [],
      confirmedBy: localStorage.getItem('pms_confirmed_by') || 'Muthuni Weerasingha',
      reservationStatus: 'Confirm Booking',
      senderName: localStorage.getItem('pms_sender_name') || 'Muthuni Weerasingha',
      badgeText: 'Hold',
      remarks: '',
      room: '',
      bookingType: type
    });
    setIsCreatingNewReservation(true);
    setShowTypeSelector(false);
    setShowConfirmationModal(true);
  };

  const handleBookingNumberChange = (val, bookingType) => {
    const bt = bookingType?.toLowerCase() || '';
    let prefix = 'D-';
    if (bt.includes('airbnb')) prefix = 'A-';
    else if (bt.includes('web')) prefix = 'W-';
    else if (bt.includes('booking.com')) prefix = 'B-';

    if (!val.startsWith(prefix)) {
      val = prefix + val.replace(/^[AWBD]-?/g, '');
    }
    setConfirmationData(prev => ({ ...prev, bookingNumber: val }));
  };

  const handlePrintConfirmation = async () => {
    if (isSaving) return;
    setIsSaving(true);
    if (isCreatingNewReservation) {
      try {
        const newGuest = {
          guestName: confirmationData.guestName,
          checkInDate: confirmationData.checkInDate,
          checkOutDate: confirmationData.checkOutDate,
          numberOfNights: parseInt(confirmationData.nights) || 1,
          adults: parseInt(confirmationData.adults) || 1,
          children: parseInt(confirmationData.children) || 0,
          whatsappNumber: confirmationData.whatsappNumber,
          nationality: confirmationData.nationality,
          country: confirmationData.nationality || confirmationData.country,
          email: confirmationData.email,
          passportNumber: `SV-${confirmationData.bookingNumber}`,
          paymentStatus: 'Pending',
          registrationStatus: 'Pending',
          isHiddenFromFrontOffice: false,
          createdBy: 'Staff'
        };

        const guestRes = await fetch(`${API_BASE}/public/guest-registrations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGuest)
        });

        if (!guestRes.ok) {
          throw new Error('Failed to create guest registration.');
        }

        const savedGuest = await guestRes.json();
        
        const roomSum = confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0
          ? confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
          : (parseFloat(confirmationData.totalPrice) || 0);

        const selCurr = confirmationData.tableCurrency || confirmationData.currency || 'USD';

        const newBooking = {
          guestRegistrationId: savedGuest.id,
          bookingNumber: confirmationData.bookingNumber,
          roomNumber: confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0
            ? confirmationData.allocatedRooms.map(r => r.roomNumber).join(', ')
            : (confirmationData.room || 'Unallocated'),
          roomType: confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0
            ? confirmationData.allocatedRooms.map(r => r.roomType).join(', ')
            : (confirmationData.roomType || 'Deluxe Room'),
          boardBasis: confirmationData.boardBasis || 'Bed & Breakfast',
          bookingType: mapBookingTypeForBackend(confirmationData.bookingType),
          totalAmount: roomSum,
          currency: selCurr,
          exchangeRate: confirmationData.exchangeRate || '1.00',
          roomPrices: confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0 
            ? JSON.stringify(confirmationData.allocatedRooms) 
            : '',
          guestName: confirmationData.guestName || '',
          email: confirmationData.email || '',
          senderName: confirmationData.senderName || localStorage.getItem('pms_sender_name') || 'Muthuni Weerasingha',
          confirmedBy: confirmationData.confirmedBy || localStorage.getItem('pms_confirmed_by') || 'Muthuni Weerasingha',
          remarks: confirmationData.remarks || '',
          status: 'Confirmed',
          propertyId: 1
        };

        const bookingRes = await fetch(`${API_BASE}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBooking)
        });

        if (!bookingRes.ok) {
          const errData = await bookingRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to save booking details. Make sure the booking number is unique!');
        }

        await fetchRegistrations();
      } catch (err) {
        alert('Error saving reservation: ' + err.message);
        console.error('Error saving standalone reservation:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSaving(false);
    }
    
    // Save values to localStorage so they are remembered next time
    localStorage.setItem('pms_confirmed_by', confirmationData.confirmedBy || '');
    localStorage.setItem('pms_sender_name', confirmationData.senderName || '');
    
    if (confirmationData.bookingType?.toLowerCase().includes('direct')) {
      setTimeout(() => {
        window.print();
        setShowConfirmationModal(false);
      }, 300);
    } else {
      setShowConfirmationModal(false);
    }
  };

  const handleDownloadDraftBill = () => {
    setForceLkr(false);
    setShowDraftPreviewModal(true);
  };

  // Switch Booking Number Prefix Dynamically
  const handleBookingChannelChange = (channel) => {
    let newBookingNumber = bookingForm.bookingNumber;
    let numericPart = '';
    if (newBookingNumber.startsWith('D-') || newBookingNumber.startsWith('B-') || newBookingNumber.startsWith('A-') || newBookingNumber.startsWith('W-')) {
      numericPart = newBookingNumber.substring(2);
    } else {
      numericPart = newBookingNumber || (1000 + (selectedReg?.id || 0)).toString();
    }

    let prefix = 'D-';
    if (channel === 'Booking.com Booking') prefix = 'B-';
    else if (channel === 'Airbnb Booking') prefix = 'A-';
    else if (channel === 'Web Booking') prefix = 'W-';

    newBookingNumber = prefix + numericPart;

    setBookingForm({
      ...bookingForm,
      bookingType: channel,
      bookingNumber: newBookingNumber
    });
  };

  // Submit Booking Form
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setUpdatingBooking(true);
    setBookingSuccess(false);

    try {
      const tableSum = confirmationData.allocatedRooms 
        ? confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
        : (parseFloat(confirmationData.totalPrice) || 0);

      const selCurr = confirmationData.tableCurrency || confirmationData.currency || 'USD';

      const payload = {
        ...bookingForm,
        amount: tableSum,
        currency: selCurr,
        tableCurrency: selCurr,
        exchangeRate: confirmationData.exchangeRate || '1.00',
        unitPrice: '0.00',
        roomPrices: confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0 
          ? JSON.stringify(confirmationData.allocatedRooms) 
          : '',
        guestName: selectedReg ? selectedReg.guestName : ''
      };

      const response = await fetch(`${API_BASE}/guest-registrations/${selectedReg.id}/booking-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to update booking details');
      
      const updatedReg = await response.json();
      setSelectedReg(updatedReg);
      setBookingSuccess(true);
      setIsEditingBooking(false);
      
      // Refresh list to update status badges
      await fetchRegistrations();
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

  const handleSavePayment = async (e, tab, remainingBalance) => {
    e.preventDefault();
    if (!selectedReg) return;
    const booking = getBookingForReg(selectedReg.id);
    if (!booking) { alert('Please save the booking details first.'); return; }
    
    const actualAmount = parseFloat(paymentForm.amount) || remainingBalance;
    const actualExchangeRate = parseFloat(paymentForm.exchangeRate) || 1.00;
    const actualCurrency = paymentForm.currencyCode || 'LKR';

    if (!actualAmount || actualAmount <= 0) {
      alert('Please enter a valid amount.'); return;
    }
    if (!actualExchangeRate || actualExchangeRate <= 0) {
      alert('Please enter a valid exchange rate.'); return;
    }

    const otherCharges = parseFloat(paymentForm.otherCharges) || 0;
    const netAmount = Math.max(0, actualAmount - otherCharges);
    const convertedLkr = netAmount * actualExchangeRate;
    const totalBookingAmount = booking.totalAmount || 0;
    const bookingExRate = parseFloat(booking.exchangeRate) || (actualCurrency === 'LKR' ? 1 : actualExchangeRate);
    const bookingCurrency = (booking.currency || 'USD').toUpperCase();
    const totalBookingAmountLkr = bookingCurrency === 'LKR' 
      ? totalBookingAmount 
      : (totalBookingAmount * bookingExRate);

    const totalPaidSoFar = getVisiblePayments(advancePayments).reduce((sum, p) => sum + (p.convertedAmountLkr || p.amountLkr || 0), 0);
    const newTotal = totalPaidSoFar + convertedLkr;
    
    // isFull is true ONLY IF explicitly submitted as FULL OR total paid in LKR meets/exceeds total booking amount in LKR
    const isFull = tab === 'FULL' || (totalBookingAmountLkr > 0 && newTotal >= (totalBookingAmountLkr - 10));

    const payload = {
      bookingId: booking.id,
      guestRegistrationId: selectedReg.id,
      paymentType: isFull ? 'FINAL' : 'ADVANCE',
      amount: actualAmount,
      currencyCode: actualCurrency,
      currency: actualCurrency,
      exchangeRate: actualExchangeRate,
      convertedAmountLkr: convertedLkr,
      amountLkr: convertedLkr,
      amountInCurrency: actualAmount,
      paymentMethod: paymentForm.paymentMethod,
      referenceNumber: paymentForm.referenceNumber,
      receiptNumber: paymentForm.referenceNumber,
      remarks: (() => {
        let r = paymentForm.remarks || '';
        if (paymentForm.paymentMethod === 'Card' && parseFloat(paymentForm.cardFee) > 0) {
          r += ` [Charges: ${parseFloat(paymentForm.cardFee)}]`;
        }
        if (parseFloat(paymentForm.otherCharges) > 0) {
          r += ` [Other Charges: ${parseFloat(paymentForm.otherCharges)}]`;
        }
        return r.trim();
      })(),
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
      if (isFull) newPaymentStatus = 'Paid';
      else if (newTotal > 0) newPaymentStatus = 'Paid Advance';

      await fetch(`${API_BASE}/bookings/${booking.id}/payment-status?paymentStatus=${newPaymentStatus}`, {
        method: 'PUT'
      });

      await fetchRegistrations();
      await fetchAdvancePayments(booking.id);

      // Reset form
      setPaymentForm({
        amount: '',
        currencyCode: 'LKR',
        exchangeRate: 1,
        paymentMethod: 'Cash',
        referenceNumber: '',
        remarks: '',
        paymentDate: new Date().toISOString().split('T')[0],
        slipPath: ''
      });

      // Auto-open receipt and print
      if (savedPayment && savedPayment.id) {
        // Refresh advancePayments list first so receipt lookup works
        const refreshRes = await fetch(`${API_BASE}/payments/booking/${booking.id}`);
        if (refreshRes.ok) {
          const freshPayments = await refreshRes.json();
          setAdvancePayments(freshPayments);
          autoPrintRef.current = true;
          await handleGenerateReceipt(savedPayment.id, freshPayments);
        }
      }
    } catch (err) {
      alert(err.message || 'Error saving payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleGenerateReceipt = async (paymentId, fallbackPaymentList = null) => {
    try {
      const res = await fetch(`${API_BASE}/receipts/advance/${paymentId}`);
      if (res.ok) {
        const data = await res.json();
        setReceiptData(data);
        const list = fallbackPaymentList || advancePayments;
        const p = list.find(pay => pay.id === paymentId);
        setSelectedPaymentForReceipt(p);
        setShowReceiptModal(true);
      } else {
        alert('Failed to generate receipt');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Cross-reference booking for row display
  const getBookingForReg = (regId) => {
    return bookings.find(b => b.guestRegistrationId === regId);
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

  // Auto-populate remaining balance into paymentForm when associatedBooking or payments change
  useEffect(() => {
    if (associatedBooking) {
      const bCurr = getBookingCurrency(associatedBooking);
      const totalAmt = parseFloat(associatedBooking.totalAmount || 0);
      const totalPaidInBCurr = getVisiblePayments(advancePayments).reduce((sum, p) => {
        const pCurr = (p.currencyCode || p.currency || 'LKR').toUpperCase();
        const pAmt = parseFloat(p.amount || p.amountInCurrency || 0);
        if (pCurr === bCurr) return sum + pAmt;
        const pLkr = parseFloat(p.convertedAmountLkr || p.amountLkr || 0);
        const pExRate = parseFloat(p.exchangeRate) || 1;
        return sum + (pExRate > 0 ? (pLkr / pExRate) : pAmt);
      }, 0);
      const remainingBal = Math.max(0, totalAmt - totalPaidInBCurr);
      const savedRate = parseFloat(associatedBooking.exchangeRate) || (bCurr === 'USD' ? 335 : bCurr === 'EUR' ? 360 : bCurr === 'AUD' ? 220 : 1);
      setPaymentForm(prev => ({
        ...prev,
        amount: remainingBal > 0 ? remainingBal.toFixed(2) : '',
        currencyCode: bCurr,
        exchangeRate: savedRate,
        paymentMethod: 'Cash',
        cardFee: ''
      }));
    }
  }, [associatedBooking, advancePayments]);

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
      {/* Header Area */}
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reservations</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Manage manually created hotel reservations, slips, and payments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleCreateNewReservation} 
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create New Reservation
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
            <option value="Confirm">Confirm</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid Advance">Paid Advance</option>
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
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="p-4">Guest Name & Photo</th>
                      <th className="p-4">Reservation ID</th>
                      <th className="p-4">WhatsApp No</th>
                      <th className="p-4">Check-in / Out</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Manage</th>
                      <th className="p-4 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                    {registrations.map((reg) => {
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
                              {reg.guestPhotoPath ? (
                                <img 
                                  src={reg.guestPhotoPath} 
                                  alt={reg.guestName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                reg.guestName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">{reg.guestName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{reg.nationality}</p>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-800 font-bold">
                            {(reg.passportNumber || '').replace(/^SV-?/i, '')}
                          </td>
                          <td className="p-4 text-slate-700">
                            {reg.whatsappNumber || reg.whatsAppNumber}
                          </td>
                          <td className="p-4">
                            <div className="text-slate-850"><span className="font-extrabold text-slate-400 text-[10px] mr-1">IN:</span> {reg.checkInDate}</div>
                            <div className="text-slate-850 mt-0.5"><span className="font-extrabold text-slate-400 text-[10px] mr-1">OUT:</span> {reg.checkOutDate}</div>
                            <p className="text-slate-500 font-bold text-[11px] mt-1">
                              {booking ? (booking.roomNumber ? `Room ${booking.roomNumber}` : 'Unallocated') : 'Unallocated'}
                            </p>
                          </td>
                          <td className="p-4 space-y-1">
                            {/* Booking Type Badge */}
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-slate-50 rounded text-[9px] text-slate-500 font-bold border border-slate-100/50">
                                {booking && booking.bookingType 
                                  ? booking.bookingType 
                                  : (reg.createdBy === 'Public QR Code' || !reg.createdBy ? 'Web / QR Booking' : 'Direct Booking')}
                              </span>
                            </div>
                            {/* Payment Status Badge */}
                            <div>
                              {(() => {
                                const status = reg.paymentStatus ? reg.paymentStatus.toLowerCase() : 'pending';
                                let displayStatus = 'Pending';
                                let colorClass = 'bg-blue-100 text-blue-700';

                                if (status.includes('paid advance') || status.includes('partially') || status === 'advance') {
                                  displayStatus = 'Advance';
                                  colorClass = 'bg-amber-100 text-amber-700';
                                } else if (status === 'paid') {
                                  displayStatus = 'Paid';
                                  colorClass = 'bg-green-100 text-green-700';
                                } else if (status === 'unpaid' || status === 'non paid' || status === 'nonpaid') {
                                  displayStatus = 'Non Paid';
                                  colorClass = 'bg-rose-100 text-rose-700';
                                }

                                return (
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${colorClass}`}>
                                    {displayStatus}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {isAdmin && (
                                <button
                                  onClick={(e) => handleToggleVisibility(reg, e)}
                                  title={reg.isHiddenFromFrontOffice ? "Show to Front Office" : "Hide from Front Office"}
                                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm cursor-pointer"
                                >
                                  {reg.isHiddenFromFrontOffice ? (
                                    <Eye className="h-3.5 w-3.5 text-rose-600" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInstantDownloadPDF(reg);
                                }}
                                title="Download Confirmation Slip"
                                className="inline-flex items-center p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-850 transition shadow-sm cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5 text-amber-700" />
                              </button>
                              <button
                                onClick={() => handleSelectGuest(reg)}
                                className="inline-flex items-center py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-sm cursor-pointer"
                              >
                                Manage
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteRegistration(reg.id)}
                              title="Delete Registration"
                              className="p-2 rounded-xl border border-rose-200 bg-rose-55 hover:bg-rose-100 text-rose-600 transition shadow-sm cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
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
                            {/* Header Info */}
              <div className="relative flex flex-col items-center text-center border-b border-slate-100 pb-5">
                <button 
                  onClick={() => setSelectedReg(null)}
                  className="absolute top-0 right-0 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-855 text-3xl font-extrabold uppercase shadow-sm border-2 border-white ring-4 ring-emerald-50">
                    {selectedReg.guestPhotoPath ? (
                      <img 
                        src={selectedReg.guestPhotoPath} 
                        alt={selectedReg.guestName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      selectedReg.guestName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg mt-3 leading-tight">{selectedReg.guestName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5 font-bold uppercase tracking-wide">
                  <Globe className="h-3 w-3 text-emerald-600" /> {selectedReg.nationality}
                </p>
              </div>

              {/* Guest Core Details */}
              <div className="space-y-4 text-xs bg-slate-50/50 border border-slate-100/50 p-5 rounded-2xl shadow-xs">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Guest Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Reservation ID */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Reservation ID</p>
                    <p className="font-mono font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                      <FileText className="h-3.5 w-3.5 text-slate-400" /> {(selectedReg.passportNumber || '').replace(/^SV-?/i, '')}
                    </p>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">WhatsApp Number</p>
                    {isEditingBooking ? (
                      <input 
                        type="text"
                        value={bookingForm.whatsappNumber}
                        onChange={(e) => setBookingForm({...bookingForm, whatsappNumber: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedReg.whatsappNumber || selectedReg.whatsAppNumber}
                      </p>
                    )}
                  </div>

                  {/* Check-In */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Check-In</p>
                    {isEditingBooking ? (
                      <input 
                        type="date"
                        value={bookingForm.checkInDate}
                        onChange={(e) => setBookingForm({...bookingForm, checkInDate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> {selectedReg.checkInDate}
                      </p>
                    )}
                  </div>

                  {/* Check-Out */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Check-Out</p>
                    {isEditingBooking ? (
                      <input 
                        type="date"
                        value={bookingForm.checkOutDate}
                        onChange={(e) => setBookingForm({...bookingForm, checkOutDate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> {selectedReg.checkOutDate}
                      </p>
                    )}
                  </div>

                  {/* Total Nights */}
                  <div className="space-y-1 border-t border-slate-100/80 pt-2.5 mt-1 col-span-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Nights:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {(() => {
                        if (bookingForm.checkInDate && bookingForm.checkOutDate) {
                          const diff = new Date(bookingForm.checkOutDate) - new Date(bookingForm.checkInDate);
                          return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                        }
                        return selectedReg.numberOfNights || selectedReg.nights || 1;
                      })()} Nights
                    </span>
                  </div>

                  {/* Pax */}
                  <div className="space-y-1 col-span-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pax:</span>
                    {isEditingBooking ? (
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            min="1"
                            value={bookingForm.adults}
                            onChange={(e) => setBookingForm({...bookingForm, adults: parseInt(e.target.value) || 1})}
                            className="w-12 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 font-bold text-slate-800 text-xs text-center focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold">Ad</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            min="0"
                            value={bookingForm.children}
                            onChange={(e) => setBookingForm({...bookingForm, children: parseInt(e.target.value) || 0})}
                            className="w-12 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 font-bold text-slate-800 text-xs text-center focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold">Ch</span>
                        </div>
                      </div>
                    ) : (
                      <span className="font-extrabold text-slate-800">{selectedReg.adults} Adults / {selectedReg.children} Children</span>
                    )}
                  </div>

                  {/* Booking Channel */}
                  <div className="space-y-1 col-span-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Booking Channel:</span>
                    <span className="font-extrabold text-slate-800">
                      {associatedBooking?.bookingType || 'Direct Booking'}
                    </span>
                  </div>
                  {/* Room Type */}
                  <div className="col-span-2 flex justify-between items-start py-2 border-b border-slate-100/40">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide pt-0.5">Room Type:</span>
                    {isEditingBooking ? (
                      <select 
                        value={bookingForm.roomType}
                        onChange={(e) => setBookingForm({...bookingForm, roomType: e.target.value})}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Standard Room">Standard Room</option>
                        <option value="Deluxe Room">Deluxe Room</option>
                        <option value="Suite Room">Suite Room</option>
                        <option value="Budget Room">Budget Room</option>
                      </select>
                    ) : (
                      <div className="flex flex-col items-end text-right font-extrabold text-slate-800 text-xs gap-2.5 max-w-[70%]">
                        {associatedBooking && (associatedBooking.roomType || associatedBooking.roomNumber || associatedBooking.roomPrices)
                          ? (() => {
                              const roomTypesList = associatedBooking.roomType ? associatedBooking.roomType.split(',').map(t => t.trim()) : [];
                              const roomNumbersList = associatedBooking.roomNumber ? associatedBooking.roomNumber.split(',').map(r => r.trim()).filter(Boolean) : [];

                              let parsedPrices = [];
                              if (associatedBooking.roomPrices) {
                                try {
                                  parsedPrices = JSON.parse(associatedBooking.roomPrices);
                                } catch (e) {}
                              }

                              const curr = associatedBooking.currency || 'USD';

                              let displayItems = [];

                              if (parsedPrices && parsedPrices.length > 0) {
                                displayItems = parsedPrices.map((p, idx) => ({
                                  roomNum: p.roomNumber || roomNumbersList[idx] || '',
                                  type: p.roomType || roomTypesList[idx] || roomTypesList[0] || 'Room',
                                  priceVal: p.price
                                }));
                              } else if (roomNumbersList.length > 0) {
                                displayItems = roomNumbersList.map((rNum, idx) => ({
                                  roomNum: rNum,
                                  type: roomTypesList[idx] || roomTypesList[0] || 'Room',
                                  priceVal: roomNumbersList.length === 1 ? (associatedBooking.totalAmount || associatedBooking.totalPrice) : null
                                }));
                              } else if (roomTypesList.length > 0) {
                                displayItems = roomTypesList.map((t, idx) => ({
                                  roomNum: '',
                                  type: t,
                                  priceVal: roomTypesList.length === 1 ? (associatedBooking.totalAmount || associatedBooking.totalPrice) : null
                                }));
                              }

                              return displayItems.map((item, index) => {
                                const label = item.roomNum ? `Room ${item.roomNum}` : item.type;
                                const priceVal = item.priceVal;

                                const formattedPrice = priceVal !== null && priceVal !== undefined && priceVal !== '' && !isNaN(parseFloat(priceVal))
                                  ? `${curr} ${parseFloat(priceVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '';

                                return (
                                  <div key={index} className="leading-normal">
                                    {label}{formattedPrice ? ` - ${formattedPrice}` : ''}
                                  </div>
                                );
                              });
                            })()
                          : 'Deluxe Room'}
                      </div>
                    )}
                  </div>

                  {/* Board Basis */}
                  <div className="col-span-2 flex justify-between items-center py-2 border-b border-slate-100/40">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Board Basis:</span>
                    {isEditingBooking ? (
                      <select 
                        value={bookingForm.boardBasis}
                        onChange={(e) => setBookingForm({...bookingForm, boardBasis: e.target.value})}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Room Only">Room Only</option>
                        <option value="Bed & Breakfast">Bed & Breakfast</option>
                        <option value="Half Board">Half Board</option>
                        <option value="Full Board">Full Board</option>
                      </select>
                    ) : (
                      <span className="font-extrabold text-slate-800">
                        {associatedBooking?.boardBasis || 'Room Only'}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="col-span-2 flex justify-between items-center py-2 border-b border-slate-100/40">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Price:</span>
                    {isEditingBooking ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold text-xs">{getBookingCurrency(associatedBooking)}</span>
                        <input 
                          type="number"
                          step="any"
                          value={bookingForm.amount}
                          onChange={(e) => setBookingForm({...bookingForm, amount: e.target.value})}
                          className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs text-right focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    ) : (
                      <span className="font-extrabold text-slate-855 text-sm font-mono">
                        {getBookingCurrency(associatedBooking)} {associatedBooking?.totalAmount ? parseFloat(associatedBooking.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                      </span>
                    )}
                  </div>

                  {/* Room No input field (Only displayed in Edit Mode) */}
                  {isEditingBooking && (
                    <div className="col-span-2 flex justify-between items-center py-2 border-b border-slate-100/40">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Room No:</span>
                      <input 
                        type="text"
                        placeholder="e.g. 101 or 101, 102"
                        value={bookingForm.room}
                        onChange={(e) => setBookingForm({...bookingForm, room: e.target.value})}
                        className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs text-right focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  )}

                </div>
              </div>

              {/* Quick Actions (WhatsApp & PDF Confirmation) */}
              <div className="grid grid-cols-3 gap-2">
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
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold py-2 px-1 rounded-xl text-[10px] transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <svg className="h-4 w-4 fill-emerald-600" viewBox="0 0 24 24">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.963L2 22l5.233-1.372a9.912 9.912 0 0 0 4.773 1.226h.004c5.505 0 9.989-4.478 9.989-9.984a9.963 9.963 0 0 0-2.924-7.064A9.917 9.917 0 0 0 12.012 2zm5.735 14.13c-.315.885-1.536 1.624-2.18 1.764-.582.126-1.341.226-3.896-.828-3.267-1.348-5.385-4.668-5.548-4.887-.163-.219-1.305-1.733-1.305-3.303 0-1.57.818-2.343 1.11-2.656.29-.313.638-.39.85-.39.213 0 .426.002.61.01.196.009.46-.073.72.559.27.653.92 2.247 1.002 2.41.082.164.137.355.027.574-.11.218-.163.355-.327.546-.164.19-.345.426-.492.573-.164.164-.336.345-.145.672.19.327.848 1.4 1.82 2.27.973.87 2.003 1.258 2.33 1.42.327.164.518.137.71-.082.19-.219.82-.955 1.037-1.28.219-.328.437-.273.738-.164.3.11 1.91.9 2.237 1.064.327.164.546.246.628.383.082.136.082.791-.233 1.676z"/>
                  </svg>
                  <span>WhatsApp Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantDownloadPDF(selectedReg)}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-850 font-bold py-2 px-1 rounded-xl text-[10px] transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Download className="h-4 w-4 text-amber-700" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDFClick}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold py-2 px-1 rounded-xl text-[10px] transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4 text-blue-700" />
                  <span>Print PDF</span>
                </button>
              </div>

              {/* View Draft Bill button for bookings inside drawer */}
              {associatedBooking && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nightsVal = selectedReg.numberOfNights || selectedReg.nights || 1;
                      setConfirmationData({
                        guestName: selectedReg.guestName || '',
                        bookingNumber: associatedBooking.bookingNumber || '',
                        checkInDate: selectedReg.checkInDate || '',
                        checkOutDate: selectedReg.checkOutDate || '',
                        nights: nightsVal,
                        adults: selectedReg.adults || 1,
                        children: selectedReg.children || 0,
                        boardBasis: associatedBooking.boardBasis || 'Room Only',
                        email: selectedReg.email || 'N/A',
                        whatsappNumber: selectedReg.whatsappNumber || 'N/A',
                        nationality: selectedReg.nationality || 'N/A',
                        reservationDate: new Date().toISOString().split('T')[0],
                        roomType: associatedBooking.roomType || '',
                        unitPrice: associatedBooking.unitPrice || '0.00',
                        totalPrice: (associatedBooking.totalAmount || 0).toFixed(2),
                        currency: associatedBooking.currency || 'LKR',
                        tableCurrency: associatedBooking.currency || 'LKR',
                        exchangeRate: associatedBooking.exchangeRate || '1.00',
                        allocatedRooms: getRoomsForBooking(associatedBooking),
                        confirmedBy: associatedBooking.confirmedBy || 'Muthuni Weerasingha',
                        reservationStatus: 'Confirm Booking',
                        senderName: associatedBooking.senderName || confirmationData.senderName || localStorage.getItem('pms_sender_name') || user?.name || user?.username || '',
                        badgeText: '',
                        remarks: associatedBooking.remarks || '',
                        bookingType: associatedBooking.bookingType || 'Booking.com Booking'
                      });
                      setShowDraftPreviewModal(true);
                    }}
                    className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileText className="h-4 w-4 text-blue-700" /> View Draft Bill
                  </button>
                </div>
              )}

              {/* Save / Edit / Cancel Buttons for Guest Info */}
              {(isFrontOfficer || isAdmin) && (
                <div className="flex flex-col gap-2 pt-2">
                  {!isEditingBooking ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditingBooking(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        Edit Info
                      </button>

                      {((associatedBooking?.bookingType || '').toLowerCase().includes('direct') || (selectedReg?.channel || '').toLowerCase().includes('direct')) && (
                        <button
                          type="button"
                          onClick={openCreateAdvanceModal}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Create Advance
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleBookingSubmit}
                        disabled={updatingBooking}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {updatingBooking ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingBooking(false);
                          if (associatedBooking) {
                            setBookingForm({
                              roomType: associatedBooking.roomType || defaultRoomType,
                              room: associatedBooking.roomNumber || '',
                              bookingType: associatedBooking.bookingType || 'Direct Booking',
                              bookingNumber: associatedBooking.bookingNumber || '',
                              boardBasis: associatedBooking.boardBasis || 'Room Only',
                              remarks: associatedBooking.remarks || '',
                              amount: associatedBooking.totalAmount || '',
                              paymentStatus: selectedReg.paymentStatus || 'Pending',
                              registrationStatus: selectedReg.registrationStatus || 'Pending',
                              checkInDate: selectedReg.checkInDate || '',
                              checkOutDate: selectedReg.checkOutDate || '',
                              whatsappNumber: selectedReg.whatsappNumber || selectedReg.whatsAppNumber || '',
                              adults: selectedReg.adults || 1,
                              children: selectedReg.children || 0
                            });
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer shadow-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}



              {/* Unified Payment Form */}
              {associatedBooking && !associatedBooking.bookingType?.toLowerCase().includes('booking.com') && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-emerald-600" /> Payments
                  </h4>

                  {/* Payment Summary Card */}
                  {(() => {
                    const bCurr = getBookingCurrency(associatedBooking);
                    const totalAmt = parseFloat(associatedBooking.totalAmount || 0);
                    const totalPaidInBCurr = getVisiblePayments(advancePayments).reduce((sum, p) => {
                      const pCurr = (p.currencyCode || p.currency || 'LKR').toUpperCase();
                      const pAmt = parseFloat(p.amount || p.amountInCurrency || 0);
                      if (pCurr === bCurr) return sum + pAmt;
                      const pLkr = parseFloat(p.convertedAmountLkr || p.amountLkr || 0);
                      const pExRate = parseFloat(p.exchangeRate) || 1;
                      return sum + (pExRate > 0 ? (pLkr / pExRate) : pAmt);
                    }, 0);
                    const bal = Math.max(0, totalAmt - totalPaidInBCurr);
                    const isFullyPaid = totalAmt > 0 && bal <= 0.01;
                    let pStatus = 'Unpaid';
                    if (isFullyPaid) pStatus = 'Paid';
                    else if (totalPaidInBCurr > 0) pStatus = 'Partially Paid';
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between font-semibold text-slate-500">
                          <span>Total Booking Amount:</span>
                          <span className="font-mono text-slate-900">{bCurr} {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200/60 pt-2">
                          <span>Remaining Balance:</span>
                          <span className={`font-mono ${bal > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {bCurr} {bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                  {payment.amount || payment.amountInCurrency} {payment.currencyCode || payment.currency}
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
                    const bCurr = getBookingCurrency(associatedBooking);
                    const totalAmt = parseFloat(associatedBooking.totalAmount || 0);
                    const totalPaidInBCurr = getVisiblePayments(advancePayments).reduce((sum, p) => {
                      const pCurr = (p.currencyCode || p.currency || 'LKR').toUpperCase();
                      const pAmt = parseFloat(p.amount || p.amountInCurrency || 0);
                      if (pCurr === bCurr) return sum + pAmt;
                      const pLkr = parseFloat(p.convertedAmountLkr || p.amountLkr || 0);
                      const pExRate = parseFloat(p.exchangeRate) || 1;
                      return sum + (pExRate > 0 ? (pLkr / pExRate) : pAmt);
                    }, 0);
                    const remainingBal = Math.max(0, totalAmt - totalPaidInBCurr);
                    const isFullyPaid = totalAmt > 0 && remainingBal <= 0.01;

                    if (isFullyPaid) return (
                      <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-bold">
                        <CheckCircle className="h-4 w-4" /> Payment fully settled
                      </div>
                    );

                    // Auto-fill amount when switching to FULL tab
                    const handleTabChange = (tab) => {
                      setPaymentTab(tab);
                      if (tab === 'FULL') {
                        setPaymentForm(prev => ({ ...prev, amount: remainingBal.toFixed(2), currencyCode: 'LKR', exchangeRate: 1 }));
                      } else {
                        setPaymentForm(prev => ({ ...prev, amount: '' }));
                      }
                    };

                    const actualPaymentTab = !associatedBooking.bookingType?.toLowerCase().includes('direct') ? 'FULL' : paymentTab;
                    const isFull = actualPaymentTab === 'FULL';
                    const accentColor = isFull ? 'blue' : 'emerald';

                    return (
                      <form onSubmit={(e) => handleSavePayment(e, actualPaymentTab, remainingBal)} className="space-y-3 text-xs">
                        {/* Tab Toggle */}
                        {associatedBooking.bookingType?.toLowerCase().includes('direct') && (
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
                                  {remainingBal.toLocaleString()} LKR
                                </span>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Form Fields */}
                        <div className={`border rounded-xl p-3.5 space-y-3 ${
                          isFull ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-slate-50/20'
                        }`}>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
                              <select
                                value={paymentForm.currencyCode}
                                onChange={handlePaymentCurrencyChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <option value="LKR">LKR</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
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
                                placeholder="0.00"
                                value={paymentForm.amount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const fee = paymentForm.paymentMethod === 'Card' ? (parseFloat(val) || 0) * 0.03 : '';
                                  setPaymentForm({ 
                                    ...paymentForm, 
                                    amount: val,
                                    cardFee: fee !== '' ? fee.toFixed(2) : ''
                                  });
                                }}
                                className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 font-bold font-mono focus:outline-none bg-white text-slate-700`}
                              />
                            </div>
                            {paymentForm.currencyCode !== 'LKR' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exchange Rate</label>
                                  <input
                                    type="number"
                                    step="any"
                                    required
                                    value={paymentForm.exchangeRate}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, exchangeRate: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none font-mono font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Converted (LKR)
                                    {parseFloat(paymentForm.otherCharges) > 0 && <span className="text-amber-600 font-normal normal-case font-mono text-[9px]"> (Net of charges)</span>}
                                  </label>
                                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-700 font-mono">
                                    {(Math.max(0, (parseFloat(paymentForm.amount) || 0) - (parseFloat(paymentForm.otherCharges) || 0)) * (parseFloat(paymentForm.exchangeRate) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LKR
                                  </div>
                                </div>
                              </>
                            )}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                              <select
                                value={paymentForm.paymentMethod}
                                onChange={(e) => {
                                  const method = e.target.value;
                                  const fee = method === 'Card' ? (parseFloat(paymentForm.amount) || 0) * 0.03 : '';
                                  setPaymentForm({ 
                                    ...paymentForm, 
                                    paymentMethod: method,
                                    cardFee: fee !== '' ? fee.toFixed(2) : ''
                                  });
                                }}
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
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Slip</label>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setPaymentForm({ ...paymentForm, slipPath: `/uploads/${e.target.files[0].name}` });
                                  }
                                }}
                                className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200"
                              />
                            </div>
                            {paymentForm.paymentMethod === 'Card' && (
                               <div className="col-span-2 space-y-1">
                                 <div className="flex justify-between items-center">
                                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Charges (LKR)</label>
                                   <button
                                     type="button"
                                     onClick={() => {
                                       const amt = parseFloat(paymentForm.amount) || 0;
                                       const rate = paymentForm.currencyCode === 'LKR' ? 1 : (parseFloat(paymentForm.exchangeRate) || 1);
                                       const lkrAmt = amt * rate;
                                       const bankFeeLkr = (lkrAmt * 0.03).toFixed(2);
                                       setPaymentForm({ ...paymentForm, cardFee: bankFeeLkr });
                                     }}
                                     className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition cursor-pointer"
                                   >
                                     + Add 3% Charges ({(((parseFloat(paymentForm.amount)||0) * (paymentForm.currencyCode === 'LKR' ? 1 : (parseFloat(paymentForm.exchangeRate)||1))) * 0.03).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} LKR)
                                   </button>
                                 </div>
                                 <div className="relative">
                                   <input
                                     type="number"
                                     step="any"
                                     placeholder="0.00 (Optional - enter only if charging guest)"
                                     value={paymentForm.cardFee}
                                     onChange={(e) => setPaymentForm({ ...paymentForm, cardFee: e.target.value })}
                                     className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold font-mono focus:outline-none text-slate-700 pr-12"
                                   />
                                   <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">LKR</span>
                                 </div>
                               </div>
                             )}

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
                             {((associatedBooking?.bookingType?.toLowerCase().includes('web')) || 
                               (associatedBooking?.channelName?.toLowerCase().includes('web')) || 
                               (associatedBooking?.bookingSource?.toLowerCase().includes('web')) || 
                               (selectedReg?.bookingType?.toLowerCase().includes('web')) ||
                               (selectedReg?.channelName?.toLowerCase().includes('web'))) && (
                               <div className="col-span-2 mt-1">
                                 <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                   <span>OTHER CHARGES</span>
                                   <span className="text-[9px] font-normal text-slate-400 normal-case">(Web Booking fees, commission, extra services, etc.)</span>
                                 </label>
                                 <div className="relative">
                                   <input
                                     type="number"
                                     step="any"
                                     placeholder="0.00"
                                     value={paymentForm.otherCharges || ''}
                                     onChange={(e) => setPaymentForm({ ...paymentForm, otherCharges: e.target.value })}
                                     className="w-full bg-amber-50/20 border border-amber-300 focus:border-amber-500 rounded-lg px-3 py-2 font-bold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 pr-14 text-xs"
                                   />
                                   <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-500">
                                     {paymentForm.currencyCode || 'USD'}
                                   </span>
                                 </div>
                               </div>
                             )}
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
              )}

              {/* BANK PAYMENT SLIP & RECEIPT UPLOAD SECTION */}
              {associatedBooking && (() => {
                const bId = associatedBooking.id || selectedReg?.id;
                const bookingSlips = allBankSlips[bId] || [];

                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5 mt-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="h-4 w-4 text-emerald-600" />
                        BANK PAYMENT SLIP & RECEIPT UPLOAD
                      </h4>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                        Bank Transfer
                      </span>
                    </div>

                    <form onSubmit={(e) => handleSaveBankSlip(e, bId)} className="space-y-2.5 text-xs">
                      {/* Bank Account Selection Dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Bank Account & Currency *
                        </label>
                        <select
                          value={bankSlipForm.bankKey}
                          onChange={(e) => setBankSlipForm({ ...bankSlipForm, bankKey: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="USD_PB">USD ($) - People's Bank (Acc: 288402130016448)</option>
                          <option value="LKR_PB_COMPANY">LKR 1 - Serene Villa (pvt)LTD (People's Bank - Acc: 288100190017275)</option>
                          <option value="LKR_PB_PERSONAL">LKR 2 - D.W.C Prasad (People's Bank - Acc: 288100186167023)</option>
                          <option value="EUR_SB">EUR (€) - Sampath Bank (Acc: 521630000114)</option>
                          <option value="AUD_SB">AUD ($) - Sampath Bank (Acc: 521630000092)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Payment Category */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Payment Type
                          </label>
                          <select
                            value={bankSlipForm.paymentType}
                            onChange={(e) => setBankSlipForm({ ...bankSlipForm, paymentType: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700 focus:outline-none text-xs cursor-pointer"
                          >
                            <option value="Advance Payment">Advance Payment</option>
                            <option value="Full Payment">Full Payment</option>
                            <option value="Other / Balance">Other / Balance</option>
                          </select>
                        </div>

                        {/* Paid Date */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Paid Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={bankSlipForm.paidDate}
                            onChange={(e) => setBankSlipForm({ ...bankSlipForm, paidDate: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700 focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      {/* Upload Slip File */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Upload Payment Slip / Receipt (Image / PDF) *
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setBankSlipForm(prev => ({
                                  ...prev,
                                  slipUrl: reader.result,
                                  fileName: file.name
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[10px] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                        />
                        {bankSlipForm.fileName && (
                          <div className="text-[10px] text-emerald-700 font-bold mt-1">
                            ✓ File loaded: {bankSlipForm.fileName}
                          </div>
                        )}
                      </div>

                      {/* Save Bank Slip Button */}
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-xs mt-1"
                      >
                        <Upload size={13} />
                        Save & Attach Bank Slip
                      </button>
                    </form>

                    {/* List of Uploaded Slips for this reservation */}
                    {bookingSlips.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Uploaded Bank Slips ({bookingSlips.length})
                        </h5>
                        <div className="space-y-2">
                          {bookingSlips.map((slip) => {
                            const bd = BANK_ACCOUNTS[slip.bankKey] || BANK_ACCOUNTS.USD_PB;
                            return (
                              <div key={slip.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-extrabold">{slip.paymentType}</span>
                                    <span>{bd.bankName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    Acc: <span className="font-mono font-bold text-slate-700">{bd.accountNumber}</span> | Paid: {slip.paidDate}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSlipPreview(slip)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Eye size={11} /> View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBankSlip(bId, slip.id)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1 rounded-md transition cursor-pointer"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Warning card ONLY if associatedBooking is completely missing OR if booking details have not been saved (amount is 0 or empty) */}
              {(!associatedBooking || !associatedBooking.totalAmount || associatedBooking.totalAmount <= 0) && (
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
      {/* Select Reservation Type Modal */}
      {showTypeSelector && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between select-none">
              <div>
                <h3 className="text-base font-extrabold tracking-wider uppercase">Select Reservation Type</h3>
                <p className="text-[11px] text-amber-100 font-medium mt-0.5">Choose the reservation source channel to load the form</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTypeSelector(false)} 
                className="text-white hover:text-amber-100 p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50/50 space-y-3">
              {[
                { 
                  name: 'Direct Booking', 
                  desc: 'Reservations made directly by the guest through the property.', 
                  color: 'hover:border-amber-400 hover:bg-amber-50/30',
                  icon: (
                    <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                      <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )
                },
                { 
                  name: 'Booking.com Booking', 
                  desc: 'Reservations received through Booking.com OTA platform.', 
                  color: 'hover:border-blue-400 hover:bg-blue-50/30',
                  icon: (
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                      <span className="font-extrabold text-xs tracking-tighter">B.</span>
                    </div>
                  )
                },
                { 
                  name: 'Airbnb Booking', 
                  desc: 'Reservations received through Airbnb listing.', 
                  color: 'hover:border-rose-450 hover:bg-rose-50/30',
                  icon: (
                    <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0">
                      <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )
                },
                { 
                  name: 'Web Booking', 
                  desc: 'Reservations made through the property\'s official website.', 
                  color: 'hover:border-emerald-400 hover:bg-emerald-50/30',
                  icon: (
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                      <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                  )
                }
              ].map((typeOption) => (
                <button
                  key={typeOption.name}
                  type="button"
                  onClick={() => handleSelectReservationType(typeOption.name)}
                  className={`w-full text-left p-4 bg-white border border-slate-200/80 rounded-2xl transition flex items-center gap-4 cursor-pointer group shadow-xs ${typeOption.color}`}
                >
                  {typeOption.icon}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition flex items-center gap-1.5">
                      {typeOption.name}
                      <span className="text-[10px] text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-5px] group-hover:translate-x-0">
                        ➔
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">{typeOption.desc}</p>
                  </div>
                </button>
              ))}
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
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm ${
                            room.status === 'Available' ? 'bg-emerald-500 text-white' : 
                            room.status === 'Occupied' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {room.status}
                          </span>
                        </div>
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
                        {(() => {
                          const roomNumbers = bookingForm.room ? bookingForm.room.split(',').map(r => r.trim()) : [];
                          const isChecked = roomNumbers.includes(room.roomNumber);
                          return (
                            <button
                              type="button"
                              disabled={!isAvailable && !isChecked}
                              onClick={() => {
                                let newRooms;
                                if (isChecked) {
                                  newRooms = roomNumbers.filter(r => r !== room.roomNumber);
                                } else {
                                  newRooms = [...roomNumbers, room.roomNumber];
                                }
                                const roomString = newRooms.join(', ');

                                let newRoomType = bookingForm.roomType;
                                if (!isChecked && newRooms.length === 1) {
                                  let mappedType = room.roomType;
                                  if (mappedType.toLowerCase().includes('deluxe')) mappedType = 'Deluxe Room';
                                  else if (mappedType.toLowerCase().includes('suite')) mappedType = 'Suite Room';
                                  else if (mappedType.toLowerCase().includes('standard')) mappedType = 'Standard Room';
                                  else if (mappedType.toLowerCase().includes('budget')) mappedType = 'Budget Room';
                                  newRoomType = mappedType;
                                }

                                setBookingForm({
                                  ...bookingForm,
                                  room: roomString,
                                  roomType: newRoomType
                                });
                              }}
                              className={`w-full py-1.5 rounded-lg font-bold text-center text-xs transition cursor-pointer ${
                                isChecked 
                                  ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                                  : isAvailable 
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {isChecked ? 'Deselect' : isAvailable ? 'Select' : room.status}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <button 
                type="button" 
                onClick={() => setShowRoomSelector(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition shadow-md shadow-emerald-500/10"
              >
                Done Selecting Rooms
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Receipt Modal */}
{/* Receipt Modal */}
      {showReceiptModal && receiptData && selectedPaymentForReceipt && (() => {
        const associatedBooking = getBookingForReg(selectedReg.id);
        if (!associatedBooking) return null;
        
        const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL';
        const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';

        const handleWhatsAppShare = () => {
          const bCurr = (associatedBooking.currency && associatedBooking.currency !== 'LKR') ? associatedBooking.currency : (associatedBooking.tableCurrency || 'USD');
          const exRate = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBooking.exchangeRate) || 335;
          const totalBookingAmountLkr = bCurr === 'LKR' ? (associatedBooking.totalAmount || 0) : ((associatedBooking.totalAmount || 0) * exRate);
          
          const paymentsList = advancePayments || [];
          const paymentsUpToThis = paymentsList.length > 0 
            ? paymentsList.filter(p => p.id <= selectedPaymentForReceipt.id)
            : [selectedPaymentForReceipt];
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

        const roomsList = associatedBooking?.roomNumber 
          ? associatedBooking.roomNumber.split(',').map(r => r.trim()).filter(Boolean)
          : [];
        const roomTypesList = associatedBooking?.roomType
          ? associatedBooking.roomType.split(',').map(t => t.trim())
          : [];
        const numRooms = roomsList.length || 1;
        const nightsVal = selectedReg.numberOfNights || selectedReg.nights || 1;
        const totalAmount = associatedBooking?.totalAmount || 0;
        const cardFeeMatch = selectedPaymentForReceipt.remarks?.match(/\[Charges: ([\d.]+)\]/);
        const cardFeeVal = cardFeeMatch ? parseFloat(cardFeeMatch[1]) : 0;
        
        const bCurr = getBookingCurrency(associatedBooking);
        const exRate = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBooking.exchangeRate) || 335;
        const dispCurr = forceReceiptLkr ? 'LKR' : bCurr;
        const convFactor = (forceReceiptLkr && bCurr !== 'LKR') ? exRate : 1;

        // Parse roomPrices if available
        let parsedRoomPrices = null;
        if (associatedBooking.roomPrices) {
          try {
            const p = JSON.parse(associatedBooking.roomPrices);
            if (Array.isArray(p) && p.length > 0) parsedRoomPrices = p;
          } catch(e) {}
        }

        const dispTotalAmount = totalAmount * convFactor;
        const totalCents = Math.round(dispTotalAmount * 100);
        
        const itemizedRows = roomsList.map((roomNumber, idx) => {
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
          const currentRoomType = roomTypesList[idx] || roomTypesList[0] || 'Room';
          
          return {
            roomNumber,
            description: `Night - ${currentRoomType} (Room ${roomNumber})`,
            rate: rateAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amountVal: amountVal.toLocaleString(),
            amountCts: amountCts
          };
        });

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
                className="no-print-close-btn absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-105 rounded-lg transition print:hidden"
                title={isFinalPayment ? 'Close & Go to Handover' : 'Close'}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header Section */}
              <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-3 mb-4">
                {/* Left Column: Logo & Details */}
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

                {/* Right Column: Title & Receipt Meta */}
                <div className="text-right space-y-1">
                  <h1 className={`text-base font-black tracking-wide uppercase ${
                    isFinalPayment ? 'text-blue-700' : 'text-emerald-800'
                  }`}>
                    {receiptTitle}
                  </h1>
                  {isFinalPayment && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ✓ Fully Settled
                    </span>
                  )}
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
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{selectedReg?.guestName || associatedBooking?.guestName || ''}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Channel</span>
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{associatedBooking?.bookingType || 'Direct Booking'}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Check - in</span>
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{(selectedReg?.checkInDate || associatedBooking?.checkInDate || '').replace(/-/g, '.')}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Check - out</span>
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{(selectedReg?.checkOutDate || associatedBooking?.checkOutDate || '').replace(/-/g, '.')}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Nights</span>
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(selectedReg?.numberOfNights || selectedReg?.nights || associatedBooking?.nights || 1).padStart(2, '0')} nights</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Basis</span>
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{associatedBooking?.boardBasis || 'Bed & Breakfast'}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Adults</span>
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(selectedReg?.adults || associatedBooking?.adults || 1).padStart(2, '0')}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 font-semibold w-24 shrink-0">Children</span>
                  <span className="font-bold text-slate-900 border-b border-dashed border-slate-200 flex-1 pb-0.5">{String(selectedReg?.children || associatedBooking?.children || 0).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Receipt Body: Table */}
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
                          <td className="border-r border-emerald-800/20 px-3 py-1.5 text-left print:border-slate-400">
                            {row.description}
                          </td>
                          <td className="border-r border-emerald-800/20 px-3 py-1.5 text-right font-mono print:border-slate-400">
                            {row.amountVal}
                          </td>
                          <td className="px-2 py-1.5 text-center font-mono border-emerald-800/20">
                            {row.amountCts}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-emerald-800/20 print:border-slate-400">
                        <td className="border-r border-emerald-800/20 px-3 py-1.5 text-left print:border-slate-400">
                          {fallbackRow.description}
                        </td>
                        <td className="border-r border-emerald-800/20 px-3 py-1.5 text-right font-mono print:border-slate-400">
                          {fallbackRow.amountVal}
                        </td>
                        <td className="px-2 py-1.5 text-center font-mono">
                          {fallbackRow.amountCts}
                        </td>
                      </tr>
                    )}

                    {/* Total Row */}
                    <tr className="bg-emerald-50/10 font-bold text-slate-900 border-t-2 border-emerald-800/30 print:border-slate-400">
                      <td className="border-r border-emerald-800/20 px-3 py-2 text-right uppercase text-[8px] tracking-wider print:border-slate-400 font-extrabold" colSpan={1}>
                        TOTAL VALUE
                      </td>
                      <td className="border-r border-emerald-800/20 px-3 py-2 text-right font-mono font-bold print:border-slate-400 text-emerald-800">
                        {Math.floor(dispTotalAmount).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-center font-mono font-bold text-emerald-800">
                        {Math.round((dispTotalAmount - Math.floor(dispTotalAmount)) * 100).toString().padStart(2, '0')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

                  {/* Advance Payment Calculations Section */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
                    {/* Left Column: Extra notes / details if any */}
                    <div className="border border-dashed border-slate-200 rounded-lg p-2.5 text-slate-500 flex flex-col justify-between print:border-slate-300">
                      <div>
                        <p className="font-bold text-[8px] uppercase tracking-wider mb-0.5 text-slate-400">Payment Reference</p>
                        <p className="font-mono text-slate-700 font-bold">{selectedPaymentForReceipt.referenceNumber || 'N/A'}</p>
                        {selectedPaymentForReceipt.remarks && (
                          <p className="mt-1 text-[10px] leading-snug">
                            <span className="font-bold">Remarks:</span> {selectedPaymentForReceipt.remarks.replace(/\[Charges: [\d.]+\]/g, '').trim()}
                          </p>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-2">
                        {isFinalPayment
                          ? '* This is the final payment receipt. Account fully settled.'
                          : '* Please preserve this receipt for final checkout subtraction.'}
                      </div>
                    </div>

                    {/* Right Column: Numeric breakdown */}
                    {(() => {
                      const bCurr = getBookingCurrency(associatedBooking);
                      const exRate = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBooking.exchangeRate) || 335;
                      const dispCurr = forceReceiptLkr ? 'LKR' : bCurr;

                      const totAmt = forceReceiptLkr && bCurr !== 'LKR' ? (associatedBooking.totalAmount || 0) * exRate : (associatedBooking.totalAmount || 0);
                      const paidAmt = forceReceiptLkr && (selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency) !== 'LKR' 
                        ? (selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0) 
                        : (selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency || 0);
                      const remBal = Math.max(0, totAmt - paidAmt);

                      return (
                        <div className="border border-emerald-800/20 rounded-lg p-3 bg-emerald-50/10 space-y-1.5 print:border-slate-300 print:bg-transparent">
                          <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                            <span className="text-slate-500 font-semibold">Total Booking Amount:</span>
                            <span className="font-bold text-slate-800">{dispCurr} {totAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          
                          <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                            <span className="text-slate-500 font-semibold">{isFinalPayment ? 'Final Payment:' : 'Advance Paid:'}</span>
                            <span className="font-bold text-emerald-850 print:text-slate-900">
                              {dispCurr} {parseFloat(paidAmt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {!forceReceiptLkr && (selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency) !== 'LKR' && (
                            <>
                              <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200 text-[10px]">
                                <span className="text-slate-500">Exchange Rate:</span>
                                <span className="font-medium text-slate-700">{exRate}</span>
                              </div>
                              <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                                <span className="text-slate-500 font-semibold">Converted Amount:</span>
                                <span className="font-bold text-emerald-850 print:text-slate-900">
                                  LKR {(selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </>
                          )}

                          {cardFeeVal > 0 && (
                            <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                              <span className="text-slate-500 font-semibold">CHARGES:</span>
                              <span className="font-bold text-slate-850">
                                {forceReceiptLkr || dispCurr === 'LKR'
                                  ? `LKR ${cardFeeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : `${dispCurr} ${(cardFeeVal / exRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </span>
                            </div>
                          )}

                          {(() => {
                            const otherMatch = selectedPaymentForReceipt.remarks?.match(/\[Other Charges: ([\d.]+)\]/);
                            const otherVal = otherMatch ? parseFloat(otherMatch[1]) : 0;
                            if (otherVal > 0) {
                              const otherDisp = forceReceiptLkr || dispCurr === 'LKR'
                                ? `LKR ${(selectedPaymentForReceipt.currencyCode === 'LKR' ? otherVal : (otherVal * exRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${dispCurr} ${otherVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              return (
                                <div className="flex justify-between pb-0.5 border-b border-emerald-800/10 print:border-slate-200">
                                  <span className="text-slate-500 font-semibold">OTHER CHARGES:</span>
                                  <span className="font-bold text-amber-700">{otherDisp}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="flex justify-between pt-1 font-bold text-sm border-t border-emerald-805/30 print:border-slate-300">
                            <span className="text-emerald-950 font-black print:text-slate-900 text-xs">Remaining Balance:</span>
                            <span className={`font-mono text-xs ${
                              isFinalPayment ? 'text-blue-700' : 'text-emerald-800'
                            } print:text-slate-900`}>
                              {dispCurr} {remBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          {isFinalPayment && (
                            <div className="text-center mt-1">
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">✓ FULLY PAID</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                {bCurr !== 'LKR' && (
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
                    <Printer size={11} /> Print in {bCurr}
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

      {/* Create Advance Request Modal */}
      {showAdvanceModal && selectedReg && (() => {
        const associatedB = getBookingForReg(selectedReg.id);

        const handleDownloadAdvancePDF = async () => {
          const element = advancePrintRef.current;
          if (!element) return;

          try {
            const dataUrl = await toPng(element, {
              cacheBust: true,
              pixelRatio: 2,
              backgroundColor: '#ffffff',
              width: 720,
              height: element.offsetHeight || 750,
              style: {
                width: '720px',
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
              const imgHeight = ((element.offsetHeight || 750) * imgWidth) / 720;

              pdf.addImage(dataUrl, 'PNG', margin, margin, imgWidth, imgHeight);
              pdf.save(`Advance_Request_${selectedReg?.guestName || 'Guest'}.pdf`);
            } else {
              const link = document.createElement('a');
              link.download = `Advance_Request_${selectedReg?.guestName || 'Guest'}.png`;
              link.href = dataUrl;
              link.click();
            }
          } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. Please try again.');
          }
        };

        const handlePrintAdvance = () => {
          window.print();
        };

        const handleWhatsAppAdvance = () => {
          let phone = selectedReg?.whatsappNumber || selectedReg?.whatsAppNumber || '';
          phone = phone.replace(/[^0-9]/g, '');
          if (phone.startsWith('0')) {
            phone = '94' + phone.substring(1);
          }

          const bookingNo = associatedB?.bookingNumber || confirmationData?.bookingNumber || 'N/A';
          const curr = advanceFormData.currency || 'USD';
          const totAmt = parseFloat(advanceFormData.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const advAmt = parseFloat(advanceFormData.advanceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const balAmt = Math.max(0, parseFloat(advanceFormData.totalAmount || 0) - parseFloat(advanceFormData.advanceAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const bd = advanceFormData.bankDetails || BANK_ACCOUNTS.USD_PB;

          const text = `*SERENE VILLA - ADVANCE PAYMENT REQUEST* 🌴\n\nDear Mr / Mrs *${advanceFormData.guestName || 'Guest'}*,\n\nGreetings from Serene Villa - Hiriketiya!\nHere are your booking & advance payment request details:\n\n📋 *Booking Ref:* #${bookingNo}\n🗓 *Check-in:* ${advanceFormData.checkIn}\n🗓 *Check-out:* ${advanceFormData.checkOut} (${advanceFormData.nights} Nights)\n\n💰 *Total Booking Amount:* ${curr} ${totAmt}\n💳 *Required Advance Amount:* ${curr} ${advAmt}\n💵 *Balance Due Upon Arrival:* ${curr} ${balAmt}\n\n🏦 *BANK TRANSFER DETAILS:*\n• *Bank Name:* ${bd.bankName}\n• *Account Holder:* ${bd.accountHolder}\n• *Account Number:* ${bd.accountNumber}\n• *Branch:* ${bd.branch}${bd.swiftCode ? `\n• *Swift Code:* ${bd.swiftCode}` : ''}\n• *Contact Hotline:* ${bd.hotline || '+94 70 499 8787'}\n\nPlease send us the payment receipt/confirmation once the transfer is completed.\nThank you for choosing Serene Villa! 🙏`;

          const url = phone 
            ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

          window.open(url, '_blank');
        };

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto flex justify-center py-6 px-4 no-print">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-black tracking-wide flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                    CREATE ADVANCE PAYMENT REQUEST
                  </h3>
                  <p className="text-[10px] text-emerald-200 font-medium mt-0.5">
                    Direct Booking - Serene Villa Hiriketiya
                  </p>
                </div>
                <button 
                  onClick={() => setShowAdvanceModal(false)} 
                  className="text-emerald-200 hover:text-white bg-emerald-900/50 hover:bg-emerald-900 p-1.5 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
                {/* Left Column: Controls & Inputs */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Guest Details (Auto-filled) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <User size={14} /> Guest Details (Auto-filled)
                    </h4>
                    <div className="text-xs space-y-1.5 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Name:</span>
                        <span className="font-bold text-slate-900">{advanceFormData.guestName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Nights:</span>
                        <span className="font-bold text-slate-900">{advanceFormData.nights} Nights</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Check-in / Check-out:</span>
                        <span className="font-bold text-slate-900 text-[11px]">{advanceFormData.checkIn} to {advanceFormData.checkOut}</span>
                      </div>
                      {advanceFormData.remarks && (
                        <div className="flex justify-between border-t border-slate-100 pt-1.5">
                          <span className="text-slate-400 font-semibold">Remarks:</span>
                          <span className="font-medium text-slate-800 text-[11px] text-right truncate max-w-[180px]">{advanceFormData.remarks}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details (Editable) */}
                  <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm space-y-3">
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-50 pb-2">
                      <CreditCard size={14} /> Payment Details
                    </h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Total Amount ({advanceFormData.currency})
                      </label>
                      <input 
                        type="text" 
                        readOnly 
                        value={`${advanceFormData.currency} ${parseFloat(advanceFormData.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                        Advance Amount ({advanceFormData.currency}) *
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={advanceFormData.advanceAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const exRate = parseFloat(advanceFormData.exchangeRate) || 335;
                          const baseAdv = advanceFormData.currency === 'LKR' ? (val / exRate) : val;
                          setAdvanceFormData({
                            ...advanceFormData,
                            advanceAmount: val,
                            baseAdvanceAmount: baseAdv
                          });
                        }}
                        className="w-full bg-white border-2 border-emerald-500 rounded-lg px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Enter required advance amount"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Currency & Bank Account Selection
                      </label>
                      <select 
                        value={advanceFormData.bankKey || 'USD_PB'}
                        onChange={(e) => handleAdvanceBankOptionChange(e.target.value)}
                        className="w-full bg-white border-2 border-emerald-500/80 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                      >
                        <option value="USD_PB">USD ($) - People's Bank (Acc: 288402130016448)</option>
                        <option value="LKR_PB_COMPANY">LKR 1 - Serene Villa (pvt)LTD (People's Bank - Acc: 288100190017275)</option>
                        <option value="LKR_PB_PERSONAL">LKR 2 - D.W.C Prasad (People's Bank - Acc: 288100186167023)</option>
                        <option value="EUR_SB">EUR (€) - Sampath Bank (Acc: 521630000114)</option>
                        <option value="AUD_SB">AUD ($) - Sampath Bank (Acc: 521630000092)</option>
                      </select>
                    </div>
                  </div>

                  {/* Bank Details Display */}
                  {(() => {
                    const bd = advanceFormData.bankDetails || BANK_ACCOUNTS.USD_PB;
                    return (
                      <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 shadow-sm space-y-2 text-xs">
                        <h4 className="text-[11px] font-black text-emerald-900 uppercase tracking-wider border-b border-emerald-200/60 pb-1.5 flex justify-between items-center">
                          <span>Bank Transfer Details</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{bd.bankName}</span>
                        </h4>
                        <div className="space-y-1 text-slate-700 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Account Holder:</span>
                            <span className="font-bold text-slate-900">{bd.accountHolder}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Account Number:</span>
                            <span className="font-mono font-extrabold text-emerald-800">{bd.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Branch:</span>
                            <span className="font-bold text-slate-900">{bd.branch}</span>
                          </div>
                          {bd.swiftCode && (
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Swift Code:</span>
                              <span className="font-mono font-bold text-slate-800">{bd.swiftCode}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-emerald-100 pt-1">
                            <span className="text-slate-500 font-medium">Hotline:</span>
                            <span className="font-bold text-slate-900">{bd.hotline || '+94 70 499 8787'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>

                {/* Right Column: Live Printable Document Preview */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div id="printable-advance-modal-content" className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm overflow-x-auto">
                    <AdvanceRequestPrint 
                      ref={advancePrintRef}
                      advanceData={advanceFormData}
                      selectedReg={selectedReg}
                      associatedBooking={associatedB}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer / Action Buttons */}
              <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} /> Close
                </button>
                
                <button
                  type="button"
                  onClick={handleDownloadAdvancePDF}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Download size={14} /> Download
                </button>

                <button
                  type="button"
                  onClick={handlePrintAdvance}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Printer size={14} /> Print
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppAdvance}
                  className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <MessageSquare size={14} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reservation Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto no-print flex justify-center py-6 px-4">
          <div className="bg-white border border-slate-100 w-full max-w-2xl rounded-2xl shadow-xl p-6 my-auto space-y-6 h-fit">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className={`text-base font-extrabold uppercase tracking-wider ${
                  confirmationData.bookingType?.toLowerCase().includes('booking.com') ? 'text-blue-700' :
                  confirmationData.bookingType?.toLowerCase().includes('airbnb') ? 'text-rose-600' :
                  confirmationData.bookingType?.toLowerCase().includes('web') ? 'text-emerald-700' :
                  'text-slate-900'
                }`}>
                  {confirmationData.bookingType?.toLowerCase().includes('booking.com') ? 'Create Booking.com Reservation' :
                   confirmationData.bookingType?.toLowerCase().includes('airbnb') ? 'Create Airbnb Reservation' :
                   confirmationData.bookingType?.toLowerCase().includes('web') ? 'Create Web Reservation' :
                   'Generate Confirmation Slip'}
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  {confirmationData.bookingType?.toLowerCase().includes('direct') 
                    ? 'Customize reservation parameters before printing/saving to PDF' 
                    : `Fill out and save guest booking details for ${confirmationData.bookingType}`}
                </p>
              </div>
              <button 
                onClick={() => setShowConfirmationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handlePrintConfirmation(); }} className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1.5 col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isCreatingNewReservation ? 'Client Name' : 'Client Name (Prefilled)'}
                </label>
                <input 
                  type="text" 
                  disabled={!isCreatingNewReservation} 
                  value={isCreatingNewReservation ? confirmationData.guestName : (selectedReg?.guestName || '')}
                  onChange={(e) => isCreatingNewReservation && setConfirmationData({...confirmationData, guestName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none disabled:text-slate-400"
                />
              </div>

               {confirmationData.bookingType?.toLowerCase().includes('direct') ? (
                 <>
                   {isCreatingNewReservation && (
                     <>
                       <div className="space-y-1.5 col-span-2">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reservation ID / Booking Number</label>
                         <input 
                           type="text" 
                           value={confirmationData.bookingNumber}
                           onChange={(e) => handleBookingNumberChange(e.target.value, confirmationData.bookingType)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none font-mono"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-in Date</label>
                         <input 
                           type="date" 
                           value={confirmationData.checkInDate}
                           onChange={(e) => {
                             const checkIn = e.target.value;
                             const checkOut = confirmationData.checkOutDate;
                             let stayNights = confirmationData.nights;
                             if (checkIn && checkOut) {
                               stayNights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
                             }
                             setConfirmationData({
                               ...confirmationData, 
                               checkInDate: checkIn,
                               nights: stayNights,
                               totalPrice: (parseFloat(confirmationData.unitPrice || 0) * stayNights).toFixed(2)
                             });
                           }}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-out Date</label>
                         <input 
                           type="date" 
                           value={confirmationData.checkOutDate}
                           onChange={(e) => {
                             const checkOut = e.target.value;
                             const checkIn = confirmationData.checkInDate;
                             let stayNights = confirmationData.nights;
                             if (checkIn && checkOut) {
                               stayNights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
                             }
                             setConfirmationData({
                               ...confirmationData, 
                               checkOutDate: checkOut,
                               nights: stayNights,
                               totalPrice: (parseFloat(confirmationData.unitPrice || 0) * stayNights).toFixed(2)
                             });
                           }}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stay Nights</label>
                         <input 
                           type="number" 
                           value={confirmationData.nights}
                           onChange={(e) => {
                             const stayNights = parseInt(e.target.value) || 1;
                             setConfirmationData({
                               ...confirmationData, 
                               nights: stayNights,
                               totalPrice: (parseFloat(confirmationData.unitPrice || 0) * stayNights).toFixed(2)
                             });
                           }}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adults Count</label>
                         <input 
                           type="number" 
                           value={confirmationData.adults}
                           onChange={(e) => setConfirmationData({...confirmationData, adults: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Children Count</label>
                         <input 
                           type="number" 
                           value={confirmationData.children}
                           onChange={(e) => setConfirmationData({...confirmationData, children: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Board Basis</label>
                         <select 
                           value={confirmationData.boardBasis}
                           onChange={(e) => setConfirmationData({...confirmationData, boardBasis: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                         >
                           <option value="Room Only">Room Only</option>
                           <option value="Bed & Breakfast">Bed & Breakfast</option>
                           <option value="Half Board">Half Board</option>
                           <option value="Full Board">Full Board</option>
                         </select>
                       </div>

                       <div className="space-y-1.5 relative col-span-2">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room Number(s)</label>
                         <div className="relative">
                           <button
                             type="button"
                             onClick={() => setIsModalRoomDropdownOpen(!isModalRoomDropdownOpen)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 text-xs text-left flex justify-between items-center cursor-pointer"
                           >
                             <span className="truncate">{confirmationData.room ? (confirmationData.room.startsWith('Room') ? confirmationData.room : `Room ${confirmationData.room}`) : 'Select Rooms...'}</span>
                             <span className="text-[9px] text-slate-400 font-bold ml-1">▼</span>
                           </button>

                           {isModalRoomDropdownOpen && (
                             <>
                               <div className="fixed inset-0 z-10" onClick={() => setIsModalRoomDropdownOpen(false)}></div>
                               <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto p-1 space-y-0.5 select-none">
                                 {rooms.map((room) => {
                                   const roomNumbers = confirmationData.room ? confirmationData.room.split(',').map(r => r.trim()) : [];
                                   const isChecked = roomNumbers.includes(room.roomNumber);
                                   return (
                                     <label 
                                       key={room.id} 
                                       className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs text-slate-700 font-medium"
                                     >
                                       <input 
                                         type="checkbox"
                                         checked={isChecked}
                                         onChange={() => {
                                           let newRooms;
                                           if (isChecked) {
                                             newRooms = roomNumbers.filter(r => r !== room.roomNumber);
                                           } else {
                                             newRooms = [...roomNumbers, room.roomNumber];
                                           }
                                           const roomString = newRooms.join(', ');
                                           
                                           // Re-build allocatedRooms and recalculate price sum
                                           const currentAllocated = confirmationData.allocatedRooms || [];
                                           const newAllocated = newRooms.map(rNum => {
                                             const existing = currentAllocated.find(ca => ca.roomNumber === rNum);
                                             const matchedR = rooms.find(rm => rm.roomNumber === rNum);
                                             return {
                                               roomType: matchedR ? matchedR.roomType : (confirmationData.roomType || 'Deluxe Room'),
                                               roomNumber: rNum,
                                               price: existing ? existing.price : '0.00'
                                             };
                                           });

                                           const totalSum = newAllocated.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
                                           const rate = parseFloat(confirmationData.exchangeRate) || 1;

                                           const firstSelectedRoomNum = newRooms[0];
                                           const matchedRoom = rooms.find(r => r.roomNumber === firstSelectedRoomNum);
                                           let newRoomType = '';
                                           if (matchedRoom) {
                                             let mappedType = matchedRoom.roomType;
                                             if (mappedType.toLowerCase().includes('deluxe')) mappedType = 'Deluxe Room';
                                             else if (mappedType.toLowerCase().includes('suite')) mappedType = 'Suite Room';
                                             else if (mappedType.toLowerCase().includes('standard')) mappedType = 'Standard Room';
                                             else if (mappedType.toLowerCase().includes('budget')) mappedType = 'Budget Room';
                                             newRoomType = mappedType;
                                           }

                                           setConfirmationData({
                                             ...confirmationData,
                                             room: roomString,
                                             roomType: newRoomType,
                                             allocatedRooms: newAllocated,
                                             totalPrice: (totalSum * rate).toFixed(2)
                                           });
                                         }}
                                         className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                       />
                                       <span>{room.roomNumber} - {room.roomType} ({room.status})</span>
                                     </label>
                                   );
                                 })}
                               </div>
                             </>
                           )}
                         </div>
                       </div>
                       
                        {confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0 && (
                          <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Room Allocations & Prices</label>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Table Currency:</span>
                                <select
                                  value={confirmationData.tableCurrency || 'USD'}
                                  onChange={(e) => {
                                    const newTableCurr = e.target.value;
                                    setConfirmationData({
                                      ...confirmationData,
                                      tableCurrency: newTableCurr
                                    });
                                  }}
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
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                    <th className="pb-1.5 font-semibold">Room Name</th>
                                    <th className="pb-1.5 font-semibold">Room Number</th>
                                    <th className="pb-1.5 font-semibold w-36 text-right">Price ({confirmationData.tableCurrency || 'USD'})</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {confirmationData.allocatedRooms.map((item, idx) => (
                                    <tr key={idx} className="text-slate-700">
                                      <td className="py-2 pr-2 font-medium">{item.roomType}</td>
                                      <td className="py-2 pr-2 font-mono font-bold text-slate-900">{item.roomNumber}</td>
                                      <td className="py-1 text-right">
                                        <div className="inline-flex items-center gap-1.5 justify-end">
                                          <span className="text-[10px] text-slate-400 font-bold font-mono">{confirmationData.tableCurrency || 'USD'}</span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const updatedAllocated = [...confirmationData.allocatedRooms];
                                              updatedAllocated[idx] = {
                                                ...updatedAllocated[idx],
                                                price: val
                                              };
                                              const tableSum = updatedAllocated.reduce((sum, itm) => sum + (parseFloat(itm.price) || 0), 0);
                                              const rate = parseFloat(confirmationData.exchangeRate) || 1;
                                              setConfirmationData({
                                                ...confirmationData,
                                                allocatedRooms: updatedAllocated,
                                                totalPrice: (tableSum * rate).toFixed(2)
                                              });
                                            }}
                                            className="w-24 bg-white border border-slate-200 rounded-md px-2 py-1 text-right text-slate-800 focus:outline-none font-bold font-mono text-xs"
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="border-t-2 border-slate-200 text-slate-900 font-bold bg-slate-100/50">
                                    <td className="py-2.5 pl-2 font-bold" colSpan={2}>Total Sum</td>
                                    <td className="py-2.5 pr-2 text-right font-mono font-bold text-slate-900">
                                      {confirmationData.tableCurrency || 'USD'} {(() => {
                                        const tableSum = confirmationData.allocatedRooms ? confirmationData.allocatedRooms.reduce((sum, itm) => sum + (parseFloat(itm.price) || 0), 0) : 0;
                                        return tableSum.toFixed(2);
                                      })()}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Email</label>
                      <input 
                        type="email" 
                        value={confirmationData.email}
                        onChange={(e) => setConfirmationData({...confirmationData, email: e.target.value})}
                        placeholder="e.g. client@email.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
                      <input 
                        type="text" 
                        value={confirmationData.whatsappNumber || ''}
                        onChange={(e) => setConfirmationData({...confirmationData, whatsappNumber: e.target.value})}
                        placeholder="e.g. +94771234567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Country</label>
                      <select 
                        value={confirmationData.nationality || ''}
                        onChange={(e) => setConfirmationData({...confirmationData, nationality: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Country</option>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="Russia">Russia</option>
                        <option value="France">France</option>
                        <option value="India">India</option>
                        <option value="Australia">Australia</option>
                        <option value="China">China</option>
                        <option value="Maldives">Maldives</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="Italy">Italy</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Japan">Japan</option>
                        <option value="Ukraine">Ukraine</option>
                        <option value="Poland">Poland</option>
                        <option value="Spain">Spain</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Currency */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</label>
                      <select 
                        value={confirmationData.currency}
                        onChange={(e) => {
                          const curr = e.target.value;
                          const usdSum = confirmationData.allocatedRooms ? confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) : 0;
                          const rate = parseFloat(confirmationData.exchangeRate) || 1;
                          setConfirmationData({
                            ...confirmationData,
                            currency: curr,
                            totalPrice: (usdSum * rate).toFixed(2)
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="USD">USD</option>
                        <option value="LKR">LKR</option>
                        <option value="EUR">EUR</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>

                    {/* Currency Rate */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency Rate</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={confirmationData.exchangeRate}
                        onChange={(e) => {
                          const rateVal = e.target.value;
                          const rate = parseFloat(rateVal) || 1;
                          const usdSum = confirmationData.allocatedRooms ? confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) : 0;
                          setConfirmationData({
                            ...confirmationData,
                            exchangeRate: rateVal,
                            totalPrice: (usdSum * rate).toFixed(2)
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none font-medium"
                      />
                    </div>

                    {/* Total Price (LKR) */}
                    <div className="space-y-1.5 col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Price (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-450 font-bold text-xs select-none">LKR</span>
                        <input 
                          type="number" 
                          readOnly
                          disabled
                          value={confirmationData.totalPrice}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-slate-500 cursor-not-allowed font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reservation Status</label>
                      <select 
                        value={confirmationData.reservationStatus}
                        onChange={(e) => setConfirmationData({...confirmationData, reservationStatus: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                      >
                        <option value="Confirm Booking">Confirm Booking</option>
                        <option value="Pending Booking">Pending Booking</option>
                      </select>
                    </div>



                    <div className="space-y-1.5 col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sender Name (Best Regards)</label>
                      <input 
                        type="text" 
                        value={confirmationData.senderName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfirmationData({ ...confirmationData, senderName: val });
                          localStorage.setItem('pms_sender_name', val);
                        }}
                        placeholder="e.g. Muthuni Weerasingha"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Special Notes</label>
                      <input 
                        type="text" 
                        value={confirmationData.remarks}
                        onChange={(e) => setConfirmationData({...confirmationData, remarks: e.target.value})}
                        placeholder="e.g. Special notes or instructions"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                      />
                    </div>
                        </>
                      )}
                    </>
               ) : (
                 <>
                   {/* Booking Number */}
                   <div className="space-y-1.5 col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Number</label>
                     <input 
                       type="text" 
                       value={confirmationData.bookingNumber}
                       onChange={(e) => handleBookingNumberChange(e.target.value, confirmationData.bookingType)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none font-mono"
                     />
                   </div>

                   {/* Check-in Date */}
                   <div className="space-y-1.5">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-in Date</label>
                     <input 
                       type="date" 
                       value={confirmationData.checkInDate}
                       onChange={(e) => {
                         const checkIn = e.target.value;
                         const checkOut = confirmationData.checkOutDate;
                         let stayNights = confirmationData.nights;
                         if (checkIn && checkOut) {
                           stayNights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
                         }
                         setConfirmationData({
                           ...confirmationData, 
                           checkInDate: checkIn,
                           nights: stayNights
                         });
                       }}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                     />
                   </div>

                   {/* Check-out Date */}
                   <div className="space-y-1.5">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-out Date</label>
                     <input 
                       type="date" 
                       value={confirmationData.checkOutDate}
                       onChange={(e) => {
                         const checkOut = e.target.value;
                         const checkIn = confirmationData.checkInDate;
                         let stayNights = confirmationData.nights;
                         if (checkIn && checkOut) {
                           stayNights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
                         }
                         setConfirmationData({
                           ...confirmationData, 
                           checkOutDate: checkOut,
                           nights: stayNights
                         });
                       }}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                     />
                   </div>

                   {/* Number of Nights */}
                   <div className="space-y-1.5">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number of Nights</label>
                     <input 
                       type="number" 
                       disabled={true}
                       value={confirmationData.nights}
                       className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed font-medium"
                     />
                   </div>

                   {/* Adults Count */}
                   <div className="space-y-1.5">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adults Count</label>
                     <input 
                       type="number" 
                       value={confirmationData.adults}
                       onChange={(e) => setConfirmationData({...confirmationData, adults: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                     />
                   </div>

                   {/* Children Count */}
                   <div className="space-y-1.5">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Children Count</label>
                     <input 
                       type="number" 
                       value={confirmationData.children}
                       onChange={(e) => setConfirmationData({...confirmationData, children: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                     />
                   </div>

                   {/* Basic Type */}
                   <div className="space-y-1.5">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Type</label>
                     <select 
                       value={confirmationData.boardBasis}
                       onChange={(e) => setConfirmationData({...confirmationData, boardBasis: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                     >
                       <option value="Room Only">Room Only</option>
                       <option value="Bed & Breakfast">Bed & Breakfast</option>
                       <option value="Half Board">Half Board</option>
                       <option value="Full Board">Full Board</option>
                     </select>
                   </div>

                   {/* Room Name Dropdown (Multiple-Select) */}
                   <div className="space-y-1.5 relative col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room Number(s)</label>
                     <div className="relative">
                       <button
                         type="button"
                         onClick={() => setIsModalRoomNameDropdownOpen(!isModalRoomNameDropdownOpen)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 text-xs text-left flex justify-between items-center cursor-pointer"
                       >
                         <span className="truncate">{confirmationData.room ? (confirmationData.room.startsWith('Room') ? confirmationData.room : `Room ${confirmationData.room}`) : 'Select Rooms...'}</span>
                         <span className="text-[9px] text-slate-400 font-bold ml-1">▼</span>
                       </button>

                       {isModalRoomNameDropdownOpen && (
                         <>
                           <div className="fixed inset-0 z-10" onClick={() => setIsModalRoomNameDropdownOpen(false)}></div>
                           <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto p-1 space-y-0.5 select-none">
                             {uniqueRoomTypes.map((type, idx) => {
                               const selectedTypes = confirmationData.roomType ? confirmationData.roomType.split(',').map(t => t.trim()) : [];
                               const isChecked = selectedTypes.includes(type);
                               return (
                                 <div
                                   key={idx}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     let newTypes;
                                     if (isChecked) {
                                       newTypes = selectedTypes.filter(t => t !== type);
                                     } else {
                                       newTypes = [...selectedTypes, type];
                                     }
                                     const typeString = newTypes.join(', ');
                                     
                                     // Automatically calculate corresponding room numbers
                                     const matchedRooms = rooms.filter(r => newTypes.includes(r.roomType));
                                     const roomNumbers = matchedRooms.map(r => r.roomNumber);
                                     const uniqueRoomNumbers = Array.from(new Set(roomNumbers));
                                     const roomString = uniqueRoomNumbers.join(', ');

                                     // Build/update allocatedRooms array with prices preserved
                                     const currentAllocated = confirmationData.allocatedRooms || [];
                                     const newAllocated = matchedRooms.map(r => {
                                       const existing = currentAllocated.find(ca => ca.roomNumber === r.roomNumber);
                                       return {
                                         roomType: r.roomType,
                                         roomNumber: r.roomNumber,
                                         price: existing ? existing.price : '0.00'
                                       };
                                     });
                                     
                                     const totalSum = newAllocated.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
                                     
                                     setConfirmationData({
                                       ...confirmationData,
                                       roomType: typeString,
                                       room: roomString,
                                       allocatedRooms: newAllocated,
                                       totalPrice: totalSum.toFixed(2)
                                     });
                                   }}
                                   className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs text-slate-700 font-medium"
                                 >
                                   <input
                                     type="checkbox"
                                     checked={isChecked}
                                     readOnly
                                     className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 pointer-events-none"
                                   />
                                   <span>{type}</span>
                                 </div>
                               );
                             })}
                           </div>
                         </>
                       )}
                     </div>
                   </div>

                   {/* Room Price Breakdown Table */}
                   {confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0 && (
                     <div className="col-span-2 mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                       <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                         <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Room Allocations & Prices</label>
                         <div className="flex items-center gap-1.5">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Table Currency:</span>
                           <select
                             value={confirmationData.tableCurrency || 'LKR'}
                             onChange={(e) => {
                               const newTableCurr = e.target.value;
                               setConfirmationData({
                                 ...confirmationData,
                                 tableCurrency: newTableCurr
                               });
                             }}
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
                         <table className="w-full text-left text-xs">
                           <thead>
                             <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                               <th className="pb-1.5 font-semibold">Room Name</th>
                               <th className="pb-1.5 font-semibold">Room Number</th>
                               <th className="pb-1.5 font-semibold w-36 text-right">Price ({confirmationData.tableCurrency || 'LKR'})</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {confirmationData.allocatedRooms.map((item, idx) => (
                                <tr key={idx} className="text-slate-700">
                                  <td className="py-2 pr-2 font-medium">{item.roomType}</td>
                                  <td className="py-2 pr-2 font-mono font-bold text-slate-900">{item.roomNumber}</td>
                                  <td className="py-1 text-right">
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      <span className="text-[10px] text-slate-400 font-bold font-mono">{confirmationData.tableCurrency || 'LKR'}</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={item.price}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const updatedAllocated = [...confirmationData.allocatedRooms];
                                          updatedAllocated[idx] = {
                                            ...updatedAllocated[idx],
                                            price: val
                                          };
                                          const tableSum = updatedAllocated.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
                                          const rate = parseFloat(confirmationData.exchangeRate) || 1;
                                          setConfirmationData({
                                            ...confirmationData,
                                            allocatedRooms: updatedAllocated,
                                            totalPrice: (tableSum * rate).toFixed(2)
                                          });
                                        }}
                                        className="w-24 bg-white border border-slate-200 rounded-md px-2 py-1 text-right text-slate-800 focus:outline-none font-bold font-mono text-xs"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {/* Total row at the bottom of the table */}
                              <tr className="border-t-2 border-slate-200 text-slate-900 font-bold bg-slate-100/50">
                                <td className="py-2.5 pl-2 font-bold" colSpan={2}>Total Sum</td>
                                <td className="py-2.5 pr-2 text-right font-mono font-bold text-slate-900">
                                  {confirmationData.tableCurrency || 'LKR'} {(() => {
                                    const tableSum = confirmationData.allocatedRooms ? confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) : 0;
                                    return tableSum.toFixed(2);
                                  })()}
                                </td>
                              </tr>
                            </tbody>
                         </table>
                       </div>
                     </div>
                   )}                   {/* Currency */}
                   <div className="space-y-1.5 col-span-1">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</label>
                     <select 
                       value={confirmationData.currency}
                       onChange={(e) => {
                         const curr = e.target.value;
                         const usdSum = confirmationData.allocatedRooms ? confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) : 0;
                         const rate = parseFloat(confirmationData.exchangeRate) || 1;
                         setConfirmationData({
                           ...confirmationData,
                           currency: curr,
                           totalPrice: (usdSum * rate).toFixed(2)
                         });
                       }}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none cursor-pointer"
                     >
                       <option value="USD">USD</option>
                       <option value="LKR">LKR</option>
                       <option value="EUR">EUR</option>
                       <option value="AUD">AUD</option>
                     </select>
                   </div>

                   {/* Currency Rate */}
                   <div className="space-y-1.5 col-span-1">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency Rate</label>
                     <input 
                       type="number" 
                       step="0.01"
                       value={confirmationData.exchangeRate}
                       onChange={(e) => {
                         const rateVal = e.target.value;
                         const rate = parseFloat(rateVal) || 1;
                         const usdSum = confirmationData.allocatedRooms ? confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) : 0;
                         setConfirmationData({
                           ...confirmationData,
                           exchangeRate: rateVal,
                           totalPrice: (usdSum * rate).toFixed(2)
                         });
                       }}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none font-medium"
                     />
                   </div>

                   {/* Total Price */}
                   <div className="space-y-1.5 col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Price (LKR)</label>
                     <div className="relative">
                       <span className="absolute left-3 top-2 text-slate-450 font-bold text-xs select-none">LKR</span>
                       <input 
                         type="number" 
                         readOnly
                         disabled
                         value={confirmationData.totalPrice}
                         className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-slate-500 cursor-not-allowed font-bold font-mono"
                       />
                     </div>
                   </div>

                   {/* WhatsApp Number */}
                   <div className="space-y-1.5 col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
                     <input 
                       type="text" 
                       value={confirmationData.whatsappNumber || ''}
                       onChange={(e) => setConfirmationData({...confirmationData, whatsappNumber: e.target.value})}
                       placeholder="e.g. +94771234567"
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                     />
                   </div>

                    {/* Sender Name */}
                    <div className="space-y-1.5 col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sender Name (Best Regards)</label>
                      <input 
                        type="text" 
                        value={confirmationData.senderName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfirmationData({ ...confirmationData, senderName: val });
                          localStorage.setItem('pms_sender_name', val);
                        }}
                        placeholder="e.g. Muthuni Weerasingha"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none font-semibold"
                      />
                    </div>

                   {/* Remarks */}
                   <div className="space-y-1.5 col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks</label>
                     <input 
                       type="text" 
                       value={confirmationData.remarks}
                       onChange={(e) => setConfirmationData({...confirmationData, remarks: e.target.value})}
                       placeholder="e.g. Booking.com no is 5165813303"
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                     />
                   </div>
                 </>
               )}

              <div className="col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowConfirmationModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                {!confirmationData.bookingType?.toLowerCase().includes('direct') && (
                  <button 
                    type="button" 
                    onClick={handleDownloadDraftBill}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <FileText size={13} /> Draft Bill
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : confirmationData.bookingType?.toLowerCase().includes('direct') ? (
                    <>
                      <Printer size={13} /> Print / Save PDF
                    </>
                  ) : (
                    <>
                      <Check size={13} /> Save Reservation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Draft Bill Preview Modal */}
      {showDraftPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Draft Bill Preview
              </h3>
              <button
                onClick={() => setShowDraftPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-6 flex justify-center">
              <div className="bg-white shadow-sm border border-slate-150 rounded-lg p-2 max-w-[760px] w-full">
                <ReservationConfirmationPrint
                  confirmationData={confirmationData}
                  selectedReg={isCreatingNewReservation ? null : selectedReg}
                  associatedBooking={isCreatingNewReservation ? null : associatedBooking}
                  payments={isCreatingNewReservation ? [] : advancePayments}
                  forceLkr={forceLkr}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {(() => {
                const draftBookingCurr = isCreatingNewReservation ? (confirmationData.currency || 'USD') : ((associatedBooking?.currency && associatedBooking?.currency !== 'LKR') ? associatedBooking.currency : (associatedBooking?.tableCurrency || 'USD'));
                return (
                  <>
                    <button
                      onClick={() => {
                        setForceLkr(true);
                        setTimeout(() => {
                          window.print();
                          setForceLkr(false);
                        }, 200);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-blue-500/10 text-xs"
                    >
                      <Printer size={13} /> Print in LKR
                    </button>
                    {draftBookingCurr !== 'LKR' && (
                      <button
                        onClick={() => {
                          setForceLkr(false);
                          setTimeout(() => {
                            window.print();
                          }, 150);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-emerald-500/10 text-xs"
                      >
                        <Printer size={13} /> Print in {draftBookingCurr}
                      </button>
                    )}
                  </>
                );
              })()}
              <button
                onClick={() => setShowDraftPreviewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Slip Modal Image Preview */}
      {selectedSlipPreview && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 flex flex-col space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="text-emerald-600" size={16} />
                  Bank Payment Slip - {selectedSlipPreview.paymentType}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Paid Date: {selectedSlipPreview.paidDate} | {BANK_ACCOUNTS[selectedSlipPreview.bankKey]?.bankName || ''} (Acc: {BANK_ACCOUNTS[selectedSlipPreview.bankKey]?.accountNumber || ''})
                </p>
              </div>
              <button
                onClick={() => setSelectedSlipPreview(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto max-h-[70vh] border border-slate-200 rounded-xl bg-slate-50 p-3 flex justify-center items-center">
              {selectedSlipPreview.slipUrl?.startsWith('data:application/pdf') ? (
                <iframe src={selectedSlipPreview.slipUrl} className="w-full h-[500px] rounded-lg" title="PDF Slip" />
              ) : (
                <img src={selectedSlipPreview.slipUrl} alt="Bank Slip" className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm" />
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <a
                href={selectedSlipPreview.slipUrl}
                download={selectedSlipPreview.fileName || 'bank_slip.png'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Download size={13} /> Download Slip
              </a>
              <button
                onClick={() => setSelectedSlipPreview(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for html2pdf direct download */}
      {showDirectDownloadContainer && (
        <div style={{ position: 'fixed', left: '0px', top: '0px', width: '0px', height: '0px', overflow: 'hidden', zIndex: '-9999', pointerEvents: 'none' }}>
          <div 
            id="direct-pdf-download-container" 
            style={{ 
              width: '800px', 
              background: 'white',
              padding: '24px',
              color: '#0f172a'
            }}
          >
            <ReservationConfirmationPrint
              confirmationData={confirmationData}
              selectedReg={isCreatingNewReservation ? null : selectedReg}
              associatedBooking={isCreatingNewReservation ? null : associatedBooking}
              payments={isCreatingNewReservation ? [] : advancePayments}
            />
          </div>
        </div>
      )}

      {/* Print-only layout */}
      <div className="print-only">
        {showAdvanceModal && (
          <AdvanceRequestPrint
            ref={advancePrintRef}
            advanceData={advanceFormData}
            selectedReg={selectedReg}
            associatedBooking={associatedBooking}
          />
        )}
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
        {showConfirmationModal && (
          <ReservationConfirmationPrint
            ref={confirmationPrintRef}
            confirmationData={confirmationData}
            selectedReg={isCreatingNewReservation ? null : selectedReg}
            associatedBooking={isCreatingNewReservation ? null : associatedBooking}
            payments={isCreatingNewReservation ? [] : advancePayments}
            forceLkr={forceLkr}
          />
        )}
      </div>
    </div>
  );
};

export default Reservations;
