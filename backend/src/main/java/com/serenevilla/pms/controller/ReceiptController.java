package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.Receipt;
import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.repository.ReceiptRepository;
import com.serenevilla.pms.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*")
public class ReceiptController {

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping("/advance/{paymentId}")
    public ResponseEntity<Receipt> getAdvanceReceipt(@PathVariable(name = "paymentId") Long paymentId) {
        return receiptRepository.findByPaymentId(paymentId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    // Find payment to get booking id
                    return paymentRepository.findById(paymentId).map(payment -> {
                        Receipt newReceipt = new Receipt();
                        newReceipt.setPaymentId(paymentId);
                        newReceipt.setBookingId(payment.getBookingId());
                        newReceipt.setReceiptType("ADVANCE");
                        newReceipt.setReceiptNumber("TEMP-" + paymentId + "-" + System.currentTimeMillis());
                        newReceipt.setGeneratedAt(LocalDateTime.now());
                        newReceipt.setGeneratedBy(payment.getCreatedBy() != null ? payment.getCreatedBy() : "Front Office");
                        
                        Receipt saved = receiptRepository.save(newReceipt);
                        saved.setReceiptNumber(String.format("REC-%04d", saved.getId()));
                        return ResponseEntity.ok(receiptRepository.save(saved));
                    }).orElse(ResponseEntity.notFound().build());
                });
    }
}
