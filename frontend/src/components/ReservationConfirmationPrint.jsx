import React from 'react';
import logoImg from '../assets/logo.jpeg';

const ReservationConfirmationPrint = React.forwardRef(({ confirmationData, selectedReg, associatedBooking, payments = [], forceLkr = false }, ref) => {
  if (!confirmationData) return null;

  // Format Dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '.');
  };

  const guestName = selectedReg?.guestName || confirmationData.guestName || '';
  const bookingNumber = associatedBooking?.bookingNumber || confirmationData.bookingNumber || '';
  const checkInDate = selectedReg?.checkInDate || confirmationData.checkInDate || '';
  const checkOutDate = selectedReg?.checkOutDate || confirmationData.checkOutDate || '';
  const nights = selectedReg?.numberOfNights || selectedReg?.nights || confirmationData.nights || 1;
  const adults = selectedReg?.adults || confirmationData.adults || 1;
  const children = selectedReg?.children || confirmationData.children || 0;
  const boardBasis = associatedBooking?.boardBasis || confirmationData.boardBasis || 'Bed & Breakfast';

  const isConfirmed = confirmationData.badgeText?.toLowerCase() === 'confirmed';
  const isDirect = !confirmationData.bookingType || confirmationData.bookingType.toLowerCase().includes('direct');

  // Table computations
  const baseCurrency = (confirmationData.currency && confirmationData.currency !== 'LKR') ? confirmationData.currency : (confirmationData.tableCurrency || 'USD');
  const displayCurrency = forceLkr ? 'LKR' : baseCurrency;
  const exchangeRateVal = parseFloat(confirmationData.exchangeRate || 1) || 1;
  const convFactor = (forceLkr && baseCurrency !== 'LKR') ? exchangeRateVal : 1;

  let totalAmount = 0;
  let itemizedRows = [];

  if (confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0) {
    totalAmount = confirmationData.allocatedRooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * convFactor, 0);
    
    itemizedRows = confirmationData.allocatedRooms.map((item) => {
      const roomTotalAmount = (parseFloat(item.price || 0)) * convFactor;

      
      const amountVal = Math.floor(roomTotalAmount);
      const amountCts = Math.round((roomTotalAmount - amountVal) * 100).toString().padStart(2, '0');

      return {
        description: `Night - ${item.roomType} (Room ${item.roomNumber})`,
        rate: roomTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        amountVal: amountVal.toLocaleString(),
        amountCts: amountCts
      };
    });
  } else {
    totalAmount = parseFloat(confirmationData.totalPrice || 0) * convFactor;
    const defaultRowAmount = totalAmount;
    const defaultAmountVal = Math.floor(defaultRowAmount);
    const defaultAmountCts = Math.round((defaultRowAmount - defaultAmountVal) * 100).toString().padStart(2, '0');
    
    itemizedRows = [{
      description: `Night - ${associatedBooking?.roomType || confirmationData.roomType || 'Room'}`,
      rate: defaultRowAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amountVal: defaultAmountVal.toLocaleString(),
      amountCts: defaultAmountCts
    }];
  }
  const isSelectedLkr = displayCurrency === 'LKR';

  const totalCents = Math.round(totalAmount * 100);
  const totalPaidLkr = payments.reduce((sum, p) => sum + (p.convertedAmountLkr || p.amountLkr || 0), 0);
  const totalPaidConverted = isSelectedLkr ? totalPaidLkr : (totalPaidLkr / exchangeRateVal);
  const remainingBalance = Math.max(0, totalAmount - totalPaidConverted);
  const isFullyPaid = totalPaidConverted >= totalAmount && totalAmount > 0;
  const isPartiallyPaid = totalPaidConverted > 0 && totalPaidConverted < totalAmount;

  return (
    <div 
      ref={ref} 
      className="confirmation-print-area" 
      style={{ 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#1e293b',
        backgroundColor: '#ffffff',
        padding: '32px',
        width: '720px',
        margin: '0 auto',
        boxSizing: 'border-box',
        lineHeight: '1.5'
      }}
    >
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #065f46', paddingBottom: '12px', marginBottom: '20px' }}>
        {/* Left Column: Logo & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoImg} alt="Serene Villa Logo" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#065f46', margin: '0', tracking: '-0.025em', lineHeight: '1' }}>Serene Villa</h2>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', margin: '2px 0 0 0', letterSpacing: '0.05em' }}>(Pvt) Ltd - Hiriketiya</p>
            </div>
          </div>
          
          <div style={{ fontSize: '10px', color: '#475569', lineHeight: '1.5', fontWeight: '500', marginTop: '6px' }}>
            Pehembiya Road, Hiriketiya, Dickwella.<br />
            Serenehiriketiya@gmail.com<br />
            Hot line : +94 41 225 5204 / +94 70 499 8787
          </div>
        </div>

        {/* Right Column: Title & Booking Meta */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', tracking: '0.05em', color: '#065f46', margin: '0' }}>
            DRAFT BILL
          </h1>
          <div style={{ display: 'inline-block', border: '1px solid rgba(6, 95, 70, 0.2)', borderRadius: '8px', padding: '6px 10px', backgroundColor: 'rgba(6, 95, 70, 0.02)', fontSize: '10px', textAlign: 'left', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Booking No:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#065f46' }}>{bookingNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '2px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Date:</span>
              <span style={{ fontWeight: '700', color: '#334155' }}>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Details Section - Guest Name + Channel included */}
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
          <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{confirmationData.bookingType || 'Direct Booking'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Check - in</span>
          <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{formatDate(checkInDate)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ color: '#64748b', fontWeight: '600', width: '100px', flexShrink: 0 }}>Check - out</span>
          <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>{formatDate(checkOutDate)}</span>
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

      {/* Itemized Invoice Table (Exactly matching final receipt layout) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', marginBottom: '20px', border: '1px solid rgba(6, 95, 70, 0.2)' }}>
        <thead>
          <tr style={{ backgroundColor: '#065f46', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', colorAdjust: 'exact' }}>
            <th style={{ backgroundColor: '#065f46', color: '#ffffff', border: '1px solid rgba(6, 95, 70, 0.4)', padding: '10px 12px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left', width: '70%' }}>
              DESCRIPTION
            </th>
            <th colSpan={2} style={{ backgroundColor: '#065f46', color: '#ffffff', border: '1px solid rgba(6, 95, 70, 0.4)', padding: '8px 12px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', width: '30%' }}>
              AMOUNT
            </th>
          </tr>
          <tr style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <th style={{ backgroundColor: '#ffffff', border: '1px solid rgba(6, 95, 70, 0.2)', borderTop: 'none' }}></th>
            <th style={{ backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid rgba(6, 95, 70, 0.3)', borderTop: 'none', padding: '6px 12px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', width: '18%' }}>
              {displayCurrency === 'LKR' ? 'RS.' : displayCurrency}
            </th>
            <th style={{ backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid rgba(6, 95, 70, 0.3)', borderTop: 'none', padding: '6px 12px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', width: '12%' }}>
              CTS.
            </th>
          </tr>
        </thead>
        <tbody style={{ fontWeight: '600', color: '#1e293b' }}>
          {itemizedRows.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(6, 95, 70, 0.15)' }}>
              <td style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)', padding: '8px 12px', fontSize: '10px', color: '#1e293b', textAlign: 'left' }}>
                {row.description}
              </td>
              <td style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)', padding: '8px 12px', fontSize: '10px', color: '#1e293b', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700' }}>
                {row.amountVal}
              </td>
              <td style={{ padding: '8px 12px', fontSize: '10px', color: '#1e293b', textAlign: 'center', fontFamily: 'monospace', fontWeight: '700' }}>
                {row.amountCts}
              </td>
            </tr>
          ))}

          {/* Total Row */}
          <tr style={{ backgroundColor: 'rgba(6, 95, 70, 0.03)', fontWeight: '800', borderTop: '2px solid #065f46', color: '#065f46' }}>
            <td style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)', padding: '10px 12px', fontSize: '10px', textAlign: 'right', textTransform: 'uppercase', fontWeight: '900' }} colSpan={1}>
              Total ({displayCurrency})
            </td>
            <td style={{ borderRight: '1px solid rgba(6, 95, 70, 0.15)', padding: '10px 12px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '900' }}>
              {Math.floor(totalAmount).toLocaleString()}
            </td>
            <td style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'center', fontFamily: 'monospace', fontWeight: '900' }}>
              {Math.round((totalAmount - Math.floor(totalAmount)) * 100).toString().padStart(2, '0')}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Payment Reference & Breakdown Box */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px', fontSize: '11px' }}>
        {/* Left Column: Reference */}
        <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '10px', color: '#64748b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: '800', fontSize: '8px', textTransform: 'uppercase', tracking: '0.05em', margin: '0 0 2px 0', color: '#94a3b8' }}>Payment Reference</p>
            <p style={{ fontFamily: 'monospace', color: '#334155', fontWeight: '700', margin: '0' }}>
              {payments.map(p => p.referenceNumber).filter(Boolean).join(', ') || 'N/A'}
            </p>
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '8px' }}>
            {isFullyPaid 
              ? '* This reservation is fully settled.' 
              : isPartiallyPaid 
              ? '* Advance paid. Please preserve this draft bill.' 
              : '* No payments made yet.'}
          </div>
        </div>

        {/* Right Column: Calculations */}
        <div style={{ border: '1px solid rgba(6, 95, 70, 0.2)', borderRadius: '8px', padding: '12px', backgroundColor: 'rgba(6, 95, 70, 0.02)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Total Booking Amount:</span>
            <span style={{ fontWeight: '700', color: '#1e293b' }}>{displayCurrency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {displayCurrency === 'LKR' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Currency Rate:</span>
              <span style={{ fontWeight: '700', color: '#1e293b' }}>{exchangeRateVal}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Total Paid So Far:</span>
            <span style={{ fontWeight: '700', color: '#1e293b' }}>{displayCurrency} {totalPaidConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Remaining Balance:</span>
            <span style={{ fontWeight: '700', color: '#1e293b' }}>{displayCurrency} {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {(isFullyPaid || isPartiallyPaid) && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                fontSize: '9px',
                fontWeight: '800',
                color: isFullyPaid ? '#1d4ed8' : '#b45309',
                backgroundColor: isFullyPaid ? '#dbeafe' : '#fef3c7',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {isFullyPaid ? '✓ Fully Paid' : '✓ Advance Paid'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info: Remarks and Best Regards aligned horizontally */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px', gap: '30px' }}>
        {/* Left Column: Reserved By / Remarks */}
        <div style={{ flex: '1' }}>
          {(!confirmationData.bookingType || confirmationData.bookingType.toLowerCase().includes('direct')) ? (
            <>
              <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                RESERVED BY
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '100px', color: '#64748b', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Confirmed By</td>
                    <td style={{ width: '15px', color: '#64748b', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#1e293b', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.confirmedBy}</td>
                  </tr>
                  <tr>
                    <td style={{ width: '100px', color: '#64748b', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Reservation Status</td>
                    <td style={{ width: '15px', color: '#64748b', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#1e293b', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.reservationStatus}</td>
                  </tr>
                  <tr>
                    <td style={{ width: '100px', color: '#64748b', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Remark</td>
                    <td style={{ width: '15px', color: '#64748b', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#1e293b', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>
                      {associatedBooking?.remarks || confirmationData.remarks || 'None'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                REMARKS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '100px', color: '#64748b', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Remark</td>
                    <td style={{ width: '15px', color: '#64748b', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#1e293b', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>
                      {associatedBooking?.remarks || confirmationData.remarks || 'None'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Right Column: Best Regards */}
        <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: '1.4', textAlign: 'right', width: '220px', flexShrink: 0 }}>
          <p style={{ margin: '0 0 2px 0' }}>Best Regards</p>
          <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#1e293b' }}>{confirmationData.senderName}</p>
          <p style={{ margin: '0', fontSize: '8.5px', color: '#64748b' }}>
            Reservation Department<br />
            Serene Villa Hiriketiya<br />
            Serene Villa (Pvt) Ltd
          </p>
        </div>
      </div>

      {/* Signature Lines (Solid matching receipt) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', marginBottom: '24px' }}>
        <div style={{ width: '220px', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '6px', width: '100%' }}></div>
          <div style={{ fontSize: '10px', fontWeight: '850', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guest Signature</div>
        </div>
        <div style={{ width: '220px', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '6px', width: '100%' }}></div>
          <div style={{ fontSize: '10px', fontWeight: '850', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Received By</div>
        </div>
      </div>

      {/* Slogan Bordered Box */}
      <div style={{ border: '1px solid rgba(6, 95, 70, 0.15)', borderRadius: '8px', padding: '10px', textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#065f46', backgroundColor: 'rgba(6, 95, 70, 0.02)', marginTop: '24px', marginBottom: '24px' }}>
        #Welcome Serene Villa # Welcome to the Hiriketiya #Visit of Sri Lanka
      </div>

      {/* Footer Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '24px' }}>
        <span>Printed: {new Date().toLocaleString()}</span>
        <span>ID: {bookingNumber}</span>
      </div>

    </div>
  );
});

ReservationConfirmationPrint.displayName = 'ReservationConfirmationPrint';

export default ReservationConfirmationPrint;
