package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_handovers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyHandover {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date = LocalDate.now();

    private String submittedBy;

    private LocalDateTime submittedAt = LocalDateTime.now();

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    private String rejectionReason;

    private int totalTransactionsCount;

    private double totalAmountLkrEquivalent;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String transactionsListJson;
}
