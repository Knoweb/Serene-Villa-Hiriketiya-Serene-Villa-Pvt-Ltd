package com.serenevilla.pms.controller;

import com.serenevilla.pms.dto.ReportSummaryDTO;
import com.serenevilla.pms.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<ReportSummaryDTO> getDailyReport(
            @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "propertyId", required = false) Long propertyId) {
        return ResponseEntity.ok(reportService.generateReport(date, date, propertyId));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ReportSummaryDTO> getWeeklyReport(
            @RequestParam(name = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "propertyId", required = false) Long propertyId) {
        return ResponseEntity.ok(reportService.generateReport(startDate, endDate, propertyId));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ReportSummaryDTO> getMonthlyReport(
            @RequestParam(name = "year") int year,
            @RequestParam(name = "month") int month,
            @RequestParam(name = "propertyId", required = false) Long propertyId) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return ResponseEntity.ok(reportService.generateReport(start, end, propertyId));
    }

    @GetMapping("/range")
    public ResponseEntity<ReportSummaryDTO> getRangeReport(
            @RequestParam(name = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "propertyId", required = false) Long propertyId) {
        return ResponseEntity.ok(reportService.generateReport(startDate, endDate, propertyId));
    }
}
