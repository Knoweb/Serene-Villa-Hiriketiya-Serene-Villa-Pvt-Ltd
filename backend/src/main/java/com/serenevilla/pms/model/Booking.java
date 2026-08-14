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
        @Index(name = "idx_booking_reg_id", columnList = "guest_registration_id"),
        @Index(name = "idx_booking_room_num", columnList = "roomNumber"),
        @Index(name = "idx_booking_property", columnList = "propertyId")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String bookingNumber;

    @Column(name = "guest_registration_id")
    private Long guestRegistrationId;

    private String roomNumber;
    
    private String roomType;

    private String bookingType; // Direct, Booking.com

    private String boardBasis; // Room Only, Half Board, Full Board

    private double totalAmount;

    private String remarks;

    private String status = "Confirmed"; // Confirmed, CheckedIn, CheckedOut, Cancelled

    private String paymentStatus = "Pending";

    @Column(name = "property_id")
    private Long propertyId = 1L;
}
