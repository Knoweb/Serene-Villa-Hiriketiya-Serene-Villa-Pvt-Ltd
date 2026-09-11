package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "discount_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscountRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id")
    private Long bookingId;

    private String bookingRef;

    private String guestName;

    private double totalAmount;

    private String requestedDiscount;

    private double discountAmount;

    private String currency = "LKR";

    private String reason;

    private String status = "Pending"; // Pending, Approved, Rejected

    private String requestedBy;

    private LocalDateTime requestedAt = LocalDateTime.now();

    private String approvedBy;

    private LocalDateTime approvedAt;
}
