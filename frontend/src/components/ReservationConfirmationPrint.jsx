import React from 'react';
import logoImg from '../assets/logo.jpeg';

const ReservationConfirmationPrint = React.forwardRef(({ confirmationData, selectedReg, associatedBooking }, ref) => {
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
      
      {/* Header Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <tbody>
          <tr>
            <td style={{ width: '70px', verticalAlign: 'top', padding: '0', border: 'none' }}>
              <img 
                src={logoImg} 
                alt="Serene Villa Logo" 
                style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block' }} 
              />
            </td>
            <td style={{ verticalAlign: 'top', padding: '0 0 0 16px', border: 'none' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#065f46', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Serene Villa Hiriketiya
              </h1>
              <p style={{ fontSize: '9.5px', color: '#475569', lineHeight: '1.4', margin: '0' }}>
                Pehembiya Road, Hiriketiya, Dickwella, Matara, Sri Lanka.<br />
                Email: resvrationshiri@gmail.com / serenehiriketiya@gmail.com<br />
                WhatsApp Number: +94 70 499 8787 Front Office: +94 41 225 5204<br />
                Web: www.serenehiriketiya.com
              </p>
            </td>
            <td style={{ width: '120px', verticalAlign: 'top', textAlign: 'right', padding: '0', border: 'none' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: isConfirmed ? '#10b981' : '#f43f5e', textTransform: 'capitalize' }}>
                {confirmationData.badgeText || 'Hold'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Title */}
      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
        Reservation Confirmation
      </div>

      {/* Guest's Details */}
      <div style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
        GUEST'S DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px' }}>
        <tbody>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Name of Client</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#0f172a', fontWeight: '700', fontSize: '10px', padding: '4px 0', border: 'none' }}>{guestName}</td>
            
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0 4px 40px', border: 'none' }}>Nationality</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#0f172a', fontWeight: '700', fontSize: '10px', padding: '4px 0', border: 'none' }}>{confirmationData.nationality || selectedReg?.nationality || 'N/A'}</td>
          </tr>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Email</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{confirmationData.email || 'N/A'}</td>
            
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0 4px 40px', border: 'none' }}>WhatsApp Number</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#0f172a', fontWeight: '700', fontSize: '10px', padding: '4px 0', border: 'none' }}>{confirmationData.whatsappNumber || selectedReg?.whatsappNumber || selectedReg?.whatsAppNumber || 'N/A'}</td>
          </tr>
        </tbody>
      </table>

      {/* Reservation Details */}
      <div style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
        RESERVATION DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Reservation Id</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#065f46', fontWeight: '700', fontSize: '10px', padding: '4px 0', border: 'none' }}>ID {bookingNumber}</td>
            
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0 4px 40px', border: 'none' }}>Check - in</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{formatDate(checkInDate)}</td>
          </tr>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Reservation Date</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{formatDate(confirmationData.reservationDate)}</td>
            
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0 4px 40px', border: 'none' }}>Check - out</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{formatDate(checkOutDate)}</td>
          </tr>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Number of guests</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{String(adults + children).padStart(2, '0')}</td>
            
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0 4px 40px', border: 'none' }}>Nights</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{String(nights).padStart(2, '0')} nights</td>
          </tr>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Adults</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>
              {String(adults).padStart(2, '0')} &nbsp;&nbsp;&nbsp;&nbsp; Children: {String(children).padStart(2, '0')}
            </td>
            
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0 4px 40px', border: 'none' }}>Basis</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{boardBasis}</td>
          </tr>
        </tbody>
      </table>

      {/* Itemized Room Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'left', width: '38%' }}>Room Reference</th>
            <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'left', width: '18%' }}>Room Type</th>
            <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center', width: '10%' }}>Quantity</th>
            <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Unit Price</th>
            <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center', width: '10%' }}>Nights</th>
            <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Total Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'left' }}>
              {confirmationData.roomReference || (associatedBooking ? `Room ${associatedBooking.roomNumber} (${associatedBooking.roomType})` : '')}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'left' }}>
              {associatedBooking?.roomType || confirmationData.roomType || ''}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'center' }}>01</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'right' }}>
              {confirmationData.currency} {parseFloat(confirmationData.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'center' }}>{String(nights).padStart(2, '0')}</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'right', fontWeight: '600' }}>
              {confirmationData.currency} {parseFloat(confirmationData.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr style={{ fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a' }}>
            <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'left' }}>Total Amount</td>
            <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'left' }}></td>
            <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'center' }}>01</td>
            <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'right' }}>
              {confirmationData.currency} {parseFloat(confirmationData.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'center' }}>{String(nights).padStart(2, '0')}</td>
            <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'right' }}>
              {confirmationData.currency} {parseFloat(confirmationData.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Reserved By */}
      <div style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
        RESERVED BY
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Confirmed By</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{confirmationData.confirmedBy}</td>
            
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0 4px 40px', border: 'none' }}>Reservation Status</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#334155', fontWeight: '500', fontSize: '10px', padding: '4px 0', border: 'none' }}>{confirmationData.reservationStatus}</td>
          </tr>
          <tr>
            <td style={{ width: '120px', color: '#64748b', fontWeight: '600', fontSize: '10px', padding: '4px 0', border: 'none' }}>Remark</td>
            <td style={{ width: '15px', color: '#94a3b8', textAlign: 'center', fontSize: '10px', padding: '4px 0', border: 'none' }}>:</td>
            <td style={{ color: '#ef4444', fontWeight: '700', fontSize: '10px', padding: '4px 0', border: 'none' }} colSpan="4">
              {associatedBooking?.remarks || confirmationData.remarks || 'None'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Best Regards */}
      <div style={{ fontSize: '9px', color: '#475569', lineHeight: '1.4', marginTop: '16px' }}>
        <p style={{ margin: '0 0 2px 0' }}>Best Regards</p>
        <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#1e293b' }}>{confirmationData.senderName}</p>
        <p style={{ margin: '0', fontSize: '8.5px', color: '#64748b' }}>
          Reservation Department<br />
          Serene Villa Hiriketiya<br />
          Serene Villa (Pvt) Ltd
        </p>
      </div>

      {/* Slogan Bordered Box */}
      <div style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#334155', marginTop: '24px', marginBottom: '24px' }}>
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
