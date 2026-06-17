package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.model.AccountantTransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingId(Long bookingId);
    List<Payment> findByAccountantTransferStatus(AccountantTransferStatus accountantTransferStatus);
}
