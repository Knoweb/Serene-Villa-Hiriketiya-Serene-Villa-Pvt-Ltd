package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.DailyHandover;
import com.serenevilla.pms.repository.DailyHandoverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/handovers")
@CrossOrigin(origins = "*")
public class HandoverController {

    @Autowired
    private DailyHandoverRepository dailyHandoverRepository;

    @PostMapping
    public ResponseEntity<DailyHandover> submitHandover(@RequestBody DailyHandover handover) {
        return ResponseEntity.ok(dailyHandoverRepository.save(handover));
    }

    @GetMapping
    public ResponseEntity<List<DailyHandover>> getHandovers() {
        return ResponseEntity.ok(dailyHandoverRepository.findAll());
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<DailyHandover> reviewHandover(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "status") String status,
            @RequestParam(name = "reason", required = false) String reason) {
        
        return dailyHandoverRepository.findById(id).map(h -> {
            h.setStatus(status);
            if (reason != null) {
                h.setRejectionReason(reason);
            }
            return ResponseEntity.ok(dailyHandoverRepository.save(h));
        }).orElse(ResponseEntity.notFound().build());
    }
}
