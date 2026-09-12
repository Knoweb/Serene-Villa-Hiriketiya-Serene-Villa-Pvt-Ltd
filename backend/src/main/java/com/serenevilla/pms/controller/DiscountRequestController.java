package com.serenevilla.pms.controller;

import com.serenevilla.pms.handler.RegistrationWebSocketHandler;
import com.serenevilla.pms.model.Booking;
import com.serenevilla.pms.model.DiscountRequest;
import com.serenevilla.pms.model.GuestRegistration;
import com.serenevilla.pms.repository.BookingRepository;
import com.serenevilla.pms.repository.DiscountRequestRepository;
import com.serenevilla.pms.repository.GuestRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discount-requests")
@CrossOrigin(origins = "*")
public class DiscountRequestController {

    @Autowired
    private DiscountRequestRepository discountRequestRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @Autowired
    private RegistrationWebSocketHandler webSocketHandler;

    // Get all discount requests
    @GetMapping
    public ResponseEntity<List<DiscountRequest>> getAllDiscountRequests(
            @RequestParam(name = "status", required = false) String status) {
        if (status != null && !status.trim().isEmpty()) {
            return ResponseEntity.ok(discountRequestRepository.findByStatusOrderByRequestedAtDesc(status));
        }
        return ResponseEntity.ok(discountRequestRepository.findAllByOrderByRequestedAtDesc());
    }

    // Submit new discount request (Front Office / Staff)
    @PostMapping
    public ResponseEntity<?> createDiscountRequest(@RequestBody DiscountRequest request) {
        try {
            if (request.getReason() == null || request.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "A reason for discount is required"));
            }
            request.setStatus("Pending");
            request.setRequestedAt(LocalDateTime.now());
            DiscountRequest saved = discountRequestRepository.save(request);
            if (webSocketHandler != null) {
                webSocketHandler.broadcast("update");
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    // Approve discount request (Admin Only) -> Automatically applies extra discount booking line
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveDiscountRequest(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "approvedBy", defaultValue = "Admin") String approvedBy) {
        return discountRequestRepository.findById(id).map(req -> {
            try {
                // Find matching parent booking
                List<Booking> allB = bookingRepository.findAll();
                List<GuestRegistration> allR = guestRegistrationRepository.findAll();

                String cleanRef = req.getBookingRef() != null ? req.getBookingRef().trim().toLowerCase() : "";
                String cleanGuestName = req.getGuestName() != null ? req.getGuestName().trim().toLowerCase() : "";

                Booking matchedParent = allB.stream().filter(b -> {
                    String bNum = b.getBookingNumber() != null ? b.getBookingNumber().trim().toLowerCase() : "";
                    String bGuest = b.getGuestName() != null ? b.getGuestName().trim().toLowerCase() : "";
                    return (!cleanRef.isEmpty() && (bNum.equals(cleanRef) || bNum.startsWith(cleanRef))) ||
                           (!cleanGuestName.isEmpty() && !bGuest.isEmpty() && bGuest.equals(cleanGuestName));
                }).findFirst().orElse(null);

                Long matchedRegId = matchedParent != null ? matchedParent.getGuestRegistrationId() : null;
                if (matchedRegId == null && !allR.isEmpty()) {
                    GuestRegistration matchedReg = allR.stream().filter(r -> {
                        String rNum = (r.getPassportNumber() != null ? r.getPassportNumber() : "").trim().toLowerCase();
                        String rGuest = r.getGuestName() != null ? r.getGuestName().trim().toLowerCase() : "";
                        return (!cleanRef.isEmpty() && (rNum.contains(cleanRef) || cleanRef.contains(rNum))) ||
                               (!cleanGuestName.isEmpty() && !rGuest.isEmpty() && rGuest.equals(cleanGuestName));
                    }).findFirst().orElse(null);
                    if (matchedReg != null) matchedRegId = matchedReg.getId();
                }

                if (matchedParent != null || matchedRegId != null) {
                    String parentBNum = matchedParent != null && matchedParent.getBookingNumber() != null ? matchedParent.getBookingNumber() : req.getBookingRef();
                    String discCurrency = req.getCurrency() != null ? req.getCurrency() : (matchedParent != null && matchedParent.getCurrency() != null ? matchedParent.getCurrency() : "LKR");
                    String newBNum = parentBNum + "/DISC";

                    // Prevent duplicate /DISC booking lines
                    boolean exists = allB.stream().anyMatch(b -> b.getBookingNumber() != null && b.getBookingNumber().equalsIgnoreCase(newBNum));
                    if (!exists) {
                        Booking discBooking = new Booking();
                        discBooking.setGuestRegistrationId(matchedRegId != null ? matchedRegId : matchedParent.getGuestRegistrationId());
                        discBooking.setBookingNumber(newBNum);
                        discBooking.setGuestName(req.getGuestName() != null ? req.getGuestName() : (matchedParent != null ? matchedParent.getGuestName() : "Guest"));
                        discBooking.setRoomNumber(matchedParent != null && matchedParent.getRoomNumber() != null ? matchedParent.getRoomNumber() : "Discount");
                        discBooking.setRoomType(matchedParent != null && matchedParent.getRoomType() != null ? matchedParent.getRoomType() : "Discount");
                        discBooking.setBookingType("Direct");
                        discBooking.setBoardBasis("Room Only");
                        discBooking.setRemarks("Discount: " + (req.getReason() != null ? req.getReason() : "Admin Approved Discount"));
                        double rawAmount = req.getDiscountAmount() > 0 ? req.getDiscountAmount() : 0;
                        discBooking.setTotalAmount(-Math.abs(rawAmount));
                        discBooking.setCurrency(discCurrency);
                        discBooking.setCheckInDate(matchedParent != null && matchedParent.getCheckInDate() != null ? matchedParent.getCheckInDate() : LocalDate.now());
                        discBooking.setCheckOutDate(matchedParent != null && matchedParent.getCheckOutDate() != null ? matchedParent.getCheckOutDate() : LocalDate.now().plusDays(1));
                        discBooking.setNumberOfNights(1);
                        discBooking.setStatus("Confirmed");
                        bookingRepository.save(discBooking);
                    }
                }

                req.setStatus("Approved");
                req.setApprovedBy(approvedBy);
                req.setApprovedAt(LocalDateTime.now());
                DiscountRequest updated = discountRequestRepository.save(req);
                if (webSocketHandler != null) {
                    webSocketHandler.broadcast("update");
                }
                return ResponseEntity.ok(updated);
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body(Map.of("message", "Error approving discount: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Reject discount request (Admin Only)
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectDiscountRequest(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "rejectedBy", defaultValue = "Admin") String rejectedBy) {
        return discountRequestRepository.findById(id).map(req -> {
            req.setStatus("Rejected");
            req.setApprovedBy(rejectedBy);
            req.setApprovedAt(LocalDateTime.now());
            DiscountRequest updated = discountRequestRepository.save(req);
            if (webSocketHandler != null) {
                webSocketHandler.broadcast("update");
            }
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Clear all / delete discount request (Admin Only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDiscountRequest(@PathVariable(name = "id") Long id) {
        discountRequestRepository.deleteById(id);
        if (webSocketHandler != null) {
            webSocketHandler.broadcast("update");
        }
        return ResponseEntity.ok(Map.of("message", "Discount request removed"));
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAllDiscountRequests() {
        discountRequestRepository.deleteAll();
        if (webSocketHandler != null) {
            webSocketHandler.broadcast("update");
        }
        return ResponseEntity.ok(Map.of("message", "All discount requests cleared successfully"));
    }
}
