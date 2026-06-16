package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.Booking;
import com.serenevilla.pms.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking) {
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getBookings(@RequestParam(name = "propertyId", defaultValue = "1") Long propertyId) {
        return ResponseEntity.ok(bookingRepository.findByPropertyId(propertyId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Booking> updateStatus(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "status") String status) {
        
        return bookingRepository.findById(id).map(b -> {
            b.setStatus(status);
            return ResponseEntity.ok(bookingRepository.save(b));
        }).orElse(ResponseEntity.notFound().build());
    }
}
