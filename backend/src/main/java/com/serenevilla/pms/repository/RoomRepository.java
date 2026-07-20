package com.serenevilla.pms.repository;

import com.serenevilla.pms.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByPropertyId(Long propertyId);
    Optional<Room> findByRoomNumber(String roomNumber);
}
