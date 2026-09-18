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
import java.time.LocalDate;
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

        // Fetch all bookings for property
        List<Booking> bookings = propertyId != null ? 
                bookingRepository.findByPropertyId(propertyId) : 
                bookingRepository.findAll();
        
        // Exclude internal sub-records like /DISC, /EXTRA, /ROOM if needed, or count parent bookings
        List<Booking> validBookings = bookings.stream()
                .filter(b -> b.getBookingNumber() != null && !b.getBookingNumber().contains("/DISC"))
                .collect(Collectors.toList());

        // 1. Total Revenue: Sum of payment amountLkr for the property, fallback to confirmed bookings if payments are 0
        List<Payment> allPayments = paymentRepository.findAll();
        List<Payment> propertyPayments = allPayments.stream()
                .filter(p -> propertyId == null || p.getPropertyId() == null || propertyId.equals(p.getPropertyId()) || (propertyId.equals(1L) && p.getPropertyId() == null))
                .collect(Collectors.toList());

        double totalPaymentRev = propertyPayments.stream()
                .mapToDouble(Payment::getAmountLkr)
                .sum();

        double totalBookingRev = 0.0;
        for (Booking b : validBookings) {
            if (b.getTotalAmount() != null && b.getTotalAmount() > 0) {
                double exRate = 1.0;
                try {
                    if (b.getExchangeRate() != null && !b.getExchangeRate().trim().isEmpty()) {
                        exRate = Double.parseDouble(b.getExchangeRate().trim());
                    }
                } catch (Exception ignored) {}
                if (exRate <= 0) exRate = 1.0;

                String curr = b.getCurrency() != null ? b.getCurrency().trim().toUpperCase() : "LKR";
                double bookingLkr = "LKR".equals(curr) ? b.getTotalAmount() : (b.getTotalAmount() * exRate);
                totalBookingRev += bookingLkr;
            }
        }

        double finalRevenue = totalPaymentRev > 0 ? totalPaymentRev : totalBookingRev;
        stats.setTotalRevenue(BigDecimal.valueOf(finalRevenue).setScale(2, RoundingMode.HALF_UP));

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

    public com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO getRoomFinancialAnalytics(Long roomId, Long propertyId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
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
                .filter(b -> {
                    if (startDate == null || endDate == null) return true;
                    LocalDate bCheckIn = b.getCheckInDate();
                    LocalDate bCheckOut = b.getCheckOutDate();
                    if (bCheckIn == null && bCheckOut == null) return true;
                    if (bCheckIn != null && !bCheckIn.isAfter(endDate)) {
                        return bCheckOut == null || !bCheckOut.isBefore(startDate);
                    }
                    return false;
                })
                .collect(Collectors.toList());

        Set<Long> bookingIds = roomBookings.stream().map(Booking::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> regIds = roomBookings.stream().map(Booking::getGuestRegistrationId).filter(Objects::nonNull).collect(Collectors.toSet());

        // 2. Fetch Handed Over (ACCEPTED) payments for this property within period
        List<Payment> allPayments = paymentRepository.findAll();
        List<Payment> acceptedPayments = allPayments.stream()
                .filter(p -> p.getAccountantTransferStatus() == com.serenevilla.pms.model.AccountantTransferStatus.ACCEPTED)
                .filter(p -> targetPropertyId == null || p.getPropertyId() == null || targetPropertyId.equals(p.getPropertyId()) || (targetPropertyId.equals(1L) && p.getPropertyId() == null))
                .filter(p -> {
                    if (startDate == null || endDate == null) return true;
                    LocalDate pDate = p.getPaymentDate();
                    return pDate == null || (!pDate.isBefore(startDate) && !pDate.isAfter(endDate));
                })
                .collect(Collectors.toList());

        // Filter payments matching this room's bookings or registrations
        List<Payment> roomPayments = acceptedPayments.stream()
                .filter(p -> (p.getBookingId() != null && bookingIds.contains(p.getBookingId())) ||
                             (p.getGuestRegistrationId() != null && regIds.contains(p.getGuestRegistrationId())))
                .collect(Collectors.toList());

        // If no accepted handover payments yet, include all payments recorded for this room in period
        if (roomPayments.isEmpty()) {
            roomPayments = allPayments.stream()
                    .filter(p -> targetPropertyId == null || p.getPropertyId() == null || targetPropertyId.equals(p.getPropertyId()) || (targetPropertyId.equals(1L) && p.getPropertyId() == null))
                    .filter(p -> {
                        if (startDate == null || endDate == null) return true;
                        LocalDate pDate = p.getPaymentDate();
                        return pDate == null || (!pDate.isBefore(startDate) && !pDate.isAfter(endDate));
                    })
                    .filter(p -> (p.getBookingId() != null && bookingIds.contains(p.getBookingId())) ||
                                 (p.getGuestRegistrationId() != null && regIds.contains(p.getGuestRegistrationId())))
                    .collect(Collectors.toList());
        }

        double cashTotal = 0.0;
        double cardTotal = 0.0;
        double bankTotal = 0.0;
        List<com.serenevilla.pms.dto.RoomBookingTransactionDTO> txList = new ArrayList<>();

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

            // Add transaction item
            com.serenevilla.pms.dto.RoomBookingTransactionDTO tx = new com.serenevilla.pms.dto.RoomBookingTransactionDTO();
            tx.setId(p.getId());
            tx.setBookingRef(p.getBookingRef() != null ? p.getBookingRef() : ("PAY-" + p.getId()));
            tx.setGuestName(p.getGuestName() != null ? p.getGuestName() : "Guest");
            tx.setPaymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod() : "Cash");
            tx.setAmount(BigDecimal.valueOf(p.getAmountInCurrency() > 0 ? p.getAmountInCurrency() : p.getAmountLkr()).setScale(2, RoundingMode.HALF_UP));
            tx.setCurrency(p.getCurrency() != null ? p.getCurrency() : "LKR");
            tx.setAmountLkr(BigDecimal.valueOf(p.getAmountLkr()).setScale(2, RoundingMode.HALF_UP));
            tx.setStatus(p.getAccountantTransferStatus() != null ? p.getAccountantTransferStatus().name() : "NONE");
            tx.setDate(p.getPaymentDate() != null ? p.getPaymentDate().toString() : "");
            txList.add(tx);
        }

        // If still no payment records but room has bookings with amount, allocate from booking amounts
        if ((cashTotal + cardTotal + bankTotal) == 0.0 && !roomBookings.isEmpty()) {
            for (Booking b : roomBookings) {
                if (b.getTotalAmount() != null && b.getTotalAmount() > 0) {
                    double exRate = 1.0;
                    try {
                        if (b.getExchangeRate() != null && !b.getExchangeRate().trim().isEmpty()) {
                            exRate = Double.parseDouble(b.getExchangeRate().trim());
                        }
                    } catch (Exception ignored) {}
                    if (exRate <= 0) exRate = 1.0;
                    String curr = b.getCurrency() != null ? b.getCurrency().trim().toUpperCase() : "LKR";
                    double bookingLkr = "LKR".equals(curr) ? b.getTotalAmount() : (b.getTotalAmount() * exRate);
                    
                    String bType = b.getBookingType() != null ? b.getBookingType().toUpperCase() : "";
                    String pMethod = "Cash";
                    if (bType.contains("AIRBNB") || bType.contains("BOOKING")) {
                        cardTotal += bookingLkr;
                        pMethod = "Card / OTA";
                    } else {
                        cashTotal += bookingLkr;
                    }

                    com.serenevilla.pms.dto.RoomBookingTransactionDTO tx = new com.serenevilla.pms.dto.RoomBookingTransactionDTO();
                    tx.setId(b.getId());
                    tx.setBookingRef(b.getBookingNumber() != null ? b.getBookingNumber() : ("B-" + b.getId()));
                    tx.setGuestName(b.getGuestName() != null ? b.getGuestName() : "Guest");
                    tx.setCheckInDate(b.getCheckInDate() != null ? b.getCheckInDate().toString() : "-");
                    tx.setCheckOutDate(b.getCheckOutDate() != null ? b.getCheckOutDate().toString() : "-");
                    tx.setNights(b.getNumberOfNights() != null ? b.getNumberOfNights() : 1);
                    tx.setBookingType(b.getBookingType() != null ? b.getBookingType() : "Direct");
                    tx.setPaymentMethod(pMethod);
                    tx.setAmount(BigDecimal.valueOf(b.getTotalAmount()).setScale(2, RoundingMode.HALF_UP));
                    tx.setCurrency(curr);
                    tx.setAmountLkr(BigDecimal.valueOf(bookingLkr).setScale(2, RoundingMode.HALF_UP));
                    tx.setStatus("CONFIRMED");
                    tx.setDate(b.getCheckInDate() != null ? b.getCheckInDate().toString() : "");
                    txList.add(tx);
                }
            }
        }

        double totalRevenue = cashTotal + cardTotal + bankTotal;
        dto.setTotalAmount(BigDecimal.valueOf(totalRevenue).setScale(2, RoundingMode.HALF_UP));
        dto.setCashAmount(BigDecimal.valueOf(cashTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setCardAmount(BigDecimal.valueOf(cardTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setBankTransferAmount(BigDecimal.valueOf(bankTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setTransactions(txList);

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

    public List<com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO> getAllRoomsFinancialAnalytics(Long propertyId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        List<com.serenevilla.pms.model.Room> rooms = (propertyId != null) ?
                roomRepository.findByPropertyId(propertyId) :
                roomRepository.findAll();

        List<com.serenevilla.pms.dto.RoomFinancialAnalyticsDTO> list = new ArrayList<>();
        for (com.serenevilla.pms.model.Room room : rooms) {
            if (room.getId() != null) {
                list.add(getRoomFinancialAnalytics(room.getId(), propertyId, startDate, endDate));
            }
        }
        return list;
    }
}
