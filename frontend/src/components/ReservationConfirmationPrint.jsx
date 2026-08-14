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
  const isDirect = !confirmationData.bookingType || confirmationData.bookingType.toLowerCase().includes('direct');

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
                SERENE VILLA - HIRIKETIYA
              </h1>
              <p style={{ fontSize: '9.5px', color: '#475569', lineHeight: '1.4', margin: '0' }}>
                Pehembiya Road, Hiriketiya, Dickwella, Matara, Sri Lanka.<br />
                Email: resvrationshiri@gmail.com / serenehiriketiya@gmail.com<br />
                WhatsApp Number: +94 70 499 8787 Front Office: +94 41 225 5204<br />
                Web: www.serenehiriketiya.com
              </p>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '0', border: 'none' }}>
              {(!confirmationData.bookingType || confirmationData.bookingType.toLowerCase().includes('direct')) && confirmationData.badgeText && confirmationData.badgeText.trim() !== '' && (
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 10px',
                  fontSize: '10px',
                  fontWeight: '800',
                  color: isConfirmed ? '#166534' : '#991b1b',
                  backgroundColor: isConfirmed ? '#dcfce7' : '#fee2e2',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {confirmationData.badgeText}
                </span>
              )}
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
          {isDirect ? (
            <>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Name of Client</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{guestName}</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Nationality</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.nationality || selectedReg?.nationality || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Email</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.email || 'N/A'}</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>WhatsApp Number</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.whatsappNumber || selectedReg?.whatsappNumber || selectedReg?.whatsAppNumber || 'N/A'}</td>
              </tr>
            </>
          ) : (
            <tr>
              <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Name of Client</td>
              <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
              <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{guestName}</td>
              
              <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Booking Channel</td>
              <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
              <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.bookingType}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Reservation Details */}
      <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
        RESERVATION DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          {isDirect ? (
            <>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Booking Number</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{bookingNumber}</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Check - in</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{formatDate(checkInDate)}</td>
              </tr>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Reservation Date</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{formatDate(confirmationData.reservationDate)}</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Check - out</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{formatDate(checkOutDate)}</td>
              </tr>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Number of guests</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{String(adults + children).padStart(2, '0')}</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Nights</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{String(nights).padStart(2, '0')} nights</td>
              </tr>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Adults</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>
                  {String(adults).padStart(2, '0')} &nbsp;&nbsp;&nbsp;&nbsp; Children: {String(children).padStart(2, '0')}
                </td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Basis</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{boardBasis}</td>
              </tr>
            </>
          ) : (
            <>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Booking Number</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{bookingNumber}</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Check - in</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{formatDate(checkInDate)}</td>
              </tr>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Reservation Date</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{formatDate(confirmationData.reservationDate)}</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Check - out</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{formatDate(checkOutDate)}</td>
              </tr>
              <tr>
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Nights</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{String(nights).padStart(2, '0')} nights</td>
                
                <td style={{ width: '120px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0 4px 40px', border: 'none' }}>Basis</td>
                <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{boardBasis}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* Itemized Room Table */}
      {!isDirect ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
          <thead>
            <tr>
              <th rowSpan="2" style={{ backgroundColor: '#004d36', border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', fontWeight: '850', color: '#ffffff', textTransform: 'uppercase', textAlign: 'left', width: '60%' }}>Description</th>
              <th rowSpan="2" style={{ backgroundColor: '#004d36', border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', fontWeight: '850', color: '#ffffff', textTransform: 'uppercase', textAlign: 'right', width: '18%' }}>Rate</th>
              <th colSpan="2" style={{ backgroundColor: '#004d36', border: '1px solid #cbd5e1', padding: '4px', fontSize: '10px', fontWeight: '850', color: '#ffffff', textTransform: 'uppercase', textAlign: 'center', width: '22%' }}>Amount</th>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#004d36', border: '1px solid #cbd5e1', padding: '4px', fontSize: '9px', fontWeight: '850', color: '#ffffff', textAlign: 'right' }}>
                {confirmationData.currency === 'USD' ? 'US$' : confirmationData.currency}
              </th>
              <th style={{ backgroundColor: '#004d36', border: '1px solid #cbd5e1', padding: '4px', fontSize: '9px', fontWeight: '850', color: '#ffffff', textAlign: 'center', width: '50px' }}>Cts.</th>
            </tr>
          </thead>
          <tbody>
            {confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0 ? (
              confirmationData.allocatedRooms.map((item, idx) => {
                const rateVal = parseFloat(item.price || 0);
                const roomTotal = rateVal * nights * (parseFloat(confirmationData.exchangeRate) || 1);
                const mainPart = Math.floor(roomTotal);
                const centsPart = Math.round((roomTotal - mainPart) * 100);

                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'left', fontWeight: '600' }}>
                        Night - {item.roomType} (Room {item.roomNumber})
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'right', fontWeight: '600' }}>
                        US$ {rateVal.toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'right', fontWeight: '700' }}>
                        {mainPart.toLocaleString()}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'center', fontWeight: '700' }}>
                        {String(centsPart).padStart(2, '0')}
                      </td>
                    </tr>
                    {confirmationData.currency !== 'USD' && parseFloat(confirmationData.exchangeRate) !== 1 && (
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontSize: '9.5px', color: '#475569', textAlign: 'left', fontStyle: 'italic' }}>
                          &nbsp;&nbsp;&nbsp;&nbsp;@ {parseFloat(confirmationData.exchangeRate).toFixed(2)}
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontSize: '9.5px', color: '#475569', textAlign: 'right' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontSize: '9.5px', color: '#475569', textAlign: 'right' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontSize: '9.5px', color: '#475569', textAlign: 'center' }}></td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'left' }}>
                  Night - {associatedBooking?.roomType || confirmationData.roomType || ''}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'right' }}>
                  US$ {parseFloat(confirmationData.unitPrice || 0).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'right', fontWeight: '700' }}>
                  {Math.floor(parseFloat(confirmationData.totalPrice || 0)).toLocaleString()}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#000000', textAlign: 'center', fontWeight: '700' }}>
                  {String(Math.round((parseFloat(confirmationData.totalPrice || 0) - Math.floor(parseFloat(confirmationData.totalPrice || 0))) * 100)).padStart(2, '0')}
                </td>
              </tr>
            )}
            <tr style={{ fontWeight: '800', backgroundColor: '#ffffff', color: '#000000' }}>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'right', textTransform: 'uppercase' }}>Total</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'right' }}></td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'right', fontWeight: '800' }}>
                {Math.floor(parseFloat(confirmationData.totalPrice || 0)).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'center', fontWeight: '800' }}>
                {String(Math.round((parseFloat(confirmationData.totalPrice || 0) - Math.floor(parseFloat(confirmationData.totalPrice || 0))) * 100)).padStart(2, '0')}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'left', width: '56%' }}>Room Type</th>
              <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center', width: '10%' }}>Quantity</th>
              <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Unit Price</th>
              <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center', width: '10%' }}>Nights</th>
              <th style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0 ? (
              confirmationData.allocatedRooms.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'left' }}>
                    {item.roomType} (Room {item.roomNumber})
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'center' }}>01</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'right' }}>
                    USD {parseFloat(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'center' }}>{String(nights).padStart(2, '0')}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '10px', color: '#334155', textAlign: 'right', fontWeight: '600' }}>
                    USD {parseFloat(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
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
            )}
            <tr style={{ fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a' }}>
              <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'left' }}>Total Amount</td>
              <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'center' }}>
                {confirmationData.allocatedRooms && confirmationData.allocatedRooms.length > 0 
                  ? String(confirmationData.allocatedRooms.length).padStart(2, '0') 
                  : '01'}
              </td>
              <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'right' }}>-</td>
              <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'center' }}>{String(nights).padStart(2, '0')}</td>
              <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1', padding: '8px', fontSize: '10px', textAlign: 'right' }}>
                {confirmationData.currency} {parseFloat(confirmationData.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Footer Info: Remarks and Best Regards aligned horizontally */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px', gap: '30px' }}>
        {/* Left Column: Reserved By / Remarks */}
        <div style={{ flex: '1' }}>
          {(!confirmationData.bookingType || confirmationData.bookingType.toLowerCase().includes('direct')) ? (
            <>
              <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                RESERVED BY
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '100px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Confirmed By</td>
                    <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.confirmedBy}</td>
                  </tr>
                  <tr>
                    <td style={{ width: '100px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Reservation Status</td>
                    <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>{confirmationData.reservationStatus}</td>
                  </tr>
                  <tr>
                    <td style={{ width: '100px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Remark</td>
                    <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>
                      {associatedBooking?.remarks || confirmationData.remarks || 'None'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                REMARKS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '100px', color: '#000000', fontWeight: '600', fontSize: '11px', padding: '4px 0', border: 'none' }}>Remark</td>
                    <td style={{ width: '15px', color: '#000000', textAlign: 'center', fontSize: '11px', padding: '4px 0', border: 'none' }}>:</td>
                    <td style={{ color: '#000000', fontWeight: '700', fontSize: '11px', padding: '4px 0', border: 'none' }}>
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

      {/* Signature Lines */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', marginBottom: '24px' }}>
        <div style={{ width: '220px', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px dotted #000000', marginBottom: '6px', width: '100%' }}></div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#000000' }}>Guest Signature</div>
        </div>
        <div style={{ width: '220px', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px dotted #000000', marginBottom: '6px', width: '100%' }}></div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#000000' }}>Received By</div>
        </div>
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
