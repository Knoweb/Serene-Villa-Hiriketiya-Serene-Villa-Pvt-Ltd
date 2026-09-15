package com.serenevilla.pms.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/maintenance")
@CrossOrigin(origins = "*")
public class AdminMaintenanceController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RoomController roomController;

    @PostMapping("/reset-transaction-data")
    public ResponseEntity<?> resetTransactionData() {
        try {
            // Disable foreign key checks temporarily for clean truncate/delete
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");

            // Delete transaction and operational data
            jdbcTemplate.execute("TRUNCATE TABLE payments;");
            jdbcTemplate.execute("TRUNCATE TABLE receipts;");
            jdbcTemplate.execute("TRUNCATE TABLE bank_slips;");
            jdbcTemplate.execute("TRUNCATE TABLE discount_requests;");
            jdbcTemplate.execute("TRUNCATE TABLE delete_requests;");
            jdbcTemplate.execute("TRUNCATE TABLE daily_handovers;");
            jdbcTemplate.execute("TRUNCATE TABLE bookings;");
            jdbcTemplate.execute("TRUNCATE TABLE guest_registrations;");
            
            // Reset rooms to clean initial state
            jdbcTemplate.execute("TRUNCATE TABLE rooms;");

            // Re-enable foreign key checks
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");

            // Re-seed default 6 rooms for Property 1 & 11 rooms for Property 2
            roomController.seedDefaultRooms();

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "All transaction data cleared successfully while preserving user accounts and property configurations."
            ));
        } catch (Exception e) {
            e.printStackTrace();
            try {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
            } catch (Exception ignored) {}
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
