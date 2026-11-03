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

        Optional<Receipt> existingOpt = receiptRepository.findByPaymentId(payment.getId());
        if (existingOpt.isPresent()) {
            Receipt existing = existingOpt.get();
            // If legacy receipt number starts with REC-, migrate to MM-XXX
            if (existing.getReceiptNumber() != null && existing.getReceiptNumber().startsWith("REC-")) {
                LocalDateTime dt = existing.getGeneratedAt() != null ? existing.getGeneratedAt() : LocalDateTime.now();
                String newNumber = generateNextReceiptNumber(dt);
                existing.setReceiptNumber(newNumber);
                existing = receiptRepository.save(existing);
                payment.setReceiptNumber(newNumber);
                paymentRepository.save(payment);
            }
            return existing;
        }

        LocalDateTime now = LocalDateTime.now();
        String receiptNumber = generateNextReceiptNumber(now);

        Receipt newReceipt = new Receipt();
        newReceipt.setPaymentId(payment.getId());
        newReceipt.setBookingId(payment.getBookingId() != null ? payment.getBookingId() : 0L);
        newReceipt.setPropertyId(payment.getPropertyId() != null ? payment.getPropertyId() : 1L);
        newReceipt.setReceiptType("ADVANCE");
        newReceipt.setReceiptNumber(receiptNumber);
        newReceipt.setGeneratedAt(now);
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
