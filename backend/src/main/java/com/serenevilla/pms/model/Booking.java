package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(
    name = "bookings",
    indexes = {
        @Index(name = "idx_bookings_prop_room_status", columnList = "property_id, roomNumber, status"),
        @Index(name = "idx_bookings_prop_dates_status", columnList = "property_id, status, checkInDate, checkOutDate"),
        @Index(name = "idx_bookings_prop_guest_reg", columnList = "property_id, guest_registration_id"),
        @Index(name = "idx_bookings_prop_pay_status", columnList = "property_id, paymentStatus"),
        @Index(name = "idx_booking_property", columnList = "property_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_property_booking_number", columnNames = {"property_id", "bookingNumber"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bookingNumber;

    @Column(name = "guest_registration_id")
    private Long guestRegistrationId;

    private String roomNumber;
    
    private String roomType;

    private String bookingType; // Direct, Booking.com

    private String boardBasis; // Room Only, Half Board, Full Board

    private Double totalAmount = 0.0;

    private String remarks;

    private String status = "Confirmed"; // Confirmed, CheckedIn, CheckedOut, Cancelled

    private String paymentStatus = "Pending";

    @Column(name = "property_id")
    private Long propertyId = 1L;

    // Currency & pricing metadata for print accuracy
    private String currency = "LKR";

    private String exchangeRate = "1.00";

    private Double unitPrice = 0.0;

    // JSON string: [{"roomNumber":"101","roomType":"Deluxe","price":"150.00"},...]
    @Column(columnDefinition = "TEXT")
    private String roomPrices;

    private String title = "Mr.";
    
    private String guestName;

    private String email;

    private String senderName;

    private String confirmedBy;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate checkInDate;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate checkOutDate;

    private Integer numberOfNights;
    
    private Boolean showExchangeRateOnBill = false;
}
