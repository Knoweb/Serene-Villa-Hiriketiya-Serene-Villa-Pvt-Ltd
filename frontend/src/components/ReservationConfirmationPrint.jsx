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
    <div ref={ref} className="confirmation-print-area text-slate-800 font-sans bg-white p-8 text-[11px] leading-relaxed">
      {/* Header Section */}
      <div className="flex justify-between items-start pb-2 mb-2 relative">
        <div className="flex gap-4">
          <img src={logoImg} alt="Serene Villa Logo" className="h-16 w-16 object-contain" />
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-emerald-800 tracking-wide uppercase">Serene Villa Hiriketiya</h1>
            <p className="text-[9px] text-slate-700 leading-tight">
              Pehembiya Road, Hiriketiya, Dickwella, Matara, Sri Lanka.<br />
              Email: resvrationshiri@gmail.com / serenehiriketiya@gmail.com<br />
              WhatsApp Number: +94 70 499 8787 Front Office: +94 41 225 5204<br />
              Web: www.serenehiriketiya.com
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block text-rose-500 font-sans text-[16px] font-bold px-2 py-0.5 tracking-wider">
            {confirmationData.badgeText || 'Hold'}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-800">
          Reservation Confirmation
        </h2>
      </div>

      {/* Guest's Details Section */}
      <div className="mb-4">
        <div className="bg-slate-700 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 mb-2">
          Guest's Details
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-1">
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Name of Client</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="font-bold text-slate-900">{guestName}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Address</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-800">{confirmationData.address || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Email</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-800">{confirmationData.email || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Vat No</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-800">{confirmationData.vatNo || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Reservation Details Section */}
      <div className="mb-4">
        <div className="bg-slate-700 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 mb-2">
          Reservation Details
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-1">
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Reservation Id</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="font-bold text-emerald-800">
              ID {bookingNumber}
            </span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Check - in</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-800">{formatDate(checkInDate)}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Reservation Date</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-800">{formatDate(confirmationData.reservationDate)}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Check - out</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-800">{formatDate(checkOutDate)}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Number of guests</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-805">{String(adults + children).padStart(2, '0')}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Nights</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-805">{String(nights).padStart(2, '0')} nights</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Adults</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-805">{String(adults).padStart(2, '0')} &nbsp;&nbsp;&nbsp;&nbsp; Children: {String(children).padStart(2, '0')}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-700 font-bold">Basis</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-805">{boardBasis}</span>
          </div>
        </div>
      </div>

      {/* Room Details Table */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-slate-700 text-white border-b border-slate-300">
              <th className="border-r border-slate-350 px-2 py-1 text-left w-[40%] font-semibold">Room Reference</th>
              <th className="border-r border-slate-350 px-2 py-1 text-left w-[15%] font-semibold">Room Type</th>
              <th className="border-r border-slate-350 px-2 py-1 text-center w-[10%] font-semibold">Quantity</th>
              <th className="border-r border-slate-350 px-2 py-1 text-right w-[12%] font-semibold">Unit Price</th>
              <th className="border-r border-slate-350 px-2 py-1 text-center w-[10%] font-semibold">Nights</th>
              <th className="px-2 py-1 text-right w-[13%] font-semibold">Total Price</th>
            </tr>
          </thead>
          <tbody className="text-slate-800">
            <tr className="border-b border-slate-300">
              <td className="border-r border-slate-300 px-2 py-2">
                {confirmationData.roomReference || (associatedBooking ? `Room ${associatedBooking.roomNumber} (${associatedBooking.roomType})` : '')}
              </td>
              <td className="border-r border-slate-300 px-2 py-2">{associatedBooking?.roomType || confirmationData.roomType || ''}</td>
              <td className="border-r border-slate-300 px-2 py-2 text-center">01</td>
              <td className="border-r border-slate-300 px-2 py-2 text-right">
                {confirmationData.currency} {parseFloat(confirmationData.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border-r border-slate-300 px-2 py-2 text-center">{String(nights).padStart(2, '0')}</td>
              <td className="px-2 py-2 text-right font-medium">
                {confirmationData.currency} {parseFloat(confirmationData.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            <tr className="bg-white font-bold border-t border-slate-300 text-slate-800">
              <td className="border-r border-slate-300 px-2 py-1">Total Amount</td>
              <td className="border-r border-slate-300 px-2 py-1"></td>
              <td className="border-r border-slate-300 px-2 py-1 text-center">01</td>
              <td className="border-r border-slate-300 px-2 py-1 text-right">
                {confirmationData.currency} {parseFloat(confirmationData.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border-r border-slate-300 px-2 py-1 text-center">{String(nights).padStart(2, '0')}</td>
              <td className="px-2 py-1 text-right font-bold">
                {confirmationData.currency} {parseFloat(confirmationData.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reserved By Section */}
      <div className="mb-6">
        <div className="bg-slate-700 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 mb-2">
          Reserved By
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-1">
          <div className="flex items-center">
            <span className="w-28 text-slate-750 font-bold">Confirmed By</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-800">{confirmationData.confirmedBy}</span>
          </div>
          <div className="flex items-center">
            <span className="w-28 text-slate-750 font-bold">Reservation Status</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="text-slate-805">{confirmationData.reservationStatus}</span>
          </div>
          <div className="flex items-center col-span-2 mt-0.5">
            <span className="w-28 text-slate-750 font-bold">Remark</span>
            <span className="mr-2 text-slate-750 font-bold">:</span>
            <span className="font-semibold text-red-600">{associatedBooking?.remarks || confirmationData.remarks || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Greetings & Sign off */}
      <div className="space-y-1 text-slate-700 mt-6 text-[10px]">
        <p>Best Regards</p>
        <p className="font-semibold text-slate-800">{confirmationData.senderName}</p>
        <p className="text-[9px] text-slate-500">
          Reservation Department<br />
          Serene Villa Hiriketiya<br />
          Serene Villa (Pvt) Ltd
        </p>
      </div>

      {/* Welcome Bordered Slogan Box */}
      <div className="mt-8 border border-slate-300 py-1.5 text-center text-[10px] font-bold text-slate-800 tracking-wide">
        #Welcome Serene Villa # Welcome to the Hiriketiya #Visit of Sri Lanka
      </div>

      {/* Printed Metadata */}
      <div className="flex justify-between text-[8px] text-slate-400 mt-10 pt-2 border-t border-slate-100 font-medium">
        <span>Printed: {new Date().toLocaleString()}</span>
        <span>ID: {bookingNumber}</span>
      </div>
    </div>
  );
});

ReservationConfirmationPrint.displayName = 'ReservationConfirmationPrint';

export default ReservationConfirmationPrint;
