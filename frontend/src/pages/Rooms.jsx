import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, Trash2, Plus, X, ListPlus, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_ROOMS = [
  {
    id: 101,
    roomNumber: '101',
    roomType: 'Deluxe Ocean View',
    image: '/deluxe.png',
    images: [],
    facilities: ['King Bed', 'AC', 'Mini Bar', 'Ocean View balcony', 'High-speed Wi-Fi', 'Coffee Maker'],
    status: 'Available',
  },
  {
    id: 102,
    roomNumber: '102',
    roomType: 'Deluxe Ocean View',
    image: '/deluxe.png',
    images: [],
    facilities: ['King Bed', 'AC', 'Mini Bar', 'Ocean View balcony', 'High-speed Wi-Fi', 'Coffee Maker'],
    status: 'Occupied',
  },
  {
    id: 103,
    roomNumber: '103',
    roomType: 'Deluxe Ocean View',
    image: '/deluxe.png',
    images: [],
    facilities: ['King Bed', 'AC', 'Mini Bar', 'Ocean View balcony', 'High-speed Wi-Fi', 'Coffee Maker'],
    status: 'Available',
  },
  {
    id: 201,
    roomNumber: '201',
    roomType: 'Tropical Plunge Suite',
    image: '/suite.png',
    images: [],
    facilities: ['King Bed', 'AC', 'Private Plunge Pool', 'Outdoor Lounge', 'Mini Bar', 'High-speed Wi-Fi', 'Luxury Toiletries'],
    status: 'Available',
  },
  {
    id: 202,
    roomNumber: '202',
    roomType: 'Tropical Plunge Suite',
    image: '/suite.png',
    images: [],
    facilities: ['King Bed', 'AC', 'Private Plunge Pool', 'Outdoor Lounge', 'Mini Bar', 'High-speed Wi-Fi', 'Luxury Toiletries'],
    status: 'Maintenance',
  },
  {
    id: 203,
    roomNumber: '203',
    roomType: 'Tropical Plunge Suite',
    image: '/suite.png',
    images: [],
    facilities: ['King Bed', 'AC', 'Private Plunge Pool', 'Outdoor Lounge', 'Mini Bar', 'High-speed Wi-Fi', 'Luxury Toiletries'],
    status: 'Occupied',
  }
];

const Rooms = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State to hold rooms (initialize from localStorage or default)
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('pms_rooms');
    return saved ? JSON.parse(saved) : DEFAULT_ROOMS;
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Deluxe Ocean View');
  const [status, setStatus] = useState('Available');
  const [facilitiesText, setFacilitiesText] = useState('King Bed, AC, High-speed Wi-Fi, Mini Bar');
  const [roomImages, setRoomImages] = useState([]);

  // Reset active image index when selected room changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedRoom]);

  // Save to localStorage when rooms state changes
  useEffect(() => {
    localStorage.setItem('pms_rooms', JSON.stringify(rooms));
  }, [rooms]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64Images => {
      setRoomImages(prev => [...prev, ...base64Images]);
    }).catch(err => {
      console.error('Error uploading images:', err);
    });
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!roomNumber) return;

    // Check if room number already exists
    if (rooms.some(r => r.roomNumber === roomNumber)) {
      alert('Room number already exists!');
      return;
    }

    const facilitiesArray = facilitiesText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const newRoom = {
      id: Date.now(),
      roomNumber,
      roomType,
      image: roomType.includes('Suite') ? '/suite.png' : '/deluxe.png',
      images: roomImages,
      facilities: facilitiesArray,
      status
    };

    setRooms(prev => [...prev, newRoom]);
    setShowAddModal(false);
    
    // Clear form
    setRoomNumber('');
    setFacilitiesText('King Bed, AC, High-speed Wi-Fi, Mini Bar');
    setStatus('Available');
    setRoomImages([]);
  };

  const handleDeleteRoom = (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Room Inventory & Management</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total rooms: {rooms.length} (Serene Villa Pvt Ltd)</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => {
              setRoomImages([]);
              setShowAddModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={14} /> Add Room
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const coverImage = room.images && room.images.length > 0 ? room.images[0] : room.image;
          return (
            <div key={room.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between relative group">
              {/* Delete button (Admin Only) */}
              {isAdmin && (
                <button
                  onClick={(e) => handleDeleteRoom(room.id, e)}
                  className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-rose-50 border border-slate-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg shadow transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                  title="Delete Room"
                >
                  <Trash2 size={13} />
                </button>
              )}

              <div>
                <div className="relative h-48 bg-slate-50">
                  <img 
                    src={coverImage} 
                    alt={room.roomType} 
                    className="w-full h-full object-cover"
                  />
                  
                  {room.images && room.images.length > 1 && (
                    <span className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                      <ImageIcon size={10} /> {room.images.length} Photos
                    </span>
                  )}

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
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 text-slate-700 hover:text-emerald-700 text-xs font-bold transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" /> View Facilities & Photos
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Facilities Modal */}
      {selectedRoom && (() => {
        const imagesToShow = selectedRoom.images && selectedRoom.images.length > 0 
          ? selectedRoom.images 
          : [selectedRoom.image];

        return (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-xl rounded-2xl overflow-hidden shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
              <button 
                onClick={() => setSelectedRoom(null)}
                className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-650 p-1.5 bg-white hover:bg-slate-100 rounded-full transition shadow cursor-pointer"
              >
                <X size={14} />
              </button>

              {/* Image Carousel / Slider */}
              <div className="relative h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={imagesToShow[activeImageIndex]} alt={selectedRoom.roomType} className="w-full h-full object-cover" />
                
                {imagesToShow.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex(prev => (prev === 0 ? imagesToShow.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex(prev => (prev === imagesToShow.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <span className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider">
                      {activeImageIndex + 1} / {imagesToShow.length}
                    </span>
                  </>
                )}
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
                  <ul className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold">
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
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Room Modal (Admin Only) */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ListPlus className="text-emerald-600 h-5 w-5" /> Add Room to Inventory
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Add a new room with multiple images and facilities</p>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Type</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="Deluxe Ocean View">Deluxe Ocean View</option>
                  <option value="Tropical Plunge Suite">Tropical Plunge Suite</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Facilities (Comma Separated)</label>
                <textarea
                  placeholder="King Bed, AC, Mini Bar, Coffee Maker"
                  value={facilitiesText}
                  onChange={(e) => setFacilitiesText(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-medium text-slate-700 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Images (Select Multiple)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                
                {roomImages.length > 0 && (
                  <div className="flex gap-1.5 mt-2.5 overflow-x-auto py-1">
                    {roomImages.map((img, i) => (
                      <div key={i} className="relative shrink-0">
                        <img src={img} className="h-12 w-12 object-cover rounded-lg border border-slate-100" />
                        <button
                          type="button"
                          onClick={() => setRoomImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 rounded-full hover:bg-rose-700 cursor-pointer"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
