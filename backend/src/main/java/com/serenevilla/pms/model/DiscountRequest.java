package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "discount_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscountRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    private double discountAmount;

    private String reason;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    private String requestedBy;

    private String approvedBy;
}
