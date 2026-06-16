package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.DiscountRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiscountRequestRepository extends JpaRepository<DiscountRequest, Long> {
    List<DiscountRequest> findByBookingId(Long bookingId);
}
