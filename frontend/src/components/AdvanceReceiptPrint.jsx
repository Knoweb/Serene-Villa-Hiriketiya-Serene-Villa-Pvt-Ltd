import React from 'react';
import logoImg from '../assets/logo.jpeg';

const AdvanceReceiptPrint = React.forwardRef(({ receiptData, selectedPaymentForReceipt, selectedReg, associatedBooking: passedAssociatedBooking, payments = [], bookings = [], forceLkr = false }, ref) => {
  if (!receiptData || !selectedPaymentForReceipt || !selectedReg || !passedAssociatedBooking) return null;

  const associatedBooking = bookings.find(b => b.id === selectedPaymentForReceipt.bookingId) || passedAssociatedBooking;
  const bCurr = (associatedBooking.currency && associatedBooking.currency !== 'LKR') ? associatedBooking.currency : 'USD';
  const exRate = parseFloat(selectedPaymentForReceipt.exchangeRate) || parseFloat(associatedBooking.exchangeRate) || 335;
  const displayCurrency = forceLkr ? 'LKR' : bCurr;
  const convFactor = forceLkr ? exRate : 1;

  const siblingBookings = bookings.length > 0 
    ? bookings.filter(b => b.guestRegistrationId === selectedReg.id)
    : [associatedBooking];

  const totalBookingAmount = siblingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalBookingAmountLkr = bCurr === 'LKR' ? totalBookingAmount : (totalBookingAmount * exRate);

  // Calculate correct total paid up to this payment to find the correct balance
  const paymentsList = payments && payments.length > 0 ? payments : [];
  const paymentsUpToThis = paymentsList.length > 0 
    ? paymentsList.filter(p => p.id <= selectedPaymentForReceipt.id)
    : [selectedPaymentForReceipt];
  const totalPaidUpToThis = paymentsUpToThis.reduce((sum, p) => sum + (p.convertedAmountLkr || p.amountLkr || 0), 0);
  const remainingBalLkr = Math.max(0, totalBookingAmountLkr - totalPaidUpToThis);

  const isFinalPayment = selectedPaymentForReceipt.paymentType === 'FINAL' && remainingBalLkr <= 10;
  const isExtraNight = associatedBooking.bookingNumber?.includes('/1N');
  const isExtraPerson = associatedBooking.bookingNumber?.includes('/1P');
  const isDiscount = associatedBooking.bookingNumber?.includes('/DISC');

  const receiptTitle = isFinalPayment 
    ? 'Final Payment Receipt' 
    : isExtraNight 
      ? 'Extra Night Receipt' 
      : isExtraPerson 
        ? 'One Person Receipt' 
        : isDiscount 
          ? 'Discount Receipt' 
          : 'Advance Payment Receipt';

  const targetBookings = (isFinalPayment && siblingBookings.length > 0)
    ? siblingBookings
    : [associatedBooking];

  let itemizedRows = [];
  targetBookings.forEach((book) => {
    const roomTypes = book.roomType ? book.roomType.split(',').map(t => t.trim()).filter(Boolean) : [];
    const roomNumbers = book.roomNumber ? book.roomNumber.split(',').map(n => n.trim()).filter(Boolean) : [];

    let parsedRoomPrices = null;
    if (book.roomPrices) {
      try {
        const p = JSON.parse(book.roomPrices);
        if (Array.isArray(p) && p.length > 0) parsedRoomPrices = p;
      } catch(e) {}
    }

    const isSubBooking = !!(book.bookingNumber && book.bookingNumber.includes('/'));
    const countRooms = isSubBooking
      ? (roomNumbers.length > 0 ? roomNumbers.length : 1)
      : Math.max(
          roomNumbers.length,
          roomTypes.length,
          parsedRoomPrices ? parsedRoomPrices.length : 0,
          1
        );

    const bookTotalAmount = book.totalAmount || 0;
    const bookDispTotal = bookTotalAmount * convFactor;
    const bookTotalCents = Math.round(bookDispTotal * 100);
    const nightsVal = book.numberOfNights || 1;

    let suffixLabel = "";
    if (book.bookingNumber?.includes('/1N')) suffixLabel = " (Extra Night)";
    else if (book.bookingNumber?.includes('/1P')) suffixLabel = " (Extra Person)";
    else if (book.bookingNumber?.includes('/DISC')) suffixLabel = " (Discount)";

    for (let idx = 0; idx < countRooms; idx++) {
      let rowAmount = 0;
      if (parsedRoomPrices && parsedRoomPrices[idx] && parsedRoomPrices[idx].price) {
        rowAmount = (parseFloat(parsedRoomPrices[idx].price) || 0) * convFactor;
      } else {
        const currentCentsSum = Math.round((bookTotalCents / countRooms) * (idx + 1));
        const prevCentsSum = Math.round((bookTotalCents / countRooms) * idx);
        const rowCents = currentCentsSum - prevCentsSum;
        rowAmount = rowCents / 100;
      }

      const rateAmount = rowAmount / nightsVal;
      const currentRoomType = roomTypes[idx] || (roomTypes.length === 1 ? roomTypes[0] : (roomTypes[0] || 'Room'));
      const rNum = roomNumbers[idx] || (roomNumbers.length === 1 ? roomNumbers[0] : '');

      let desc = rNum
        ? `Night - ${currentRoomType} (Room ${rNum})${suffixLabel}`
        : `Night - ${currentRoomType}${suffixLabel}`;

      const isDiscBooking = book.bookingNumber?.includes('/DISC') || rowAmount < 0;
      if (isDiscBooking) {
        desc = `Discount: ${book.remarks?.replace(/^Discount:\s*/i, '') || 'Admin Approved Discount'}`;
      }

      const absAmount = Math.abs(rowAmount);
      const absVal = Math.floor(absAmount);
      const absCts = Math.round((absAmount - absVal) * 100).toString().padStart(2, '0');

      itemizedRows.push({
        roomNumber: rNum,
        description: desc,
        rate: isDiscBooking ? `-${(Math.abs(rowAmount) / nightsVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : rateAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        amountVal: isDiscBooking ? `-${absVal.toLocaleString()}` : Math.floor(rowAmount).toLocaleString(),
        amountCts: absCts,
        rawAmount: rowAmount,
        isDiscount: isDiscBooking
      });
    }
  });

  const displayTotalAmount = itemizedRows.reduce((sum, row) => sum + (parseFloat(row.amountVal.replace(/,/g, '')) || 0) + (parseFloat(row.amountCts)/100), 0);

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
              <span className="text-slate-500 font-semibold">Booking No:</span>
              <span className="font-mono font-bold text-emerald-800">{associatedBooking.bookingNumber || (selectedReg.passportNumber || '').replace(/^SV-?/i, '') || `D-${1000 + selectedReg.id}`}</span>
            </div>
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
        const checkInDate = isFinalPayment 
          ? (selectedReg?.checkInDate || associatedBooking?.checkInDate || '')
          : (associatedBooking?.checkInDate || selectedReg?.checkInDate || '');
        const checkOutDate = isFinalPayment 
          ? (selectedReg?.checkOutDate || associatedBooking?.checkOutDate || '')
          : (associatedBooking?.checkOutDate || selectedReg?.checkOutDate || '');
        const nights = isFinalPayment 
          ? (selectedReg?.numberOfNights || selectedReg?.nights || associatedBooking?.nights || 1)
          : (associatedBooking?.numberOfNights || associatedBooking?.nights || 1);
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
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>
                  {String(isExtraNight ? 1 : nights).padStart(2, '0')} nights {isExtraNight && <span style={{ color: '#b45309', fontWeight: '700', fontSize: '10px' }}>(Extra Night)</span>}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Basis</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{boardBasis}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Adults</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>
                  {isExtraPerson ? '01 (Extra One Person)' : String(adults).padStart(2, '0')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Children</span>
                <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>
                  {isExtraPerson ? '00' : String(children).padStart(2, '0')}
                </span>
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
                {selectedPaymentForReceipt.remarks.replace(/\[(?:Bank )?Charges: [\d.]+\]/g, '').trim()}
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
          const currencyCode = selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency || 'LKR';
          const paidAmt = selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || (rawPaid * exRate);

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
                const cardFeeMatch = selectedPaymentForReceipt.remarks?.match(/\[(?:Bank )?Charges: ([\d.]+)\]/);
                const cardFeeRaw = cardFeeMatch ? parseFloat(cardFeeMatch[1]) : 0;
                if (cardFeeRaw > 0) {
                  let feeDisplayVal = 0;
                  if (forceLkr || displayCurrency === 'LKR') {
                    const lkrPaid = paidDisplayAmt * (currencyCode === 'LKR' ? 1 : exRate);
                    feeDisplayVal = cardFeeRaw < (lkrPaid * 0.01) ? (cardFeeRaw * exRate) : cardFeeRaw;
                  } else {
                    feeDisplayVal = cardFeeRaw > (paidDisplayAmt * 0.5) ? (cardFeeRaw / exRate) : cardFeeRaw;
                  }
                  
                  const feeDisplay = `${displayCurrency} ${feeDisplayVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  return (
                    <div className="flex justify-between pb-1 border-b border-slate-200">
                      <span className="text-slate-550 font-semibold">CHARGES:</span>
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
