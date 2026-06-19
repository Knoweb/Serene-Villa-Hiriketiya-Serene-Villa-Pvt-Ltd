import React from 'react';
import logoImg from '../assets/logo.jpeg';
import { MapPin, Globe, Phone } from 'lucide-react';

const AdvanceReceiptPrint = React.forwardRef(({ receiptData, selectedPaymentForReceipt, selectedReg, associatedBooking }, ref) => {
  if (!receiptData || !selectedPaymentForReceipt || !selectedReg || !associatedBooking) return null;

  const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL';
  const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';
  const paidAmt = selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0;

  return (
    <div ref={ref} className="receipt-print-area text-slate-900 font-sans">
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
          <div className="inline-block border border-emerald-800/30 rounded-lg px-2.5 py-1.5 bg-emerald-50/20 text-[10px] text-left space-y-0.5 mt-1">
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

      {/* Header Information (Guest / Booking Details) */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 bg-slate-50/50 px-3 py-2 border border-slate-100 rounded-lg text-[11px]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-slate-550 font-bold uppercase tracking-wider text-[8px] w-20 shrink-0">Guest Name:</span>
          <span className="font-bold text-slate-855 border-b border-dashed border-slate-300 flex-1 pb-0.5">{selectedReg.guestName}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-slate-550 font-bold uppercase tracking-wider text-[8px] w-20 shrink-0">Booking No:</span>
          <span className="font-mono font-bold text-slate-855 border-b border-dashed border-slate-300 flex-1 pb-0.5">{associatedBooking.bookingNumber}</span>
        </div>
      </div>

      {/* Receipt Body: Table */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-slate-900 uppercase text-[8px] tracking-wider">
              <th className="border border-slate-300 px-2 py-1 text-center w-12">Qty</th>
              <th className="border border-slate-300 px-3 py-1 text-left">Description</th>
              <th className="border border-slate-300 px-3 py-1 text-right w-24">Rate (LKR)</th>
              <th className="border border-slate-300 px-3 py-1 text-right w-28">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody className="font-medium text-slate-700">
            <tr className="border-b border-slate-300">
              <td className="border-r border-slate-300 px-2 py-1.5 text-center">
                {selectedReg.numberOfNights || selectedReg.nights}
              </td>
              <td className="border-r border-slate-300 px-3 py-1.5">
                Accommodation ({selectedReg.checkInDate} - {selectedReg.checkOutDate})
              </td>
              <td className="border-r border-slate-300 px-3 py-1.5 text-right">
                {((associatedBooking.totalAmount || 0) / (selectedReg.numberOfNights || selectedReg.nights || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-1.5 text-right border-l border-slate-300">
                {(associatedBooking.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            <tr className="border-b border-slate-200 bg-slate-50/20">
              <td className="border-r border-slate-300 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-300 px-3 py-1 text-slate-500">
                <span className="font-bold text-[8px] uppercase tracking-wider mr-1.5 text-slate-400">Room Type:</span>
                <span className="font-bold text-slate-700">{associatedBooking.roomType}</span>
              </td>
              <td className="border-r border-slate-300 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-450 border-l border-slate-300">-</td>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50/20">
              <td className="border-r border-slate-300 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-300 px-3 py-1 text-slate-500">
                <span className="font-bold text-[8px] uppercase tracking-wider mr-1.5 text-slate-400">Room Number:</span>
                <span className="font-bold text-slate-700">{associatedBooking.roomNumber || 'TBD'}</span>
              </td>
              <td className="border-r border-slate-300 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-450 border-l border-slate-300">-</td>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50/20">
              <td className="border-r border-slate-300 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-300 px-3 py-1 text-slate-500">
                <span className="font-bold text-[8px] uppercase tracking-wider mr-1.5 text-slate-400">Board Basis:</span>
                <span className="font-bold text-slate-700">{associatedBooking.boardBasis || 'Room Only'}</span>
              </td>
              <td className="border-r border-slate-300 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-450 border-l border-slate-300">-</td>
            </tr>
            <tr className="border-b border-slate-300 bg-slate-50/20">
              <td className="border-r border-slate-300 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-300 px-3 py-1 text-slate-500">
                <span className="font-bold text-[8px] uppercase tracking-wider mr-1.5 text-slate-400">Booking Type:</span>
                <span className="font-bold text-slate-700">{associatedBooking.bookingType || 'Direct'}</span>
              </td>
              <td className="border-r border-slate-300 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-455 border-l border-slate-300">-</td>
            </tr>

            <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-300">
              <td className="border-r border-slate-300 px-2 py-1.5 text-center"></td>
              <td className="border-r border-slate-300 px-3 py-1.5 text-right uppercase text-[8px] tracking-wider">Total Value</td>
              <td className="border-r border-slate-300 px-3 py-1.5 text-right"></td>
              <td className="px-3 py-1.5 text-right border-l border-slate-300 text-slate-900">
                {(associatedBooking.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Advance Payment Calculations Section */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
        {/* Left Column: Extra notes / details if any */}
        <div className="border border-dashed border-slate-300 rounded-lg p-2.5 text-slate-500 flex flex-col justify-between">
          <div>
            <p className="font-bold text-[8px] uppercase tracking-wider mb-0.5 text-slate-450">Payment Reference</p>
            <p className="font-mono text-slate-700 font-bold">{selectedPaymentForReceipt.referenceNumber || 'N/A'}</p>
            {selectedPaymentForReceipt.remarks && (
              <p className="mt-1 text-[10px] leading-snug">
                <span className="font-bold">Remarks:</span> {selectedPaymentForReceipt.remarks}
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
        <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between pb-0.5 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Total Booking Amount:</span>
            <span className="font-bold text-slate-800">LKR {(associatedBooking.totalAmount || 0).toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between pb-0.5 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">{isFinalPayment ? 'Final Payment:' : 'Advance Paid:'}</span>
            <span className="font-bold text-slate-900">
              {selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency} {selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency}
            </span>
          </div>

          {(selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency) !== 'LKR' && (
            <>
              <div className="flex justify-between pb-0.5 border-b border-slate-200 text-[10px]">
                <span className="text-slate-500">Exchange Rate:</span>
                <span className="font-medium text-slate-700">{selectedPaymentForReceipt.exchangeRate}</span>
              </div>
              <div className="flex justify-between pb-0.5 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Converted Amount:</span>
                <span className="font-bold text-slate-900">
                  LKR {(selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0).toLocaleString()}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-1 font-bold text-sm border-t border-slate-300">
            <span className="text-slate-900 font-black text-xs">Remaining Balance:</span>
            <span className="font-mono text-xs text-slate-900">
              LKR {Math.max(0, (associatedBooking.totalAmount || 0) - (selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0)).toLocaleString()}
            </span>
          </div>
          {isFinalPayment && (
            <div className="text-center mt-1">
              <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">✓ FULLY PAID</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="flex justify-between items-end mt-16 pt-4 border-t border-slate-200">
        <div className="text-center w-48">
          <p className="border-b border-slate-300 pb-0.5 font-mono text-slate-400">...................................................</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Guest Signature</p>
        </div>
        
        <div className="text-center w-48">
          <p className="border-b border-slate-300 pb-0.5 font-mono text-slate-400">...................................................</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Received By</p>
        </div>
      </div>

      {/* Metadata / Timestamp */}
      <div className="flex justify-between text-[8px] text-slate-400 mt-10 pt-3 border-t border-slate-100">
        <span>Printed: {new Date().toLocaleString()}</span>
        <span>Staff: {receiptData.generatedBy || 'Front Office'}</span>
      </div>
    </div>
  );
});

AdvanceReceiptPrint.displayName = 'AdvanceReceiptPrint';

export default AdvanceReceiptPrint;
