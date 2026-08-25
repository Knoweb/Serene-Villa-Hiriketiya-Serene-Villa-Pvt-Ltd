package com.serenevilla.pms.service;

import com.serenevilla.pms.model.Booking;
import com.serenevilla.pms.model.GuestRegistration;
import com.serenevilla.pms.repository.BookingRepository;
import com.serenevilla.pms.repository.GuestRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import com.serenevilla.pms.handler.RegistrationWebSocketHandler;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import com.serenevilla.pms.repository.PaymentRepository;
import com.serenevilla.pms.model.Payment;
import java.util.List;

@Service
public class GuestRegistrationService {

    @Autowired
    private RegistrationWebSocketHandler webSocketHandler;

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private com.serenevilla.pms.repository.RoomRepository roomRepository;



    public GuestRegistration createPublicRegistration(GuestRegistration registration) {
        if (registration.getGuestName() == null || registration.getGuestName().trim().isEmpty()) {
            registration.setGuestName("Guest");
        }
        if (registration.getPassportNumber() == null || registration.getPassportNumber().trim().isEmpty()) {
            registration.setPassportNumber("SV-" + System.currentTimeMillis());
        }
        if (registration.getWhatsappNumber() == null || registration.getWhatsappNumber().trim().isEmpty()) {
            registration.setWhatsappNumber("N/A");
        }
        if (registration.getNationality() == null || registration.getNationality().trim().isEmpty()) {
            registration.setNationality(registration.getCountry() != null && !registration.getCountry().isEmpty() ? registration.getCountry() : "Other");
        }
        if (registration.getCountry() == null || registration.getCountry().trim().isEmpty()) {
            registration.setCountry(registration.getNationality());
        }

        // Calculate nights
        if (registration.getCheckInDate() != null && registration.getCheckOutDate() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(registration.getCheckInDate(), registration.getCheckOutDate());
            registration.setNumberOfNights((int) Math.max(1, days));
        } else {
            registration.setNumberOfNights(1);
        }
        registration.setPaymentStatus("Confirm");
        registration.setRegistrationStatus("Pending");
        registration.setHiddenFromFrontOffice(false);
        if (registration.getCreatedBy() == null || registration.getCreatedBy().isEmpty()) {
            registration.setCreatedBy("Public QR Code");
        }

        GuestRegistration saved = guestRegistrationRepository.save(registration);
        webSocketHandler.broadcast("update");
        return saved;
    }

    public Page<GuestRegistration> searchRegistrations(String search, String status, String role, String source, int page, int size) {
        // Show hidden only if admin
        boolean showHidden = "ADMIN".equalsIgnoreCase(role);
        
        // Latest registrations first
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<GuestRegistration> result = guestRegistrationRepository.searchRegistrations(search, status, showHidden, source, pageable);

        // Dynamically recalculate paymentStatus for FRONT_OFFICER based on visible payments
        if ("FRONT_OFFICER".equalsIgnoreCase(role)) {
            result = result.map(reg -> {
                try {
                    List<Booking> bookings = bookingRepository.findByGuestRegistrationId(reg.getId());
                    if (bookings == null || bookings.isEmpty()) {
                        if (reg.getGuestName() != null && !reg.getGuestName().trim().isEmpty()) {
                            String gName = reg.getGuestName().replaceAll("^(?i)(mr|mrs|ms|dr|prof)\\.?\\s*", "").trim();
                            List<Booking> nameMatches = bookingRepository.findAll().stream()
                                    .filter(b -> b.getGuestName() != null && b.getGuestName().replaceAll("^(?i)(mr|mrs|ms|dr|prof)\\.?\\s*", "").trim().equalsIgnoreCase(gName))
                                    .toList();
                            if (!nameMatches.isEmpty()) {
                                Booking bToLink = nameMatches.get(nameMatches.size() - 1);
                                bToLink.setGuestRegistrationId(reg.getId());
                                bookingRepository.save(bToLink);
                                bookings = java.util.List.of(bToLink);
                            }
                        }
                    }

                    if (bookings != null && !bookings.isEmpty()) {
                        Booking booking = bookings.get(bookings.size() - 1);
                        List<Payment> allPayments = paymentRepository.findByBookingId(booking.getId());
                        if (allPayments != null) {
                            // Filter out hidden payments
                            List<Payment> visiblePayments = allPayments.stream()
                                    .filter(p -> p != null && (p.getIsHiddenFromFrontOffice() == null || !p.getIsHiddenFromFrontOffice()))
                                    .toList();
                            
                            double totalPaidLkr = visiblePayments.stream()
                                    .mapToDouble(p -> p.getConvertedAmountLkr() != null ? p.getConvertedAmountLkr() : p.getAmountLkr())
                                    .sum();
                            
                            double totalAmt = booking.getTotalAmount();
                            String bCurr = booking.getCurrency() != null ? booking.getCurrency().toUpperCase() : "USD";
                            double exRate = 1.0;
                            try {
                                if (booking.getExchangeRate() != null && !booking.getExchangeRate().trim().isEmpty()) {
                                    exRate = Double.parseDouble(booking.getExchangeRate().trim());
                                }
                            } catch (Exception ignored) {}
                            if (exRate <= 0) exRate = 335.0;

                            double totalBookingAmtLkr = "LKR".equals(bCurr) ? totalAmt : (totalAmt * exRate);

                            String computedStatus = "Unpaid";
                            if (totalBookingAmtLkr > 0 && totalPaidLkr >= (totalBookingAmtLkr - 10.0)) {
                                computedStatus = "Paid";
                            } else if (totalPaidLkr > 0) {
                                computedStatus = "Paid Advance";
                            }
                            reg.setPaymentStatus(computedStatus);
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
                return reg;
            });
        }

        // Return lightweight entities for listing, stripping heavy passport Base64 image payloads
        return result.map(reg -> {
            reg.setPassportFrontPath(null);
            reg.setPassportBackPath(null);
            return reg;
        });
    }

    public Optional<GuestRegistration> getRegistrationById(Long id) {
        return guestRegistrationRepository.findById(id);
    }

    public Optional<GuestRegistration> setVisibility(Long id, boolean hide) {
        return guestRegistrationRepository.findById(id).map(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            GuestRegistration saved = guestRegistrationRepository.save(reg);
            webSocketHandler.broadcast("update");
            return saved;
        });
    }

    public Optional<GuestRegistration> updateBookingDetails(Long id, Map<String, Object> details) {
        return guestRegistrationRepository.findById(id).map(reg -> {
            // Update status on registration
            if (details.containsKey("paymentStatus")) {
                reg.setPaymentStatus((String) details.get("paymentStatus"));
            }
            if (details.containsKey("registrationStatus")) {
                reg.setRegistrationStatus((String) details.get("registrationStatus"));
            }
            if (details.containsKey("checkInDate") && details.get("checkInDate") != null) {
                reg.setCheckInDate(LocalDate.parse((String) details.get("checkInDate")));
            }
            if (details.containsKey("checkOutDate") && details.get("checkOutDate") != null) {
                reg.setCheckOutDate(LocalDate.parse((String) details.get("checkOutDate")));
            }
            if (details.containsKey("numberOfNights") && details.get("numberOfNights") != null) {
                Object nightsVal = details.get("numberOfNights");
                if (nightsVal instanceof Number) {
                    reg.setNumberOfNights(((Number) nightsVal).intValue());
                } else if (nightsVal instanceof String) {
                    reg.setNumberOfNights(Integer.parseInt((String) nightsVal));
                }
            } else if (reg.getCheckInDate() != null && reg.getCheckOutDate() != null) {
                long days = reg.getCheckInDate().datesUntil(reg.getCheckOutDate()).count();
                reg.setNumberOfNights((int) days);
            }
            if (details.containsKey("guestName") && details.get("guestName") != null) {
                reg.setGuestName((String) details.get("guestName"));
            }
            if (details.containsKey("whatsappNumber") && details.get("whatsappNumber") != null) {
                reg.setWhatsAppNumber((String) details.get("whatsappNumber"));
            }
            if (details.containsKey("adults") && details.get("adults") != null) {
                Object adultsVal = details.get("adults");
                if (adultsVal instanceof Number) {
                    reg.setAdults(((Number) adultsVal).intValue());
                } else if (adultsVal instanceof String) {
                    reg.setAdults(Integer.parseInt((String) adultsVal));
                }
            }
            if (details.containsKey("children") && details.get("children") != null) {
                Object childrenVal = details.get("children");
                if (childrenVal instanceof Number) {
                    reg.setChildren(((Number) childrenVal).intValue());
                } else if (childrenVal instanceof String) {
                    reg.setChildren(Integer.parseInt((String) childrenVal));
                }
            }
            if (details.containsKey("passportFrontPath") && details.get("passportFrontPath") != null) {
                reg.setPassportFrontPath((String) details.get("passportFrontPath"));
            }
            if (details.containsKey("guestPhotoPath") && details.get("guestPhotoPath") != null) {
                reg.setGuestPhotoPath((String) details.get("guestPhotoPath"));
            }

            GuestRegistration savedReg = guestRegistrationRepository.save(reg);

            // Find or create associated booking with smart matching
            List<Booking> candidates = bookingRepository.findAll().stream()
                    .filter(b -> (b.getGuestRegistrationId() != null && b.getGuestRegistrationId().equals(id))
                              || (details.containsKey("bookingNumber") && details.get("bookingNumber") != null && b.getBookingNumber() != null && b.getBookingNumber().equalsIgnoreCase(String.valueOf(details.get("bookingNumber")).trim()))
                              || (savedReg.getGuestName() != null && b.getGuestName() != null && b.getGuestName().trim().equalsIgnoreCase(savedReg.getGuestName().trim())))
                    .sorted((a, b) -> {
                        boolean aIsReal = a.getBookingNumber() != null && (a.getBookingNumber().startsWith("D-789") || (!a.getBookingNumber().startsWith("D-10") && !a.getBookingNumber().startsWith("D-11")));
                        boolean bIsReal = b.getBookingNumber() != null && (b.getBookingNumber().startsWith("D-789") || (!b.getBookingNumber().startsWith("D-10") && !b.getBookingNumber().startsWith("D-11")));
                        if (aIsReal && !bIsReal) return -1;
                        if (!aIsReal && bIsReal) return 1;
                        return (int) (b.getId() - a.getId());
                    })
                    .toList();

            Booking booking = candidates.isEmpty() ? null : candidates.get(0);
            if (booking == null) {
                booking = new Booking();
                booking.setStatus("Confirmed");
                booking.setPropertyId(1L);
            }

            booking.setGuestRegistrationId(id);

            if (details.containsKey("roomType")) {
                String rt = (String) details.get("roomType");
                if (rt != null && !rt.trim().isEmpty()) {
                    booking.setRoomType(rt);
                }
            }
            if (details.containsKey("room")) {
                String rm = (String) details.get("room");
                if (rm != null && !rm.trim().isEmpty()) {
                    booking.setRoomNumber(rm);
                }
            }
            if (details.containsKey("bookingType")) {
                booking.setBookingType((String) details.get("bookingType"));
            }
            if (details.containsKey("bookingNumber")) {
                String newBNum = (String) details.get("bookingNumber");
                // Do not overwrite real reservation numbers (e.g. D-78920xx) with synthetic D-1xxx draft numbers
                if (newBNum != null && !newBNum.trim().isEmpty()) {
                    boolean existingIsReal = booking.getBookingNumber() != null && !booking.getBookingNumber().startsWith("D-10") && !booking.getBookingNumber().startsWith("D-11");
                    boolean incomingIsSynthetic = newBNum.startsWith("D-10") || newBNum.startsWith("D-11");
                    if (!existingIsReal || !incomingIsSynthetic) {
                        booking.setBookingNumber(newBNum);
                    }
                }
            }
            if (details.containsKey("boardBasis")) {
                booking.setBoardBasis((String) details.get("boardBasis"));
            }
            if (details.containsKey("remarks")) {
                booking.setRemarks((String) details.get("remarks"));
            }
            if (details.containsKey("amount")) {
                Object amountVal = details.get("amount");
                if (amountVal instanceof Number) {
                    booking.setTotalAmount(((Number) amountVal).doubleValue());
                } else if (amountVal instanceof String) {
                    booking.setTotalAmount(Double.parseDouble((String) amountVal));
                }
            }
            if (details.containsKey("currency") && details.get("currency") != null) {
                booking.setCurrency((String) details.get("currency"));
            }
            if (details.containsKey("exchangeRate") && details.get("exchangeRate") != null) {
                booking.setExchangeRate(String.valueOf(details.get("exchangeRate")));
            }
            if (details.containsKey("unitPrice") && details.get("unitPrice") != null) {
                Object up = details.get("unitPrice");
                if (up instanceof Number) booking.setUnitPrice(((Number) up).doubleValue());
                else if (up instanceof String && !((String) up).trim().isEmpty()) booking.setUnitPrice(Double.parseDouble((String) up));
            }
            if (details.containsKey("roomPrices") && details.get("roomPrices") != null) {
                booking.setRoomPrices(String.valueOf(details.get("roomPrices")));
            }
            if (details.containsKey("guestName") && details.get("guestName") != null) {
                booking.setGuestName((String) details.get("guestName"));
            }

            bookingRepository.save(booking);

            // Automatic Room Status Release/Update based on Registration Status
            String regStatus = savedReg.getRegistrationStatus();
            String allocatedRoomNumber = booking.getRoomNumber();
            if (allocatedRoomNumber != null && !allocatedRoomNumber.trim().isEmpty()) {
                roomRepository.findByRoomNumber(allocatedRoomNumber.trim()).ifPresent(room -> {
                    if ("CheckedOut".equalsIgnoreCase(regStatus) || "Cancelled".equalsIgnoreCase(regStatus)) {
                        room.setStatus("Available");
                        roomRepository.save(room);
                    } else if ("CheckedIn".equalsIgnoreCase(regStatus)) {
                        room.setStatus("Occupied");
                        roomRepository.save(room);
                    }
                });
            }

            webSocketHandler.broadcast("update");
            return savedReg;
        });
    }

    public void hideByPaymentMethod(String method, boolean hide) {
        List<Booking> bookingsWithMethod = bookingRepository.findAll().stream()
                .filter(b -> {
                    List<Payment> payments = paymentRepository.findByBookingId(b.getId());
                    return payments.stream().anyMatch(p -> method.equalsIgnoreCase(p.getPaymentMethod()));
                })
                .toList();
                
        List<Long> regIds = bookingsWithMethod.stream()
                .map(Booking::getGuestRegistrationId)
                .filter(java.util.Objects::nonNull)
                .toList();
                
        guestRegistrationRepository.findAllById(regIds).forEach(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            guestRegistrationRepository.save(reg);
        });
        
        webSocketHandler.broadcast("update");
    }

    public void hideAllRegistrations(boolean hide) {
        guestRegistrationRepository.findAll().forEach(reg -> {
            reg.setHiddenFromFrontOffice(hide);
            guestRegistrationRepository.save(reg);
        });
        webSocketHandler.broadcast("update");
    }

    public Optional<Map<String, Object>> findReservationForPublicCheckIn(String bookingNumber, String passportNumber) {
        if (bookingNumber != null && !bookingNumber.trim().isEmpty()) {
            String trimmedNum = bookingNumber.trim();
            
            // 1. Try exact case-insensitive match first (e.g. D-4562358 or W-4562358)
            Optional<Booking> bookingOpt = bookingRepository.findByBookingNumber(trimmedNum);
            if (bookingOpt.isEmpty()) {
                bookingOpt = bookingRepository.findAll().stream()
                    .filter(b -> b.getBookingNumber() != null && b.getBookingNumber().equalsIgnoreCase(trimmedNum))
                    .findFirst();
            }

            // 2. Smart fallback: If exact prefix didn't match, search by numeric part (e.g. 4562358)
            if (bookingOpt.isEmpty()) {
                String numericPart = trimmedNum.replaceAll("^[A-Za-z]+-?", "").trim();
                if (!numericPart.isEmpty()) {
                    bookingOpt = bookingRepository.findAll().stream()
                        .filter(b -> {
                            if (b.getBookingNumber() == null) return false;
                            String bNum = b.getBookingNumber();
                            String bNumeric = bNum.replaceAll("^[A-Za-z]+-?", "").trim();
                            return bNum.equalsIgnoreCase(trimmedNum) 
                                || bNum.endsWith(numericPart) 
                                || bNumeric.equalsIgnoreCase(numericPart);
                        })
                        .findFirst();
                }
            }

            if (bookingOpt.isPresent()) {
                Booking booking = bookingOpt.get();
                GuestRegistration reg = null;
                if (booking.getGuestRegistrationId() != null) {
                    reg = guestRegistrationRepository.findById(booking.getGuestRegistrationId()).orElse(null);
                }
                
                // Ensure email & country are synced if available on booking
                if (reg != null && (reg.getEmail() == null || reg.getEmail().trim().isEmpty()) && booking.getEmail() != null && !booking.getEmail().trim().isEmpty()) {
                    reg.setEmail(booking.getEmail());
                }

                Map<String, Object> result = new java.util.HashMap<>();
                result.put("booking", booking);
                if (reg != null) {
                    result.put("registration", reg);
                }
                return Optional.of(result);
            }
        } else if (passportNumber != null && !passportNumber.trim().isEmpty()) {
            List<GuestRegistration> registrations = guestRegistrationRepository.findAll().stream()
                .filter(reg -> reg.getPassportNumber() != null && reg.getPassportNumber().equalsIgnoreCase(passportNumber.trim()))
                .toList();
            if (!registrations.isEmpty()) {
                GuestRegistration latestReg = registrations.get(registrations.size() - 1);
                Optional<Booking> bookingOpt = bookingRepository.findAll().stream()
                    .filter(b -> b.getGuestRegistrationId() != null && b.getGuestRegistrationId().equals(latestReg.getId()))
                    .findFirst();
                Map<String, Object> result = new java.util.HashMap<>();
                result.put("registration", latestReg);
                bookingOpt.ifPresent(b -> result.put("booking", b));
                return Optional.of(result);
            }
        }
        return Optional.empty();
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteRegistration(Long id) {
        List<Booking> bookings = bookingRepository.findByGuestRegistrationId(id);
        if (bookings != null && !bookings.isEmpty()) {
            for (Booking booking : bookings) {
                List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
                if (payments != null) {
                    paymentRepository.deleteAll(payments);
                }
                bookingRepository.delete(booking);
            }
        }
        guestRegistrationRepository.deleteById(id);
        webSocketHandler.broadcast("update");
    }
}
