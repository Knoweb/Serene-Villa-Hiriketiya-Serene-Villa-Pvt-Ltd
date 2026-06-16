package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.GuestRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GuestRegistrationRepository extends JpaRepository<GuestRegistration, Long> {
    List<GuestRegistration> findByPropertyId(Long propertyId);
    List<GuestRegistration> findByPropertyIdAndIsHiddenFromFrontOfficeFalse(Long propertyId);
}
