import React from 'react';
import logoImg from '../assets/logo.jpeg';

const AdvanceReceiptPrint = React.forwardRef(({ receiptData, selectedPaymentForReceipt, selectedReg, associatedBooking, payments = [], forceLkr = false }, ref) => {
  if (!receiptData || !selectedPaymentForReceipt || !selectedReg || !associatedBooking) return null;

  const bCurr = (associatedBooking.currency && associatedBooking.currency !== 'LKR') ? associatedBooking.currency : 'USD';
  const exRate = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBooking.exchangeRate) || 335;
  const displayCurrency = forceLkr ? 'LKR' : bCurr;
  const convFactor = forceLkr ? exRate : 1;

  const totalBookingAmount = associatedBooking.totalAmount || 0;
  const totalBookingAmountLkr = bCurr === 'LKR' ? totalBookingAmount : (totalBookingAmount * exRate);

  // Calculate correct total paid up to this payment to find the correct balance
  const paymentsList = payments && payments.length > 0 ? payments : [];
  const paymentsUpToThis = paymentsList.length > 0 
    ? paymentsList.filter(p => p.id <= selectedPaymentForReceipt.id)
    : [selectedPaymentForReceipt];
  const totalPaidUpToThis = paymentsUpToThis.reduce((sum, p) => sum + (p.convertedAmountLkr || p.amountLkr || 0), 0);
  const remainingBalLkr = Math.max(0, totalBookingAmountLkr - totalPaidUpToThis);

  const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL' && remainingBalLkr <= 10;
  const receiptTitle = isFinalPayment ? 'Final Payment Receipt' : 'Advance Payment Receipt';
  const paidAmt = selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || 0;
  const currencyCode = selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency || 'LKR';
  const isLkr = currencyCode === 'LKR';

  // Split and map room-by-room itemized rows matching Draft Bill
  const roomTypes = associatedBooking.roomType ? associatedBooking.roomType.split(',').map(t => t.trim()) : [];
  const roomNumbers = associatedBooking.roomNumber ? associatedBooking.roomNumber.split(',').map(n => n.trim()) : [];
  const numRooms = Math.max(1, roomNumbers.length);

  // If stored roomPrices JSON exists, parse exact room prices
  let parsedRoomPrices = null;
  if (associatedBooking.roomPrices) {
    try {
      const p = JSON.parse(associatedBooking.roomPrices);
      if (Array.isArray(p) && p.length > 0) parsedRoomPrices = p;
    } catch(e) {}
  }

  const baseTotalAmount = associatedBooking.totalAmount || 0;
  const displayTotalAmount = baseTotalAmount * convFactor;
  const totalCents = Math.round(displayTotalAmount * 100);

  let itemizedRows = [];
  if (roomNumbers.length > 0) {
    itemizedRows = roomNumbers.map((rNum, idx) => {
      let rowAmount = 0;
      if (parsedRoomPrices && parsedRoomPrices[idx] && parsedRoomPrices[idx].price) {
        rowAmount = (parseFloat(parsedRoomPrices[idx].price) || 0) * convFactor;
      } else {
        const currentCentsSum = Math.round((totalCents / numRooms) * (idx + 1));
        const prevCentsSum = Math.round((totalCents / numRooms) * idx);
        const rowCents = currentCentsSum - prevCentsSum;
        rowAmount = rowCents / 100;
      }
      
      const rType = roomTypes[idx] || roomTypes[0] || 'Room';
      const amountVal = Math.floor(rowAmount);
      const amountCts = Math.round((rowAmount - amountVal) * 100).toString().padStart(2, '0');

      return {
        description: `Night - ${rType} (Room ${rNum})`,
        amountVal: amountVal.toLocaleString(),
        amountCts: amountCts
      };
    });
  } else {
    const defaultRowAmount = displayTotalAmount;
    const defaultAmountVal = Math.floor(defaultRowAmount);
    const defaultAmountCts = Math.round((defaultRowAmount - defaultAmountVal) * 100).toString().padStart(2, '0');
    
    itemizedRows = [{
      description: `Night - ${associatedBooking.roomType || 'Room'}`,
      amountVal: defaultAmountVal.toLocaleString(),
      amountCts: defaultAmountCts
    }];
  }

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
          {isFinalPayment ? (
            <span className="inline-block bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              ✓ Fully Settled
            </span>
          ) : (
            <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              ✓ Advance Payment Received
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

      {/* Reservation Details Section (Matching Draft Bill layout) */}
      {(() => {
        const guestName = selectedReg?.guestName || associatedBooking?.guestName || '';
        const bookingChannel = associatedBooking?.bookingType || 'Direct Booking';
        const checkInDate = selectedReg?.checkInDate || associatedBooking?.checkInDate || '';
        const checkOutDate = selectedReg?.checkOutDate || associatedBooking?.checkOutDate || '';
        const nights = selectedReg?.numberOfNights || selectedReg?.nights || associatedBooking?.nights || 1;
        const boardBasis = associatedBooking?.boardBasis || 'Bed & Breakfast';
        const adults = selectedReg?.adults || associatedBooking?.adults || 1;
        const children = selectedReg?.children || associatedBooking?.children || 0;
        const formatDateDots = (dStr) => dStr ? dStr.replace(/-/g, '.') : '';

        return (
          <>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              RESERVATION DETAILS
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', marginBottom: '20px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Guest Name</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{guestName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Channel</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{bookingChannel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Check - in</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{formatDateDots(checkInDate)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Check - out</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{formatDateDots(checkOutDate)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Nights</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{String(nights).padStart(2, '0')} nights</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Basis</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{boardBasis}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Adults</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{String(adults).padStart(2, '0')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Children</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{String(children).padStart(2, '0')}</span>
              </div>
            </div>
          </>
        );
      })()}

      {/* Main Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-emerald-800/20 text-[11px]" style={{ border: '1px solid rgba(6, 95, 70, 0.2)' }}>
          <thead>
            <tr style={{ backgroundColor: '#065f46', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', colorAdjust: 'exact' }}>
              <th className="px-3 py-2 text-left uppercase text-[8px] tracking-wider" style={{ backgroundColor: '#065f46', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.2)', width: '70%' }}>DESCRIPTION</th>
              <th colSpan={2} className="px-3 py-2 text-center uppercase text-[8px] tracking-wider" style={{ backgroundColor: '#065f46', color: '#ffffff', width: '30%' }}>AMOUNT</th>
            </tr>
            <tr style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <th style={{ backgroundColor: '#ffffff', border: '1px solid rgba(6, 95, 70, 0.2)', borderTop: 'none' }}></th>
              <th className="px-3 py-1.5 text-center uppercase text-[8px] tracking-wider w-28" style={{ backgroundColor: '#ffffff', color: '#1e293b', borderRight: '1px solid rgba(6, 95, 70, 0.2)', borderBottom: '1px solid rgba(6, 95, 70, 0.2)' }}>{displayCurrency === 'LKR' ? 'RS.' : displayCurrency}</th>
              <th className="px-3 py-1.5 text-center uppercase text-[8px] tracking-wider w-12" style={{ backgroundColor: '#ffffff', color: '#1e293b', borderBottom: '1px solid rgba(6, 95, 70, 0.2)' }}>CTS.</th>
            </tr>
          </thead>
          <tbody className="font-medium text-slate-700" style={{ fontWeight: '600', color: '#1e293b' }}>
            {itemizedRows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(6, 95, 70, 0.15)' }}>
                <td className="px-3 py-1.5" style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)' }}>
                  {row.description}
                </td>
                <td className="px-3 py-1.5 text-right font-mono font-bold" style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)' }}>
                  {row.amountVal}
                </td>
                <td className="px-3 py-1.5 text-center font-mono font-bold">
                  {row.amountCts}
                </td>
              </tr>
            ))}

            <tr style={{ backgroundColor: 'rgba(6, 95, 70, 0.03)', fontWeight: '800', borderTop: '2px solid #065f46', color: '#065f46' }}>
              <td className="px-3 py-2 text-right uppercase text-[8px] tracking-wider font-black" style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)' }}>Total Value</td>
              <td className="px-3 py-2 text-right font-black font-mono" style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)' }}>
                {Math.floor(displayTotalAmount).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-center font-black font-mono">
                {Math.round((displayTotalAmount - Math.floor(displayTotalAmount)) * 100).toString().padStart(2, '0')}
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
                {selectedPaymentForReceipt.remarks.replace(/\[Bank Charges: [\d.]+\]/g, '').trim()}
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
        {(() => {
          const totAmt = forceLkr ? (associatedBooking.totalAmount || 0) * exRate : (associatedBooking.totalAmount || 0);
          const rawPaid = parseFloat(selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency || 0);
          const paidDisplayAmt = forceLkr 
            ? (selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || (rawPaid * exRate))
            : rawPaid;
          const totalPaidUpToThisDisplay = forceLkr
            ? totalPaidUpToThis
            : (totalPaidUpToThis / exRate);
          const remBal = Math.max(0, totAmt - totalPaidUpToThisDisplay);

          return (
            <div className="border border-slate-350 rounded p-3 space-y-2 bg-slate-50/20">
              <div className="flex justify-between pb-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Total Booking Amount:</span>
                <span className="font-bold text-slate-800">{displayCurrency} {totAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between pb-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Amount Paid:</span>
                <span className="font-bold text-slate-900">
                  {displayCurrency} {paidDisplayAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {paymentsUpToThis.length > 1 && (
                <div className="flex justify-between pb-1 border-b border-slate-200 text-slate-500">
                  <span>Total Paid So Far:</span>
                  <span className="font-bold">{displayCurrency} {(totalPaidUpToThis * (forceLkr ? 1 : (1/exRate))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              {(() => {
                const cardFeeMatch = selectedPaymentForReceipt.remarks?.match(/\[Bank Charges: ([\d.]+)\]/);
                const cardFee = cardFeeMatch ? parseFloat(cardFeeMatch[1]) : 0;
                if (cardFee > 0) {
                  const feeDisplay = forceLkr
                    ? `LKR ${cardFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${displayCurrency} ${(cardFee / exRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  return (
                    <div className="flex justify-between pb-1 border-b border-slate-200">
                      <span className="text-slate-550 font-semibold">BANK CHARGES:</span>
                      <span className="font-bold text-slate-800">
                        {feeDisplay}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {(() => {
                const otherFeeMatch = selectedPaymentForReceipt.remarks?.match(/\[Other Charges: ([\d.]+)\]/);
                const otherFee = otherFeeMatch ? parseFloat(otherFeeMatch[1]) : 0;
                if (otherFee > 0) {
                  const feeDisplay = forceLkr || displayCurrency === 'LKR'
                    ? `LKR ${(currencyCode === 'LKR' ? otherFee : (otherFee * exRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${displayCurrency} ${otherFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  
                  const grossAmt = paidDisplayAmt;
                  const netPayable = Math.max(0, grossAmt - (forceLkr || displayCurrency === 'LKR' ? (currencyCode === 'LKR' ? otherFee : (otherFee * exRate)) : otherFee));
                  
                  return (
                    <>
                      <div className="flex justify-between pb-1 border-b border-slate-200 text-amber-800">
                        <span className="font-semibold">OTHER CHARGES (Deducted):</span>
                        <span className="font-bold">
                          - {feeDisplay}
                        </span>
                      </div>
                      <div className="flex justify-between pb-1 border-b border-slate-200 text-emerald-800">
                        <span className="font-semibold">NET PAYABLE AMOUNT:</span>
                        <span className="font-bold">
                          {displayCurrency} {netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  );
                }
                return null;
              })()}

              {!forceLkr && (currencyCode !== 'LKR') && (
                <>
                  <div className="flex justify-between pb-1 border-b border-slate-200 text-[10px]">
                    <span className="text-slate-500">Exchange Rate:</span>
                    <span className="font-medium text-slate-750">{exRate}</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Converted Amount:</span>
                    <span className="font-bold text-slate-900">
                      LKR {paidAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-1 font-bold text-sm border-t border-slate-350">
                <span className="text-slate-900 font-black text-xs">Remaining Balance:</span>
                <span className="font-bold text-xs text-slate-900">
                  {displayCurrency} {remBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {isFinalPayment && (
                <div className="text-center mt-2">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">✓ FULLY PAID</span>
                </div>
              )}
            </div>
          );
        })()}
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
