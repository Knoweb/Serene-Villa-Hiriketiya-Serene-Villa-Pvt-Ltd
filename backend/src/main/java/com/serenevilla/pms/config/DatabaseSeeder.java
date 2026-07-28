package com.serenevilla.pms.config;

import com.serenevilla.pms.model.Role;
import com.serenevilla.pms.model.User;
import com.serenevilla.pms.model.Room;
import com.serenevilla.pms.repository.UserRepository;
import com.serenevilla.pms.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Migration: Update manually created reservations with created_by = 'Staff'
        try {
            int updatedRows = jdbcTemplate.update(
                "UPDATE guest_registrations SET created_by = 'Staff' WHERE (passport_number LIKE 'SV-%' OR guest_name = 'shiva' OR guest_name = 'kkr') AND (created_by IS NULL OR created_by = 'Public QR Code')"
            );
            if (updatedRows > 0) {
                System.out.println(">>> Legacy data migration: Updated " + updatedRows + " reservations to created_by = 'Staff' <<<");
            }
        } catch (Exception e) {
            System.err.println("Migration error: " + e.getMessage());
        }

        // Seed default Admin user if it doesn't exist
        if (userRepository.findByUsername("admin@serene.com").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin@serene.com");
            admin.setPassword("admin@serene123");
            admin.setRole(Role.ADMIN);
            admin.setPropertyId(1L);
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println(">>> Admin user successfully seeded into database (admin@serene.com / admin@serene123) <<<");
        }

        // Seed default Rooms if none exist in the database
        if (roomRepository.count() == 0) {
            Room r1 = new Room();
            r1.setRoomNumber("101");
            r1.setRoomType("Budget Room");
            r1.setDescription("Comfortable and affordable budget room.");
            r1.setImage("/deluxe.png");
            r1.setFacilities(Arrays.asList("Air conditioning", "Free Wifi", "Private bathroom"));
            r1.setStatus("Available");
            r1.setPropertyId(1L);
            roomRepository.save(r1);

            Room r2 = new Room();
            r2.setRoomNumber("102");
            r2.setRoomType("Standard Room");
            r2.setDescription("Modern standard room with essential amenities.");
            r2.setImage("/deluxe.png");
            r2.setFacilities(Arrays.asList("Air conditioning", "Free Wifi", "Private bathroom", "King Bed"));
            r2.setStatus("Available");
            r2.setPropertyId(1L);
            roomRepository.save(r2);

            Room r3 = new Room();
            r3.setRoomNumber("201");
            r3.setRoomType("Deluxe Room");
            r3.setDescription("Spacious deluxe room with balcony and garden view.");
            r3.setImage("/deluxe.png");
            r3.setFacilities(Arrays.asList("Air conditioning", "Free Wifi", "Balcony", "Private bathroom", "Minibar", "Queen Bed"));
            r3.setStatus("Available");
            r3.setPropertyId(1L);
            roomRepository.save(r3);

            Room r4 = new Room();
            r4.setRoomNumber("301");
            r4.setRoomType("Suite Room");
            r4.setDescription("Luxurious suite room with premium sea view and private terrace.");
            r4.setImage("/suite.png");
            r4.setFacilities(Arrays.asList("Air conditioning", "Free Wifi", "Balcony", "Sea view", "Private bathroom", "Minibar", "Terrace", "King Bed"));
            r4.setStatus("Available");
            r4.setPropertyId(1L);
            roomRepository.save(r4);

            System.out.println(">>> Default rooms successfully seeded into database (101, 102, 201, 301) <<<");
        }
    }
}
