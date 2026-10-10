package com.serenevilla.pms.controller;

import com.serenevilla.pms.handler.RegistrationWebSocketHandler;
import com.serenevilla.pms.model.ExchangeRate;
import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.repository.ExchangeRateRepository;
import com.serenevilla.pms.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ExchangeRateRepository exchangeRateRepository;

    @Autowired
    private com.serenevilla.pms.repository.BookingRepository bookingRepository;

    @Autowired
    private com.serenevilla.pms.repository.GuestRegistrationRepository guestRegistrationRepository;

    @Autowired(required = false)
    private RegistrationWebSocketHandler webSocketHandler;

    private void syncBookingAndRegistrationStatus(Long bookingId, Long guestRegistrationId, boolean isFullOrFinal) {
        try {
            Long targetBookingId = bookingId;
            if (targetBookingId == null && guestRegistrationId != null) {
                List<com.serenevilla.pms.model.Booking> bList = bookingRepository.findByGuestRegistrationId(guestRegistrationId);
                if (bList != null && !bList.isEmpty()) {
                    targetBookingId = bList.get(0).getId();
                }
            }

            if (targetBookingId != null) {
                bookingRepository.findById(targetBookingId).ifPresent(b -> {
                    List<Payment> pList = paymentRepository.findByBookingId(b.getId());
                    double totalPaid = 0.0;
                    String bCurr = b.getCurrency() != null ? b.getCurrency().toUpperCase() : "USD";
                    double exRate = 1.0;
                    try {
                        if (b.getExchangeRate() != null && !b.getExchangeRate().trim().isEmpty()) {
                            exRate = Double.parseDouble(b.getExchangeRate().trim());
                        }
                    } catch (Exception ignored) {}

                    if (pList != null) {
                        for (Payment p : pList) {
                            String pCurr = p.getCurrencyCode() != null ? p.getCurrencyCode() : (p.getCurrency() != null ? p.getCurrency() : bCurr);
                            double pAmt = p.getAmountInCurrency() > 0 ? p.getAmountInCurrency() : (p.getAmount() != null ? p.getAmount() : 0.0);
                            double pLkr = p.getConvertedAmountLkr() != null && p.getConvertedAmountLkr() > 0 ? p.getConvertedAmountLkr() : p.getAmountLkr();
                            double pExRate = p.getExchangeRate() > 0 ? p.getExchangeRate() : exRate;

                            double converted = pAmt;
                            if (pCurr.equalsIgnoreCase(bCurr)) {
                                converted = pAmt;
                            } else if ("LKR".equalsIgnoreCase(bCurr)) {
                                converted = pLkr > 0 ? pLkr : (pAmt * pExRate);
                            } else {
                                if (pExRate > 0) converted = (pLkr > 0 ? pLkr : pAmt) / pExRate;
                            }
                            totalPaid += converted;
                        }
                    }

                    double totalTarget = b.getTotalAmount() != null ? b.getTotalAmount() : 0.0;
                    String newStatus = "Unpaid";
                    if (totalTarget > 0 ? (totalPaid >= (totalTarget - 0.01)) : isFullOrFinal) {
                        newStatus = "Paid";
                    } else if (totalPaid > 0) {
                        newStatus = "Paid Advance";
                    }

                    b.setPaymentStatus(newStatus);
                    bookingRepository.save(b);

                    Long regId = b.getGuestRegistrationId() != null ? b.getGuestRegistrationId() : guestRegistrationId;
                    if (regId != null) {
                        final String finalStatus = newStatus;
                        guestRegistrationRepository.findById(regId).ifPresent(reg -> {
                            reg.setPaymentStatus(finalStatus);
                            guestRegistrationRepository.save(reg);
                        });
                    }
                });
            } else if (guestRegistrationId != null) {
                guestRegistrationRepository.findById(guestRegistrationId).ifPresent(reg -> {
                    String newStatus = isFullOrFinal ? "Paid" : "Paid Advance";
                    reg.setPaymentStatus(newStatus);
                    guestRegistrationRepository.save(reg);
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PostMapping
    public ResponseEntity<Payment> recordPayment(@RequestBody Payment payment) {
        if (payment.getAccountantTransferStatus() == null) {
            payment.setAccountantTransferStatus(com.serenevilla.pms.model.AccountantTransferStatus.NONE);
        }
        // Compute LKR equivalent at standard rate or custom rate
        double rate = 1.0;
        if (!"LKR".equalsIgnoreCase(payment.getCurrency())) {
            rate = exchangeRateRepository.findByCurrencyCode(payment.getCurrency())
                    .map(ExchangeRate::getRate)
                    .orElse(payment.getExchangeRate());
        }
        payment.setExchangeRate(rate);
        payment.setAmountLkr(payment.getAmountInCurrency() * rate);
        Payment saved = paymentRepository.save(payment);
        
        boolean isFinal = "FINAL".equalsIgnoreCase(saved.getPaymentType()) || !Boolean.TRUE.equals(saved.getIsAdvancePayment());
        syncBookingAndRegistrationStatus(saved.getBookingId(), saved.getGuestRegistrationId(), isFinal);

        if (webSocketHandler != null) {
            webSocketHandler.broadcast("update");
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Payment>> getPaymentsByBooking(
            @PathVariable(name = "bookingId") Long bookingId,
            @RequestParam(name = "role", required = false, defaultValue = "FRONT_OFFICER") String role) {
        List<Payment> list = paymentRepository.findByBookingId(bookingId);
        if ("FRONT_OFFICER".equalsIgnoreCase(role)) {
            list = list.stream()
                    .filter(p -> p.getIsHiddenFromFrontOffice() == null || !p.getIsHiddenFromFrontOffice())
                    .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping("/advance")
    public ResponseEntity<Payment> createAdvancePayment(@RequestBody Payment payment) {
        boolean isFinalType = "FINAL".equalsIgnoreCase(payment.getPaymentType()) || Boolean.FALSE.equals(payment.getIsAdvancePayment());
        if (isFinalType) {
            payment.setAdvancePayment(false);
            payment.setPaymentType("FINAL");
        } else {
            payment.setAdvancePayment(true);
            payment.setPaymentType("ADVANCE");
        }
        if (payment.getAccountantTransferStatus() == null) {
            payment.setAccountantTransferStatus(com.serenevilla.pms.model.AccountantTransferStatus.NONE);
        }
        
        // Sync duplicate fields
        if (payment.getAmount() == 0 && payment.getAmountInCurrency() != 0) {
            payment.setAmount(payment.getAmountInCurrency());
        } else if (payment.getAmount() != 0 && payment.getAmountInCurrency() == 0) {
            payment.setAmountInCurrency(payment.getAmount());
        }
        
        if (payment.getCurrencyCode() == null && payment.getCurrency() != null) {
            payment.setCurrencyCode(payment.getCurrency());
        } else if (payment.getCurrencyCode() != null && payment.getCurrency() == null) {
            payment.setCurrency(payment.getCurrencyCode());
        }

        if (payment.getConvertedAmountLkr() == 0 && payment.getAmountLkr() != 0) {
            payment.setConvertedAmountLkr(payment.getAmountLkr());
        } else if (payment.getConvertedAmountLkr() != 0 && payment.getAmountLkr() == 0) {
            payment.setAmountLkr(payment.getConvertedAmountLkr());
        }

        if (payment.getSlipPath() == null && payment.getPaymentSlipUrl() != null) {
            payment.setSlipPath(payment.getPaymentSlipUrl());
        } else if (payment.getSlipPath() != null && payment.getPaymentSlipUrl() == null) {
            payment.setPaymentSlipUrl(payment.getSlipPath());
        }

        if (payment.getReferenceNumber() == null && payment.getReceiptNumber() != null) {
            payment.setReferenceNumber(payment.getReceiptNumber());
        } else if (payment.getReferenceNumber() != null && payment.getReceiptNumber() == null) {
            payment.setReceiptNumber(payment.getReferenceNumber());
        }

        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(java.time.LocalDate.now());
        }
        if (payment.getCreatedAt() == null) {
            payment.setCreatedAt(java.time.LocalDateTime.now());
        }
        
        Payment saved = paymentRepository.save(payment);

        syncBookingAndRegistrationStatus(saved.getBookingId(), saved.getGuestRegistrationId(), isFinalType);

        if (webSocketHandler != null) {
            webSocketHandler.broadcast("update");
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/advance/{bookingId}")
    public ResponseEntity<List<Payment>> getAdvancePayments(
            @PathVariable(name = "bookingId") Long bookingId,
            @RequestParam(name = "role", required = false, defaultValue = "FRONT_OFFICER") String role) {
        List<Payment> list = paymentRepository.findByBookingId(bookingId).stream()
                .filter(p -> "ADVANCE".equalsIgnoreCase(p.getPaymentType()) || p.isAdvancePayment())
                .collect(java.util.stream.Collectors.toList());
        if ("FRONT_OFFICER".equalsIgnoreCase(role)) {
            list = list.stream()
                    .filter(p -> p.getIsHiddenFromFrontOffice() == null || !p.getIsHiddenFromFrontOffice())
                    .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(list);
    }

    @PutMapping("/rates")
    public ResponseEntity<ExchangeRate> updateExchangeRate(@RequestBody ExchangeRate rate) {
        ExchangeRate existing = exchangeRateRepository.findByCurrencyCode(rate.getCurrencyCode())
                .orElse(rate);
        existing.setRate(rate.getRate());
        existing.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(exchangeRateRepository.save(existing));
    }

    @GetMapping("/rates")
    public ResponseEntity<List<ExchangeRate>> getRates() {
        return ResponseEntity.ok(exchangeRateRepository.findAll());
    }

    // Get all payments
    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentRepository.findAll());
    }

    // Hide individual payment
    @PutMapping("/{id}/hide")
    public ResponseEntity<Payment> hidePayment(@PathVariable(name = "id") Long id) {
        return paymentRepository.findById(id).map(p -> {
            p.setIsHiddenFromFrontOffice(true);
            return ResponseEntity.ok(paymentRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Unhide individual payment
    @PutMapping("/{id}/unhide")
    public ResponseEntity<Payment> unhidePayment(@PathVariable(name = "id") Long id) {
        return paymentRepository.findById(id).map(p -> {
            p.setIsHiddenFromFrontOffice(false);
            return ResponseEntity.ok(paymentRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Bulk hide by method
    @PutMapping("/hide-by-method")
    public ResponseEntity<?> bulkHideByMethod(@RequestParam(name = "method") String method) {
        List<Payment> payments = paymentRepository.findAll();
        payments.stream()
                .filter(p -> method.equalsIgnoreCase(p.getPaymentMethod()))
                .forEach(p -> {
                    p.setIsHiddenFromFrontOffice(true);
                    paymentRepository.save(p);
                });
        return ResponseEntity.ok(java.util.Map.of("message", "All " + method + " payments hidden successfully"));
    }

    // Bulk unhide by method
    @PutMapping("/unhide-by-method")
    public ResponseEntity<?> bulkUnhideByMethod(@RequestParam(name = "method") String method) {
        List<Payment> payments = paymentRepository.findAll();
        payments.stream()
                .filter(p -> method.equalsIgnoreCase(p.getPaymentMethod()))
                .forEach(p -> {
                    p.setIsHiddenFromFrontOffice(false);
                    paymentRepository.save(p);
                });
        return ResponseEntity.ok(java.util.Map.of("message", "All " + method + " payments unhidden successfully"));
    }

    // Bulk hide all payments
    @PutMapping("/hide-all")
    public ResponseEntity<?> bulkHideAll() {
        List<Payment> payments = paymentRepository.findAll();
        payments.forEach(p -> {
            p.setIsHiddenFromFrontOffice(true);
            paymentRepository.save(p);
        });
        return ResponseEntity.ok(java.util.Map.of("message", "All payments hidden successfully"));
    }

    // Bulk unhide all payments
    @PutMapping("/unhide-all")
    public ResponseEntity<?> bulkUnhideAll() {
        List<Payment> payments = paymentRepository.findAll();
        payments.forEach(p -> {
            p.setIsHiddenFromFrontOffice(false);
            paymentRepository.save(p);
        });
        return ResponseEntity.ok(java.util.Map.of("message", "All payments unhidden successfully"));
    }
}
