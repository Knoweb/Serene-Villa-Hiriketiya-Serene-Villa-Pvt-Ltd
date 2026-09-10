package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "delete_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeleteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long registrationId;

    private Long bookingId;

    private String bookingRef;

    private String guestName;

    private String reason;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    private String requestedBy;

    private LocalDateTime requestedAt = LocalDateTime.now();

    private String approvedBy;

    private LocalDateTime approvedAt;
}
