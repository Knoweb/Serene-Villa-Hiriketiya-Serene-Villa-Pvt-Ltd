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

        // 1. Total Revenue: Strictly sum of actual collected payments for the property
        List<Payment> allPayments = paymentRepository.findAll();
        List<Payment> propertyPayments = allPayments.stream()
                .filter(p -> propertyId == null || p.getPropertyId() == null || propertyId.equals(p.getPropertyId()) || (propertyId.equals(1L) && p.getPropertyId() == null))
                .collect(Collectors.toList());

        double totalPaymentRev = 0;
        double totalCardCharges = 0;
        double totalOtherCharges = 0;
        double cashRev = 0;
        double cardRev = 0;
        double bankRev = 0;

        for (Payment p : propertyPayments) {
            double pAmt = p.getAmountLkr();
            Double rateObj = p.getExchangeRate();
            double pRate = (rateObj != null && rateObj > 0) ? rateObj : 1.0;
            String pCurr = p.getCurrency() != null ? p.getCurrency().toUpperCase() : "LKR";
            String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase().trim() : "";

            totalPaymentRev += pAmt;

            if (method.contains("CASH")) {
                cashRev += pAmt;
            } else if (method.contains("CARD") || method.contains("VISA") || method.contains("MASTER") || method.contains("AMEX")) {
                cardRev += pAmt;
            } else if (method.contains("BANK") || method.contains("TRANSFER") || method.contains("ONLINE") || method.contains("PEOPLE")) {
                bankRev += pAmt;
            } else {
                cashRev += pAmt;
            }

            if (p.getRemarks() != null) {
                java.util.regex.Matcher cardFeeMatch = java.util.regex.Pattern.compile("\\[(?:Bank )?Charges: ([\\d.]+)\\]", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(p.getRemarks());
                if (cardFeeMatch.find()) {
                    try {
                        double feeRaw = Double.parseDouble(cardFeeMatch.group(1));
                        double feeLkr = "LKR".equals(pCurr) ? feeRaw : (feeRaw * pRate);
                        totalCardCharges += feeLkr;
                    } catch (Exception ignored) {}
                }

                java.util.regex.Matcher otherMatch = java.util.regex.Pattern.compile("\\[Other Charges: ([\\d.]+)\\]", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(p.getRemarks());
                if (otherMatch.find()) {
                    try {
                        double otherRaw = Double.parseDouble(otherMatch.group(1));
                        double otherLkr = "LKR".equals(pCurr) ? otherRaw : (otherRaw * pRate);
                        totalOtherCharges += otherLkr;
                    } catch (Exception ignored) {}
                }
            }
        }

        // Calculate Extra Night and Extra Person revenue from bookings
        double extraNightsRev = 0;
        double extraPaxRev = 0;

        for (Booking b : bookings) {
            String bNum = b.getBookingNumber() != null ? b.getBookingNumber().toUpperCase().trim() : "";
            String remarks = b.getRemarks() != null ? b.getRemarks().toUpperCase() : "";
            double amt = b.getTotalAmount() != null ? Math.abs(b.getTotalAmount()) : 0.0;
            String bCurr = b.getCurrency() != null ? b.getCurrency().toUpperCase() : "USD";
            double exRate = 1.0;
            try {
                if (b.getExchangeRate() != null && !b.getExchangeRate().trim().isEmpty()) {
                    exRate = Double.parseDouble(b.getExchangeRate().trim());
                }
            } catch (Exception ignored) {}
            if (exRate <= 0) exRate = 335.0;
            double amtLkr = "LKR".equals(bCurr) ? amt : (amt * exRate);

            if (bNum.matches(".*/\\d+N.*") || remarks.contains("EXTRA NIGHT")) {
                extraNightsRev += amtLkr;
            } else if (bNum.matches(".*/\\d+P.*") || remarks.contains("EXTRA PERSON") || remarks.contains("ONE PERSON")) {
                extraPaxRev += amtLkr;
            }
        }

        stats.setTotalRevenue(BigDecimal.valueOf(totalPaymentRev).setScale(2, RoundingMode.HALF_UP));
        stats.setTotalCardCharges(BigDecimal.valueOf(totalCardCharges).setScale(2, RoundingMode.HALF_UP));
        stats.setTotalOtherCharges(BigDecimal.valueOf(totalOtherCharges).setScale(2, RoundingMode.HALF_UP));
        stats.setNetRevenue(BigDecimal.valueOf(Math.max(0, totalPaymentRev - totalOtherCharges)).setScale(2, RoundingMode.HALF_UP));

        stats.setCashRevenue(BigDecimal.valueOf(cashRev).setScale(2, RoundingMode.HALF_UP));
        stats.setCardRevenue(BigDecimal.valueOf(cardRev).setScale(2, RoundingMode.HALF_UP));
        stats.setBankTransferRevenue(BigDecimal.valueOf(bankRev).setScale(2, RoundingMode.HALF_UP));

        stats.setExtraNightsRevenue(BigDecimal.valueOf(extraNightsRev).setScale(2, RoundingMode.HALF_UP));
        stats.setExtraPaxRevenue(BigDecimal.valueOf(extraPaxRev).setScale(2, RoundingMode.HALF_UP));
        stats.setTotalExtrasRevenue(BigDecimal.valueOf(extraNightsRev + extraPaxRev).setScale(2, RoundingMode.HALF_UP));

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

    private boolean matchesRoomNumber(String roomString, String roomPrices, String targetRoomNum) {
        if (targetRoomNum == null || targetRoomNum.trim().isEmpty()) return false;
        String cleanTarget = targetRoomNum.trim().replaceAll("[^0-9a-zA-Z]", "").toLowerCase();
        if (cleanTarget.isEmpty()) return false;

        if (roomString != null && !roomString.trim().isEmpty()) {
            String cleanString = roomString.trim().replaceAll("[^0-9a-zA-Z]", "").toLowerCase();
            if (cleanString.equals(cleanTarget)) return true;

            // Split by comma, slash, ampersand, dash, space
            String[] tokens = roomString.split("[,/&;\\s\\-]+");
            for (String t : tokens) {
                String cleanT = t.replaceAll("[^0-9a-zA-Z]", "").toLowerCase();
                if (cleanT.equals(cleanTarget)) return true;
            }
        }

        if (roomPrices != null && !roomPrices.trim().isEmpty()) {
            String rp = roomPrices.toLowerCase();
            if (rp.contains("\"" + cleanTarget + "\"") || 
                rp.contains(":" + cleanTarget) || 
                rp.contains("\"roomnumber\":\"" + targetRoomNum.toLowerCase() + "\"") ||
                rp.contains("\"roomnumber\":\"" + cleanTarget + "\"")) {
                return true;
            }
        }

        return false;
    }

    private int getRoomCountForBooking(Booking b) {
        if (b == null) return 1;
        if (b.getRoomPrices() != null && !b.getRoomPrices().trim().isEmpty()) {
            try {
                int count = 0;
                int idx = 0;
                String lower = b.getRoomPrices().toLowerCase();
                while ((idx = lower.indexOf("roomnumber", idx)) != -1) {
                    count++;
                    idx += 10;
                }
                if (count > 0) return count;
            } catch (Exception ignored) {}
        }
        if (b.getRoomNumber() != null && !b.getRoomNumber().trim().isEmpty()) {
            String[] tokens = b.getRoomNumber().split("[,/&;]+");
            if (tokens.length > 1) return tokens.length;
        }
        return 1;
    }

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

        // 1. Fetch all bookings for the property (All time) to establish room ownership
        List<Booking> allBookings = (targetPropertyId != null) ?
                bookingRepository.findByPropertyId(targetPropertyId) :
                bookingRepository.findAll();
        if (allBookings.isEmpty() && targetPropertyId != null) {
            allBookings = bookingRepository.findAll();
        }

        String targetRoomNum = room.getRoomNumber() != null ? room.getRoomNumber().trim() : "";

        // All bookings that belong to this room across all time
        List<Booking> allRoomBookings = allBookings.stream()
                .filter(b -> matchesRoomNumber(b.getRoomNumber(), b.getRoomPrices(), targetRoomNum))
                .collect(Collectors.toList());

        Map<Long, Booking> roomBookingsById = allRoomBookings.stream()
                .filter(b -> b.getId() != null)
                .collect(Collectors.toMap(Booking::getId, b -> b, (b1, b2) -> b1));

        Set<Long> allRoomBookingIds = new HashSet<>(roomBookingsById.keySet());
        Set<Long> allRoomRegIds = allRoomBookings.stream()
                .map(Booking::getGuestRegistrationId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Also fetch guest registrations to link registrations that match this room
        List<GuestRegistration> allRegistrations = (targetPropertyId != null) ?
                guestRegistrationRepository.findByPropertyId(targetPropertyId) :
                guestRegistrationRepository.findAll();

        Map<Long, GuestRegistration> regMap = allRegistrations.stream()
                .collect(Collectors.toMap(GuestRegistration::getId, r -> r, (r1, r2) -> r1));

        // Map how many distinct rooms are in each guest registration / booking so payments split equally
        Map<Long, Integer> roomsCountPerBooking = new HashMap<>();
        for (Booking b : allBookings) {
            if (b.getId() != null) {
                roomsCountPerBooking.put(b.getId(), getRoomCountForBooking(b));
            }
        }

        Map<Long, Long> roomsPerReg = allBookings.stream()
                .filter(b -> b.getGuestRegistrationId() != null && b.getRoomNumber() != null && !b.getRoomNumber().trim().isEmpty())
                .collect(Collectors.groupingBy(Booking::getGuestRegistrationId, Collectors.mapping(Booking::getRoomNumber, Collectors.toSet())))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> (long) Math.max(1, e.getValue().size())));

        // 2. Fetch payments made within the requested date period
        List<Payment> allPayments = paymentRepository.findAll();
        List<Payment> paymentsInPeriod = allPayments.stream()
                .filter(p -> targetPropertyId == null || p.getPropertyId() == null || targetPropertyId.equals(p.getPropertyId()) || (targetPropertyId.equals(1L) && p.getPropertyId() == null))
                .filter(p -> {
                    if (startDate == null || endDate == null) return true;
                    LocalDate pDate = p.getPaymentDate();
                    return pDate == null || (!pDate.isBefore(startDate) && !pDate.isAfter(endDate));
                })
                .collect(Collectors.toList());

        // Filter payments that belong to this room (via booking ID or registration ID)
        List<Payment> matchingPayments = paymentsInPeriod.stream()
                .filter(p -> (p.getBookingId() != null && allRoomBookingIds.contains(p.getBookingId())) ||
                             (p.getGuestRegistrationId() != null && allRoomRegIds.contains(p.getGuestRegistrationId())))
                .collect(Collectors.toList());

        double cashTotal = 0.0;
        double cardTotal = 0.0;
        double bankTotal = 0.0;
        List<com.serenevilla.pms.dto.RoomBookingTransactionDTO> txList = new ArrayList<>();
        Set<Long> processedPaymentBookingIds = new HashSet<>();

        for (Payment p : matchingPayments) {
            // Determine number of rooms to split payment
            long roomCount = 1L;
            if (p.getBookingId() != null && roomsCountPerBooking.containsKey(p.getBookingId())) {
                roomCount = roomsCountPerBooking.get(p.getBookingId());
            } else if (p.getGuestRegistrationId() != null && roomsPerReg.containsKey(p.getGuestRegistrationId())) {
                roomCount = roomsPerReg.get(p.getGuestRegistrationId());
            }
            if (roomCount <= 0) roomCount = 1L;

            double amt = p.getAmountLkr() / (double) roomCount;
            double amtInCurr = p.getAmountInCurrency() > 0 ? (p.getAmountInCurrency() / (double) roomCount) : amt;
            String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase() : "";

            if (method.contains("CASH")) {
                cashTotal += amt;
            } else if (method.contains("CARD") || method.contains("POS") || method.contains("VISA") || method.contains("MASTER")) {
                cardTotal += amt;
            } else if (method.contains("BANK") || method.contains("TRANSFER") || method.contains("ONLINE")) {
                bankTotal += amt;
            } else {
                cashTotal += amt; // Default to cash
            }

            if (p.getBookingId() != null) {
                processedPaymentBookingIds.add(p.getBookingId());
            }

            // Add transaction item
            com.serenevilla.pms.dto.RoomBookingTransactionDTO tx = new com.serenevilla.pms.dto.RoomBookingTransactionDTO();
            tx.setId(p.getId());
            tx.setBookingRef(p.getBookingRef() != null ? p.getBookingRef() : ("PAY-" + p.getId()));
            tx.setGuestName(p.getGuestName() != null ? p.getGuestName() : "Guest");
            tx.setPaymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod() : "Cash");
            tx.setAmount(BigDecimal.valueOf(amtInCurr).setScale(2, RoundingMode.HALF_UP));
            tx.setCurrency(p.getCurrency() != null ? p.getCurrency() : "LKR");
            tx.setAmountLkr(BigDecimal.valueOf(amt).setScale(2, RoundingMode.HALF_UP));
            tx.setStatus(p.getAccountantTransferStatus() != null ? p.getAccountantTransferStatus().name() : "CONFIRMED");
            tx.setDate(p.getPaymentDate() != null ? p.getPaymentDate().toString() : "");
            txList.add(tx);
        }

        // 3. Filter bookings active in the period for occupancy metrics
        List<Booking> bookingsInPeriod = allRoomBookings.stream()
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

        double totalRevenue = cashTotal + cardTotal + bankTotal;
        dto.setTotalAmount(BigDecimal.valueOf(totalRevenue).setScale(2, RoundingMode.HALF_UP));
        dto.setCashAmount(BigDecimal.valueOf(cashTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setCardAmount(BigDecimal.valueOf(cardTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setBankTransferAmount(BigDecimal.valueOf(bankTotal).setScale(2, RoundingMode.HALF_UP));
        dto.setTransactions(txList);

        // 4. Occupancy Metrics (Total Nights, Adults, Children)
        int totalNights = 0;
        int totalAdults = 0;
        int totalChildren = 0;
        Set<Long> processedRegIds = new HashSet<>();

        for (Booking b : bookingsInPeriod) {
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
