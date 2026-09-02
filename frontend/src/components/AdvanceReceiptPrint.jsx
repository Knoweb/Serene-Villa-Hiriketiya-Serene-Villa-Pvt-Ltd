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
  const isDiscountAdjusted = selectedPaymentForReceipt.paymentType === 'DISCOUNT_ADJUSTED';
  const isOriginalBill = selectedPaymentForReceipt.paymentType === 'ORIGINAL_BILL';
  const isExtraNight = associatedBooking.bookingNumber?.includes('/1N');
  const isExtraPerson = associatedBooking.bookingNumber?.includes('/1P');
  const isDiscount = associatedBooking.bookingNumber?.includes('/DISC');

  const receiptTitle = isDiscountAdjusted
    ? 'Discount Adjusted Invoice'
    : isOriginalBill
      ? 'Original Reservation Invoice'
      : isFinalPayment 
        ? 'Final Payment Receipt' 
        : isExtraNight 
          ? 'Extra Night Receipt' 
          : isExtraPerson 
            ? 'One Person Receipt' 
            : isDiscount 
              ? 'Discount Receipt' 
              : 'Advance Payment Receipt';

  const baseBookingItem = siblingBookings.find(b => !b.bookingNumber || !b.bookingNumber.includes('/')) || associatedBooking;

  // Filter top itemized rows to show only room nights (clean layout matching Image 1)
  let targetBookings = [];
  if (isExtraNight || isExtraPerson) {
    // For Extra Night or Extra Person sub-bills, target strictly the sub-booking!
    targetBookings = [associatedBooking];
  } else if (isOriginalBill || (!isFinalPayment && !isDiscountAdjusted)) {
    // For Original Bill or standard Advance Payment receipt on base booking, target strictly the base booking!
    targetBookings = [baseBookingItem || associatedBooking];
  } else if (siblingBookings.length > 0) {
    // For Final Settlement or Discount Adjusted Consolidated Bill, include all room bookings
    const nonDisc = siblingBookings.filter(b => !b.bookingNumber?.includes('/DISC'));
    targetBookings = nonDisc.length > 0 ? nonDisc : (baseBookingItem ? [baseBookingItem] : (associatedBooking ? [associatedBooking] : []));
  } else if (associatedBooking) {
    targetBookings = [associatedBooking];
  } else {
    targetBookings = [];
  }

  if (targetBookings.length === 0 && selectedReg) {
    targetBookings = [{
      roomNumber: selectedReg.roomNumber,
      roomType: selectedReg.roomType,
      roomPrices: selectedReg.roomPrices,
      totalAmount: selectedReg.totalAmount || 0,
      numberOfNights: selectedReg.numberOfNights || selectedReg.nights || 1
    }];
  }

  let itemizedRows = [];
  let roomChargesTotal = 0;

  // Robust split helper for room types and room numbers
  const parseList = (str) => {
    if (!str) return [];
    return String(str).split(',').map(s => s.trim()).filter(Boolean);
  };

  const globalRoomsList = parseList(selectedReg?.roomNumber || associatedBooking?.roomNumber || '');
  const globalRoomTypesList = parseList(selectedReg?.roomType || associatedBooking?.roomType || '');
  let globalParsedPrices = null;
  if (selectedReg?.roomPrices || associatedBooking?.roomPrices) {
    try {
      const p = typeof (selectedReg?.roomPrices || associatedBooking?.roomPrices) === 'string'
        ? JSON.parse(selectedReg?.roomPrices || associatedBooking?.roomPrices)
        : (selectedReg?.roomPrices || associatedBooking?.roomPrices);
      if (Array.isArray(p) && p.length > 0) globalParsedPrices = p;
    } catch(e) {}
  }

  targetBookings.forEach((book) => {
    const isSubBooking = !!(book.bookingNumber && book.bookingNumber.includes('/'));
    
    let roomsList = parseList(book.roomNumber);
    let roomTypesList = parseList(book.roomType);

    let parsedRoomPrices = null;
    if (book.roomPrices) {
      try {
        const p = typeof book.roomPrices === 'string' ? JSON.parse(book.roomPrices) : book.roomPrices;
        if (Array.isArray(p) && p.length > 0) parsedRoomPrices = p;
      } catch(e) {}
    }

    if (!isSubBooking || book === baseBookingItem) {
      if (roomsList.length === 0) roomsList = globalRoomsList;
      if (roomTypesList.length === 0) roomTypesList = globalRoomTypesList;
      if (!parsedRoomPrices) parsedRoomPrices = globalParsedPrices;
    }

    const countRooms = Math.max(
      roomsList.length,
      roomTypesList.length,
      parsedRoomPrices ? parsedRoomPrices.length : 0,
      1
    );

    let bookTotalAmount = Math.abs(parseFloat(book.totalAmount || book.amount || 0));
    if (bookTotalAmount === 0 && (!isSubBooking || book === baseBookingItem)) {
      bookTotalAmount = Math.abs(parseFloat(selectedReg?.totalAmount || associatedBooking?.totalAmount || 0));
    }

    if (parsedRoomPrices && parsedRoomPrices.length > 0) {
      const sumPrices = parsedRoomPrices.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      if (sumPrices > 0) {
        bookTotalAmount = sumPrices;
      }
    }

    const bookDispTotal = bookTotalAmount * convFactor;
    const bookTotalCents = Math.round(bookDispTotal * 100);
    const nightsVal = book.numberOfNights || selectedReg?.numberOfNights || selectedReg?.nights || associatedBooking?.numberOfNights || 1;

    let suffixLabel = "";
    if (book.bookingNumber?.includes('/1N')) suffixLabel = " (Extra Night)";
    else if (book.bookingNumber?.includes('/1P')) suffixLabel = " (Extra Person)";

    for (let idx = 0; idx < countRooms; idx++) {
      let rowAmount = 0;
      if (parsedRoomPrices && parsedRoomPrices[idx] && parsedRoomPrices[idx].price != null && !isNaN(parsedRoomPrices[idx].price)) {
        rowAmount = (parseFloat(parsedRoomPrices[idx].price) || 0) * convFactor;
      } else {
        const currentCentsSum = Math.round((bookTotalCents / countRooms) * (idx + 1));
        const prevCentsSum = Math.round((bookTotalCents / countRooms) * idx);
        const rowCents = currentCentsSum - prevCentsSum;
        rowAmount = rowCents / 100;
      }

      const rateAmount = rowAmount / nightsVal;
      const currentRoomType = roomTypesList[idx] || (roomTypesList.length === 1 ? roomTypesList[0] : (selectedReg?.roomType || associatedBooking?.roomType || 'Room'));
      const rNum = roomsList[idx] || (roomsList.length === 1 ? roomsList[0] : '');

      let desc = rNum
        ? `Night - ${currentRoomType} (Room ${rNum})${suffixLabel}`
        : `Night - ${currentRoomType}${suffixLabel}`;

      const amountVal = Math.floor(rowAmount);
      const amountCts = Math.round((rowAmount - amountVal) * 100).toString().padStart(2, '0');

      itemizedRows.push({
        roomNumber: rNum,
        description: desc,
        rate: rateAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        amountVal: amountVal.toLocaleString(),
        amountCts: amountCts,
        rawAmount: rowAmount,
        isExtra: !!(book.bookingNumber && book.bookingNumber.includes('/'))
      });
      roomChargesTotal += rowAmount;
    }
  });

  const dispTotalAmount = roomChargesTotal;

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
              <h1 className="text-xl font-bold text-slate-800">Serene Villa</h1>
              <p className="text-xs text-slate-500 font-semibold">(PVT) LTD - HIRIKETIYA</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">Pehembiya Road, Hiriketiya, Dickwella.</p>
          <p className="text-xs text-slate-600">Email: Serenehiriketiya@gmail.com</p>
          <p className="text-xs text-slate-600">Hotline: +94 41 225 5204 / +94 70 499 8787</p>
        </div>

        {/* Right Column: Receipt Type & Meta */}
        <div className="text-right space-y-1">
          <h2 className="text-lg font-black text-emerald-800 tracking-wide uppercase">{receiptTitle}</h2>
          {isFinalPayment && <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">✓ FULLY SETTLED</span>}
          <div className="border border-emerald-800/30 rounded px-3 py-1.5 bg-emerald-50/20 text-xs text-left space-y-0.5">
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
        const isExtraNight = associatedBooking?.bookingNumber?.includes('/1N');
        const checkInDate = isExtraNight && associatedBooking?.checkInDate
          ? associatedBooking.checkInDate
          : (isFinalPayment 
              ? (selectedReg?.checkInDate || associatedBooking?.checkInDate || '')
              : (associatedBooking?.checkInDate || selectedReg?.checkInDate || ''));
        const checkOutDate = isExtraNight && associatedBooking?.checkOutDate
          ? associatedBooking.checkOutDate
          : (isFinalPayment 
              ? (selectedReg?.checkOutDate || associatedBooking?.checkOutDate || '')
              : (associatedBooking?.checkOutDate || selectedReg?.checkOutDate || ''));
        const nights = isExtraNight 
          ? (associatedBooking?.numberOfNights || 1)
          : (isFinalPayment 
              ? (selectedReg?.numberOfNights || selectedReg?.nights || associatedBooking?.nights || 1)
              : (associatedBooking?.numberOfNights || associatedBooking?.nights || 1));
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
                  {String(nights).padStart(2, '0')} nights {isExtraNight && <span style={{ color: '#b45309', fontWeight: '700', fontSize: '10px' }}>(Extra Night)</span>}
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

      {/* Main Breakdown Table */}
      <table className="w-full text-xs border border-slate-300 mb-6">
        <thead>
          <tr className="bg-emerald-800 text-white font-bold">
            <th className="p-2 text-left border-r border-emerald-700 w-2/3">DESCRIPTION</th>
            <th colSpan="2" className="p-2 text-center">AMOUNT</th>
          </tr>
          <tr className="bg-slate-100 text-slate-700 text-[10px] font-semibold border-b border-slate-300">
            <th className="border-r border-slate-300"></th>
            <th className="p-1 border-r border-slate-300 text-center w-24">{displayCurrency === 'LKR' ? 'RS.' : displayCurrency}</th>
            <th className="p-1 text-center w-12">CTS.</th>
          </tr>
        </thead>
        <tbody>
          {itemizedRows.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-200">{row.description}</td>
              <td className="p-2 text-right border-r border-slate-200 font-mono">{row.amountVal}</td>
              <td className="p-2 text-center font-mono">{row.amountCts}</td>
            </tr>
          ))}
          <tr className="font-bold bg-slate-50 border-t border-slate-300">
            <td className="p-2 border-r border-slate-300">TOTAL VALUE</td>
            <td className="p-2 text-right border-r border-slate-300 font-mono text-emerald-800">{Math.floor(dispTotalAmount).toLocaleString()}</td>
            <td className="p-2 text-center font-mono text-emerald-800">{Math.round((dispTotalAmount - Math.floor(dispTotalAmount)) * 100).toString().padStart(2, '0')}</td>
          </tr>
        </tbody>
      </table>

      {/* Bottom Section: Payment Reference & Totals Box (Matching User Image 2) */}
      <div className="grid grid-cols-2 gap-4 text-xs mb-8">
        {/* Left Column: Reference & Notes */}
        <div className="border border-slate-250 border-dashed rounded p-3 flex flex-col justify-between">
          <div>
            <span className="font-bold text-[8px] uppercase tracking-wider block mb-1 text-slate-400">PAYMENT REFERENCE / REMARKS</span>
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
          const discBookings = siblingBookings.filter(b => b.bookingNumber && b.bookingNumber.includes('/DISC'));
          // Discounts must ONLY be deducted on Discount Adjusted Invoices or Final Payment Receipts
          const shouldApplyDiscount = (isDiscountAdjusted || isFinalPayment) && !isOriginalBill;
          const totalDiscountVal = shouldApplyDiscount ? discBookings.reduce((sum, b) => sum + Math.abs(parseFloat(b.totalAmount || b.amount || 0)), 0) : 0;

          const grossTotAmt = roomChargesTotal / convFactor;
          const dispGrossTotAmt = forceLkr ? grossTotAmt * exRate : grossTotAmt;

          const netTotAmt = Math.max(0, grossTotAmt - totalDiscountVal);
          const dispNetTotAmt = forceLkr ? netTotAmt * exRate : netTotAmt;

          const rawPaid = parseFloat(selectedPaymentForReceipt.amount || selectedPaymentForReceipt.amountInCurrency || 0);
          const paidDisplayAmt = isFinalPayment
            ? (forceLkr ? netTotAmt * exRate : netTotAmt)
            : (forceLkr 
                ? (selectedPaymentForReceipt.convertedAmountLkr || selectedPaymentForReceipt.amountLkr || (rawPaid * exRate))
                : rawPaid);

          let remBal = 0;
          if (isFinalPayment) {
            remBal = 0;
          } else if (isExtraNight || isExtraPerson) {
            remBal = Math.max(0, dispNetTotAmt - paidDisplayAmt);
          } else if (isDiscountAdjusted) {
            const totalPaidUpToThisDisplay = forceLkr ? totalPaidUpToThis : (totalPaidUpToThis / exRate);
            remBal = Math.max(0, dispNetTotAmt - totalPaidUpToThisDisplay);
          } else {
            const totalPaidUpToThisDisplay = forceLkr ? totalPaidUpToThis : (totalPaidUpToThis / exRate);
            remBal = Math.max(0, dispGrossTotAmt - totalPaidUpToThisDisplay);
          }
          const currencyCode = selectedPaymentForReceipt.currencyCode || selectedPaymentForReceipt.currency || 'LKR';
          
          // Converted amount in LKR is calculated on the net amount after discount deduction (if applicable)
          const convertedAmountLkr = (netTotAmt * (displayCurrency === 'LKR' ? 1 : exRate));

          return (
            <div className="border border-slate-700/60 rounded-lg p-3 space-y-1.5 bg-white shadow-2xs">
              <div className="flex justify-between pb-0.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Total Booking Amount:</span>
                <span className="font-bold text-slate-800">{displayCurrency} {dispGrossTotAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {totalDiscountVal > 0 && shouldApplyDiscount && (
                <div className="flex justify-between pb-0.5 border-b border-slate-100 text-rose-600 bg-rose-50/50 px-1 py-0.5 rounded">
                  <span className="font-semibold">Discount Deducted:</span>
                  <span className="font-bold font-mono">-{displayCurrency} {(forceLkr ? totalDiscountVal * exRate : totalDiscountVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {(paidDisplayAmt > 0 || isFinalPayment) && (
                <div className="flex justify-between pb-0.5 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">{isFinalPayment ? 'Amount Paid:' : 'Advance Paid:'}</span>
                  <span className="font-bold text-slate-900">
                    {displayCurrency} {paidDisplayAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
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
                    <div className="flex justify-between pb-0.5 border-b border-slate-100">
                      <span className="text-slate-700 font-bold">CHARGES:</span>
                      <span className="font-bold text-slate-900">
                        {feeDisplay}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {!forceLkr && (currencyCode !== 'LKR') && (
                <>
                  <div className="flex justify-between pb-0.5 border-b border-slate-100 text-[10px]">
                    <span className="text-slate-500">Exchange Rate:</span>
                    <span className="font-medium text-slate-750">{exRate}</span>
                  </div>
                  <div className="flex justify-between pb-0.5 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">Converted Amount:</span>
                    <span className="font-bold text-slate-900">
                      LKR {convertedAmountLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-1 font-bold text-sm border-t-2 border-slate-700/60 mt-1">
                <span className="text-slate-900 font-black text-xs">Remaining Balance:</span>
                <span className="font-bold text-xs text-slate-900">
                  {displayCurrency} {remBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {isFinalPayment && (
                <div className="text-center mt-1 pt-0.5">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">✓ FULLY PAID</span>
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
