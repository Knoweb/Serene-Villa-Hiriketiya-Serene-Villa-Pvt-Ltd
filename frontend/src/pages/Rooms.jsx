import React, { useState } from 'react';
import { Eye, CheckCircle2, Building } from 'lucide-react';

const Rooms = () => {
  const [rooms, setRooms] = useState([
    {
      id: 101,
      roomNumber: '101',
      roomType: 'Deluxe Ocean View',
      image: '/deluxe.png',
      facilities: ['King Bed', 'AC', 'Mini Bar', 'Ocean View balcony', 'High-speed Wi-Fi', 'Coffee Maker'],
      status: 'Available',
    },
    {
      id: 102,
      roomNumber: '102',
      roomType: 'Deluxe Ocean View',
      image: '/deluxe.png',
      facilities: ['King Bed', 'AC', 'Mini Bar', 'Ocean View balcony', 'High-speed Wi-Fi', 'Coffee Maker'],
      status: 'Occupied',
    },
    {
      id: 103,
      roomNumber: '103',
      roomType: 'Deluxe Ocean View',
      image: '/deluxe.png',
      facilities: ['King Bed', 'AC', 'Mini Bar', 'Ocean View balcony', 'High-speed Wi-Fi', 'Coffee Maker'],
      status: 'Available',
    },
    {
      id: 201,
      roomNumber: '201',
      roomType: 'Tropical Plunge Suite',
      image: '/suite.png',
      facilities: ['King Bed', 'AC', 'Private Plunge Pool', 'Outdoor Lounge', 'Mini Bar', 'High-speed Wi-Fi', 'Luxury Toiletries'],
      status: 'Available',
    },
    {
      id: 202,
      roomNumber: '202',
      roomType: 'Tropical Plunge Suite',
      image: '/suite.png',
      facilities: ['King Bed', 'AC', 'Private Plunge Pool', 'Outdoor Lounge', 'Mini Bar', 'High-speed Wi-Fi', 'Luxury Toiletries'],
      status: 'Maintenance',
    },
    {
      id: 203,
      roomNumber: '203',
      roomType: 'Tropical Plunge Suite',
      image: '/suite.png',
      facilities: ['King Bed', 'AC', 'Private Plunge Pool', 'Outdoor Lounge', 'Mini Bar', 'High-speed Wi-Fi', 'Luxury Toiletries'],
      status: 'Occupied',
    }
  ]);

  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Room Inventory & Management</h2>
        <p className="text-xs text-slate-505 font-medium mt-0.5">Total rooms: 6 (Serene Villa Pvt Ltd context)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="relative h-48 bg-slate-50">
                <img 
                  src={room.image} 
                  alt={room.roomType} 
                  className="w-full h-full object-cover"
                />
                <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  room.status === 'Available' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : room.status === 'Occupied' 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-800' 
                    : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                  {room.status}
                </span>
                <span className="absolute bottom-4 left-4 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white">
                  Room {room.roomNumber}
                </span>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-800">{room.roomType}</h3>
                
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Facilities Included</p>
                  <div className="flex flex-wrap gap-1.5">
                    {room.facilities.slice(0, 4).map((f, i) => (
                      <span key={i} className="text-[10px] bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-semibold">
                        {f}
                      </span>
                    ))}
                    {room.facilities.length > 4 && (
                      <span className="text-[10px] text-emerald-600 font-bold px-2 py-0.5">
                        +{room.facilities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setSelectedRoom(room)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 text-slate-700 hover:text-emerald-700 text-xs font-bold transition"
              >
                <Eye className="h-4 w-4" /> View Facilities
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-xl rounded-2xl overflow-hidden shadow-xl relative">
            <div className="h-56 bg-slate-50">
              <img src={selectedRoom.image} alt={selectedRoom.roomType} className="w-full h-full object-cover" />
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Room {selectedRoom.roomNumber} - {selectedRoom.roomType}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Property: Serene Villa Pvt Ltd</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  selectedRoom.status === 'Available' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : selectedRoom.status === 'Occupied' 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-800' 
                    : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                  {selectedRoom.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">All Facilities & Amenities</p>
                <ul className="grid grid-cols-2 gap-2 text-xs text-slate-650 font-semibold">
                  {selectedRoom.facilities.map((fac, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      {fac}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-5 rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
