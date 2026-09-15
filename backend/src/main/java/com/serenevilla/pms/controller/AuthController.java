package com.serenevilla.pms.controller;

import com.serenevilla.pms.model.User;
import com.serenevilla.pms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> credentials) {
        String username = (String) credentials.get("username");
        String rawPassword = (String) credentials.get("password");
        
        Long requestPropertyId = null;
        if (credentials.get("propertyId") != null) {
            try {
                requestPropertyId = Long.valueOf(credentials.get("propertyId").toString());
            } catch (Exception ignored) {}
        }
        
        java.util.Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
        }
        
        User user = userOpt.get();
        
        // Support both BCrypt hashes and legacy plaintext (with auto-upgrade to BCrypt)
        boolean passwordMatches = false;
        String storedPassword = user.getPassword();
        if (storedPassword != null) {
            if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
                passwordMatches = passwordEncoder.matches(rawPassword, storedPassword);
            } else {
                // Legacy plaintext match
                passwordMatches = storedPassword.equals(rawPassword);
                if (passwordMatches) {
                    // Auto upgrade legacy password to BCrypt hash
                    user.setPassword(passwordEncoder.encode(rawPassword));
                    userRepository.save(user);
                }
            }
        }

        if (!passwordMatches) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
        }
        
        if (!user.isActive()) {
            return ResponseEntity.status(401).body(Map.of("message", "User account is inactive"));
        }

        // Strict Property Tenant Check:
        // Non-ADMIN staff (FRONT_OFFICER, ACCOUNTANT) cannot login to a different property's portal
        if (user.getRole() != com.serenevilla.pms.model.Role.ADMIN && requestPropertyId != null) {
            Long userPropId = user.getPropertyId() != null ? user.getPropertyId() : 1L;
            if (!userPropId.equals(requestPropertyId)) {
                return ResponseEntity.status(403).body(Map.of(
                    "message", "Access Denied: You do not have permission to access this property portal."
                ));
            }
        }
        
        // Generate secure session token with property and role context
        String secureToken = java.util.UUID.randomUUID().toString().replace("-", "");
        
        return ResponseEntity.ok(Map.of(
            "username", user.getUsername(),
            "role", user.getRole().name(),
            "token", "sv-auth-" + secureToken,
            "propertyId", user.getPropertyId() != null ? user.getPropertyId() : (requestPropertyId != null ? requestPropertyId : 1L)
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }
            if (userRepository.findByUsername(user.getUsername().trim()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
            }

            user.setUsername(user.getUsername().trim());
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            if (user.getRole() == null) {
                user.setRole(com.serenevilla.pms.model.Role.FRONT_OFFICER);
            }
            if (user.getPropertyId() == null) {
                user.setPropertyId(1L);
            }
            user.setActive(true);

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to create user: " + e.getMessage()));
        }
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        return registerUser(user);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(@RequestParam(required = false) Long propertyId) {
        if (propertyId != null) {
            return ResponseEntity.ok(userRepository.findByPropertyId(propertyId));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
