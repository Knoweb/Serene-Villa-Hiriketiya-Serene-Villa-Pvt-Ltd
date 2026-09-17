package com.serenevilla.pms.service;

import com.serenevilla.pms.dto.AccountantDashboardStatsDTO;
import com.serenevilla.pms.model.Booking;
import com.serenevilla.pms.model.DiscountRequest;
import com.serenevilla.pms.model.GuestRegistration;
import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.repository.BookingRepository;
import com.serenevilla.pms.repository.DiscountRequestRepository;
import com.serenevilla.pms.repository.GuestRegistrationRepository;
import com.serenevilla.pms.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @Autowired
    private DiscountRequestRepository discountRequestRepository;

    public AccountantDashboardStatsDTO getAccountantDashboardStats(Long propertyId) {
        AccountantDashboardStatsDTO stats = new AccountantDashboardStatsDTO();

        // 1. Total Revenue: Sum of payment amountLkr for the property
        Double totalRev = paymentRepository.sumTotalRevenueByPropertyId(propertyId);
        stats.setTotalRevenue(totalRev != null ? BigDecimal.valueOf(totalRev).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

        // Fetch all bookings for property
        List<Booking> bookings = propertyId != null ? 
                bookingRepository.findByPropertyId(propertyId) : 
                bookingRepository.findAll();
        
        // Exclude internal sub-records like /DISC, /EXTRA, /ROOM if needed, or count parent bookings
        List<Booking> validBookings = bookings.stream()
                .filter(b -> b.getBookingNumber() != null && !b.getBookingNumber().contains("/DISC"))
                .collect(Collectors.toList());

        // 2. Total Bookings
        stats.setTotalBookings((long) validBookings.size());

        // 3. Total Nights: Calculated across GuestRegistrations or Bookings checkIn/checkOut
        List<GuestRegistration> registrations = propertyId != null ? 
                guestRegistrationRepository.findByPropertyId(propertyId) : 
                guestRegistrationRepository.findAll();
        
        Map<Long, GuestRegistration> regMap = registrations.stream()
                .collect(Collectors.toMap(GuestRegistration::getId, r -> r, (r1, r2) -> r1));

        long totalNights = 0L;
        for (Booking b : validBookings) {
            if (b.getCheckInDate() != null && b.getCheckOutDate() != null) {
                long days = ChronoUnit.DAYS.between(b.getCheckInDate(), b.getCheckOutDate());
                totalNights += Math.max(1, days);
            } else if (b.getGuestRegistrationId() != null) {
                GuestRegistration reg = regMap.get(b.getGuestRegistrationId());
                if (reg != null && reg.getCheckInDate() != null && reg.getCheckOutDate() != null) {
                    long days = ChronoUnit.DAYS.between(reg.getCheckInDate(), reg.getCheckOutDate());
                    totalNights += Math.max(1, days);
                } else if (reg != null && reg.getNumberOfNights() != null) {
                    totalNights += reg.getNumberOfNights();
                }
            }
        }
        stats.setTotalNights(totalNights);

        // 4. Total Discounts: Sum of all approved discount requests for property
        List<DiscountRequest> discounts = (propertyId != null) ?
                discountRequestRepository.findByPropertyIdAndStatusOrderByRequestedAtDesc(propertyId, "Approved") :
                discountRequestRepository.findByStatusOrderByRequestedAtDesc("Approved");

        double sumDiscounts = 0.0;
        for (DiscountRequest d : discounts) {
            if (d.getDiscountAmount() > 0) {
                sumDiscounts += d.getDiscountAmount();
            } else if (d.getRequestedDiscount() != null) {
                try {
                    String clean = d.getRequestedDiscount().replaceAll("[^\\d.]", "");
                    if (!clean.isEmpty()) {
                        sumDiscounts += Double.parseDouble(clean);
                    }
                } catch (Exception ignored) {}
            }
        }
        stats.setTotalDiscounts(BigDecimal.valueOf(sumDiscounts).setScale(2, RoundingMode.HALF_UP));

        // 5. Booking Type Distribution (Direct, Booking.com, Airbnb, Walk-in, etc.)
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (Booking b : validBookings) {
            String type = b.getBookingType();
            if (type == null || type.trim().isEmpty()) {
                type = "Direct";
            } else {
                type = type.trim();
            }
            distribution.put(type, distribution.getOrDefault(type, 0L) + 1L);
        }

        // Ensure common types exist for clean chart display even if 0
        if (!distribution.containsKey("Direct")) distribution.put("Direct", 0L);
        if (!distribution.containsKey("Booking.com")) distribution.put("Booking.com", 0L);
        stats.setBookingTypeDistribution(distribution);

        return stats;
    }

    @Autowired
    private com.serenevilla.pms.repository.RoomRepository roomRepository;

    public com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO getRoomFinancialAnalytics(Long roomId, Long propertyId) {
        com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO dto = new com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO();
        dto.setRoomId(roomId);

        // Fetch room info
        Optional<com.serenevilla.pms.model.Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return dto;
        }
        com.serenevilla.pms.model.Room room = roomOpt.get();
        dto.setRoomNumber(room.getRoomNumber());
        dto.setRoomType(room.getRoomType());

        Long targetPropertyId = (propertyId != null) ? propertyId : room.getPropertyId();

        // 1. Find all bookings allocated to this room (by roomNumber and propertyId)
        List<Booking> allBookings = (targetPropertyId != null) ?
                bookingRepository.findByPropertyId(targetPropertyId) :
                bookingRepository.findAll();

        String targetRoomNum = room.getRoomNumber() != null ? room.getRoomNumber().trim() : "";
        List<Booking> roomBookings = allBookings.stream()
                .filter(b -> b.getRoomNumber() != null && b.getRoomNumber().trim().equalsIgnoreCase(targetRoomNum))
                .collect(Collectors.toList());

        Set<Long> bookingIds = roomBookings.stream().map(Booking::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> regIds = roomBookings.stream().map(Booking::getGuestRegistrationId).filter(Objects::nonNull).collect(Collectors.toSet());

        // 2. Fetch Handed Over (ACCEPTED) payments for this property
        List<Payment> acceptedPayments = (targetPropertyId != null) ?
                paymentRepository.findByPropertyIdAndAccountantTransferStatus(targetPropertyId, com.serenevilla.pms.model.AccountantTransferStatus.ACCEPTED) :
                paymentRepository.findByAccountantTransferStatus(com.serenevilla.pms.model.AccountantTransferStatus.ACCEPTED);

        // Filter payments matching this room's bookings or registrations
        List<Payment> roomPayments = acceptedPayments.stream()
                .filter(p -> (p.getBookingId() != null && bookingIds.contains(p.getBookingId())) ||
                             (p.getGuestRegistrationId() != null && regIds.contains(p.getGuestRegistrationId())))
                .collect(Collectors.toList());

        double cashTotal = 0.0;
        double cardTotal = 0.0;
        double bankTotal = 0.0;

        for (Payment p : roomPayments) {
            double amt = p.getAmountLkr();
            String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase() : "";

            if (method.contains("CASH")) {
                cashTotal += amt;
            } else if (method.contains("CARD")) {
                cardTotal += amt;
            } else if (method.contains("BANK") || method.contains("TRANSFER")) {
                bankTotal += amt;
            } else {
                cashTotal += amt; // Default to cash if unspecified
            }
        }

        double totalRevenue = cashTotal + cardTotal + bankTotal;
        dto.setTotalAmount(BigDecimal.valueOf(totalRevenue).setScale(2, RoundingMode.HALF_UP));
        dto.setCashAmount(BigDecimal.valueOf(cashTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setCardAmount(BigDecimal.valueOf(cardTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setBankTransferAmount(BigDecimal.valueOf(bankTotal).setScale(2, RoundingMode.HALF_UP));

        // 3. Occupancy Metrics (Total Nights, Adults, Children)
        List<GuestRegistration> registrations = (targetPropertyId != null) ?
                guestRegistrationRepository.findByPropertyId(targetPropertyId) :
                guestRegistrationRepository.findAll();

        Map<Long, GuestRegistration> regMap = registrations.stream()
                .collect(Collectors.toMap(GuestRegistration::getId, r -> r, (r1, r2) -> r1));

        int totalNights = 0;
        int totalAdults = 0;
        int totalChildren = 0;
        Set<Long> processedRegIds = new HashSet<>();

        for (Booking b : roomBookings) {
            // Nights calculation
            if (b.getCheckInDate() != null && b.getCheckOutDate() != null) {
                long days = ChronoUnit.DAYS.between(b.getCheckInDate(), b.getCheckOutDate());
                totalNights += (int) Math.max(1, days);
            } else if (b.getGuestRegistrationId() != null && regMap.containsKey(b.getGuestRegistrationId())) {
                GuestRegistration reg = regMap.get(b.getGuestRegistrationId());
                if (reg.getCheckInDate() != null && reg.getCheckOutDate() != null) {
                    long days = ChronoUnit.DAYS.between(reg.getCheckInDate(), reg.getCheckOutDate());
                    totalNights += (int) Math.max(1, days);
                } else if (reg.getNumberOfNights() != null) {
                    totalNights += reg.getNumberOfNights();
                }
            }

            // Guests count
            if (b.getGuestRegistrationId() != null && !processedRegIds.contains(b.getGuestRegistrationId())) {
                processedRegIds.add(b.getGuestRegistrationId());
                GuestRegistration reg = regMap.get(b.getGuestRegistrationId());
                if (reg != null) {
                    if (reg.getAdults() != null) totalAdults += reg.getAdults();
                    if (reg.getChildren() != null) totalChildren += reg.getChildren();
                }
            }
        }

        dto.setTotalNights(totalNights);
        dto.setTotalAdults(totalAdults);
        dto.setTotalChildren(totalChildren);

        return dto;
    }
}
