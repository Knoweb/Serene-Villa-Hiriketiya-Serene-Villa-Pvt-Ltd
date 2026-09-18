package com.serenevilla.pms.controller;

import com.serenevilla.pms.dto.AccountantDashboardStatsDTO;
import com.serenevilla.pms.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accountant")
@CrossOrigin(origins = "*")
public class AccountantDashboardController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/dashboard-stats")
    public ResponseEntity<AccountantDashboardStatsDTO> getDashboardStats(
            @RequestParam(name = "propertyId", required = false) Long propertyId,
            @RequestHeader(name = "X-Active-Property", required = false) Long headerPropertyId) {
        
        Long targetPropertyId = (propertyId != null) ? propertyId : headerPropertyId;
        AccountantDashboardStatsDTO stats = analyticsService.getAccountantDashboardStats(targetPropertyId);
        return ResponseEntity.ok(stats);
    }

    @Autowired
    private com.serenevilla.pms.repository.RoomRepository roomRepository;

    @GetMapping("/analytics/rooms")
    public ResponseEntity<?> getRoomsForAnalytics(
            @RequestParam(name = "propertyId", required = false) Long propertyId,
            @RequestHeader(name = "X-Active-Property", required = false) Long headerPropertyId) {
        Long targetPropertyId = (propertyId != null) ? propertyId : headerPropertyId;
        if (targetPropertyId != null) {
            return ResponseEntity.ok(roomRepository.findByPropertyId(targetPropertyId));
        }
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @GetMapping("/analytics/room/{roomId}")
    public ResponseEntity<com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO> getRoomAnalytics(
            @PathVariable(name = "roomId") Long roomId,
            @RequestParam(name = "propertyId", required = false) Long propertyId,
            @RequestParam(name = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @RequestHeader(name = "X-Active-Property", required = false) Long headerPropertyId) {
        Long targetPropertyId = (propertyId != null) ? propertyId : headerPropertyId;
        return ResponseEntity.ok(analyticsService.getRoomFinancialAnalytics(roomId, targetPropertyId, startDate, endDate));
    }

    @GetMapping("/analytics/all-rooms")
    public ResponseEntity<java.util.List<com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO>> getAllRoomsAnalytics(
            @RequestParam(name = "propertyId", required = false) Long propertyId,
            @RequestParam(name = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @RequestHeader(name = "X-Active-Property", required = false) Long headerPropertyId) {
        Long targetPropertyId = (propertyId != null) ? propertyId : headerPropertyId;
        return ResponseEntity.ok(analyticsService.getAllRoomsFinancialAnalytics(targetPropertyId, startDate, endDate));
    }
}
