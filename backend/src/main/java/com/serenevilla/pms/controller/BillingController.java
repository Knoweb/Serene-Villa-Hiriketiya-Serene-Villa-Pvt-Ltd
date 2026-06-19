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
        List<Integer> rawIds = (List<Integer>) request.get("invoiceIds");
        if (rawIds == null) {
            return ResponseEntity.badRequest().body("invoiceIds list is required");
        }
        
        LocalDateTime now = LocalDateTime.now();
        for (Integer rawId : rawIds) {
            paymentRepository.findById(rawId.longValue()).ifPresent(payment -> {
                payment.setAccountantTransferStatus(AccountantTransferStatus.PENDING);
                payment.setSentToAccountantAt(now);
                payment.setSentToAccountantById(1L); // Simulated Front Office User ID
                payment.setRemarks(""); // Clear any previous rejection reason
                paymentRepository.save(payment);
            });
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
        List<Payment> nonePayments = new java.util.ArrayList<>(paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.NONE));
        List<Payment> rejectedPayments = paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.REJECTED);
        nonePayments.addAll(rejectedPayments);
        
        List<Payment> eligiblePayments = nonePayments.stream()
            .filter(payment -> {
                if (payment.getBookingId() == null) return false;
                return bookingRepository.findById(payment.getBookingId())
                    .map(booking -> "Paid".equalsIgnoreCase(booking.getPaymentStatus()))
                    .orElse(false);
            })
            .collect(Collectors.toList());
            
        populatePaymentDetails(eligiblePayments);
        return ResponseEntity.ok(eligiblePayments);
    }

    private void populatePaymentDetails(List<Payment> payments) {
        for (Payment payment : payments) {
            if (payment.getBookingId() != null) {
                bookingRepository.findById(payment.getBookingId()).ifPresent(booking -> {
                    payment.setBookingRef(booking.getBookingNumber());
                    if (booking.getGuestRegistrationId() != null) {
                        guestRegistrationRepository.findById(booking.getGuestRegistrationId()).ifPresent(guest -> {
                            payment.setGuestName(guest.getGuestName());
                        });
                    }
                });
            }
            if (payment.getGuestName() == null && payment.getGuestRegistrationId() != null) {
                guestRegistrationRepository.findById(payment.getGuestRegistrationId()).ifPresent(guest -> {
                    payment.setGuestName(guest.getGuestName());
                });
            }
        }
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptTransactions(@RequestBody Map<String, Object> request) {
        List<Integer> rawIds = (List<Integer>) request.get("invoiceIds");
        if (rawIds == null) {
            return ResponseEntity.badRequest().body("invoiceIds list is required");
        }
        
        LocalDateTime now = LocalDateTime.now();
        for (Integer rawId : rawIds) {
            paymentRepository.findById(rawId.longValue()).ifPresent(payment -> {
                payment.setAccountantTransferStatus(AccountantTransferStatus.ACCEPTED);
                payment.setAcceptedByAccountantAt(now);
                payment.setAcceptedByAccountantId(2L); // Simulated Accountant User ID
                paymentRepository.save(payment);
            });
        }
        return ResponseEntity.ok(Map.of("message", "Transactions accepted successfully."));
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectTransactions(@RequestBody Map<String, Object> request) {
        List<Integer> rawIds = (List<Integer>) request.get("invoiceIds");
        String reason = (String) request.get("reason");
        if (rawIds == null) {
            return ResponseEntity.badRequest().body("invoiceIds list is required");
        }
        
        for (Integer rawId : rawIds) {
            paymentRepository.findById(rawId.longValue()).ifPresent(payment -> {
                payment.setAccountantTransferStatus(AccountantTransferStatus.REJECTED);
                payment.setRemarks(reason != null && !reason.trim().isEmpty() ? "Rejected: " + reason : "Rejected by Accountant");
                paymentRepository.save(payment);
            });
        }
        return ResponseEntity.ok(Map.of("message", "Transactions rejected successfully."));
    }
}
