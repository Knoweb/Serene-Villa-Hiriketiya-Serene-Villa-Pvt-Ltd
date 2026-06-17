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
            @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(reportService.generateReport(date, date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ReportSummaryDTO> getWeeklyReport(
            @RequestParam(name = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.generateReport(startDate, endDate));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ReportSummaryDTO> getMonthlyReport(
            @RequestParam(name = "year") int year,
            @RequestParam(name = "month") int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return ResponseEntity.ok(reportService.generateReport(start, end));
    }

    @GetMapping("/range")
    public ResponseEntity<ReportSummaryDTO> getRangeReport(
            @RequestParam(name = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.generateReport(startDate, endDate));
    }
}
