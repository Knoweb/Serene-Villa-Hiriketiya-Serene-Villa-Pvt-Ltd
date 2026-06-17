package com.serenevilla.pms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDTO {
    private long totalBookings;
    private long totalCheckIns;
    private long totalCheckOuts;
    private long totalGuests;
    private long totalAdults;
    private long totalChildren;
    private long totalInvoices;
    private double totalRevenue;
    private double totalAdvancePayments;
    private double totalRemainingBalance;
    private double totalOutstandingAmount;

    // Payment method breakdowns
    private double cashRevenue;
    private double cardRevenue;
    private double bankTransferRevenue;

    // Booking source counts
    private long directBookingCount;
    private long bookingComCount;

    // Discount summaries
    private double approvedDiscountTotal;
    private long pendingDiscountRequestCount;
    
    // Details
    private List<ReportRowDTO> rows;
}
