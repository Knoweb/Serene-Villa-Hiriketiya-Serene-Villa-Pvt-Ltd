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
    private Long totalBookings = 0L;
    private Long totalNights = 0L;
    private BigDecimal totalDiscounts = BigDecimal.ZERO;
    private Map<String, Long> bookingTypeDistribution;
}
