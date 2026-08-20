import React from 'react';
import logoImg from '../assets/logo.jpeg';

const AdvanceRequestPrint = React.forwardRef(({ advanceData, selectedReg, associatedBooking }, ref) => {
  if (!advanceData) return null;

  const formatDateDots = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '.');
  };

  const guestName = advanceData.guestName || selectedReg?.guestName || associatedBooking?.guestName || '';
  const bookingNumber = associatedBooking?.bookingNumber || 'N/A';
  const checkInDate = advanceData.checkIn || selectedReg?.checkInDate || associatedBooking?.checkInDate || '';
  const checkOutDate = advanceData.checkOut || selectedReg?.checkOutDate || associatedBooking?.checkOutDate || '';
  const nights = advanceData.nights || selectedReg?.numberOfNights || selectedReg?.nights || associatedBooking?.nights || 1;
  const boardBasis = associatedBooking?.boardBasis || 'Bed & Breakfast';
  const adults = selectedReg?.adults || associatedBooking?.adults || 1;
  const children = selectedReg?.children || associatedBooking?.children || 0;
  const remarks = advanceData.remarks || associatedBooking?.remarks || selectedReg?.remarks || 'N/A';

  const currency = advanceData.currency || associatedBooking?.currency || 'USD';
  const totalAmount = parseFloat(advanceData.totalAmount || 0);
  const advanceAmount = parseFloat(advanceData.advanceAmount || 0);
  const balanceAmount = Math.max(0, totalAmount - advanceAmount);
  const exRate = parseFloat(advanceData.exchangeRate || associatedBooking?.exchangeRate || 1) || 1;
  const bankDetails = advanceData.bankDetails || {
    bankName: "People's Bank",
    companyName: "Serene Villa",
    accountHolder: "Serene Villa Hiriketiya",
    accountNumber: "288402130016448",
    branch: "Kudawella",
    swiftCode: "PSBKLKLX",
    hotline: "+94 70 499 8787"
  };

  return (
    <div 
      ref={ref} 
      className="advance-request-print-area text-black font-sans bg-white p-6"
      style={{ 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#1e293b',
        backgroundColor: '#ffffff',
        padding: '24px 16px',
        width: '100%',
        maxWidth: '100%',
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
          
          <div style={{ fontSize: '10px', color: '#334155', lineHeight: '1.4', marginTop: '4px', fontWeight: '500' }}>
            <p style={{ margin: 0 }}>Pehembiya Road, Hiriketiya, Dickwella.</p>
            <p style={{ margin: 0 }}>Email: Serenehiriketiya@gmail.com</p>
            <p style={{ margin: 0 }}>Hotline: +94 41 225 5204 / +94 70 499 8787</p>
          </div>
        </div>

        {/* Right Column: Title & Request Box */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '900', color: '#065f46', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ADVANCE PAYMENT REQUEST
          </h1>
          <div style={{ display: 'inline-block', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '10px', textAlign: 'left', minWidth: '160px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '2px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Booking No:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#065f46' }}>{bookingNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Date:</span>
              <span style={{ fontWeight: '700', color: '#1e293b' }}>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Details Section */}
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
          <span style={{ color: '#0f172a', fontWeight: '700', borderBottom: '1px dashed #e2e8f0', flex: 1, paddingBottom: '2px' }}>Direct Booking</span>
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

      {/* Payment & Bank Details 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        
        {/* Left Box: Bank Transfer Details */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
            BANK TRANSFER DETAILS
          </div>
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Bank Name:</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{bankDetails.bankName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Account Holder:</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{bankDetails.accountHolder}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Account Number:</span>
              <span style={{ fontWeight: '800', color: '#065f46', fontFamily: 'monospace' }}>{bankDetails.accountNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Branch:</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{bankDetails.branch}</span>
            </div>
            {bankDetails.swiftCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '2px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Swift Code:</span>
                <span style={{ fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{bankDetails.swiftCode}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Hotline / Contact:</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{bankDetails.hotline || '+94 70 499 8787'}</span>
            </div>
          </div>
        </div>

        {/* Right Box: Calculations */}
        <div style={{ border: '1px solid rgba(6, 95, 70, 0.2)', borderRadius: '8px', padding: '12px', backgroundColor: 'rgba(6, 95, 70, 0.02)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
            PAYMENT SUMMARY
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px', fontSize: '11px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Total Amount:</span>
            <span style={{ fontWeight: '700', color: '#1e293b' }}>{currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {currency !== 'LKR' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px', fontSize: '11px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Exchange Rate:</span>
                <span style={{ fontWeight: '700', color: '#1e293b' }}>{exRate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px', fontSize: '11px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Converted Amount:</span>
                <span style={{ fontWeight: '700', color: '#1e293b' }}>LKR {(totalAmount * exRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 95, 70, 0.1)', paddingBottom: '2px', fontSize: '11px' }}>
            <span style={{ color: '#065f46', fontWeight: '700' }}>Advance Amount:</span>
            <span style={{ fontWeight: '800', color: '#065f46' }}>{currency} {advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px', fontSize: '11px' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Balance Due Upon Arrival:</span>
            <span style={{ fontWeight: '700', color: '#1e293b' }}>{currency} {balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>

      {/* Remarks Section */}
      {remarks && remarks !== 'N/A' && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '10px', marginBottom: '12px', backgroundColor: '#fafafa' }}>
          <span style={{ fontWeight: '700', color: '#475569' }}>Remarks / Special Notes: </span>
          <span style={{ color: '#334155' }}>{remarks}</span>
        </div>
      )}

      {/* Signatures Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '8px', fontSize: '10px' }}>
        <div style={{ textTransform: 'uppercase', fontWeight: '700', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '4px', width: '200px', textAlign: 'center' }}>
          GUEST SIGNATURE
        </div>
        <div style={{ textTransform: 'uppercase', fontWeight: '700', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '4px', width: '200px', textAlign: 'center' }}>
          AUTHORIZED SIGNATURE
        </div>
      </div>

    </div>
  );
});

AdvanceRequestPrint.displayName = 'AdvanceRequestPrint';

export default AdvanceRequestPrint;
