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

import com.serenevilla.pms.handler.RegistrationWebSocketHandler;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import com.serenevilla.pms.repository.PaymentRepository;
import com.serenevilla.pms.model.Payment;
import java.util.List;

@Service
public class GuestRegistrationService {

    @Autowired
    private RegistrationWebSocketHandler webSocketHandler;

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private com.serenevilla.pms.repository.RoomRepository roomRepository;

    public GuestRegistration createPublicRegistration(GuestRegistration registration) {
        // Calculate nights
        if (registration.getCheckInDate() != null && registration.getCheckOutDate() != null) {
            long days = registration.getCheckInDate().datesUntil(registration.getCheckOutDate()).count();
            registration.setNumberOfNights((int) days);
        }
        registration.setPaymentStatus("Pending");
        registration.setRegistrationStatus("Pending");
        registration.setHiddenFromFrontOffice(false);
        if (registration.getCreatedBy() == null || registration.getCreatedBy().isEmpty()) {
            registration.setCreatedBy("Public QR Code");
        }

        GuestRegistration saved = guestRegistrationRepository.save(registration);
        webSocketHandler.broadcast("update");
        return saved;
    }

    public Page<GuestRegistration> searchRegistrations(String search, String status, String role, String source, int page, int size) {
        // Show hidden only if admin
        boolean showHidden = "ADMIN".equalsIgnoreCase(role);
        
        // Latest registrations first
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<GuestRegistration> result = guestRegistrationRepository.searchRegistrations(search, status, showHidden, source, pageable);

        // Dynamically recalculate paymentStatus for FRONT_OFFICER based on visible payments
        if ("FRONT_OFFICER".equalsIgnoreCase(role)) {
            return result.map(reg -> {
                bookingRepository.findAll().stream()
                        .filter(b -> b.getGuestRegistrationId() != null && b.getGuestRegistrationId().equals(reg.getId()))
                        .findFirst()
                        .ifPresent(booking -> {
                            List<Payment> allPayments = paymentRepository.findByBookingId(booking.getId());
                            // Filter out hidden payments
                            List<Payment> visiblePayments = allPayments.stream()
                                    .filter(p -> p.getIsHiddenFromFrontOffice() == null || !p.getIsHiddenFromFrontOffice())
                                    .toList();
                            
                            double totalPaid = visiblePayments.stream()
                                    .mapToDouble(p -> p.getConvertedAmountLkr() != null ? p.getConvertedAmountLkr() : p.getAmountLkr())
                                    .sum();
                            
                            double totalAmt = booking.getTotalAmount();
                            String computedStatus = "Unpaid";
                            if (totalPaid >= totalAmt && totalAmt > 0) {
                                computedStatus = "Paid";
                            } else if (totalPaid > 0) {
                                computedStatus = "Partially Paid";
                            }
                            reg.setPaymentStatus(computedStatus);
                        });
                return reg;
            });
        }

        return result;
    }

    public Optional<GuestRegistration> getRegistrationById(Long id) {
        return guestRegistrationRepository.findById(id);
    }

    public Optional<GuestRegistration> setVisibility(Long id, boolean hide) {
        return guestRegistrationRepository.findById(id).map(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            GuestRegistration saved = guestRegistrationRepository.save(reg);
            webSocketHandler.broadcast("update");
            return saved;
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
            if (details.containsKey("checkInDate") && details.get("checkInDate") != null) {
                reg.setCheckInDate(LocalDate.parse((String) details.get("checkInDate")));
            }
            if (details.containsKey("checkOutDate") && details.get("checkOutDate") != null) {
                reg.setCheckOutDate(LocalDate.parse((String) details.get("checkOutDate")));
            }
            if (details.containsKey("numberOfNights") && details.get("numberOfNights") != null) {
                Object nightsVal = details.get("numberOfNights");
                if (nightsVal instanceof Number) {
                    reg.setNumberOfNights(((Number) nightsVal).intValue());
                } else if (nightsVal instanceof String) {
                    reg.setNumberOfNights(Integer.parseInt((String) nightsVal));
                }
            } else if (reg.getCheckInDate() != null && reg.getCheckOutDate() != null) {
                long days = reg.getCheckInDate().datesUntil(reg.getCheckOutDate()).count();
                reg.setNumberOfNights((int) days);
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

            // Automatic Room Status Release/Update based on Registration Status
            String regStatus = savedReg.getRegistrationStatus();
            String allocatedRoomNumber = booking.getRoomNumber();
            if (allocatedRoomNumber != null && !allocatedRoomNumber.trim().isEmpty()) {
                roomRepository.findByRoomNumber(allocatedRoomNumber.trim()).ifPresent(room -> {
                    if ("CheckedOut".equalsIgnoreCase(regStatus) || "Cancelled".equalsIgnoreCase(regStatus)) {
                        room.setStatus("Available");
                        roomRepository.save(room);
                    } else if ("CheckedIn".equalsIgnoreCase(regStatus)) {
                        room.setStatus("Occupied");
                        roomRepository.save(room);
                    }
                });
            }

            webSocketHandler.broadcast("update");
            return savedReg;
        });
    }

    public void hideByPaymentMethod(String method, boolean hide) {
        List<Booking> bookingsWithMethod = bookingRepository.findAll().stream()
                .filter(b -> {
                    List<Payment> payments = paymentRepository.findByBookingId(b.getId());
                    return payments.stream().anyMatch(p -> method.equalsIgnoreCase(p.getPaymentMethod()));
                })
                .toList();
                
        List<Long> regIds = bookingsWithMethod.stream()
                .map(Booking::getGuestRegistrationId)
                .filter(java.util.Objects::nonNull)
                .toList();
                
        guestRegistrationRepository.findAllById(regIds).forEach(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            guestRegistrationRepository.save(reg);
        });
        
        webSocketHandler.broadcast("update");
    }

    public void hideAllRegistrations(boolean hide) {
        guestRegistrationRepository.findAll().forEach(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            guestRegistrationRepository.save(reg);
        });
        webSocketHandler.broadcast("update");
    }

    public Optional<Map<String, Object>> findReservationForPublicCheckIn(String bookingNumber, String passportNumber) {
        if (bookingNumber != null && !bookingNumber.trim().isEmpty()) {
            return bookingRepository.findByBookingNumber(bookingNumber.trim()).flatMap(booking -> {
                return guestRegistrationRepository.findById(booking.getGuestRegistrationId()).map(reg -> {
                    return Map.of(
                        "booking", booking,
                        "registration", reg
                    );
                });
            });
        } else if (passportNumber != null && !passportNumber.trim().isEmpty()) {
            List<GuestRegistration> registrations = guestRegistrationRepository.findAll().stream()
                .filter(reg -> reg.getPassportNumber() != null && reg.getPassportNumber().equalsIgnoreCase(passportNumber.trim()))
                .toList();
            if (!registrations.isEmpty()) {
                GuestRegistration latestReg = registrations.get(registrations.size() - 1);
                return bookingRepository.findAll().stream()
                    .filter(b -> b.getGuestRegistrationId() != null && b.getGuestRegistrationId().equals(latestReg.getId()))
                    .findFirst()
                    .map(booking -> {
                        return Map.of(
                            "booking", booking,
                            "registration", latestReg
                        );
                    });
            }
        }
        return Optional.empty();
    }
}
