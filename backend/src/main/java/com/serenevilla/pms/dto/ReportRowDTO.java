package com.serenevilla.pms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRowDTO {
    private String invoiceNumber;
    private String bookingNumber;
    private String guestName;
    private String passportNumber;
    private String roomName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private int numberOfNights;
    private String paymentMethod;
    private String paymentStatus;
    private String currencyCode;
    private double exchangeRate;
    private double paidAmount;
    private double convertedAmount;
    private double invoiceTotal;
    private double advancePaymentAmount;
    private double remainingBalance;
    private String bookingSource;
    private double discountAmount;
    private String discountStatus;
    private String createdByFrontOfficer;
}
