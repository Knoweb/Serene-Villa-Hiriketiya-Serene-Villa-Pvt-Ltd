package com.serenevilla.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountantDashboardStatsDTO {
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private BigDecimal totalCardCharges = BigDecimal.ZERO;
    private BigDecimal totalOtherCharges = BigDecimal.ZERO;
    private BigDecimal netRevenue = BigDecimal.ZERO;

    // Payment method breakdown
    private BigDecimal cashRevenue = BigDecimal.ZERO;
    private BigDecimal cardRevenue = BigDecimal.ZERO;
    private BigDecimal bankTransferRevenue = BigDecimal.ZERO;

    // Extras breakdown
    private BigDecimal extraNightsRevenue = BigDecimal.ZERO;
    private BigDecimal extraPaxRevenue = BigDecimal.ZERO;
    private BigDecimal totalExtrasRevenue = BigDecimal.ZERO;

    private Long totalBookings = 0L;
    private Long totalNights = 0L;
    private BigDecimal totalDiscounts = BigDecimal.ZERO;
    private Map<String, Long> bookingTypeDistribution;
}

