package com.serenevilla.pms.controller;

import com.serenevilla.pms.handler.RegistrationWebSocketHandler;
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

    @Autowired(required = false)
    private RegistrationWebSocketHandler webSocketHandler;

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
        if (webSocketHandler != null) {
            webSocketHandler.broadcast("update");
        }
        return ResponseEntity.ok(Map.of("message", "Transactions sent to accountant successfully."));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Payment>> getPendingTransactions(@RequestParam(name = "propertyId", required = false) Long propertyId) {
        List<Payment> pendingPayments = paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.PENDING);
        populatePaymentDetails(pendingPayments);
        if (propertyId != null) {
            pendingPayments = pendingPayments.stream()
                .filter(p -> propertyId.equals(p.getPropertyId()))
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(pendingPayments);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Payment>> getHandoverHistory(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "propertyId", required = false) Long propertyId) {
        List<Payment> historyPayments;
        if ("ACCEPTED".equalsIgnoreCase(status)) {
            historyPayments = paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.ACCEPTED);
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            historyPayments = paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.REJECTED);
        } else {
            historyPayments = new java.util.ArrayList<>(paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.ACCEPTED));
            historyPayments.addAll(paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.REJECTED));
        }

        populatePaymentDetails(historyPayments);
        if (propertyId != null) {
            historyPayments = historyPayments.stream()
                .filter(p -> propertyId.equals(p.getPropertyId()))
                .collect(Collectors.toList());
        }
        // Sort newest first
        historyPayments.sort((a, b) -> {
            LocalDateTime tA = a.getAcceptedByAccountantAt() != null ? a.getAcceptedByAccountantAt() : a.getCreatedAt();
            LocalDateTime tB = b.getAcceptedByAccountantAt() != null ? b.getAcceptedByAccountantAt() : b.getCreatedAt();
            if (tA == null && tB == null) return 0;
            if (tA == null) return 1;
            if (tB == null) return -1;
            return tB.compareTo(tA);
        });

        return ResponseEntity.ok(historyPayments);
    }

    @GetMapping("/fo-pending")
    public ResponseEntity<List<Payment>> getFoPendingTransactions(@RequestParam(name = "propertyId", required = false) Long propertyId) {
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
        if (propertyId != null) {
            eligiblePayments = eligiblePayments.stream()
                .filter(p -> propertyId.equals(p.getPropertyId()))
                .collect(Collectors.toList());
        }
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
                    if (payment.getPropertyId() == null && booking.getPropertyId() != null) {
                        payment.setPropertyId(booking.getPropertyId());
                    }
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
                            if (payment.getPropertyId() == null && guest.getPropertyId() != null) {
                                payment.setPropertyId(guest.getPropertyId());
                            }
                        }
                    }
                }
            }
            if ((payment.getBookingRef() == null || payment.getBookingRef().trim().isEmpty()) && payment.getGuestRegistrationId() != null) {
                bookingRepository.findByGuestRegistrationId(payment.getGuestRegistrationId()).stream()
                    .filter(b -> b.getBookingNumber() != null && !b.getBookingNumber().contains("/"))
                    .findFirst()
                    .ifPresent(b -> {
                        payment.setBookingRef(b.getBookingNumber());
                        if (payment.getPropertyId() == null && b.getPropertyId() != null) {
                            payment.setPropertyId(b.getPropertyId());
                        }
                    });
            }
            if (payment.getGuestName() == null && payment.getGuestRegistrationId() != null) {
                com.serenevilla.pms.model.GuestRegistration guest = guestMap.get(payment.getGuestRegistrationId());
                if (guest != null) {
                    payment.setGuestName(guest.getGuestName());
                    if (payment.getPropertyId() == null && guest.getPropertyId() != null) {
                        payment.setPropertyId(guest.getPropertyId());
                    }
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
        if (webSocketHandler != null) {
            webSocketHandler.broadcast("update");
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
        
        LocalDateTime now = LocalDateTime.now();
        for (Object rawId : rawIds) {
            if (rawId instanceof Number) {
                long id = ((Number) rawId).longValue();
                paymentRepository.findById(id).ifPresent(payment -> {
                    payment.setAccountantTransferStatus(AccountantTransferStatus.REJECTED);
                    payment.setAcceptedByAccountantAt(now);
                    payment.setAcceptedByAccountantId(2L);
                    payment.setRemarks(reason != null && !reason.trim().isEmpty() ? "Rejected: " + reason : "Rejected by Accountant");
                    paymentRepository.save(payment);
                });
            }
        }
        if (webSocketHandler != null) {
            webSocketHandler.broadcast("update");
        }
        return ResponseEntity.ok(Map.of("message", "Transactions rejected successfully."));
    }
}
