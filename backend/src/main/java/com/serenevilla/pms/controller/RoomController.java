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

    // Public endpoint for guest registrations
    @GetMapping("/api/public/rooms")
    public ResponseEntity<List<Room>> getPublicRooms() {
        return ResponseEntity.ok(roomRepository.findAll());
    }

    // Protected endpoints
    @GetMapping("/api/rooms")
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @PostMapping("/api/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Room room) {
        try {
            if (roomRepository.findByRoomNumber(room.getRoomNumber()).isPresent()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Room number already exists!"));
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
