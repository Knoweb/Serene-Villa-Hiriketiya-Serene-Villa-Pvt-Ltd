package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.model.AccountantTransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingId(Long bookingId);
    List<Payment> findByAccountantTransferStatus(AccountantTransferStatus accountantTransferStatus);
    List<Payment> findByPropertyId(Long propertyId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amountLkr), 0) FROM Payment p WHERE (:propertyId IS NULL OR p.propertyId = :propertyId)")
    Double sumTotalRevenueByPropertyId(@org.springframework.data.repository.query.Param("propertyId") Long propertyId);
}
