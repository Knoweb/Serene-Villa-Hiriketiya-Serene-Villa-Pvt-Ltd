package com.serenevilla.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomFinancialAnalyticsDTO {
    private Long roomId;
    private String roomNumber;
    private String roomType;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private BigDecimal cashAmount = BigDecimal.ZERO;
    private BigDecimal cardAmount = BigDecimal.ZERO;
    private BigDecimal bankTransferAmount = BigDecimal.ZERO;
    private Integer totalNights = 0;
    private Integer totalAdults = 0;
    private Integer totalChildren = 0;
    private java.util.List<RoomBookingTransactionDTO> transactions = new java.util.ArrayList<>();
}
