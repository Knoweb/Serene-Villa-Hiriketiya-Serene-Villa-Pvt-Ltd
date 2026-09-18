package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.model.AccountantTransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingId(Long bookingId);
    List<Payment> findByAccountantTransferStatus(AccountantTransferStatus accountantTransferStatus);
    List<Payment> findByPropertyId(Long propertyId);
    List<Payment> findByPropertyIdAndAccountantTransferStatus(Long propertyId, AccountantTransferStatus accountantTransferStatus);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(COALESCE(NULLIF(p.amountLkr, 0), NULLIF(p.convertedAmountLkr, 0), NULLIF(p.amountInCurrency * CASE WHEN p.exchangeRate > 0 THEN p.exchangeRate ELSE 1.0 END, 0), NULLIF(p.amount, 0), 0)), 0) FROM Payment p WHERE (:propertyId IS NULL OR p.propertyId = :propertyId OR (p.propertyId IS NULL AND :propertyId = 1))")
    Double sumTotalRevenueByPropertyId(@org.springframework.data.repository.query.Param("propertyId") Long propertyId);
}
