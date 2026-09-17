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
}
