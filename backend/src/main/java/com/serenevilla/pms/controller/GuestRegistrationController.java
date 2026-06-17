package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.GuestRegistration;
import com.serenevilla.pms.service.GuestRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class GuestRegistrationController {

    @Autowired
    private GuestRegistrationService guestRegistrationService;

    // Public QR Code Submission Form
    @PostMapping("/api/public/guest-registrations")
    public ResponseEntity<GuestRegistration> registerGuestPublic(@RequestBody GuestRegistration registration) {
        return ResponseEntity.ok(guestRegistrationService.createPublicRegistration(registration));
    }

    // Paginated Search & Filter Guest Registrations
    @GetMapping("/api/guest-registrations")
    public ResponseEntity<Page<GuestRegistration>> getRegistrations(
            @RequestParam(name = "search", required = false, defaultValue = "") String search,
            @RequestParam(name = "status", required = false, defaultValue = "") String status,
            @RequestParam(name = "role", defaultValue = "FRONT_OFFICER") String role,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        
        return ResponseEntity.ok(guestRegistrationService.searchRegistrations(search, status, role, page, size));
    }

    // Get Guest Registration Details
    @GetMapping("/api/guest-registrations/{id}")
    public ResponseEntity<GuestRegistration> getRegistrationById(@PathVariable(name = "id") Long id) {
        return guestRegistrationService.getRegistrationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Complete/Update Booking Details
    @PutMapping("/api/guest-registrations/{id}/booking-details")
    public ResponseEntity<GuestRegistration> updateBookingDetails(
            @PathVariable(name = "id") Long id,
            @RequestBody Map<String, Object> details) {
        
        return guestRegistrationService.updateBookingDetails(id, details)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Hide Guest Record from Front Office
    @PutMapping("/api/guest-registrations/{id}/hide")
    public ResponseEntity<GuestRegistration> hideRegistration(@PathVariable(name = "id") Long id) {
        return guestRegistrationService.setVisibility(id, true)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Unhide Guest Record from Front Office
    @PutMapping("/api/guest-registrations/{id}/unhide")
    public ResponseEntity<GuestRegistration> unhideRegistration(@PathVariable(name = "id") Long id) {
        return guestRegistrationService.setVisibility(id, false)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
