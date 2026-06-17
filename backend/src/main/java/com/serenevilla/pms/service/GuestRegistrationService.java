package com.serenevilla.pms.service;

import com.serenevilla.pms.model.Booking;
import com.serenevilla.pms.model.GuestRegistration;
import com.serenevilla.pms.repository.BookingRepository;
import com.serenevilla.pms.repository.GuestRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@Service
public class GuestRegistrationService {

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public GuestRegistration createPublicRegistration(GuestRegistration registration) {
        // Calculate nights
        if (registration.getCheckInDate() != null && registration.getCheckOutDate() != null) {
            long days = registration.getCheckInDate().datesUntil(registration.getCheckOutDate()).count();
            registration.setNumberOfNights((int) days);
        }
        registration.setPaymentStatus("Pending");
        registration.setRegistrationStatus("Pending");
        registration.setHiddenFromFrontOffice(false);
        registration.setCreatedBy("Public QR Code");

        return guestRegistrationRepository.save(registration);
    }

    public Page<GuestRegistration> searchRegistrations(String search, String status, String role, int page, int size) {
        // Show hidden if admin or accountant
        boolean showHidden = "ADMIN".equalsIgnoreCase(role) || "ACCOUNTANT".equalsIgnoreCase(role);
        
        // Latest registrations first
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        return guestRegistrationRepository.searchRegistrations(search, status, showHidden, pageable);
    }

    public Optional<GuestRegistration> getRegistrationById(Long id) {
        return guestRegistrationRepository.findById(id);
    }

    public Optional<GuestRegistration> setVisibility(Long id, boolean hide) {
        return guestRegistrationRepository.findById(id).map(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            return guestRegistrationRepository.save(reg);
        });
    }

    public Optional<GuestRegistration> updateBookingDetails(Long id, Map<String, Object> details) {
        return guestRegistrationRepository.findById(id).map(reg -> {
            // Update status on registration
            if (details.containsKey("paymentStatus")) {
                reg.setPaymentStatus((String) details.get("paymentStatus"));
            }
            if (details.containsKey("registrationStatus")) {
                reg.setRegistrationStatus((String) details.get("registrationStatus"));
            }

            GuestRegistration savedReg = guestRegistrationRepository.save(reg);

            // Find or create associated booking
            Booking booking = bookingRepository.findAll().stream()
                    .filter(b -> b.getGuestRegistrationId() != null && b.getGuestRegistrationId().equals(id))
                    .findFirst()
                    .orElseGet(() -> {
                        Booking newBooking = new Booking();
                        newBooking.setGuestRegistrationId(id);
                        newBooking.setStatus("Confirmed");
                        return newBooking;
                    });

            if (details.containsKey("roomType")) {
                booking.setRoomType((String) details.get("roomType"));
            }
            if (details.containsKey("room")) {
                booking.setRoomNumber((String) details.get("room"));
            }
            if (details.containsKey("bookingType")) {
                booking.setBookingType((String) details.get("bookingType"));
            }
            if (details.containsKey("bookingNumber")) {
                booking.setBookingNumber((String) details.get("bookingNumber"));
            }
            if (details.containsKey("boardBasis")) {
                booking.setBoardBasis((String) details.get("boardBasis"));
            }
            if (details.containsKey("remarks")) {
                booking.setRemarks((String) details.get("remarks"));
            }
            if (details.containsKey("amount")) {
                Object amountVal = details.get("amount");
                if (amountVal instanceof Number) {
                    booking.setTotalAmount(((Number) amountVal).doubleValue());
                } else if (amountVal instanceof String) {
                    booking.setTotalAmount(Double.parseDouble((String) amountVal));
                }
            }

            bookingRepository.save(booking);
            return savedReg;
        });
    }
}
