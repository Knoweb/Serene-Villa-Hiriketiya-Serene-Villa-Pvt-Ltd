package com.serenevilla.pms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyCheckInDTO {
    private Long id;
    private String guestName;
    private String passportNumber;
    private String roomNumber;
    private String roomType;
    private Double amount;
    private Integer pax;
    private Integer adults;
    private Integer children;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String bookingNumber;
    private String bookingSource;
    private String paymentStatus;
}
