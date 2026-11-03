package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.Receipt;
import com.serenevilla.pms.service.ReceiptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*")
public class ReceiptController {

    @Autowired
    private ReceiptService receiptService;

    @GetMapping("/advance/{paymentId}")
    public ResponseEntity<Receipt> getAdvanceReceipt(@PathVariable(name = "paymentId") Long paymentId) {
        return receiptService.getOrCreateAdvanceReceipt(paymentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
