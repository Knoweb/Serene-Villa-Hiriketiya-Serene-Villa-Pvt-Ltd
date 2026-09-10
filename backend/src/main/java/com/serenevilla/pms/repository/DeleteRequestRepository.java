package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.DeleteRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeleteRequestRepository extends JpaRepository<DeleteRequest, Long> {
    List<DeleteRequest> findByStatusOrderByRequestedAtDesc(String status);
    List<DeleteRequest> findAllByOrderByRequestedAtDesc();
}
