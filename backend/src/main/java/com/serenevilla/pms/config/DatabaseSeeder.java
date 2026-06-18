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

    @Override
    public void run(String... args) throws Exception {
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
