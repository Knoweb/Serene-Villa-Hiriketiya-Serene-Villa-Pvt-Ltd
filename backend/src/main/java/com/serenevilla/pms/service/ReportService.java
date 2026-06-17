package com.serenevilla.pms.service;

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
                    GuestRegistration reg = registrationMap.get(b.getGuestRegistrationId());
                    if (reg == null || reg.getCheckInDate() == null) return false;
                    return !reg.getCheckInDate().isBefore(startDate) && !reg.getCheckInDate().isAfter(endDate);
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
        long totalGuests = checkInsInRange.stream().mapToInt(r -> r.getAdults() + r.getChildren()).sum();
        long totalAdults = checkInsInRange.stream().mapToInt(GuestRegistration::getAdults).sum();
        long totalChildren = checkInsInRange.stream().mapToInt(GuestRegistration::getChildren).sum();

        long totalInvoices = paymentsInRange.size();
        double totalRevenue = paymentsInRange.stream().mapToDouble(Payment::getAmountLkr).sum();

        // Payment method breakdown
        double cashRevenue = paymentsInRange.stream()
                .filter(p -> "CASH".equalsIgnoreCase(p.getPaymentMethod()))
                .mapToDouble(Payment::getAmountLkr).sum();
        double cardRevenue = paymentsInRange.stream()
                .filter(p -> "CARD".equalsIgnoreCase(p.getPaymentMethod()))
                .mapToDouble(Payment::getAmountLkr).sum();
        double bankTransferRevenue = paymentsInRange.stream()
                .filter(p -> "BANK_TRANSFER".equalsIgnoreCase(p.getPaymentMethod()) || "BANK TRANSFER".equalsIgnoreCase(p.getPaymentMethod()))
                .mapToDouble(Payment::getAmountLkr).sum();

        // Booking sources breakdown
        long directBookingCount = bookingsInRange.stream()
                .filter(b -> "DIRECT".equalsIgnoreCase(b.getBookingType()) || "Direct".equalsIgnoreCase(b.getBookingType()))
                .count();
        long bookingComCount = bookingsInRange.stream()
                .filter(b -> "BOOKING_COM".equalsIgnoreCase(b.getBookingType()) || "Booking.com".equalsIgnoreCase(b.getBookingType()))
                .count();

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

            double remaining = booking.getTotalAmount() - totalPaidForBooking - approvedDiscount;
            
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
            String guestName = reg != null ? reg.getGuestName() : "Unknown Guest";
            String passportNumber = reg != null ? reg.getPassportNumber() : "N/A";
            LocalDate checkIn = reg != null ? reg.getCheckInDate() : null;
            LocalDate checkOut = reg != null ? reg.getCheckOutDate() : null;
            int nights = reg != null ? reg.getNights() : 0;

            List<Payment> bookingPayments = paymentsByBooking.getOrDefault(booking.getId(), Collections.emptyList());
            double totalPaidForBooking = bookingPayments.stream().mapToDouble(Payment::getAmountLkr).sum();
            double advancePaid = bookingPayments.stream().filter(Payment::isAdvancePayment).mapToDouble(Payment::getAmountLkr).sum();

            List<DiscountRequest> bookingDiscounts = discountsByBooking.getOrDefault(booking.getId(), Collections.emptyList());
            double discountAmount = bookingDiscounts.stream()
                    .filter(d -> "APPROVED".equalsIgnoreCase(d.getStatus()))
                    .mapToDouble(DiscountRequest::getDiscountAmount).sum();
            String discountStatus = bookingDiscounts.isEmpty() ? "NONE" : bookingDiscounts.get(0).getStatus();

            double remaining = booking.getTotalAmount() - totalPaidForBooking - discountAmount;

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
            row.setInvoiceTotal(booking.getTotalAmount());
            row.setAdvancePaymentAmount(advancePaid);
            row.setRemainingBalance(remaining > 0 ? remaining : 0.0);
            row.setBookingSource(booking.getBookingType());
            row.setDiscountAmount(discountAmount);
            row.setDiscountStatus(discountStatus);
            row.setCreatedByFrontOfficer("Front Officer");

            rows.add(row);
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
        summary.setBookingComCount(bookingComCount);
        summary.setApprovedDiscountTotal(approvedDiscountTotal);
        summary.setPendingDiscountRequestCount(pendingDiscountRequestCount);
        summary.setRows(rows);

        return summary;
    }
}
