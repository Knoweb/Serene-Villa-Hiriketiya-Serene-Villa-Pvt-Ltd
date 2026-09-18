package com.serenevilla.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomIncomeSummaryDTO {
    private Long roomId;
    private String roomNumber;
    private String roomType;
    private long totalBookings;
    private int totalNights;
    private int totalGuests;
    private double cashRevenue;
    private double cardRevenue;
    private double bankTransferRevenue;
    private double totalRevenue;
}
