import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  CreditCard, 
  Percent, 
  FileText, 
  CheckCircle2,
  FileCheck,
  Plus
} from 'lucide-react';

const Bookings = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initialAllocation = location.state?.allocateFromReg || null;

  const [bookings, setBookings] = useState([
    {
      id: 501,
      bookingNumber: 'SV-2026-0001',
      guestName: 'Liam Johnson',
      roomNumber: '101',
      roomType: 'Deluxe Ocean View',
      checkInDate: '2026-06-18',
      checkOutDate: '2026-06-25',
      nights: 7,
      boardBasis: 'Full Board',
      bookingType: 'Direct',
      totalAmount: 140000,
      advancePaid: 40000,
      paymentSlipUploaded: true,
      discountRequested: false,
      discountApproved: false,
      discountAmount: 0,
      paymentStatus: 'Partial',
      status: 'Confirmed'
    },
    {
      id: 502,
      bookingNumber: 'SV-2026-0002',
      guestName: 'Hiroshi Tanaka',
      roomNumber: '201',
      roomType: 'Tropical Plunge Suite',
      checkInDate: '2026-06-22',
      checkOutDate: '2026-06-28',
      nights: 6,
      boardBasis: 'Room Only',
      bookingType: 'Booking.com',
      totalAmount: 180000,
      advancePaid: 0,
      paymentSlipUploaded: false,
      discountRequested: true,
      discountApproved: false,
      discountAmount: 15000,
      discountReason: 'Loyalty guest request',
      paymentStatus: 'Unpaid',
      status: 'Confirmed'
    }
  ]);

  const [allocationForm, setAllocationForm] = useState(initialAllocation ? {
    guestName: initialAllocation.guestName,
    checkInDate: initialAllocation.checkInDate,
    checkOutDate: initialAllocation.checkOutDate,
    bookingNumber: 'SV-' + Date.now().toString().slice(-6),
    roomNumber: '101',
    boardBasis: 'Room Only',
    bookingType: 'Direct',
    totalAmount: 100000,
    remarks: '',
  } : null);

  const [advancePaymentForm, setAdvancePaymentForm] = useState(null);
  const [discountRequestForm, setDiscountRequestForm] = useState(null);
  const [invoiceView, setInvoiceView] = useState(null);
  const [receiptView, setReceiptView] = useState(null);

  const handleCreateBooking = (e) => {
    e.preventDefault();
    const start = new Date(allocationForm.checkInDate);
    const end = new Date(allocationForm.checkOutDate);
    const nightsCalculated = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

    const newBooking = {
      id: Date.now(),
      bookingNumber: allocationForm.bookingNumber,
      guestName: allocationForm.guestName,
      roomNumber: allocationForm.roomNumber,
      roomType: allocationForm.roomNumber.startsWith('2') ? 'Tropical Plunge Suite' : 'Deluxe Ocean View',
      checkInDate: allocationForm.checkInDate,
      checkOutDate: allocationForm.checkOutDate,
      nights: nightsCalculated,
      boardBasis: allocationForm.boardBasis,
      bookingType: allocationForm.bookingType,
      totalAmount: parseFloat(allocationForm.totalAmount),
      advancePaid: 0,
      paymentSlipUploaded: false,
      discountRequested: false,
      discountApproved: false,
      discountAmount: 0,
      paymentStatus: 'Unpaid',
      status: 'Confirmed'
    };

    setBookings([newBooking, ...bookings]);
    setAllocationForm(null);
  };

  const handleUploadAdvance = (e) => {
    e.preventDefault();
    const { bookingId, amount, file } = advancePaymentForm;
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          advancePaid: parseFloat(amount),
          paymentSlipUploaded: !!file,
          paymentStatus: 'Partial'
        };
      }
      return b;
    }));
    
    const targetBooking = bookings.find(b => b.id === bookingId);
    setReceiptView({
      receiptNumber: 'REC-' + Date.now().toString().slice(-6),
      guestName: targetBooking.guestName,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      bookingNumber: targetBooking.bookingNumber,
    });

    setAdvancePaymentForm(null);
  };

  const handleRequestDiscount = (e) => {
    e.preventDefault();
    const { bookingId, amount, reason } = discountRequestForm;
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          discountRequested: true,
          discountApproved: false,
          discountAmount: parseFloat(amount),
          discountReason: reason
        };
      }
      return b;
    }));
    setDiscountRequestForm(null);
  };

  const handleCheckoutPayment = (booking, scenario) => {
    let finalPaid = booking.totalAmount;
    if (booking.discountApproved) {
      finalPaid -= booking.discountAmount;
    }
    
    setBookings(prev => prev.map(b => {
      if (b.id === booking.id) {
        return {
          ...b,
          advancePaid: finalPaid,
          paymentStatus: 'Paid'
        };
      }
      return b;
    }));

    setInvoiceView({
      invoiceNumber: 'INV-' + (1000 + booking.id % 1000),
      date: new Date().toISOString().split('T')[0],
      guestName: booking.guestName,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      roomName: `Room ${booking.roomNumber} (${booking.roomType})`,
      nights: booking.nights,
      paymentMethod: scenario === 2 ? 'Full Payment Check-In' : 'Checkout Settlement',
      description: `${booking.boardBasis} package stay`,
      amount: finalPaid,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Booking Management</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Assign rooms, board basis, and trigger payments</p>
      </div>

      {allocationForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Complete Booking for {allocationForm.guestName}</h3>
            <button onClick={() => setAllocationForm(null)} className="text-xs text-rose-600 font-bold hover:underline">Cancel</button>
          </div>
          <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-650">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Booking Number</label>
              <input 
                type="text" 
                value={allocationForm.bookingNumber} 
                onChange={(e) => setAllocationForm({...allocationForm, bookingNumber: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assign Room</label>
              <select 
                value={allocationForm.roomNumber}
                onChange={(e) => setAllocationForm({...allocationForm, roomNumber: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="101">Room 101 - Deluxe Ocean View</option>
                <option value="103">Room 103 - Deluxe Ocean View</option>
                <option value="201">Room 201 - Tropical Plunge Suite</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Board Basis</label>
              <select 
                value={allocationForm.boardBasis}
                onChange={(e) => setAllocationForm({...allocationForm, boardBasis: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="Room Only">Room Only</option>
                <option value="Half Board">Half Board</option>
                <option value="Full Board">Full Board</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Booking Source</label>
              <select 
                value={allocationForm.bookingType}
                onChange={(e) => setAllocationForm({...allocationForm, bookingType: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="Direct">Direct Booking</option>
                <option value="Booking.com">Booking.com Reservation</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount (LKR)</label>
              <input 
                type="number" 
                value={allocationForm.totalAmount}
                onChange={(e) => setAllocationForm({...allocationForm, totalAmount: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
              <input 
                type="text" 
                value={allocationForm.remarks}
                onChange={(e) => setAllocationForm({...allocationForm, remarks: e.target.value})}
                placeholder="Remarks" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none" 
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm">
                Save & Allocate Room
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Booking Ref</th>
              <th className="p-4">Stay Info</th>
              <th className="p-4">Rates</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4">Discount</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50/20 transition">
                <td className="p-4">
                  <p className="font-bold text-slate-900 text-sm">{booking.bookingNumber}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{booking.guestName}</p>
                  <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                    {booking.bookingType}
                  </span>
                </td>
                <td className="p-4">
                  <p className="text-slate-800">Room {booking.roomNumber}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{booking.checkInDate} to {booking.checkOutDate}</p>
                  <p className="text-[10px] text-slate-500">{booking.nights} Nights</p>
                </td>
                <td className="p-4 font-mono">
                  <p className="text-slate-900">LKR {booking.totalAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-sans">{booking.boardBasis}</p>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    booking.paymentStatus === 'Paid' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/30' 
                      : booking.paymentStatus === 'Partial' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-100/30' 
                      : 'bg-rose-50 text-rose-800 border border-rose-100/30'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Paid: LKR {booking.advancePaid.toLocaleString()}</p>
                </td>
                <td className="p-4">
                  {booking.discountRequested ? (
                    <div>
                      <p className={`text-[10px] font-bold ${booking.discountApproved ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {booking.discountApproved ? 'Approved' : 'Pending'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">LKR {booking.discountAmount.toLocaleString()}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-normal">None</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {booking.paymentStatus !== 'Paid' && (
                      <button
                        onClick={() => setAdvancePaymentForm({ bookingId: booking.id, amount: '', file: null })}
                        className="py-1.5 px-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-emerald-700 font-bold transition"
                      >
                        + Advance
                      </button>
                    )}

                    {!booking.discountRequested && (
                      <button
                        onClick={() => setDiscountRequestForm({ bookingId: booking.id, amount: '', reason: '' })}
                        className="py-1.5 px-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-amber-700 font-bold transition"
                      >
                        % Discount
                      </button>
                    )}

                    {booking.paymentStatus !== 'Paid' ? (
                      <button
                        onClick={() => handleCheckoutPayment(booking, 3)}
                        className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-650 text-white font-bold transition"
                      >
                        Checkout
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckoutPayment(booking, 3)}
                        className="py-1.5 px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" /> Invoice
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Advance Payment Slip Modal */}
      {advancePaymentForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Record Advance Payment</h3>
            <form onSubmit={handleUploadAdvance} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Advance Amount (LKR)</label>
                <input 
                  type="number" 
                  required 
                  value={advancePaymentForm.amount}
                  onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, amount: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Slip</label>
                <input 
                  type="file" 
                  required
                  onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, file: e.target.files[0]})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setAdvancePaymentForm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-650 text-white rounded-xl font-bold">
                  Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Request Modal */}
      {discountRequestForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Request Discount</h3>
            <form onSubmit={handleRequestDiscount} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount Amount (LKR)</label>
                <input 
                  type="number" 
                  required 
                  value={discountRequestForm.amount}
                  onChange={(e) => setDiscountRequestForm({...discountRequestForm, amount: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason for Discount</label>
                <textarea 
                  required
                  rows="3"
                  value={discountRequestForm.reason}
                  onChange={(e) => setDiscountRequestForm({...discountRequestForm, reason: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDiscountRequestForm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-650 text-white rounded-xl font-bold">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptView && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm p-6 rounded-2xl shadow-xl relative border-t-8 border-emerald-600 font-mono text-[11px]">
            <div className="text-center space-y-1 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Serene Villa Pvt Ltd</h4>
              <p className="text-[9px] text-slate-405 font-bold uppercase">Advance Receipt</p>
            </div>
            <div className="space-y-2 border-y border-dashed border-slate-250 py-4 mb-6">
              <p><strong>Receipt No:</strong> {receiptView.receiptNumber}</p>
              <p><strong>Booking Ref:</strong> {receiptView.bookingNumber}</p>
              <p><strong>Date:</strong> {receiptView.date}</p>
              <p><strong>Guest:</strong> {receiptView.guestName}</p>
              <p className="text-sm font-bold text-emerald-700 mt-2"><strong>Amount Paid:</strong> LKR {parseFloat(receiptView.amount).toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-500">
              <span className="text-emerald-750 font-bold">Sent via WhatsApp</span>
              <button 
                onClick={() => setReceiptView(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg"
              >
                Close & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Invoice Modal */}
      {invoiceView && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-md p-6 rounded-2xl shadow-xl relative border-t-8 border-emerald-600 font-mono text-[11px]">
            <div className="text-center space-y-1 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Serene Villa Pvt Ltd</h4>
              <p className="text-[9px] text-slate-405 font-bold uppercase">Official Checkout Invoice</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 mb-4">
              <div>
                <p><strong>Invoice No:</strong> {invoiceView.invoiceNumber}</p>
                <p><strong>Date:</strong> {invoiceView.date}</p>
                <p><strong>Guest:</strong> {invoiceView.guestName}</p>
              </div>
              <div className="text-right">
                <p><strong>Check-In:</strong> {invoiceView.checkInDate}</p>
                <p><strong>Check-Out:</strong> {invoiceView.checkOutDate}</p>
                <p><strong>Nights:</strong> {invoiceView.nights}</p>
              </div>
            </div>

            <div className="border-b border-slate-200 pb-4 mb-4">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-2 text-[9px] uppercase text-slate-400">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between py-1">
                <span>{invoiceView.roomName} - {invoiceView.description}</span>
                <span>LKR {invoiceView.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-right space-y-1 text-sm font-bold border-b border-dashed border-slate-250 pb-4 mb-6">
              <p className="text-emerald-700">Total Settlement: LKR {invoiceView.amount.toLocaleString()}</p>
              <p className="text-[9px] text-slate-450 font-normal">Method: {invoiceView.paymentMethod}</p>
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-650 font-bold">
                <FileCheck className="h-4 w-4" /> Shared via WhatsApp
              </span>
              <button 
                onClick={() => setInvoiceView(null)}
                className="bg-emerald-600 hover:bg-emerald-650 text-white font-bold py-1.5 px-4 rounded-lg"
              >
                Close & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
