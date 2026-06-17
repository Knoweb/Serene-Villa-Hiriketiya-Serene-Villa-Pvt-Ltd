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

    private double amountInCurrency;

    private String currency; // LKR, USD, EUR, GBP

    private double exchangeRate = 1.0;

    private double amountLkr;

    private String paymentSlipUrl; // For advance slips

    private boolean isAdvancePayment = false;

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
}
