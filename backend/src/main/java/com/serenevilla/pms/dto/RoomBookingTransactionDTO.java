package com.serenevilla.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomBookingTransactionDTO {
    private Long id;
    private String bookingRef;
    private String guestName;
    private String checkInDate;
    private String checkOutDate;
    private Integer nights;
    private String bookingType;
    private String paymentMethod;
    private BigDecimal amount = BigDecimal.ZERO;
    private String currency = "USD";
    private BigDecimal amountLkr = BigDecimal.ZERO;
    private String status; // NONE, PENDING, ACCEPTED, REJECTED
    private String date;
}
