package com.serenevilla.pms.config;

import com.serenevilla.pms.model.Booking;
import com.serenevilla.pms.model.GuestRegistration;
import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.model.Receipt;
import com.serenevilla.pms.model.Role;
import com.serenevilla.pms.model.User;
import com.serenevilla.pms.repository.BookingRepository;
import com.serenevilla.pms.repository.GuestRegistrationRepository;
import com.serenevilla.pms.repository.PaymentRepository;
import com.serenevilla.pms.repository.ReceiptRepository;
import com.serenevilla.pms.repository.UserRepository;
import com.serenevilla.pms.service.ReceiptService;
import com.serenevilla.pms.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @Autowired
    private ReceiptService receiptService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Migration: Drop legacy single-column unique index on rooms.room_number if exists
        try {
            jdbcTemplate.execute("ALTER TABLE rooms DROP INDEX UK7ljglxlj90ln3lbas4kl983m2");
            System.out.println(">>> Dropped legacy single-column unique index UK7ljglxlj90ln3lbas4kl983m2 on rooms <<<");
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute("ALTER TABLE rooms DROP INDEX uk_room_number");
        } catch (Exception ignored) {}

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

        // Migration: Update receipt numbers from REC-XXXX to MM-XXX format
        try {
            List<Receipt> oldReceipts = receiptRepository.findAll().stream()
                .filter(r -> r.getReceiptNumber() != null && r.getReceiptNumber().startsWith("REC-"))
                .sorted(Comparator.comparing(Receipt::getId))
                .toList();

            if (!oldReceipts.isEmpty()) {
                System.out.println(">>> Migrating " + oldReceipts.size() + " legacy REC- receipt numbers to MM-XXX format... <<<");
                for (Receipt r : oldReceipts) {
                    LocalDateTime date = r.getGeneratedAt();
                    if (date == null && r.getPaymentId() != null) {
                        Payment p = paymentRepository.findById(r.getPaymentId()).orElse(null);
                        if (p != null) {
                            date = p.getCreatedAt() != null ? p.getCreatedAt() : (p.getPaymentDate() != null ? p.getPaymentDate().atStartOfDay() : null);
                        }
                    }
                    if (date == null) {
                        date = LocalDateTime.now();
                    }
                    String newNumber = receiptService.generateNextReceiptNumber(date);
                    String oldNumber = r.getReceiptNumber();
                    r.setReceiptNumber(newNumber);
                    receiptRepository.save(r);

                    if (r.getPaymentId() != null) {
                        paymentRepository.findById(r.getPaymentId()).ifPresent(p -> {
                            p.setReceiptNumber(newNumber);
                            paymentRepository.save(p);
                        });
                    }
                    try {
                        jdbcTemplate.update("UPDATE payments SET receipt_number = ? WHERE receipt_number = ?", newNumber, oldNumber);
                    } catch (Exception ignored) {}
                }
                System.out.println(">>> Receipt migration to MM-XXX completed successfully! <<<");
            }
        } catch (Exception e) {
            System.err.println("Receipt migration note: " + e.getMessage());
        }

        // Migration: Ensure ALL payments have an official MM-XXX receipt number and Receipt record
        try {
            List<Payment> allPayments = paymentRepository.findAll().stream()
                .sorted(Comparator.comparing(Payment::getId))
                .toList();

            int updatedCount = 0;
            for (Payment p : allPayments) {
                String rNum = p.getReceiptNumber();
                boolean needsReceipt = (rNum == null || rNum.trim().isEmpty() || rNum.startsWith("REC-") || !rNum.matches("^\\d{2}-\\d{3,}$"));

                Optional<Receipt> receiptOpt = receiptRepository.findByPaymentId(p.getId());
                if (!receiptOpt.isPresent() || needsReceipt) {
                    try {
                        Receipt receipt = receiptService.getOrCreateAdvanceReceipt(p);
                        if (receipt != null && receipt.getReceiptNumber() != null) {
                            p.setReceiptNumber(receipt.getReceiptNumber());
                            paymentRepository.save(p);
                            updatedCount++;
                        }
                    } catch (Exception ex) {
                        System.err.println("Could not create receipt for payment #" + p.getId() + ": " + ex.getMessage());
                    }
                }
            }
            if (updatedCount > 0) {
                System.out.println(">>> Verified & migrated " + updatedCount + " payments to official MM-XXX receipt numbers <<<");
            }
        } catch (Exception e) {
            System.err.println("Payment receipt migration note: " + e.getMessage());
        }

        // Migration: Link unlinked bookings to registrations, heal missing room numbers, and hide superseded drafts
        try {
            List<Booking> allB = bookingRepository.findAll();
            List<GuestRegistration> allG = guestRegistrationRepository.findAll();

            int healedCount = 0;
            for (Booking b : allB) {
                // If roomNumber is missing or unallocated, resolve from roomPrices
                if (b.getRoomNumber() == null || b.getRoomNumber().trim().isEmpty() || "Unallocated".equalsIgnoreCase(b.getRoomNumber().trim()) || "N/A".equalsIgnoreCase(b.getRoomNumber().trim())) {
                    String resolvedRoom = ReportService.extractRoomNumber(b);
                    if (!"N/A".equalsIgnoreCase(resolvedRoom)) {
                        b.setRoomNumber(resolvedRoom);
                        bookingRepository.save(b);
                        healedCount++;
                    }
                }

                // If guestRegistrationId is null, link to matching registration
                if (b.getGuestRegistrationId() == null) {
                    GuestRegistration matched = allG.stream()
                            .filter(g -> {
                                String cleanPass = g.getPassportNumber() != null ? g.getPassportNumber().replaceFirst("(?i)^SV-?", "").trim() : "";
                                if (b.getBookingNumber() != null && cleanPass.equalsIgnoreCase(b.getBookingNumber().trim())) return true;
                                if (g.getGuestName() != null && b.getGuestName() != null &&
                                    g.getGuestName().trim().equalsIgnoreCase(b.getGuestName().trim()) &&
                                    g.getCheckInDate() != null && b.getCheckInDate() != null &&
                                    g.getCheckInDate().equals(b.getCheckInDate())) return true;
                                return false;
                            })
                            .findFirst()
                            .orElse(null);

                    if (matched != null) {
                        b.setGuestRegistrationId(matched.getId());
                        bookingRepository.save(b);
                        healedCount++;
                    }
                }
            }

            // Also hide orphaned/superseded SV- draft registrations if a real online registration exists
            for (GuestRegistration draft : allG) {
                if (draft.getPassportNumber() != null && draft.getPassportNumber().startsWith("SV-")) {
                    String cleanPass = draft.getPassportNumber().replaceFirst("(?i)^SV-?", "").trim().toLowerCase();
                    boolean hasReal = allG.stream().anyMatch(real -> 
                        real.getId() != null && !real.getId().equals(draft.getId()) &&
                        real.getPassportNumber() != null && !real.getPassportNumber().startsWith("SV-") &&
                        ((!cleanPass.isEmpty() && cleanPass.equalsIgnoreCase(real.getPassportNumber().trim())) ||
                         (real.getGuestName() != null && draft.getGuestName() != null && 
                          real.getGuestName().trim().equalsIgnoreCase(draft.getGuestName().trim()) &&
                          real.getCheckInDate() != null && draft.getCheckInDate() != null &&
                          real.getCheckInDate().equals(draft.getCheckInDate())))
                    );
                    if (hasReal && (draft.getIsHiddenFromFrontOffice() == null || !draft.getIsHiddenFromFrontOffice())) {
                        draft.setHiddenFromFrontOffice(true);
                        guestRegistrationRepository.save(draft);
                        healedCount++;
                    }
                }
            }

            if (healedCount > 0) {
                System.out.println(">>> Healed " + healedCount + " booking room allocations and registration links <<<");
            }
        } catch (Exception e) {
            System.err.println("Booking-registration healing note: " + e.getMessage());
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

        // Seed default Front Officer user if it doesn't exist
        if (userRepository.findByUsername("frontoffice1@serene.com").isEmpty()) {
            User fo = new User();
            fo.setUsername("frontoffice1@serene.com");
            fo.setPassword("frontoffice123");
            fo.setRole(Role.FRONT_OFFICER);
            fo.setPropertyId(1L);
            fo.setActive(true);
            userRepository.save(fo);
            System.out.println(">>> Front Office user successfully seeded into database (frontoffice1@serene.com / frontoffice123) <<<");
        }
    }
}
