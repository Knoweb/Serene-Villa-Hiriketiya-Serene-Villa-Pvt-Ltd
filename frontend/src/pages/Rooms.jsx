import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, Trash2, Plus, X, ListPlus, ChevronLeft, ChevronRight, Image as ImageIcon, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const STANDARD_FACILITIES = [
  'Air conditioning',
  'Free Wifi',
  'Balcony',
  'Sea view',
  'Private bathroom',
  'Minibar',
  'Terrace',
  'Dishwasher',
  'King Bed',
  'Queen Bed'
];

const RoomCard = ({ room, isAdmin, onEdit, onDelete, onView }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const images = room.images && room.images.length > 0 ? room.images : [room.image];

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setActiveIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setActiveIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setActiveIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3500); // Auto-slide every 3.5 seconds

    return () => clearInterval(interval);
  }, [images.length, isHovered]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between relative group"
    >
      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-4 left-4 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition no-print">
          <button
            onClick={(e) => onEdit(room, e)}
            className="bg-white/90 hover:bg-emerald-50 border border-slate-100 text-slate-500 hover:text-emerald-700 p-1.5 rounded-lg shadow-sm transition cursor-pointer"
            title="Edit Room"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => onDelete(room.id, e)}
            className="bg-white/90 hover:bg-rose-50 border border-slate-100 text-slate-500 hover:text-rose-700 p-1.5 rounded-lg shadow-sm transition cursor-pointer"
            title="Delete Room"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      <div>
        <div className="relative h-48 bg-slate-50 overflow-hidden">
          <img 
            src={images[activeIdx]} 
            alt={room.roomType} 
            className="w-full h-full object-cover transition-all duration-300"
          />

          {images.length > 1 && (
            <>
              {/* Prev / Next controls */}
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer z-10"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer z-10"
              >
                <ChevronRight size={12} />
              </button>

              {/* Photos label */}
              <span className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded flex items-center gap-1 font-bold group-hover:opacity-0 transition z-10">
                <ImageIcon size={10} /> {images.length} Photos
              </span>

              {/* Dots / Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 font-sans">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full transition ${idx === activeIdx ? 'bg-white scale-125' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
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
          <span className="absolute bottom-4 left-4 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white z-10 font-mono">
            Room {room.roomNumber}
          </span>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-800">{room.roomType}</h3>
          {room.description && (
            <p className="text-[11px] text-slate-450 mt-1 line-clamp-2 leading-relaxed">
              {room.description}
            </p>
          )}
          
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
          onClick={() => onView(room)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 text-slate-700 hover:text-emerald-700 text-xs font-bold transition cursor-pointer"
        >
          <Eye className="h-4 w-4" /> View Facilities & Photos
        </button>
      </div>
    </div>
  );
};

const Rooms = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`;
  const [rooms, setRooms] = useState([]);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isModalHovered, setIsModalHovered] = useState(false);
  
  // Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('');
  const [status, setStatus] = useState('Available');
  const [selectedFacilities, setSelectedFacilities] = useState(['Air conditioning', 'Free Wifi']);
  const [additionalFacilities, setAdditionalFacilities] = useState('');
  const [description, setDescription] = useState('');
  const [roomImages, setRoomImages] = useState([]);

  // Edit Form State
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editRoomType, setEditRoomType] = useState('');
  const [editStatus, setEditStatus] = useState('Available');
  const [editSelectedFacilities, setEditSelectedFacilities] = useState([]);
  const [editAdditionalFacilities, setEditAdditionalFacilities] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRoomImages, setEditRoomImages] = useState([]);

  // Reset active image index when selected room changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedRoom]);

  // Auto-slide inside the details modal
  useEffect(() => {
    if (!selectedRoom) return;
    const imagesToShow = selectedRoom.images && selectedRoom.images.length > 0 
      ? selectedRoom.images 
      : [selectedRoom.image];
      
    if (imagesToShow.length <= 1 || isModalHovered) return;

    const interval = setInterval(() => {
      setActiveImageIndex(prev => (prev === imagesToShow.length - 1 ? 0 : prev + 1));
    }, 3500); // auto-slide every 3.5 seconds

    return () => clearInterval(interval);
  }, [selectedRoom, isModalHovered]);

  // Rooms list managed in backend database

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

  const handleEditImageUpload = (e) => {
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
      setEditRoomImages(prev => [...prev, ...base64Images]);
    }).catch(err => {
      console.error('Error uploading images:', err);
    });
  };

  const handleEditClick = (room, e) => {
    if (e) e.stopPropagation();
    setEditingRoom(room);
    setEditRoomNumber(room.roomNumber || '');
    setEditRoomType(room.roomType || '');
    setEditStatus(room.status || 'Available');
    setEditDescription(room.description || '');
    setEditRoomImages(room.images || (room.image ? [room.image] : []));

    const standard = (room.facilities || []).filter(f => STANDARD_FACILITIES.includes(f));
    const custom = (room.facilities || []).filter(f => !STANDARD_FACILITIES.includes(f));
    setEditSelectedFacilities(standard);
    setEditAdditionalFacilities(custom.join(', '));

    setShowEditModal(true);
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editRoomNumber || !editingRoom) return;

    if (rooms.some(r => r.roomNumber === editRoomNumber && r.id !== editingRoom.id)) {
      alert('Room number already exists!');
      return;
    }

    const customFacilitiesArray = editAdditionalFacilities
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);
    const facilitiesArray = [...editSelectedFacilities, ...customFacilitiesArray];

    const updatedFields = {
      roomNumber: editRoomNumber,
      roomType: editRoomType,
      description: editDescription,
      image: editRoomImages.length > 0 ? editRoomImages[0] : (editRoomType.toLowerCase().includes('suite') ? '/suite.png' : '/deluxe.png'),
      images: editRoomImages,
      facilities: facilitiesArray,
      status: editStatus
    };

    try {
      const res = await fetch(`${API_BASE}/rooms/${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        fetchRooms();
        setShowEditModal(false);
        setEditingRoom(null);
      }
    } catch (err) {
      console.error('Error updating room:', err);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomNumber) return;

    // Check if room number already exists
    if (rooms.some(r => r.roomNumber === roomNumber)) {
      alert('Room number already exists!');
      return;
    }

    const customFacilitiesArray = additionalFacilities
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);
    const facilitiesArray = [...selectedFacilities, ...customFacilitiesArray];

    const newRoom = {
      roomNumber,
      roomType,
      description,
      image: roomImages.length > 0 ? roomImages[0] : (roomType.toLowerCase().includes('suite') ? '/suite.png' : '/deluxe.png'),
      images: roomImages,
      facilities: facilitiesArray,
      status
    };

    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom)
      });
      if (res.ok) {
        fetchRooms();
        setShowAddModal(false);
        // Clear form
        setRoomNumber('');
        setRoomType('');
        setSelectedFacilities(['Air conditioning', 'Free Wifi']);
        setAdditionalFacilities('');
        setDescription('');
        setStatus('Available');
        setRoomImages([]);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to add room');
      }
    } catch (err) {
      console.error('Error adding room:', err);
    }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchRooms();
      }
    } catch (err) {
      console.error('Error deleting room:', err);
    }
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
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isAdmin={isAdmin}
            onEdit={handleEditClick}
            onDelete={handleDeleteRoom}
            onView={setSelectedRoom}
          />
        ))}
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
              <div 
                onMouseEnter={() => setIsModalHovered(true)}
                onMouseLeave={() => setIsModalHovered(false)}
                className="relative h-64 bg-slate-100 flex items-center justify-center overflow-hidden"
              >
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

                {selectedRoom.description && (
                  <p className="text-xs text-slate-550 font-medium italic bg-slate-50 p-2.5 rounded-lg">
                    "{selectedRoom.description}"
                  </p>
                )}

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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Name / Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Ocean View, Tropical Plunge Suite"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Standard Facilities</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  {STANDARD_FACILITIES.map((facility) => {
                    const isChecked = selectedFacilities.includes(facility);
                    return (
                      <label key={facility} className="flex items-center gap-2 font-medium text-slate-705 cursor-pointer select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedFacilities(prev => prev.filter(f => f !== facility));
                            } else {
                              setSelectedFacilities(prev => [...prev, facility]);
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        {facility}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Additional Facilities (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Coffee Maker, Luxury Toiletries"
                  value={additionalFacilities}
                  onChange={(e) => setAdditionalFacilities(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Description</label>
                <textarea
                  placeholder="e.g. Spacious room overlooking the ocean, equipped with high-end luxury details."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

      {/* Edit Room Modal (Admin Only) */}
      {showEditModal && isAdmin && editingRoom && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setShowEditModal(false);
                setEditingRoom(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Pencil className="text-emerald-600 h-5 w-5" /> Edit Room Details
              </h3>
              <p className="text-[11px] text-slate-445 font-semibold mt-0.5">Modify room configurations, description, images, and facilities</p>
            </div>

            <form onSubmit={handleEditRoomSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104"
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Name / Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Ocean View, Tropical Plunge Suite"
                  value={editRoomType}
                  onChange={(e) => setEditRoomType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Standard Facilities</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  {STANDARD_FACILITIES.map((facility) => {
                    const isChecked = editSelectedFacilities.includes(facility);
                    return (
                      <label key={facility} className="flex items-center gap-2 font-medium text-slate-705 cursor-pointer select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditSelectedFacilities(prev => prev.filter(f => f !== facility));
                            } else {
                              setEditSelectedFacilities(prev => [...prev, facility]);
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        {facility}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Additional Facilities (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Coffee Maker, Luxury Toiletries"
                  value={editAdditionalFacilities}
                  onChange={(e) => setEditAdditionalFacilities(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Description</label>
                <textarea
                  placeholder="e.g. Spacious room overlooking the ocean, equipped with high-end luxury details."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-medium text-slate-700 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Add More Room Images (Select Multiple)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="w-full text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                
                {editRoomImages.length > 0 && (
                  <div className="flex gap-1.5 mt-2.5 overflow-x-auto py-1">
                    {editRoomImages.map((img, i) => (
                      <div key={i} className="relative shrink-0">
                        <img src={img} className="h-12 w-12 object-cover rounded-lg border border-slate-100" />
                        <button
                          type="button"
                          onClick={() => setEditRoomImages(prev => prev.filter((_, idx) => idx !== i))}
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
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoom(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Changes
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
