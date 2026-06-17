package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    Optional<Receipt> findByPaymentId(Long paymentId);
}
