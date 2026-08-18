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

    @Autowired
    private com.serenevilla.pms.repository.GuestRegistrationRepository guestRegistrationRepository;

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking) {
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @GetMapping
    public ResponseEntity<?> getBookings(@RequestParam(name = "propertyId", required = false, defaultValue = "1") Long propertyId) {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            return ResponseEntity.ok(bookings != null ? bookings : new java.util.ArrayList<>());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
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

    @PutMapping("/{bookingId}/payment-status")
    public ResponseEntity<Booking> updatePaymentStatus(
            @PathVariable(name = "bookingId") Long bookingId,
            @RequestParam(name = "paymentStatus") String paymentStatus) {
        
        return bookingRepository.findById(bookingId).map(b -> {
            b.setPaymentStatus(paymentStatus);
            Booking saved = bookingRepository.save(b);
            
            // Also update associated guest registration
            if (b.getGuestRegistrationId() != null) {
                guestRegistrationRepository.findById(b.getGuestRegistrationId()).ifPresent(reg -> {
                    reg.setPaymentStatus(paymentStatus);
                    guestRegistrationRepository.save(reg);
                });
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
