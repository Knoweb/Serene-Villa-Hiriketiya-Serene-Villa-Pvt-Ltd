package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.BankSlip;
import com.serenevilla.pms.repository.BankSlipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bank-slips")
@CrossOrigin(origins = "*")
public class BankSlipController {

    @Autowired
    private BankSlipRepository bankSlipRepository;

    @GetMapping
    public ResponseEntity<List<BankSlip>> getAllSlips() {
        return ResponseEntity.ok(bankSlipRepository.findAll());
    }

    @GetMapping("/key/{bookingKey}")
    public ResponseEntity<List<BankSlip>> getSlipsByKey(@PathVariable("bookingKey") String bookingKey) {
        return ResponseEntity.ok(bankSlipRepository.findByBookingKey(bookingKey));
    }

    @PostMapping
    public ResponseEntity<BankSlip> saveSlip(@RequestBody BankSlip slip) {
        if (slip.getCreatedAt() == null) {
            slip.setCreatedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(bankSlipRepository.save(slip));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlip(@PathVariable("id") Long id) {
        if (bankSlipRepository.existsById(id)) {
            bankSlipRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Bank slip deleted successfully."));
        }
        return ResponseEntity.notFound().build();
    }
}
