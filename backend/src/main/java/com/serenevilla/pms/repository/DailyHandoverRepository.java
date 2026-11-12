package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.DailyHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DailyHandoverRepository extends JpaRepository<DailyHandover, Long> {
    List<DailyHandover> findByPropertyIdOrderBySubmittedAtDesc(Long propertyId);
    List<DailyHandover> findAllByOrderBySubmittedAtDesc();
}
