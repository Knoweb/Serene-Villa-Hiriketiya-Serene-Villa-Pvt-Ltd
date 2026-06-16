package com.serenevilla.pms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "guest_registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String guestName;

    private String photoUrl;

    @Column(nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private LocalDate checkOutDate;

    private String passportFrontUrl;
    
    private String passportBackUrl;

    @Column(nullable = false)
    private String passportNumber;

    @Column(nullable = false)
    private String whatsAppNumber;

    @Column(nullable = false)
    private String nationality;

    private int adults = 1;
    
    private int children = 0;

    private int nights;

    private boolean isHiddenFromFrontOffice = false;

    @Column(name = "property_id")
    private Long propertyId = 1L; // Defaults to property 1
}
