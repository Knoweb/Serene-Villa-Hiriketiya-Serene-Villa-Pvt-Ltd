package com.serenevilla.pms.controller;

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

    @PostMapping
    public ResponseEntity<Payment> recordPayment(@RequestBody Payment payment) {
        // Compute LKR equivalent at standard rate or custom rate
        double rate = 1.0;
        if (!"LKR".equalsIgnoreCase(payment.getCurrency())) {
            rate = exchangeRateRepository.findByCurrencyCode(payment.getCurrency())
                    .map(ExchangeRate::getRate)
                    .orElse(payment.getExchangeRate());
        }
        payment.setExchangeRate(rate);
        payment.setAmountLkr(payment.getAmountInCurrency() * rate);
        return ResponseEntity.ok(paymentRepository.save(payment));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Payment>> getPaymentsByBooking(@PathVariable(name = "bookingId") Long bookingId) {
        return ResponseEntity.ok(paymentRepository.findByBookingId(bookingId));
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
}
