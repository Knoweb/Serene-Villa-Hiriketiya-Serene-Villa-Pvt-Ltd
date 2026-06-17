package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_number", nullable = false, unique = true)
    private String receiptNumber;

    @Column(name = "payment_id", nullable = false)
    private Long paymentId;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "receipt_type")
    private String receiptType = "ADVANCE";

    private LocalDateTime generatedAt = LocalDateTime.now();

    private String generatedBy;
}
