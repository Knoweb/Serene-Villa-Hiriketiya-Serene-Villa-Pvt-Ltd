package com.serenevilla.pms.service;

import com.serenevilla.pms.dto.AccountantDashboardStatsDTO;
import com.serenevilla.pms.model.Booking;
import com.serenevilla.pms.model.DiscountRequest;
import com.serenevilla.pms.model.GuestRegistration;
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
        if (!distribution.containsKey("Airbnb")) distribution.put("Airbnb", 0L);
        if (!distribution.containsKey("Walk-in")) distribution.put("Walk-in", 0L);

        stats.setBookingTypeDistribution(distribution);

        return stats;
    }
}
