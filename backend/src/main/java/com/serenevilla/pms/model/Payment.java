package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    private Double amountInCurrency;

    private String currency; // LKR, USD, EUR, GBP

    private Double exchangeRate = 1.0;

    private Double amountLkr;

    private String paymentSlipUrl; // For advance slips

    private Boolean isAdvancePayment = false;

    private String paymentMethod; // Cash, Card, Bank Transfer

    private LocalDate paymentDate = LocalDate.now();

    private String receiptNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "accountant_transfer_status", nullable = false)
    private AccountantTransferStatus accountantTransferStatus = AccountantTransferStatus.NONE;

    @Column(name = "sent_to_accountant_at")
    private LocalDateTime sentToAccountantAt;

    @Column(name = "sent_to_accountant_by_id")
    private Long sentToAccountantById;

    @Column(name = "accepted_by_accountant_at")
    private LocalDateTime acceptedByAccountantAt;

    @Column(name = "accepted_by_accountant_id")
    private Long acceptedByAccountantId;

    @Column(name = "guest_registration_id")
    private Long guestRegistrationId;

    @Column(name = "payment_type")
    private String paymentType = "ADVANCE"; // ADVANCE

    private Double amount;

    private String currencyCode;

    private Double convertedAmountLkr;

    private String referenceNumber;

    private String slipPath;

    private String remarks;

    private String createdBy;

    @Transient
    private String guestName;

    @Transient
    private String bookingRef;

    private LocalDateTime createdAt = LocalDateTime.now();

    public double getAmountLkr() {
        return amountLkr != null ? amountLkr : 0.0;
    }
    
    public double getAmountInCurrency() {
        return amountInCurrency != null ? amountInCurrency : 0.0;
    }

    public double getExchangeRate() {
        return exchangeRate != null ? exchangeRate : 1.0;
    }

    public Boolean getIsAdvancePayment() {
        return isAdvancePayment;
    }

    public void setIsAdvancePayment(Boolean isAdvancePayment) {
        this.isAdvancePayment = isAdvancePayment;
    }

    public boolean isAdvancePayment() {
        return isAdvancePayment != null && isAdvancePayment;
    }

    public void setAdvancePayment(boolean isAdvancePayment) {
        this.isAdvancePayment = isAdvancePayment;
    }
}
