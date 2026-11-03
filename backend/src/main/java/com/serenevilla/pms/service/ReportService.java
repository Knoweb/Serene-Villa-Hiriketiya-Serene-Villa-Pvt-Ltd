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

    @Autowired
    private com.serenevilla.pms.repository.RoomRepository roomRepository;

    @Autowired
    private com.serenevilla.pms.repository.ReceiptRepository receiptRepository;

    @Autowired
    private ReceiptService receiptService;

    // Helper to cleanly extract room number from a booking, falling back to roomPrices JSON if needed
    public static String extractRoomNumber(Booking booking) {
        if (booking == null) return "N/A";
        String rm = booking.getRoomNumber();
        if (rm != null && !rm.trim().isEmpty() && !"Unallocated".equalsIgnoreCase(rm.trim()) && !"N/A".equalsIgnoreCase(rm.trim())) {
            return rm.trim();
        }
        if (booking.getRoomPrices() != null && !booking.getRoomPrices().trim().isEmpty()) {
            try {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"roomNumber\"\\s*:\\s*\"([^\"]+)\"", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(booking.getRoomPrices());
                List<String> list = new ArrayList<>();
                while (m.find()) {
                    String r = m.group(1).trim();
                    if (!r.isEmpty() && !"Unallocated".equalsIgnoreCase(r) && !list.contains(r)) {
                        list.add(r);
                    }
                }
                if (!list.isEmpty()) {
                    return String.join(", ", list);
                }
            } catch (Exception ignored) {}
        }
        return (rm != null && !rm.trim().isEmpty() && !"Unallocated".equalsIgnoreCase(rm.trim())) ? rm.trim() : "N/A";
    }

    // Smart lookup to find a matching booking for a registration
    public static Booking findMatchingBooking(GuestRegistration reg, List<Booking> allBookings) {
        if (reg == null || allBookings == null || allBookings.isEmpty()) return null;

        // 1. Direct match by guestRegistrationId
        if (reg.getId() != null) {
            for (Booking b : allBookings) {
                if (Objects.equals(b.getGuestRegistrationId(), reg.getId()) && (b.getBookingNumber() == null || !b.getBookingNumber().contains("/"))) {
                    return b;
                }
            }
        }

        // 2. Match by passportNumber (e.g. SV-B-6307864151 -> B-6307864151 or exact)
        String pass = reg.getPassportNumber();
        if (pass != null && !pass.trim().isEmpty()) {
            String cleanPass = pass.replaceFirst("(?i)^SV-?", "").trim();
            if (!cleanPass.isEmpty() && !"N/A".equalsIgnoreCase(cleanPass) && !"undefined".equalsIgnoreCase(cleanPass) && !"null".equalsIgnoreCase(cleanPass)) {
                for (Booking b : allBookings) {
                    if (b.getBookingNumber() != null && !b.getBookingNumber().contains("/")) {
                        String bNum = b.getBookingNumber().trim();
                        if (bNum.equalsIgnoreCase(cleanPass) || bNum.equalsIgnoreCase(pass.trim()) ||
                            cleanPass.equalsIgnoreCase(bNum.replaceFirst("(?i)^SV-?", ""))) {
                            return b;
                        }
                    }
                }
            }
        }

        // 3. Match by guest name AND check-in date
        if (reg.getGuestName() != null && !reg.getGuestName().trim().isEmpty()) {
            String gName = reg.getGuestName().trim().toLowerCase();
            for (Booking b : allBookings) {
                if (b.getGuestName() != null && b.getGuestName().trim().toLowerCase().equals(gName) && (b.getBookingNumber() == null || !b.getBookingNumber().contains("/"))) {
                    if (reg.getCheckInDate() == null || b.getCheckInDate() == null || reg.getCheckInDate().equals(b.getCheckInDate())) {
                        return b;
                    }
                }
            }
        }

        return null;
    }

    // Deduplicate registrations: filter out cancelled and merge duplicate draft records
    public static List<GuestRegistration> deduplicateRegistrations(List<GuestRegistration> list) {
        if (list == null || list.isEmpty()) return Collections.emptyList();

        Map<String, List<GuestRegistration>> groups = new LinkedHashMap<>();
        for (GuestRegistration reg : list) {
            String pass = reg.getPassportNumber() != null ? reg.getPassportNumber().trim() : "";
            String cleanPass = pass.replaceFirst("(?i)^SV-?", "").trim().toLowerCase();
            String gName = reg.getGuestName() != null ? reg.getGuestName().trim().toLowerCase() : "";
            String inDate = reg.getCheckInDate() != null ? reg.getCheckInDate().toString() : "";

            String key;
            if (!cleanPass.isEmpty() && !cleanPass.equals("n/a") && !cleanPass.startsWith("sv-") && !cleanPass.equals("undefined") && !cleanPass.equals("null")) {
                key = "pass_" + cleanPass;
            } else if (!gName.isEmpty()) {
                key = "name_" + gName + "_" + inDate;
            } else {
                key = "id_" + reg.getId();
            }

            String matchedKey = key;
            for (Map.Entry<String, List<GuestRegistration>> entry : groups.entrySet()) {
                for (GuestRegistration existing : entry.getValue()) {
                    String exPass = existing.getPassportNumber() != null ? existing.getPassportNumber().replaceFirst("(?i)^SV-?", "").trim().toLowerCase() : "";
                    String exName = existing.getGuestName() != null ? existing.getGuestName().trim().toLowerCase() : "";
                    String exIn = existing.getCheckInDate() != null ? existing.getCheckInDate().toString() : "";

                    if (!cleanPass.isEmpty() && !exPass.isEmpty() && cleanPass.equals(exPass)) {
                        matchedKey = entry.getKey();
                        break;
                    }
                    if (!gName.isEmpty() && !exName.isEmpty() && gName.equals(exName) && inDate.equals(exIn)) {
                        matchedKey = entry.getKey();
                        break;
                    }
                }
                if (!matchedKey.equals(key)) break;
            }

            groups.computeIfAbsent(matchedKey, k -> new ArrayList<>()).add(reg);
        }

        List<GuestRegistration> result = new ArrayList<>();
        for (List<GuestRegistration> group : groups.values()) {
            if (group.size() == 1) {
                result.add(group.get(0));
            } else {
                GuestRegistration best = group.stream()
                        .filter(r -> r.getPassportNumber() != null && !r.getPassportNumber().toUpperCase().startsWith("SV-"))
                        .findFirst()
                        .orElse(group.get(group.size() - 1));
                result.add(best);
            }
        }
        return result;
    }

    public ReportSummaryDTO generateReport(LocalDate startDate, LocalDate endDate, Long propertyId) {
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

        // Payments in range
        List<Payment> paymentsInRange = allPayments.stream()
                .filter(p -> p.getPaymentDate() != null && !p.getPaymentDate().isBefore(startDate) && !p.getPaymentDate().isAfter(endDate))
                .collect(Collectors.toList());

        // Filter bookings for report metrics:
        // Include bookings where:
        // 1) Check-in date is within [startDate, endDate], OR
        // 2) The booking received a payment within [startDate, endDate] (e.g. advance payment, settlement)
        Set<Long> bookingIdsWithPaymentInRange = paymentsInRange.stream()
                .map(Payment::getBookingId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<Long> regIdsWithPaymentInRange = paymentsInRange.stream()
                .map(Payment::getGuestRegistrationId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Booking> bookingsInRange = allBookings.stream()
                .filter(b -> {
                    if (bookingIdsWithPaymentInRange.contains(b.getId())) return true;
                    if (b.getGuestRegistrationId() != null && regIdsWithPaymentInRange.contains(b.getGuestRegistrationId())) return true;

                    LocalDate cIn = b.getCheckInDate();
                    if (cIn == null) {
                        GuestRegistration reg = registrationMap.get(b.getGuestRegistrationId());
                        if (reg != null) cIn = reg.getCheckInDate();
                    }
                    if (cIn == null) return false;
                    return !cIn.isBefore(startDate) && !cIn.isAfter(endDate);
                })
                .collect(Collectors.toList());

        // Check-ins in range (exclude hidden and cancelled, and deduplicate placeholder draft registrations)
        List<GuestRegistration> rawCheckIns = allRegistrations.stream()
                .filter(r -> r.getCheckInDate() != null && !r.getCheckInDate().isBefore(startDate) && !r.getCheckInDate().isAfter(endDate))
                .filter(r -> r.getIsHiddenFromFrontOffice() == null || !r.getIsHiddenFromFrontOffice())
                .filter(r -> !"Cancelled".equalsIgnoreCase(r.getRegistrationStatus()))
                .collect(Collectors.toList());

        List<GuestRegistration> checkInsInRange = deduplicateRegistrations(rawCheckIns);

        // Check-outs in range
        List<GuestRegistration> rawCheckOuts = allRegistrations.stream()
                .filter(r -> r.getCheckOutDate() != null && !r.getCheckOutDate().isBefore(startDate) && !r.getCheckOutDate().isAfter(endDate))
                .filter(r -> r.getIsHiddenFromFrontOffice() == null || !r.getIsHiddenFromFrontOffice())
                .filter(r -> !"Cancelled".equalsIgnoreCase(r.getRegistrationStatus()))
                .collect(Collectors.toList());

        List<GuestRegistration> checkOutsInRange = deduplicateRegistrations(rawCheckOuts);

        // Aggregate core numbers
        long totalBookings = bookingsInRange.size();
        long totalCheckIns = checkInsInRange.size();
        long totalCheckOuts = checkOutsInRange.size();
        long totalGuests = checkInsInRange.stream().mapToInt(r -> (r.getAdults() != null ? r.getAdults() : 1) + (r.getChildren() != null ? r.getChildren() : 0)).sum();
        long totalAdults = checkInsInRange.stream().mapToInt(r -> r.getAdults() != null ? r.getAdults() : 1).sum();
        long totalChildren = checkInsInRange.stream().mapToInt(r -> r.getChildren() != null ? r.getChildren() : 0).sum();

        long totalInvoices = paymentsInRange.size();
        double totalRevenue = paymentsInRange.stream().mapToDouble(Payment::getAmountLkr).sum();

        // Payment method breakdown and charges calculation
        double cashRevenue = 0;
        double cardRevenue = 0;
        double bankTransferRevenue = 0;
        double totalCardCharges = 0;
        double totalOtherCharges = 0;

        for (Payment p : paymentsInRange) {
            String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase().trim() : "";
            double pAmtLkr = p.getAmountLkr();
            Double rateObj = p.getExchangeRate();
            double pRate = rateObj != null && rateObj > 0 ? rateObj : 1.0;
            String pCurr = p.getCurrency() != null ? p.getCurrency().toUpperCase() : "LKR";

            if (method.contains("CASH")) {
                cashRevenue += pAmtLkr;
            } else if (method.contains("CARD") || method.contains("VISA") || method.contains("MASTER") || method.contains("AMEX")) {
                cardRevenue += pAmtLkr;
            } else if (method.contains("BANK") || method.contains("TRANSFER") || method.contains("ONLINE") || method.contains("PEOPLE")) {
                bankTransferRevenue += pAmtLkr;
            } else {
                cashRevenue += pAmtLkr;
            }

            // Extract Card / Bank Charges from remarks e.g. [Charges: 42]
            if (p.getRemarks() != null) {
                java.util.regex.Matcher cardFeeMatch = java.util.regex.Pattern.compile("\\[(?:Bank )?Charges: ([\\d.]+)\\]", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(p.getRemarks());
                if (cardFeeMatch.find()) {
                    try {
                        double feeRaw = Double.parseDouble(cardFeeMatch.group(1));
                        double feeLkr = "LKR".equals(pCurr) ? feeRaw : (feeRaw * pRate);
                        totalCardCharges += feeLkr;
                    } catch (Exception ignored) {}
                }

                // Extract Other Charges from remarks e.g. [Other Charges: 50]
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
            // Convert to LKR if currency is foreign
            double exRate = 1.0;
            try {
                if (b.getExchangeRate() != null && !b.getExchangeRate().trim().isEmpty()) {
                    exRate = Double.parseDouble(b.getExchangeRate().trim());
                }
            } catch (Exception ignored) {}
            if (exRate <= 0) exRate = 1.0;
            String curr = b.getCurrency() != null ? b.getCurrency().trim().toUpperCase() : "LKR";
            double bLkr = "LKR".equals(curr) ? amt : (amt * exRate);

            if (bType.contains("booking.com") || bType.contains("booking_com")) {
                bookingComCount++;
                bookingComAmount += bLkr;
            } else if (bType.contains("airbnb")) {
                airbnbCount++;
                airbnbAmount += bLkr;
            } else if (bType.contains("web") || bType.contains("website") || bType.contains("online")) {
                webBookingCount++;
                webBookingAmount += bLkr;
            } else {
                // Default to Direct Booking
                directBookingCount++;
                directBookingAmount += bLkr;
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

            String invoiceNum = payment.getReceiptNumber();
            if (invoiceNum != null) {
                invoiceNum = invoiceNum.trim();
            }
            if (invoiceNum == null || invoiceNum.isEmpty() || invoiceNum.startsWith("REC-") || !invoiceNum.matches("^\\d{2}-\\d{3,}$")) {
                Optional<com.serenevilla.pms.model.Receipt> receiptOpt = receiptRepository.findByPaymentId(payment.getId());
                if (receiptOpt.isPresent() && receiptOpt.get().getReceiptNumber() != null && !receiptOpt.get().getReceiptNumber().trim().isEmpty() && !receiptOpt.get().getReceiptNumber().startsWith("REC-")) {
                    invoiceNum = receiptOpt.get().getReceiptNumber().trim();
                    payment.setReceiptNumber(invoiceNum);
                    try { paymentRepository.save(payment); } catch (Exception ignored) {}
                } else {
                    try {
                        com.serenevilla.pms.model.Receipt r = receiptService.getOrCreateAdvanceReceipt(payment);
                        if (r != null && r.getReceiptNumber() != null && !r.getReceiptNumber().trim().isEmpty()) {
                            invoiceNum = r.getReceiptNumber().trim();
                        }
                    } catch (Exception ignored) {}
                }
            }

            if (invoiceNum == null || invoiceNum.isEmpty()) {
                int m = (payment.getCreatedAt() != null) ? payment.getCreatedAt().getMonthValue() : (payment.getPaymentDate() != null ? payment.getPaymentDate().getMonthValue() : LocalDate.now().getMonthValue());
                long pId = payment.getId() != null ? payment.getId() : 1L;
                invoiceNum = String.format("%02d-%03d", m, (pId % 1000));
            }

            ReportRowDTO row = new ReportRowDTO();
            row.setInvoiceNumber(invoiceNum);
            row.setBookingNumber(booking.getBookingNumber());
            row.setGuestName(guestName);
            row.setPassportNumber(passportNumber);
            row.setRoomName(extractRoomNumber(booking));
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

            // Extract row-specific card fees and other charges
            double rowFeeLkr = 0;
            double rowOtherLkr = 0;
            if (payment.getRemarks() != null) {
                java.util.regex.Matcher cfm = java.util.regex.Pattern.compile("\\[(?:Bank )?Charges: ([\\d.]+)\\]", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(payment.getRemarks());
                if (cfm.find()) {
                    try {
                        double feeRaw = Double.parseDouble(cfm.group(1));
                        rowFeeLkr = "LKR".equalsIgnoreCase(payment.getCurrency()) ? feeRaw : (feeRaw * (payment.getExchangeRate() > 0 ? payment.getExchangeRate() : 1.0));
                    } catch (Exception ignored) {}
                }
                java.util.regex.Matcher om = java.util.regex.Pattern.compile("\\[Other Charges: ([\\d.]+)\\]", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(payment.getRemarks());
                if (om.find()) {
                    try {
                        double otherRaw = Double.parseDouble(om.group(1));
                        rowOtherLkr = "LKR".equalsIgnoreCase(payment.getCurrency()) ? otherRaw : (otherRaw * (payment.getExchangeRate() > 0 ? payment.getExchangeRate() : 1.0));
                    } catch (Exception ignored) {}
                }
            }
            row.setCardCharges(rowFeeLkr);
            row.setOtherCharges(rowOtherLkr);
            row.setNetAmount(Math.max(0, pAmountLkr - rowOtherLkr));

            rows.add(row);
        }

        // Daily Check-ins List for check-in summary view
        List<DailyCheckInDTO> checkInDTOList = new ArrayList<>();
        for (GuestRegistration reg : checkInsInRange) {
            // Find primary matching booking with smart fallback
            Booking matchedBooking = findMatchingBooking(reg, allBookings);

            String rNumber = extractRoomNumber(matchedBooking);
            String rType = (matchedBooking != null && matchedBooking.getRoomType() != null) ? matchedBooking.getRoomType() : "";
            double bAmount = (matchedBooking != null && matchedBooking.getTotalAmount() != null) ? matchedBooking.getTotalAmount() : 0.0;
            String bNumber = (matchedBooking != null && matchedBooking.getBookingNumber() != null)
                    ? matchedBooking.getBookingNumber()
                    : (reg.getPassportNumber() != null ? reg.getPassportNumber().replaceFirst("(?i)^SV-?", "") : "N/A");
            String bSource = (matchedBooking != null && matchedBooking.getBookingType() != null)
                    ? matchedBooking.getBookingType()
                    : "Direct";

            if (matchedBooking != null && !"N/A".equalsIgnoreCase(rNumber) && (matchedBooking.getRoomNumber() == null || matchedBooking.getRoomNumber().trim().isEmpty() || "Unallocated".equalsIgnoreCase(matchedBooking.getRoomNumber()))) {
                matchedBooking.setRoomNumber(rNumber);
                try { bookingRepository.save(matchedBooking); } catch (Exception ignored) {}
            }

            int adults = reg.getAdults() != null ? reg.getAdults() : 1;
            int children = reg.getChildren() != null ? reg.getChildren() : 0;
            int pax = adults + children;

            DailyCheckInDTO checkInDTO = new DailyCheckInDTO();
            checkInDTO.setId(reg.getId());
            checkInDTO.setGuestName(reg.getGuestName());
            checkInDTO.setPassportNumber(bNumber != null && !bNumber.equals("N/A") ? bNumber : reg.getPassportNumber());
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

        // Generate Room-Wise Breakdown for all rooms in property
        List<com.serenevilla.pms.model.Room> propertyRooms = propertyId != null ?
                roomRepository.findByPropertyId(propertyId) :
                roomRepository.findAll();
        if (propertyRooms.isEmpty() && propertyId != null) {
            propertyRooms = roomRepository.findAll();
        }

        // Helper to check if a booking contains a specific room number (handles single "101" or comma-separated "101, 102, 103")
        java.util.function.BiFunction<Booking, String, Boolean> bookingHasRoom = (b, targetRoom) -> {
            if (b == null || b.getRoomNumber() == null || targetRoom == null || targetRoom.trim().isEmpty()) return false;
            String[] parts = b.getRoomNumber().split(",");
            for (String p : parts) {
                if (p.trim().equalsIgnoreCase(targetRoom.trim())) return true;
            }
            return false;
        };

        // Helper to count total rooms assigned to a booking
        java.util.function.Function<Booking, Integer> getBookingRoomCount = (b) -> {
            if (b == null || b.getRoomNumber() == null || b.getRoomNumber().trim().isEmpty()) return 1;
            String[] parts = b.getRoomNumber().split(",");
            int count = 0;
            for (String p : parts) {
                if (!p.trim().isEmpty()) count++;
            }
            return Math.max(1, count);
        };

        List<com.serenevilla.pms.dto.RoomIncomeSummaryDTO> roomBreakdowns = new ArrayList<>();
        for (com.serenevilla.pms.model.Room r : propertyRooms) {
            String rNum = r.getRoomNumber() != null ? r.getRoomNumber().trim() : "";
            
            // Filter bookings that include this room
            List<Booking> rBookings = bookingsInRange.stream()
                    .filter(b -> bookingHasRoom.apply(b, rNum))
                    .collect(Collectors.toList());

            double rCash = 0;
            double rCard = 0;
            double rBank = 0;

            // Attribute payments for bookings containing this room
            for (Payment p : paymentsInRange) {
                Booking b = p.getBookingId() != null ? bookingMap.get(p.getBookingId()) : null;
                if (b == null && p.getGuestRegistrationId() != null) {
                    b = allBookings.stream()
                            .filter(bk -> Objects.equals(bk.getGuestRegistrationId(), p.getGuestRegistrationId()))
                            .findFirst()
                            .orElse(null);
                }

                if (b != null && bookingHasRoom.apply(b, rNum)) {
                    int roomCount = getBookingRoomCount.apply(b);
                    double amt = p.getAmountLkr() / (double) roomCount;
                    String m = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase().trim() : "";
                    if (m.contains("CASH")) {
                        rCash += amt;
                    } else if (m.contains("CARD") || m.contains("VISA") || m.contains("MASTER") || m.contains("AMEX")) {
                        rCard += amt;
                    } else if (m.contains("BANK") || m.contains("TRANSFER") || m.contains("ONLINE") || m.contains("PEOPLE")) {
                        rBank += amt;
                    } else {
                        rCash += amt;
                    }
                }
            }

            // Fallback to room booking value if no explicit payment recorded yet
            if ((rCash + rCard + rBank) == 0 && !rBookings.isEmpty()) {
                for (Booking b : rBookings) {
                    if (b.getTotalAmount() != null && b.getTotalAmount() > 0) {
                        int roomCount = getBookingRoomCount.apply(b);
                        double exRate = 1.0;
                        try {
                            if (b.getExchangeRate() != null && !b.getExchangeRate().trim().isEmpty()) {
                                exRate = Double.parseDouble(b.getExchangeRate().trim());
                            }
                        } catch (Exception ignored) {}
                        if (exRate <= 0) exRate = 1.0;
                        String curr = b.getCurrency() != null ? b.getCurrency().trim().toUpperCase() : "LKR";
                        double bLkr = ("LKR".equals(curr) ? b.getTotalAmount() : (b.getTotalAmount() * exRate)) / (double) roomCount;
                        String bType = b.getBookingType() != null ? b.getBookingType().toUpperCase() : "";
                        if (bType.contains("AIRBNB") || bType.contains("BOOKING")) {
                            rCard += bLkr;
                        } else {
                            rCash += bLkr;
                        }
                    }
                }
            }

            int rNights = 0;
            int rGuests = 0;
            Set<Long> processedRegs = new HashSet<>();

            for (Booking b : rBookings) {
                int roomCount = getBookingRoomCount.apply(b);
                int bNights = 1;
                if (b.getCheckInDate() != null && b.getCheckOutDate() != null) {
                    long days = java.time.temporal.ChronoUnit.DAYS.between(b.getCheckInDate(), b.getCheckOutDate());
                    bNights = (int) Math.max(1, days);
                } else if (b.getNumberOfNights() != null) {
                    bNights = b.getNumberOfNights();
                }
                rNights += bNights;

                if (b.getGuestRegistrationId() != null && !processedRegs.contains(b.getGuestRegistrationId())) {
                    processedRegs.add(b.getGuestRegistrationId());
                    GuestRegistration reg = registrationMap.get(b.getGuestRegistrationId());
                    if (reg != null) {
                        int totalPax = (reg.getAdults() != null ? reg.getAdults() : 1) + (reg.getChildren() != null ? reg.getChildren() : 0);
                        rGuests += Math.max(1, (int) Math.round((double) totalPax / (double) roomCount));
                    }
                }
            }

            com.serenevilla.pms.dto.RoomIncomeSummaryDTO rSummary = new com.serenevilla.pms.dto.RoomIncomeSummaryDTO();
            rSummary.setRoomId(r.getId());
            rSummary.setRoomNumber(r.getRoomNumber());
            rSummary.setRoomType(r.getRoomType());
            rSummary.setTotalBookings(rBookings.size());
            rSummary.setTotalNights(rNights);
            rSummary.setTotalGuests(rGuests);
            rSummary.setCashRevenue(rCash);
            rSummary.setCardRevenue(rCard);
            rSummary.setBankTransferRevenue(rBank);
            rSummary.setTotalRevenue(rCash + rCard + rBank);

            roomBreakdowns.add(rSummary);
        }

        ReportSummaryDTO summary = new ReportSummaryDTO();
        summary.setTotalBookings(totalBookings);
        summary.setTotalCheckIns(totalCheckIns);
        summary.setTotalCheckOuts(totalCheckOuts);
        summary.setTotalGuests(totalGuests);
        summary.setTotalAdults(totalAdults);
        summary.setTotalChildren(totalChildren);
        double grossRevenue = totalRevenue + totalOtherCharges;
        summary.setTotalRevenue(grossRevenue);
        summary.setTotalAdvancePayments(totalAdvancePayments);
        summary.setTotalRemainingBalance(totalRemainingBalance);
        summary.setTotalOutstandingAmount(totalOutstandingAmount);
        
        summary.setCashRevenue(cashRevenue);
        summary.setCardRevenue(cardRevenue);
        summary.setBankTransferRevenue(bankTransferRevenue);
        summary.setTotalCardCharges(totalCardCharges);
        summary.setTotalOtherCharges(totalOtherCharges);
        summary.setNetRevenue(totalRevenue);

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
        summary.setRoomBreakdowns(roomBreakdowns);
        summary.setRows(rows);

        return summary;
    }
}
