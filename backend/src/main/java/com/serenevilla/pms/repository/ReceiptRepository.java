package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    Optional<Receipt> findByPaymentId(Long paymentId);

    boolean existsByReceiptNumber(String receiptNumber);

    @Query("SELECT r.receiptNumber FROM Receipt r WHERE r.receiptNumber LIKE :prefixPattern")
    List<String> findReceiptNumbersByPrefix(@Param("prefixPattern") String prefixPattern);

    @Query("SELECT r.receiptNumber FROM Receipt r WHERE r.receiptNumber LIKE :prefixPattern AND ((r.generatedAt >= :startOfMonth AND r.generatedAt < :endOfMonth) OR r.generatedAt IS NULL)")
    List<String> findReceiptNumbersInMonth(
        @Param("prefixPattern") String prefixPattern,
        @Param("startOfMonth") LocalDateTime startOfMonth,
        @Param("endOfMonth") LocalDateTime endOfMonth
    );
}
