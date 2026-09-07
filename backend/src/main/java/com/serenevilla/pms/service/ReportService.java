package com.serenevilla.pms.service;

import com.serenevilla.pms.dto.DailyCheckInDTO;
import com.serenevilla.pms.dto.ReportRowDTO;
import com.serenevilla.pms.dto.ReportSummaryDTO;
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

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GuestRegistrationRepository guestRegistrationRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DiscountRequestRepository discountRequestRepository;

    public ReportSummaryDTO generateReport(LocalDate startDate, LocalDate endDate) {
        // Fetch all data
        List<GuestRegistration> allRegistrations = guestRegistrationRepository.findAll();
        List<Booking> allBookings = bookingRepository.findAll();
        List<Payment> allPayments = paymentRepository.findAll();
        List<DiscountRequest> allDiscounts = discountRequestRepository.findAll();

        // Map registrations by ID for fast lookup
        Map<Long, GuestRegistration> registrationMap = allRegistrations.stream()
                .collect(Collectors.toMap(GuestRegistration::getId, r -> r, (r1, r2) -> r1));

        // Map bookings by ID for fast lookup
        Map<Long, Booking> bookingMap = allBookings.stream()
                .collect(Collectors.toMap(Booking::getId, b -> b, (b1, b2) -> b1));

        // Group payments by bookingId
        Map<Long, List<Payment>> paymentsByBooking = allPayments.stream()
                .collect(Collectors.groupingBy(Payment::getBookingId));

        // Group discounts by bookingId
        Map<Long, List<DiscountRequest>> discountsByBooking = allDiscounts.stream()
                .collect(Collectors.groupingBy(DiscountRequest::getBookingId));

        // Filter bookings whose guest registration check-in date is in range
        List<Booking> bookingsInRange = allBookings.stream()
                .filter(b -> {
                    LocalDate cIn = b.getCheckInDate();
                    if (cIn == null) {
                        GuestRegistration reg = registrationMap.get(b.getGuestRegistrationId());
                        if (reg != null) cIn = reg.getCheckInDate();
                    }
                    if (cIn == null) return false;
                    return !cIn.isBefore(startDate) && !cIn.isAfter(endDate);
                })
                .collect(Collectors.toList());

        // Check-ins in range
        List<GuestRegistration> checkInsInRange = allRegistrations.stream()
                .filter(r -> r.getCheckInDate() != null && !r.getCheckInDate().isBefore(startDate) && !r.getCheckInDate().isAfter(endDate))
                .collect(Collectors.toList());

        // Check-outs in range
        List<GuestRegistration> checkOutsInRange = allRegistrations.stream()
                .filter(r -> r.getCheckOutDate() != null && !r.getCheckOutDate().isBefore(startDate) && !r.getCheckOutDate().isAfter(endDate))
                .collect(Collectors.toList());

        // Payments in range
        List<Payment> paymentsInRange = allPayments.stream()
                .filter(p -> p.getPaymentDate() != null && !p.getPaymentDate().isBefore(startDate) && !p.getPaymentDate().isAfter(endDate))
                .collect(Collectors.toList());

        // Aggregate core numbers
        long totalBookings = bookingsInRange.size();
        long totalCheckIns = checkInsInRange.size();
        long totalCheckOuts = checkOutsInRange.size();
        long totalGuests = checkInsInRange.stream().mapToInt(r -> (r.getAdults() != null ? r.getAdults() : 1) + (r.getChildren() != null ? r.getChildren() : 0)).sum();
        long totalAdults = checkInsInRange.stream().mapToInt(r -> r.getAdults() != null ? r.getAdults() : 1).sum();
        long totalChildren = checkInsInRange.stream().mapToInt(r -> r.getChildren() != null ? r.getChildren() : 0).sum();

        long totalInvoices = paymentsInRange.size();
        double totalRevenue = paymentsInRange.stream().mapToDouble(Payment::getAmountLkr).sum();

        // Payment method breakdown
        double cashRevenue = 0;
        double cardRevenue = 0;
        double bankTransferRevenue = 0;

        for (Payment p : paymentsInRange) {
            String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase().trim() : "";
            if (method.contains("CASH")) {
                cashRevenue += p.getAmountLkr();
            } else if (method.contains("CARD") || method.contains("VISA") || method.contains("MASTER") || method.contains("AMEX")) {
                cardRevenue += p.getAmountLkr();
            } else if (method.contains("BANK") || method.contains("TRANSFER") || method.contains("ONLINE") || method.contains("PEOPLE")) {
                bankTransferRevenue += p.getAmountLkr();
            } else {
                cashRevenue += p.getAmountLkr();
            }
        }

        // Booking Channel Breakdown: Booking.com, Web Booking, Airbnb, Direct Booking
        long directBookingCount = 0;
        double directBookingAmount = 0;

        long bookingComCount = 0;
        double bookingComAmount = 0;

        long airbnbCount = 0;
        double airbnbAmount = 0;

        long webBookingCount = 0;
        double webBookingAmount = 0;

        for (Booking b : bookingsInRange) {
            String bType = b.getBookingType() != null ? b.getBookingType().toLowerCase().trim() : "";
            double amt = b.getTotalAmount() != null ? b.getTotalAmount() : 0.0;

            if (bType.contains("booking.com") || bType.contains("booking_com")) {
                bookingComCount++;
                bookingComAmount += amt;
            } else if (bType.contains("airbnb")) {
                airbnbCount++;
                airbnbAmount += amt;
            } else if (bType.contains("web") || bType.contains("website") || bType.contains("online")) {
                webBookingCount++;
                webBookingAmount += amt;
            } else {
                // Default to Direct Booking
                directBookingCount++;
                directBookingAmount += amt;
            }
        }

        // Advance payments, remaining balance, and outstanding unpaid amount for bookings in range
        double totalAdvancePayments = 0;
        double totalRemainingBalance = 0;
        double totalOutstandingAmount = 0;
        double approvedDiscountTotal = 0;
        long pendingDiscountRequestCount = 0;

        for (Booking booking : bookingsInRange) {
            List<Payment> pList = paymentsByBooking.getOrDefault(booking.getId(), Collections.emptyList());
            double totalPaidForBooking = pList.stream().mapToDouble(Payment::getAmountLkr).sum();
            double advancePaid = pList.stream().filter(Payment::isAdvancePayment).mapToDouble(Payment::getAmountLkr).sum();

            List<DiscountRequest> dList = discountsByBooking.getOrDefault(booking.getId(), Collections.emptyList());
            double approvedDiscount = dList.stream()
                    .filter(d -> "APPROVED".equalsIgnoreCase(d.getStatus()))
                    .mapToDouble(DiscountRequest::getDiscountAmount).sum();
            long pendingDiscounts = dList.stream()
                    .filter(d -> "PENDING".equalsIgnoreCase(d.getStatus()))
                    .count();

            double remaining = (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0) - totalPaidForBooking - approvedDiscount;
            
            totalAdvancePayments += advancePaid;
            approvedDiscountTotal += approvedDiscount;
            pendingDiscountRequestCount += pendingDiscounts;

            if (remaining > 0) {
                totalRemainingBalance += remaining;
                if (!"Cancelled".equalsIgnoreCase(booking.getStatus())) {
                    totalOutstandingAmount += remaining;
                }
            }
        }

        // Generate Report Rows
        List<ReportRowDTO> rows = new ArrayList<>();
        for (Payment payment : paymentsInRange) {
            Booking booking = bookingMap.get(payment.getBookingId());
            if (booking == null) continue;

            GuestRegistration reg = registrationMap.get(booking.getGuestRegistrationId());
            String guestName = reg != null ? reg.getGuestName() : (booking.getGuestName() != null ? booking.getGuestName() : "Unknown Guest");
            String passportNumber = reg != null ? reg.getPassportNumber() : "N/A";
            LocalDate checkIn = booking.getCheckInDate() != null ? booking.getCheckInDate() : (reg != null ? reg.getCheckInDate() : null);
            LocalDate checkOut = booking.getCheckOutDate() != null ? booking.getCheckOutDate() : (reg != null ? reg.getCheckOutDate() : null);
            int nights = booking.getNumberOfNights() != null ? booking.getNumberOfNights() : (reg != null && reg.getNights() != null ? reg.getNights() : 0);
            int pax = reg != null ? ((reg.getAdults() != null ? reg.getAdults() : 1) + (reg.getChildren() != null ? reg.getChildren() : 0)) : 1;

            List<Payment> bookingPayments = paymentsByBooking.getOrDefault(booking.getId(), Collections.emptyList());
            double totalPaidForBooking = bookingPayments.stream().mapToDouble(Payment::getAmountLkr).sum();
            double advancePaid = bookingPayments.stream().filter(Payment::isAdvancePayment).mapToDouble(Payment::getAmountLkr).sum();

            List<DiscountRequest> bookingDiscounts = discountsByBooking.getOrDefault(booking.getId(), Collections.emptyList());
            double discountAmount = bookingDiscounts.stream()
                    .filter(d -> "APPROVED".equalsIgnoreCase(d.getStatus()))
                    .mapToDouble(DiscountRequest::getDiscountAmount).sum();
            String discountStatus = bookingDiscounts.isEmpty() ? "NONE" : bookingDiscounts.get(0).getStatus();

            double remaining = (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0) - totalPaidForBooking - discountAmount;

            double pAmountLkr = payment.getAmountLkr();
            double rowCash = 0;
            double rowCard = 0;
            double rowBank = 0;

            String pMethod = payment.getPaymentMethod() != null ? payment.getPaymentMethod().toUpperCase().trim() : "";
            if (pMethod.contains("CASH")) {
                rowCash = pAmountLkr;
            } else if (pMethod.contains("CARD") || pMethod.contains("VISA") || pMethod.contains("MASTER") || pMethod.contains("AMEX")) {
                rowCard = pAmountLkr;
            } else if (pMethod.contains("BANK") || pMethod.contains("TRANSFER") || pMethod.contains("ONLINE") || pMethod.contains("PEOPLE")) {
                rowBank = pAmountLkr;
            } else {
                rowCash = pAmountLkr;
            }

            ReportRowDTO row = new ReportRowDTO();
            row.setInvoiceNumber(payment.getReceiptNumber() != null ? payment.getReceiptNumber() : "INV-" + payment.getId());
            row.setBookingNumber(booking.getBookingNumber());
            row.setGuestName(guestName);
            row.setPassportNumber(passportNumber);
            row.setRoomName(booking.getRoomNumber());
            row.setCheckInDate(checkIn);
            row.setCheckOutDate(checkOut);
            row.setNumberOfNights(nights);
            row.setPaymentMethod(payment.getPaymentMethod());
            row.setPaymentStatus("PAID");
            row.setCurrencyCode(payment.getCurrency());
            row.setExchangeRate(payment.getExchangeRate());
            row.setPaidAmount(payment.getAmountInCurrency());
            row.setConvertedAmount(payment.getAmountLkr());
            row.setInvoiceTotal(booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0);
            row.setAdvancePaymentAmount(advancePaid);
            row.setRemainingBalance(remaining > 0 ? remaining : 0.0);
            row.setBookingSource(booking.getBookingType());
            row.setDiscountAmount(discountAmount);
            row.setDiscountStatus(discountStatus);
            row.setCreatedByFrontOfficer("Front Officer");
            row.setCashAmount(rowCash);
            row.setCardAmount(rowCard);
            row.setBankTransferAmount(rowBank);
            row.setPax(pax);

            rows.add(row);
        }

        // Daily Check-ins List for check-in summary view
        List<DailyCheckInDTO> checkInDTOList = new ArrayList<>();
        for (GuestRegistration reg : checkInsInRange) {
            // Find primary matching booking
            Booking matchedBooking = allBookings.stream()
                    .filter(b -> Objects.equals(b.getGuestRegistrationId(), reg.getId()))
                    .findFirst()
                    .orElse(null);

            String rNumber = (matchedBooking != null && matchedBooking.getRoomNumber() != null) ? matchedBooking.getRoomNumber() : "N/A";
            String rType = (matchedBooking != null && matchedBooking.getRoomType() != null) ? matchedBooking.getRoomType() : "";
            double bAmount = (matchedBooking != null && matchedBooking.getTotalAmount() != null) ? matchedBooking.getTotalAmount() : 0.0;
            String bNumber = matchedBooking != null ? matchedBooking.getBookingNumber() : "N/A";
            String bSource = matchedBooking != null ? matchedBooking.getBookingType() : "Direct";

            int adults = reg.getAdults() != null ? reg.getAdults() : 1;
            int children = reg.getChildren() != null ? reg.getChildren() : 0;
            int pax = adults + children;

            DailyCheckInDTO checkInDTO = new DailyCheckInDTO();
            checkInDTO.setId(reg.getId());
            checkInDTO.setGuestName(reg.getGuestName());
            checkInDTO.setPassportNumber(reg.getPassportNumber());
            checkInDTO.setRoomNumber(rNumber);
            checkInDTO.setRoomType(rType);
            checkInDTO.setAmount(bAmount);
            checkInDTO.setPax(pax);
            checkInDTO.setAdults(adults);
            checkInDTO.setChildren(children);
            checkInDTO.setCheckInDate(reg.getCheckInDate());
            checkInDTO.setCheckOutDate(reg.getCheckOutDate());
            checkInDTO.setBookingNumber(bNumber);
            checkInDTO.setBookingSource(bSource);
            checkInDTO.setPaymentStatus(reg.getPaymentStatus());

            checkInDTOList.add(checkInDTO);
        }

        ReportSummaryDTO summary = new ReportSummaryDTO();
        summary.setTotalBookings(totalBookings);
        summary.setTotalCheckIns(totalCheckIns);
        summary.setTotalCheckOuts(totalCheckOuts);
        summary.setTotalGuests(totalGuests);
        summary.setTotalAdults(totalAdults);
        summary.setTotalChildren(totalChildren);
        summary.setTotalInvoices(totalInvoices);
        summary.setTotalRevenue(totalRevenue);
        summary.setTotalAdvancePayments(totalAdvancePayments);
        summary.setTotalRemainingBalance(totalRemainingBalance);
        summary.setTotalOutstandingAmount(totalOutstandingAmount);
        
        summary.setCashRevenue(cashRevenue);
        summary.setCardRevenue(cardRevenue);
        summary.setBankTransferRevenue(bankTransferRevenue);

        summary.setDirectBookingCount(directBookingCount);
        summary.setDirectBookingAmount(directBookingAmount);
        summary.setBookingComCount(bookingComCount);
        summary.setBookingComAmount(bookingComAmount);
        summary.setAirbnbCount(airbnbCount);
        summary.setAirbnbAmount(airbnbAmount);
        summary.setWebBookingCount(webBookingCount);
        summary.setWebBookingAmount(webBookingAmount);

        summary.setApprovedDiscountTotal(approvedDiscountTotal);
        summary.setPendingDiscountRequestCount(pendingDiscountRequestCount);
        summary.setCheckIns(checkInDTOList);
        summary.setRows(rows);

        return summary;
    }
}
