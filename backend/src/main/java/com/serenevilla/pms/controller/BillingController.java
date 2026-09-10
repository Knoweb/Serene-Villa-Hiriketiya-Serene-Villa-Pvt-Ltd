package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.AccountantTransferStatus;
import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.repository.PaymentRepository;
import com.serenevilla.pms.repository.BookingRepository;
import com.serenevilla.pms.repository.GuestRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/billing/accountant")
@CrossOrigin(origins = "*")
public class BillingController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @PostMapping("/send")
    public ResponseEntity<?> sendToAccountant(@RequestBody Map<String, Object> request) {
        Object rawIdsObj = request.get("invoiceIds");
        if (!(rawIdsObj instanceof List)) {
            return ResponseEntity.badRequest().body("invoiceIds list is required");
        }
        List<?> rawIds = (List<?>) rawIdsObj;
        
        LocalDateTime now = LocalDateTime.now();
        for (Object rawId : rawIds) {
            if (rawId instanceof Number) {
                long id = ((Number) rawId).longValue();
                paymentRepository.findById(id).ifPresent(payment -> {
                    payment.setAccountantTransferStatus(AccountantTransferStatus.PENDING);
                    payment.setSentToAccountantAt(now);
                    payment.setSentToAccountantById(1L); // Simulated Front Office User ID
                    payment.setRemarks(""); // Clear any previous rejection reason
                    paymentRepository.save(payment);
                });
            }
        }
        return ResponseEntity.ok(Map.of("message", "Transactions sent to accountant successfully."));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Payment>> getPendingTransactions() {
        List<Payment> pendingPayments = paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.PENDING);
        populatePaymentDetails(pendingPayments);
        return ResponseEntity.ok(pendingPayments);
    }

    @GetMapping("/fo-pending")
    public ResponseEntity<List<Payment>> getFoPendingTransactions() {
        List<Payment> allActivePayments = new java.util.ArrayList<>(paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.PENDING));
        allActivePayments.addAll(paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.NONE));
        allActivePayments.addAll(paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.REJECTED));
        
        List<Payment> eligiblePayments = allActivePayments.stream()
            .filter(payment -> {
                if (payment.getBookingId() == null && payment.getGuestRegistrationId() == null) return false;
                if (payment.getBookingId() != null) {
                    return bookingRepository.existsById(payment.getBookingId());
                }
                return guestRegistrationRepository.existsById(payment.getGuestRegistrationId());
            })
            .collect(Collectors.toList());
            
        populatePaymentDetails(eligiblePayments);
        return ResponseEntity.ok(eligiblePayments);
    }

    private void populatePaymentDetails(List<Payment> payments) {
        if (payments == null || payments.isEmpty()) return;

        // Collect all distinct booking and registration IDs
        java.util.Set<Long> bookingIds = payments.stream()
                .map(Payment::getBookingId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        java.util.Set<Long> regIds = payments.stream()
                .map(Payment::getGuestRegistrationId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        // Batch load bookings and guest registrations
        Map<Long, com.serenevilla.pms.model.Booking> bookingMap = bookingIds.isEmpty() ? Map.of() :
                bookingRepository.findAllById(bookingIds).stream()
                        .collect(Collectors.toMap(com.serenevilla.pms.model.Booking::getId, b -> b, (b1, b2) -> b1));

        // Also add any guestRegistrationIds referenced from loaded bookings
        bookingMap.values().forEach(b -> {
            if (b.getGuestRegistrationId() != null) regIds.add(b.getGuestRegistrationId());
        });

        Map<Long, com.serenevilla.pms.model.GuestRegistration> guestMap = regIds.isEmpty() ? Map.of() :
                guestRegistrationRepository.findAllById(regIds).stream()
                        .collect(Collectors.toMap(com.serenevilla.pms.model.GuestRegistration::getId, g -> g, (g1, g2) -> g1));

        for (Payment payment : payments) {
            if (payment.getBookingId() != null) {
                com.serenevilla.pms.model.Booking booking = bookingMap.get(payment.getBookingId());
                if (booking != null) {
                    if (payment.getBookingRef() == null || payment.getBookingRef().trim().isEmpty()) {
                        payment.setBookingRef(booking.getBookingNumber());
                    }
                    if (booking.getGuestRegistrationId() != null && payment.getGuestRegistrationId() == null) {
                        payment.setGuestRegistrationId(booking.getGuestRegistrationId());
                    }
                    if (booking.getGuestRegistrationId() != null) {
                        com.serenevilla.pms.model.GuestRegistration guest = guestMap.get(booking.getGuestRegistrationId());
                        if (guest != null) {
                            payment.setGuestName(guest.getGuestName());
                        }
                    }
                }
            }
            if ((payment.getBookingRef() == null || payment.getBookingRef().trim().isEmpty()) && payment.getGuestRegistrationId() != null) {
                bookingRepository.findByGuestRegistrationId(payment.getGuestRegistrationId()).stream()
                    .filter(b -> b.getBookingNumber() != null && !b.getBookingNumber().contains("/"))
                    .findFirst()
                    .ifPresent(b -> payment.setBookingRef(b.getBookingNumber()));
            }
            if (payment.getGuestName() == null && payment.getGuestRegistrationId() != null) {
                com.serenevilla.pms.model.GuestRegistration guest = guestMap.get(payment.getGuestRegistrationId());
                if (guest != null) {
                    payment.setGuestName(guest.getGuestName());
                }
            }
        }
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptTransactions(@RequestBody Map<String, Object> request) {
        Object rawIdsObj = request.get("invoiceIds");
        if (!(rawIdsObj instanceof List)) {
            return ResponseEntity.badRequest().body("invoiceIds list is required");
        }
        List<?> rawIds = (List<?>) rawIdsObj;
        
        LocalDateTime now = LocalDateTime.now();
        for (Object rawId : rawIds) {
            if (rawId instanceof Number) {
                long id = ((Number) rawId).longValue();
                paymentRepository.findById(id).ifPresent(payment -> {
                    payment.setAccountantTransferStatus(AccountantTransferStatus.ACCEPTED);
                    payment.setAcceptedByAccountantAt(now);
                    payment.setAcceptedByAccountantId(2L); // Simulated Accountant User ID
                    paymentRepository.save(payment);
                });
            }
        }
        return ResponseEntity.ok(Map.of("message", "Transactions accepted successfully."));
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectTransactions(@RequestBody Map<String, Object> request) {
        Object rawIdsObj = request.get("invoiceIds");
        String reason = (String) request.get("reason");
        if (!(rawIdsObj instanceof List)) {
            return ResponseEntity.badRequest().body("invoiceIds list is required");
        }
        List<?> rawIds = (List<?>) rawIdsObj;
        
        for (Object rawId : rawIds) {
            if (rawId instanceof Number) {
                long id = ((Number) rawId).longValue();
                paymentRepository.findById(id).ifPresent(payment -> {
                    payment.setAccountantTransferStatus(AccountantTransferStatus.REJECTED);
                    payment.setRemarks(reason != null && !reason.trim().isEmpty() ? "Rejected: " + reason : "Rejected by Accountant");
                    paymentRepository.save(payment);
                });
            }
        }
        return ResponseEntity.ok(Map.of("message", "Transactions rejected successfully."));
    }
}
