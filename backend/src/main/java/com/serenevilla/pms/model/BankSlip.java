package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "bank_slips",
    indexes = {
        @Index(name = "idx_bank_slip_key", columnList = "bookingKey"),
        @Index(name = "idx_bank_slip_booking_id", columnList = "booking_id"),
        @Index(name = "idx_bank_slip_reg_id", columnList = "guest_registration_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankSlip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bookingKey; // e.g. "booking_D-7892023" or "reg_123"

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "guest_registration_id")
    private Long guestRegistrationId;

    private String bankKey; // e.g. USD_PB, EUR_SB, etc.

    private LocalDate paidDate;

    private String paymentType = "Advance Payment";

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String slipUrl;

    private String fileName;

    private LocalDateTime createdAt = LocalDateTime.now();
}
