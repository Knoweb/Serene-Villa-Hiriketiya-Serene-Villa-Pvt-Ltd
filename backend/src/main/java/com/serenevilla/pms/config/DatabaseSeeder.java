package com.serenevilla.pms.config;

import com.serenevilla.pms.model.Role;
import com.serenevilla.pms.model.User;
import com.serenevilla.pms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

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
    }
}
