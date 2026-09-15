package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    Optional<Property> findByCode(String code);
    Optional<Property> findByName(String name);
}
