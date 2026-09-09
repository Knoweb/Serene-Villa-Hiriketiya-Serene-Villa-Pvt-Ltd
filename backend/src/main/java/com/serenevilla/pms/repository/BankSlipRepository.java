package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.BankSlip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BankSlipRepository extends JpaRepository<BankSlip, Long> {
    List<BankSlip> findByBookingKey(String bookingKey);
    List<BankSlip> findByBookingId(Long bookingId);
    List<BankSlip> findByGuestRegistrationId(Long guestRegistrationId);
}
