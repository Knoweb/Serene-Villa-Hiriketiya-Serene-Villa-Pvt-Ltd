package com.serenevilla.pms.service;

import com.serenevilla.pms.model.Payment;
import com.serenevilla.pms.model.Receipt;
import com.serenevilla.pms.repository.PaymentRepository;
import com.serenevilla.pms.repository.ReceiptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReceiptService {

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private com.serenevilla.pms.repository.BookingRepository bookingRepository;

    private static final Pattern LEADING_DIGITS = Pattern.compile("^\\d+");

    /**
     * Generates the next sequential receipt number in MM-XXX format.
     * E.g. for October: 10-001, 10-002; for November: 11-001, 11-002.
     * Resets sequence back to 001 at the beginning of each new month.
     */
    public synchronized String generateNextReceiptNumber(LocalDateTime dateTime) {
        if (dateTime == null) {
            dateTime = LocalDateTime.now();
        }

        int month = dateTime.getMonthValue();
        String prefix = String.format("%02d-", month);
        String prefixPattern = prefix + "%";

        LocalDateTime startOfMonth = dateTime.toLocalDate().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        int maxSeq = 0;

        List<String> receiptNumbers = receiptRepository.findReceiptNumbersInMonth(prefixPattern, startOfMonth, endOfMonth);
        if (receiptNumbers != null) {
            for (String num : receiptNumbers) {
                maxSeq = Math.max(maxSeq, extractSequence(num, prefix));
            }
        }

        List<String> prefixReceipts = receiptRepository.findReceiptNumbersByPrefix(prefixPattern);
        if (prefixReceipts != null) {
            for (String num : prefixReceipts) {
                maxSeq = Math.max(maxSeq, extractSequence(num, prefix));
            }
        }

        List<String> paymentReceiptNumbers = paymentRepository.findReceiptNumbersByPrefix(prefixPattern);
        if (paymentReceiptNumbers != null) {
            for (String num : paymentReceiptNumbers) {
                maxSeq = Math.max(maxSeq, extractSequence(num, prefix));
            }
        }

        int nextSeq = maxSeq + 1;
        String candidate = String.format("%02d-%03d", month, nextSeq);

        while (receiptRepository.existsByReceiptNumber(candidate)) {
            nextSeq++;
            candidate = String.format("%02d-%03d", month, nextSeq);
        }

        return candidate;
    }

    private int extractSequence(String num, String prefix) {
        if (num == null || !num.startsWith(prefix)) {
            return 0;
        }
        try {
            String remainder = num.substring(prefix.length()).trim();
            Matcher matcher = LEADING_DIGITS.matcher(remainder);
            if (matcher.find()) {
                return Integer.parseInt(matcher.group());
            }
        } catch (Exception ignored) {}
        return 0;
    }

    /**
     * Gets an existing advance receipt or creates a new one with the MM-XXX sequence number.
     * Also updates the payment record so payment.receiptNumber is always synchronized.
     */
    @Transactional
    public synchronized Receipt getOrCreateAdvanceReceipt(Payment payment) {
        if (payment == null || payment.getId() == null) {
            throw new IllegalArgumentException("Payment and payment ID must not be null");
        }

        LocalDateTime targetDt = payment.getCreatedAt() != null 
                ? payment.getCreatedAt() 
                : (payment.getPaymentDate() != null ? payment.getPaymentDate().atStartOfDay() : LocalDateTime.now());

        Long rPropId = payment.getPropertyId();
        if (payment.getBookingId() != null && bookingRepository != null) {
            rPropId = bookingRepository.findById(payment.getBookingId())
                    .map(com.serenevilla.pms.model.Booking::getPropertyId)
                    .orElse(rPropId);
        }
        if (rPropId == null) rPropId = 1L;

        Optional<Receipt> existingOpt = receiptRepository.findByPaymentId(payment.getId());
        if (existingOpt.isPresent()) {
            Receipt existing = existingOpt.get();
            if (existing.getPropertyId() == null || !rPropId.equals(existing.getPropertyId())) {
                existing.setPropertyId(rPropId);
                receiptRepository.save(existing);
            }
            String currentNum = existing.getReceiptNumber();
            if (currentNum == null || currentNum.trim().isEmpty() || currentNum.startsWith("REC-") || !currentNum.matches("^\\d{2}-\\d{3,}$")) {
                LocalDateTime dt = existing.getGeneratedAt() != null ? existing.getGeneratedAt() : targetDt;
                String newNumber = generateNextReceiptNumber(dt);
                existing.setReceiptNumber(newNumber);
                if (existing.getGeneratedAt() == null) {
                    existing.setGeneratedAt(targetDt);
                }
                existing = receiptRepository.save(existing);
                payment.setReceiptNumber(newNumber);
                paymentRepository.save(payment);
            } else {
                if (payment.getReceiptNumber() == null || !payment.getReceiptNumber().equals(currentNum)) {
                    payment.setReceiptNumber(currentNum);
                    paymentRepository.save(payment);
                }
            }
            return existing;
        }

        String receiptNumber = payment.getReceiptNumber();
        if (receiptNumber != null) {
            receiptNumber = receiptNumber.trim();
        }
        if (receiptNumber == null || receiptNumber.isEmpty() || receiptNumber.startsWith("REC-") || !receiptNumber.matches("^\\d{2}-\\d{3,}$")) {
            receiptNumber = generateNextReceiptNumber(targetDt);
        }

        Receipt newReceipt = new Receipt();
        newReceipt.setPaymentId(payment.getId());
        newReceipt.setBookingId(payment.getBookingId() != null ? payment.getBookingId() : 0L);
        newReceipt.setPropertyId(rPropId);
        newReceipt.setReceiptType("ADVANCE");
        newReceipt.setReceiptNumber(receiptNumber);
        newReceipt.setGeneratedAt(targetDt);
        newReceipt.setGeneratedBy(payment.getCreatedBy() != null ? payment.getCreatedBy() : "Front Office");

        Receipt saved = receiptRepository.save(newReceipt);

        payment.setReceiptNumber(saved.getReceiptNumber());
        paymentRepository.save(payment);

        return saved;
    }

    @Transactional
    public Optional<Receipt> getOrCreateAdvanceReceipt(Long paymentId) {
        if (paymentId == null) {
            return Optional.empty();
        }
        return paymentRepository.findById(paymentId).map(this::getOrCreateAdvanceReceipt);
    }
}

