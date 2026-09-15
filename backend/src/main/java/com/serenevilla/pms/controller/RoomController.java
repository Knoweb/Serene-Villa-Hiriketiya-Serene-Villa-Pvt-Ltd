package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.Room;
import com.serenevilla.pms.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @jakarta.annotation.PostConstruct
    public void seedDefaultRooms() {
        if (roomRepository.count() == 0) {
            // Seed 6 Rooms for Property 1 (Serene Villa Pvt Ltd)
            for (int i = 1; i <= 6; i++) {
                Room r = new Room();
                r.setRoomNumber(String.valueOf(i));
                r.setRoomType(i <= 2 ? "Suite Room" : (i <= 4 ? "Deluxe Room" : "Standard Room"));
                r.setDescription("Comfortable room with garden view, private bathroom, AC and Free Wifi.");
                r.setImage(i <= 2 ? "/suite.png" : "/deluxe.png");
                r.setFacilities(List.of("Air conditioning", "Free Wifi", "Private bathroom", "Balcony"));
                r.setStatus("Available");
                r.setPropertyId(1L);
                roomRepository.save(r);
            }

            // Seed 11 Rooms for Property 2 (Serene Villa Hiriketiya)
            for (int i = 1; i <= 11; i++) {
                Room r = new Room();
                r.setRoomNumber(String.valueOf(i));
                r.setRoomType(i <= 3 ? "Suite Room" : (i <= 7 ? "Deluxe Room" : (i <= 9 ? "Standard Room" : "Budget Room")));
                r.setDescription("Beautiful room at Hiriketiya beach side with full modern amenities.");
                r.setImage(i <= 3 ? "/suite.png" : "/deluxe.png");
                r.setFacilities(List.of("Air conditioning", "Free Wifi", "Private bathroom", "Sea view", "Balcony"));
                r.setStatus("Available");
                r.setPropertyId(2L);
                roomRepository.save(r);
            }
        }
    }

    // Public endpoint for guest registrations
    @GetMapping("/api/public/rooms")
    public ResponseEntity<List<Room>> getPublicRooms(@RequestParam(name = "propertyId", required = false) Long propertyId) {
        if (propertyId != null) {
            return ResponseEntity.ok(roomRepository.findByPropertyId(propertyId));
        }
        return ResponseEntity.ok(roomRepository.findAll());
    }

    // Protected endpoints
    @GetMapping("/api/rooms")
    public ResponseEntity<List<Room>> getAllRooms(@RequestParam(name = "propertyId", required = false) Long propertyId) {
        if (propertyId != null) {
            return ResponseEntity.ok(roomRepository.findByPropertyId(propertyId));
        }
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @PostMapping("/api/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Room room) {
        try {
            Long propId = room.getPropertyId() != null ? room.getPropertyId() : 1L;
            room.setPropertyId(propId);
            if (roomRepository.findByPropertyIdAndRoomNumber(propId, room.getRoomNumber()).isPresent()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Room number already exists for this property!"));
            }
            return ResponseEntity.ok(roomRepository.save(room));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/api/rooms/{id}")
    public ResponseEntity<?> updateRoom(@PathVariable(name = "id") Long id, @RequestBody Room roomDetails) {
        return roomRepository.findById(id).map(room -> {
            room.setRoomNumber(roomDetails.getRoomNumber());
            room.setRoomType(roomDetails.getRoomType());
            room.setDescription(roomDetails.getDescription());
            room.setImage(roomDetails.getImage());
            room.setFacilities(roomDetails.getFacilities());
            room.setImages(roomDetails.getImages());
            room.setStatus(roomDetails.getStatus());
            return ResponseEntity.ok(roomRepository.save(room));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/rooms/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable(name = "id") Long id) {
        return roomRepository.findById(id).map(room -> {
            roomRepository.delete(room);
            return ResponseEntity.ok(java.util.Map.of("message", "Room deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
