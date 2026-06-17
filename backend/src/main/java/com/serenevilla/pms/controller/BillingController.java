package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.AccountantTransferStatus;
import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/accountant")
@CrossOrigin(origins = "*")
public class BillingController {

    @Autowired
    private PaymentRepository paymentRepository;

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
                paymentRepository.save(payment);
            });
        }
        return ResponseEntity.ok(Map.of("message", "Transactions sent to accountant successfully."));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Payment>> getPendingTransactions() {
        return ResponseEntity.ok(paymentRepository.findByAccountantTransferStatus(AccountantTransferStatus.PENDING));
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
}
