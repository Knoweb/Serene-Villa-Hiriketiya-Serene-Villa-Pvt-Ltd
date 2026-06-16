package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.GuestRegistration;
import com.serenevilla.pms.repository.GuestRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin(origins = "*")
public class GuestRegistrationController {

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @PostMapping
    public ResponseEntity<GuestRegistration> registerGuest(@RequestBody GuestRegistration registration) {
        // Automatically calculate nights if dates are provided
        if (registration.getCheckInDate() != null && registration.getCheckOutDate() != null) {
            long days = registration.getCheckInDate().datesUntil(registration.getCheckOutDate()).count();
            registration.setNights((int) days);
        }
        return ResponseEntity.ok(guestRegistrationRepository.save(registration));
    }

    @GetMapping
    public ResponseEntity<List<GuestRegistration>> getRegistrations(
            @RequestParam(name = "propertyId", defaultValue = "1") Long propertyId,
            @RequestParam(name = "role", defaultValue = "ADMIN") String role) {
        
        // Front Office staff should NOT see hidden registrations
        if ("FRONT_OFFICER".equalsIgnoreCase(role)) {
            return ResponseEntity.ok(guestRegistrationRepository.findByPropertyIdAndIsHiddenFromFrontOfficeFalse(propertyId));
        }
        return ResponseEntity.ok(guestRegistrationRepository.findByPropertyId(propertyId));
    }

    @PutMapping("/{id}/visibility")
    public ResponseEntity<GuestRegistration> toggleVisibility(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "hide") boolean hide) {
        
        return guestRegistrationRepository.findById(id).map(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            return ResponseEntity.ok(guestRegistrationRepository.save(reg));
        }).orElse(ResponseEntity.notFound().build());
    }
}
