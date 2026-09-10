package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.DeleteRequest;
import com.serenevilla.pms.repository.DeleteRequestRepository;
import com.serenevilla.pms.service.GuestRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delete-requests")
@CrossOrigin(origins = "*")
public class DeleteRequestController {

    @Autowired
    private DeleteRequestRepository deleteRequestRepository;

    @Autowired
    private GuestRegistrationService guestRegistrationService;

    // Get all delete requests
    @GetMapping
    public ResponseEntity<List<DeleteRequest>> getAllDeleteRequests(
            @RequestParam(name = "status", required = false) String status) {
        if (status != null && !status.trim().isEmpty()) {
            return ResponseEntity.ok(deleteRequestRepository.findByStatusOrderByRequestedAtDesc(status.toUpperCase()));
        }
        return ResponseEntity.ok(deleteRequestRepository.findAllByOrderByRequestedAtDesc());
    }

    // Submit new delete request (Front Office / Staff)
    @PostMapping
    public ResponseEntity<?> createDeleteRequest(@RequestBody DeleteRequest request) {
        try {
            if (request.getReason() == null || request.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "A reason for deletion is required"));
            }
            request.setStatus("PENDING");
            request.setRequestedAt(LocalDateTime.now());
            DeleteRequest saved = deleteRequestRepository.save(request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    // Approve delete request (Admin Only) -> Cascades delete to registration/booking
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveDeleteRequest(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "approvedBy", defaultValue = "Admin") String approvedBy) {
        return deleteRequestRepository.findById(id).map(req -> {
            try {
                // Delete actual registration if present
                if (req.getRegistrationId() != null) {
                    try {
                        guestRegistrationService.deleteRegistration(req.getRegistrationId());
                    } catch (Exception ex) {
                        System.err.println("Warning: Target registration already deleted or not found: " + ex.getMessage());
                    }
                }

                req.setStatus("APPROVED");
                req.setApprovedBy(approvedBy);
                req.setApprovedAt(LocalDateTime.now());
                DeleteRequest updated = deleteRequestRepository.save(req);
                return ResponseEntity.ok(updated);
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body(Map.of("message", "Error approving deletion: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Reject delete request (Admin Only)
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectDeleteRequest(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "rejectedBy", defaultValue = "Admin") String rejectedBy) {
        return deleteRequestRepository.findById(id).map(req -> {
            req.setStatus("REJECTED");
            req.setApprovedBy(rejectedBy);
            req.setApprovedAt(LocalDateTime.now());
            DeleteRequest updated = deleteRequestRepository.save(req);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}
