package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.DiscountRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscountRequestRepository extends JpaRepository<DiscountRequest, Long> {
    List<DiscountRequest> findByBookingId(Long bookingId);
    List<DiscountRequest> findByStatusOrderByRequestedAtDesc(String status);
    List<DiscountRequest> findAllByOrderByRequestedAtDesc();
}
