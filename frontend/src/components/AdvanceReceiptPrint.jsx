import React from 'react';
import logoImg from '../assets/logo.jpeg';

const AdvanceReceiptPrint = React.forwardRef(({ receiptData, selectedPaymentForReceipt, selectedReg, associatedBooking }, ref) => {
  if (!receiptData || !selectedPaymentForReceipt || !selectedReg || !associatedBooking) return null;

  const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL';
  const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';
  const paidAmt = selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0;
  const currencyCode = selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency || 'LKR';
  const isLkr = currencyCode === 'LKR';

  // Format Dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div ref={ref} className="receipt-print-area text-black font-sans bg-white p-4">
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-3 mb-6">
        {/* Left Column: Logo & Hotel Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Serene Villa Logo" className="h-12 w-12 object-contain" />
            <div>
              <h2 className="text-xl font-black text-emerald-800 tracking-tight leading-none">Serene Villa</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">(Pvt) Ltd - Hiriketiya</p>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-700 leading-tight space-y-0.5 mt-2 font-medium">
            <p>Pehembiya Road, Hiriketiya, Dickwella.</p>
            <p>Email: Serenehiriketiya@gmail.com</p>
            <p>Hotline: +94 41 225 5204 / +94 70 499 8787</p>
          </div>
        </div>

        {/* Right Column: Title & Receipt Details Box */}
        <div className="text-right space-y-2">
          <h1 className="text-lg font-black tracking-wide uppercase text-emerald-800">
            {receiptTitle}
          </h1>
          {isFinalPayment && (
            <span className="inline-block bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              ✓ Fully Settled
            </span>
          )}
          <div className="inline-block border border-slate-300 rounded p-2 text-[10px] text-left space-y-1">
            <div className="flex gap-4 justify-between">
              <span className="text-slate-500 font-semibold">Receipt No:</span>
              <span className="font-mono font-bold text-slate-800">{receiptData.receiptNumber}</span>
            </div>
            <div className="flex gap-4 justify-between">
              <span className="text-slate-500 font-semibold">Date:</span>
              <span className="font-bold text-slate-800">{new Date(receiptData.generatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Details Section (Bordered single row) */}
      <div className="border border-slate-350 rounded mb-6 p-2 text-[11px] grid grid-cols-4 gap-4">
        <div>
          <span className="text-slate-500 font-semibold block text-[8px] uppercase tracking-wider">Guest Name</span>
          <span className="font-bold text-slate-800 block truncate">{selectedReg.guestName}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block text-[8px] uppercase tracking-wider">Booking Number</span>
          <span className="font-mono font-bold text-slate-800 block">{associatedBooking.bookingNumber}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block text-[8px] uppercase tracking-wider">Check-in / Check-out</span>
          <span className="font-bold text-slate-800 block text-[10px]">
            {formatDate(selectedReg.checkInDate)} to {formatDate(selectedReg.checkOutDate)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block text-[8px] uppercase tracking-wider">Stay Duration</span>
          <span className="font-bold text-slate-800 block">
            {selectedReg.numberOfNights || selectedReg.nights || 0} Nights
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-slate-350 text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-slate-900 uppercase text-[8px] tracking-wider border-b border-slate-350">
              <th className="border-r border-slate-350 px-2 py-1 text-center w-12">Qty</th>
              <th className="border-r border-slate-350 px-3 py-1 text-left">Description</th>
              <th className="border-r border-slate-350 px-3 py-1 text-right w-24">Rate (LKR)</th>
              <th className="px-3 py-1 text-right w-28">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody className="font-medium text-slate-700">
            <tr className="border-b border-slate-350">
              <td className="border-r border-slate-350 px-2 py-1.5 text-center">
                {selectedReg.numberOfNights || selectedReg.nights}
              </td>
              <td className="border-r border-slate-350 px-3 py-1.5">
                Accommodation ({formatDate(selectedReg.checkInDate)} - {formatDate(selectedReg.checkOutDate)})
              </td>
              <td className="border-r border-slate-350 px-3 py-1.5 text-right">
                {((associatedBooking.totalAmount || 0) / (selectedReg.numberOfNights || selectedReg.nights || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-1.5 text-right text-slate-800">
                {(associatedBooking.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            <tr className="border-b border-slate-200">
              <td className="border-r border-slate-350 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-350 px-3 py-1 text-slate-655">
                <span className="font-semibold text-[8px] uppercase tracking-wider mr-2 text-slate-400">Room Type:</span>
                <span className="text-slate-700">{associatedBooking.roomType}</span>
              </td>
              <td className="border-r border-slate-350 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-400">-</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="border-r border-slate-350 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-350 px-3 py-1 text-slate-655">
                <span className="font-semibold text-[8px] uppercase tracking-wider mr-2 text-slate-400">Room Number:</span>
                <span className="text-slate-700">{associatedBooking.roomNumber || 'TBD'}</span>
              </td>
              <td className="border-r border-slate-350 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-400">-</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="border-r border-slate-350 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-350 px-3 py-1 text-slate-655">
                <span className="font-semibold text-[8px] uppercase tracking-wider mr-2 text-slate-400">Board Basis:</span>
                <span className="text-slate-700">{associatedBooking.boardBasis || 'Room Only'}</span>
              </td>
              <td className="border-r border-slate-350 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-400">-</td>
            </tr>
            <tr className="border-b border-slate-350">
              <td className="border-r border-slate-350 px-2 py-1 text-center text-slate-400">-</td>
              <td className="border-r border-slate-350 px-3 py-1 text-slate-655">
                <span className="font-semibold text-[8px] uppercase tracking-wider mr-2 text-slate-400">Booking Type:</span>
                <span className="text-slate-700">{associatedBooking.bookingType || 'Direct'}</span>
              </td>
              <td className="border-r border-slate-350 px-3 py-1 text-right text-slate-400">-</td>
              <td className="px-3 py-1 text-right text-slate-400">-</td>
            </tr>

            <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-350">
              <td className="border-r border-slate-350 px-2 py-1.5 text-center"></td>
              <td className="border-r border-slate-350 px-3 py-1.5 text-right uppercase text-[8px] tracking-wider">Total Value</td>
              <td className="border-r border-slate-350 px-3 py-1.5 text-right"></td>
              <td className="px-3 py-1.5 text-right font-black text-slate-900">
                {(associatedBooking.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Calculations & Summary Section */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-[11px]">
        {/* Left Column: Reference / Remarks */}
        <div className="border border-slate-300 rounded p-3 text-slate-600 flex flex-col justify-between">
          <div>
            <span className="font-bold text-[8px] uppercase tracking-wider block mb-1 text-slate-400">Payment Reference / Remarks</span>
            <p className="font-mono text-slate-800 font-semibold mb-2">Ref: {selectedPaymentForReceipt.referenceNumber || 'N/A'}</p>
            {selectedPaymentForReceipt.remarks && (
              <p className="text-[10px] leading-tight text-slate-750">
                {selectedPaymentForReceipt.remarks}
              </p>
            )}
          </div>
          <div className="text-[9px] text-slate-400 italic mt-3">
            {isFinalPayment
              ? '* This is the final payment receipt. Account fully settled.'
              : '* Please preserve this receipt for final checkout subtraction.'}
          </div>
        </div>

        {/* Right Column: Numeric breakdown */}
        <div className="border border-slate-350 rounded p-3 space-y-2 bg-slate-50/20">
          <div className="flex justify-between pb-1 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Total Booking Amount:</span>
            <span className="font-bold text-slate-800">LKR {(associatedBooking.totalAmount || 0).toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between pb-1 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">{isFinalPayment ? 'Final Payment:' : 'Advance Paid:'}</span>
            <span className="font-bold text-slate-900">
              {selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency} {currencyCode}
            </span>
          </div>

          {!isLkr && (
            <>
              <div className="flex justify-between pb-1 border-b border-slate-200 text-[10px]">
                <span className="text-slate-500">Exchange Rate:</span>
                <span className="font-medium text-slate-750">{selectedPaymentForReceipt.exchangeRate}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Converted Amount:</span>
                <span className="font-bold text-slate-900">
                  LKR {paidAmt.toLocaleString()}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-1 font-bold text-sm border-t border-slate-350">
            <span className="text-slate-900 font-black text-xs">Remaining Balance:</span>
            <span className="font-bold text-xs text-slate-900">
              LKR {Math.max(0, (associatedBooking.totalAmount || 0) - paidAmt).toLocaleString()}
            </span>
          </div>
          {isFinalPayment && (
            <div className="text-center mt-2">
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">✓ FULLY PAID</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature Lines */}
      <div className="flex justify-between items-end mt-16 pb-4">
        <div className="text-center w-52">
          <div className="border-b border-slate-400 w-full mb-1"></div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Guest Signature</span>
        </div>
        
        <div className="text-center w-52">
          <div className="border-b border-slate-400 w-full mb-1"></div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Received By</span>
        </div>
      </div>

      {/* Metadata & Printed Date */}
      <div className="flex justify-between text-[8px] text-slate-400 mt-10 pt-2 border-t border-slate-100 font-medium">
        <span>Printed: {new Date().toLocaleString()}</span>
        <span>Staff: {receiptData.generatedBy || 'Front Office'}</span>
      </div>
    </div>
  );
});

AdvanceReceiptPrint.displayName = 'AdvanceReceiptPrint';

export default AdvanceReceiptPrint;
