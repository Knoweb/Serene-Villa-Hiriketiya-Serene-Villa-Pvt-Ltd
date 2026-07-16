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

  return (
    <div ref={ref} className="confirmation-print-area text-slate-800 font-sans bg-white p-8 text-[11px] leading-relaxed" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* CSS overrides inside the component to ensure rendering correctness in html2pdf */}
      <style>{`
        .voucher-container {
          width: 100%;
          color: #1e293b;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .header-table td {
          border: none !important;
          padding: 0 !important;
        }
        .logo-img {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }
        .title-h1 {
          font-size: 16px;
          font-weight: 800;
          color: #065f46;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-details-p {
          font-size: 9px;
          color: #475569;
          line-height: 1.3;
          margin: 0;
        }
        .status-badge {
          font-size: 14px;
          font-weight: 700;
          color: #f43f5e;
          text-transform: capitalize;
        }
        .status-badge.confirmed {
          color: #10b981;
        }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .details-table td {
          padding: 3px 0 !important;
          border: none !important;
          font-size: 10px;
        }
        .label-col {
          width: 130px;
          color: #64748b;
          font-weight: 600;
        }
        .sep-col {
          width: 15px;
          color: #94a3b8;
          text-align: center;
        }
        .value-col {
          color: #0f172a;
          font-weight: 700;
        }
        .value-col-normal {
          color: #334155;
          font-weight: 500;
        }
        .itemized-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          margin-bottom: 16px;
        }
        .itemized-table th {
          background-color: #f8fafc;
          border-top: 1px solid #cbd5e1 !important;
          border-bottom: 1px solid #cbd5e1 !important;
          border-left: 1px solid #cbd5e1 !important;
          border-right: 1px solid #cbd5e1 !important;
          padding: 8px !important;
          font-size: 9px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .itemized-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 8px !important;
          font-size: 10px;
          color: #334155;
        }
        .itemized-table tr.total-row td {
          font-weight: 700;
          background-color: #ffffff;
          border-top: 2px solid #cbd5e1 !important;
          border-bottom: 2px solid #cbd5e1 !important;
          color: #0f172a;
        }
        .remark-span {
          font-weight: 700;
          color: #ef4444;
        }
        .slogan-box {
          border: 1px solid #cbd5e1;
          padding: 10px;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          color: #334155;
          margin-top: 20px;
          margin-bottom: 20px;
        }
        .footer-meta {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 24px;
        }
      `}</style>

      <div className="voucher-container">
        
        {/* Header Table */}
        <table className="header-table">
          <tbody>
            <tr>
              <td style={{ width: '74px', verticalAlign: 'top' }}>
                <img src={logoImg} alt="Serene Villa Logo" className="logo-img" />
              </td>
              <td style={{ verticalAlign: 'top', paddingLeft: '12px' }}>
                <h1 className="title-h1">Serene Villa Hiriketiya</h1>
                <p className="header-details-p">
                  Pehembiya Road, Hiriketiya, Dickwella, Matara, Sri Lanka.<br />
                  Email: resvrationshiri@gmail.com / serenehiriketiya@gmail.com<br />
                  WhatsApp Number: +94 70 499 8787 Front Office: +94 41 225 5204<br />
                  Web: www.serenehiriketiya.com
                </p>
              </td>
              <td style={{ width: '120px', verticalAlign: 'top', textAlign: 'right' }}>
                <span className={`status-badge ${confirmationData.badgeText?.toLowerCase() === 'confirmed' ? 'confirmed' : ''}`}>
                  {confirmationData.badgeText || 'Hold'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <div className="section-title">
          Reservation Confirmation
        </div>

        {/* Guest's Details */}
        <div style={{ fontSize: '9px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
          GUEST'S DETAILS
        </div>
        <table className="details-table">
          <tbody>
            <tr>
              <td className="label-col">Name of Client</td>
              <td className="sep-col">:</td>
              <td className="value-col">{guestName}</td>
              <td className="label-col" style={{ paddingLeft: '40px' }}>Nationality</td>
              <td className="sep-col">:</td>
              <td className="value-col">{confirmationData.nationality || selectedReg?.nationality || 'N/A'}</td>
            </tr>
            <tr>
              <td className="label-col">Email</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{confirmationData.email || 'N/A'}</td>
              <td className="label-col" style={{ paddingLeft: '40px' }}>WhatsApp Number</td>
              <td className="sep-col">:</td>
              <td className="value-col">{confirmationData.whatsappNumber || selectedReg?.whatsappNumber || selectedReg?.whatsAppNumber || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        {/* Reservation Details */}
        <div style={{ fontSize: '9px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
          RESERVATION DETAILS
        </div>
        <table className="details-table">
          <tbody>
            <tr>
              <td className="label-col">Reservation Id</td>
              <td className="sep-col">:</td>
              <td className="value-col" style={{ color: '#065f46' }}>ID {bookingNumber}</td>
              <td className="label-col" style={{ paddingLeft: '40px' }}>Check - in</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{formatDate(checkInDate)}</td>
            </tr>
            <tr>
              <td className="label-col">Reservation Date</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{formatDate(confirmationData.reservationDate)}</td>
              <td className="label-col" style={{ paddingLeft: '40px' }}>Check - out</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{formatDate(checkOutDate)}</td>
            </tr>
            <tr>
              <td className="label-col">Number of guests</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{String(adults + children).padStart(2, '0')}</td>
              <td className="label-col" style={{ paddingLeft: '40px' }}>Nights</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{String(nights).padStart(2, '0')} nights</td>
            </tr>
            <tr>
              <td className="label-col">Adults</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">
                {String(adults).padStart(2, '0')} &nbsp;&nbsp;&nbsp;&nbsp; Children: {String(children).padStart(2, '0')}
              </td>
              <td className="label-col" style={{ paddingLeft: '40px' }}>Basis</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{boardBasis}</td>
            </tr>
          </tbody>
        </table>

        {/* Itemized Table */}
        <table className="itemized-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '38%' }}>Room Reference</th>
              <th style={{ textAlign: 'left', width: '18%' }}>Room Type</th>
              <th style={{ textAlign: 'center', width: '10%' }}>Quantity</th>
              <th style={{ textAlign: 'right', width: '12%' }}>Unit Price</th>
              <th style={{ textAlign: 'center', width: '10%' }}>Nights</th>
              <th style={{ textAlign: 'right', width: '12%' }}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>
                {confirmationData.roomReference || (associatedBooking ? `Room ${associatedBooking.roomNumber} (${associatedBooking.roomType})` : '')}
              </td>
              <td style={{ textAlign: 'left' }}>{associatedBooking?.roomType || confirmationData.roomType || ''}</td>
              <td style={{ textAlign: 'center' }}>01</td>
              <td style={{ textAlign: 'right' }}>
                {confirmationData.currency} {parseFloat(confirmationData.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style={{ textAlign: 'center' }}>{String(nights).padStart(2, '0')}</td>
              <td style={{ textAlign: 'right', fontWeight: '600' }}>
                {confirmationData.currency} {parseFloat(confirmationData.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="total-row">
              <td style={{ textAlign: 'left' }}>Total Amount</td>
              <td style={{ textAlign: 'left' }}></td>
              <td style={{ textAlign: 'center' }}>01</td>
              <td style={{ textAlign: 'right' }}>
                {confirmationData.currency} {parseFloat(confirmationData.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style={{ textAlign: 'center' }}>{String(nights).padStart(2, '0')}</td>
              <td style={{ textAlign: 'right' }}>
                {confirmationData.currency} {parseFloat(confirmationData.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Reserved By */}
        <div style={{ fontSize: '9px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
          RESERVED BY
        </div>
        <table className="details-table" style={{ marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td className="label-col">Confirmed By</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{confirmationData.confirmedBy}</td>
              <td className="label-col" style={{ paddingLeft: '40px' }}>Reservation Status</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal">{confirmationData.reservationStatus}</td>
            </tr>
            <tr>
              <td className="label-col">Remark</td>
              <td className="sep-col">:</td>
              <td className="value-col-normal" colSpan="4">
                <span className="remark-span">{associatedBooking?.remarks || confirmationData.remarks || 'None'}</span>
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
        <div className="slogan-box">
          #Welcome Serene Villa # Welcome to the Hiriketiya #Visit of Sri Lanka
        </div>

        {/* Footer Meta */}
        <div className="footer-meta">
          <span>Printed: {new Date().toLocaleString()}</span>
          <span>ID: {bookingNumber}</span>
        </div>

      </div>

    </div>
  );
});

ReservationConfirmationPrint.displayName = 'ReservationConfirmationPrint';

export default ReservationConfirmationPrint;
