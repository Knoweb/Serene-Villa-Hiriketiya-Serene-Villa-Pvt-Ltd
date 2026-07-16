package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.GuestRegistration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface GuestRegistrationRepository extends JpaRepository<GuestRegistration, Long> {
    List<GuestRegistration> findByPropertyId(Long propertyId);
    List<GuestRegistration> findByPropertyIdAndIsHiddenFromFrontOfficeFalse(Long propertyId);

    @Query("SELECT g FROM GuestRegistration g WHERE " +
           "(g.isHiddenFromFrontOffice = false OR :showHidden = true) AND " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(g.guestName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.passportNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.whatsappNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.nationality) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR LOWER(g.paymentStatus) = LOWER(:status)) AND " +
           "(:source IS NULL OR :source = '' OR (:source = 'QR' AND (g.createdBy IS NULL OR g.createdBy = 'Public QR Code')) OR (:source = 'Staff' AND g.createdBy = 'Staff'))")
    Page<GuestRegistration> searchRegistrations(
            @Param("query") String query,
            @Param("status") String status,
            @Param("showHidden") boolean showHidden,
            @Param("source") String source,
            Pageable pageable);
}
